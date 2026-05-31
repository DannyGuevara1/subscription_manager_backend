import type { SubscriptionDateCalculator, CalculatorConfig, ProjectionConfig } from "@/modules/subscription/subscription.type.js";
import { Temporal } from 'temporal-polyfill';

export default class SubscriptionCalculatorService implements SubscriptionDateCalculator {
    private readonly unitMap: Record<string, string> = {
        DAYS: 'days',
        WEEKS: 'weeks',
        MONTHS: 'months',
        YEARS: 'years'
    };

    private toTemporal(d: Date) {
        return Temporal.Instant.fromEpochMilliseconds(d.getTime()).toZonedDateTimeISO('UTC');
    }

    private toJsDate(t: Temporal.ZonedDateTime) {
        return new Date(t.toInstant().epochMilliseconds);
    }

    nextPaymentDate(config: CalculatorConfig): Date {
        try {
            const { firstPaymentDate, billingFrequency, billingUnit, trialEndsOn } = config;
            const today = config.referenceDate ?? new Date();
            const durationStr = this.unitMap[billingUnit] as keyof Temporal.Duration;

            let baseDate = this.toTemporal(firstPaymentDate);

            if (trialEndsOn) {
                const temporalTrialEndsOn = this.toTemporal(trialEndsOn);
                if (Temporal.ZonedDateTime.compare(temporalTrialEndsOn, baseDate) > 0) {
                    baseDate = temporalTrialEndsOn;
                }
            }

            let nextDate = baseDate;
            const temporalFirstPaymentDate = this.toTemporal(firstPaymentDate);
            let periods = 1;
            while (Temporal.ZonedDateTime.compare(nextDate, this.toTemporal(today)) < 0) {
                nextDate = temporalFirstPaymentDate.add({ [durationStr]: periods * billingFrequency });
                periods++;
            }

            return this.toJsDate(nextDate);
        } catch (err) {
            throw new Error('Error al calcular la fecha del próximo pago: ' + err);
        }
    }

    projectNextPaymentDates(config: ProjectionConfig): Date[] {
        const { endDate, billingFrequency, billingUnit } = config;
        const nextsPaymentDate: Date[] = [];

        // 1. Calculamos el primer pago válido a futuro
        const firstFuturePayment = this.nextPaymentDate({
            ...config,
            referenceDate: config.firstPaymentDate
        });

        // 2. Preparamos las variables para el bucle de alta performance
        let temporalCurrent = this.toTemporal(firstFuturePayment);
        const temporalFirstPaymentDate = this.toTemporal(config.firstPaymentDate);
        const temporalEndDate = this.toTemporal(endDate);
        const durationStr = this.unitMap[billingUnit] as keyof Temporal.Duration;

        // 3. Iteramos matemáticamente hasta alcanzar la fecha de fin
        let periods = 1;
        while (Temporal.ZonedDateTime.compare(temporalCurrent, temporalEndDate) <= 0) {
            nextsPaymentDate.push(this.toJsDate(temporalCurrent));
            temporalCurrent = temporalFirstPaymentDate.add({ [durationStr]: periods * billingFrequency });
            periods++;
        }

        return nextsPaymentDate;
    }
}

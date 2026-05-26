import type { SubscriptionDateCalculator, CalculatorConfig, ProjectionConfig } from "@/modules/subscription/subscription.type.js";

export default class SubscriptionCalculatorService implements SubscriptionDateCalculator {
    nextPaymentDate(config: CalculatorConfig): Date {
        const { firstPaymentDate, billingFrequency, billingUnit, trialEndsOn } = config;
        return new Date();
    }

    projectNextPaymentDates(config: ProjectionConfig): Date[] {
        const { firstPaymentDate, billingFrequency, billingUnit, trialEndsOn, endDate } = config;
        return [];
    }


}
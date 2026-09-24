-- Four decimals can round small but valid FX rates to zero.
ALTER TABLE "public"."Currency"
  ALTER COLUMN "exchangeRateToUSD" TYPE DECIMAL(20,10);

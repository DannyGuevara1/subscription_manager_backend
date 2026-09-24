BEGIN;
UPDATE "public"."Subscription" AS subscription
SET "status" = CASE WHEN legacy."isActive" THEN 'ACTIVE'::"public"."StatusSubscription"
                    ELSE 'PAUSED'::"public"."StatusSubscription" END
FROM "public"."_SubscriptionLegacyState" AS legacy
WHERE subscription."id" = legacy."subscriptionId";
DROP TABLE "public"."_SubscriptionLegacyState";
COMMIT;

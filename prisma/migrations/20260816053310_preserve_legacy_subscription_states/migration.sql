-- Keep already-published SQL immutable. This guard runs before the historical DROP.
-- On an already-migrated database with rows, stop rather than invent lost states.
BEGIN;
CREATE TABLE "public"."_SubscriptionLegacyState" (
  "subscriptionId" UUID PRIMARY KEY,
  "isActive" BOOLEAN NOT NULL
);
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Subscription' AND column_name = 'isActive'
  ) THEN
    INSERT INTO "public"."_SubscriptionLegacyState" ("subscriptionId", "isActive")
      SELECT "id", "isActive" FROM "public"."Subscription";
  ELSIF EXISTS (SELECT 1 FROM "public"."Subscription") THEN
    RAISE EXCEPTION 'Legacy isActive is absent on a nonempty database. Restore or audit states before adopting the release migration chain; see docs/deploy-checklist.md';
  END IF;
END $$;
COMMIT;

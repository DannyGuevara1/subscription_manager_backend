-- Rename values in place before the historical enum-replacement migration casts them.
-- Already-applied environments can already have the correct spelling.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public' AND t.typname = 'StatusSubscription' AND e.enumlabel = 'CANCELED'
  ) THEN
    ALTER TYPE "public"."StatusSubscription" RENAME VALUE 'CANCELED' TO 'CANCELLED';
  END IF;
END $$;

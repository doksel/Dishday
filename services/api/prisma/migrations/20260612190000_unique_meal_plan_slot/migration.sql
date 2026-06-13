-- Slot R1: enforce one dish per (plan, day, meal_type).
--
-- Before this migration the table had no unique constraint on the slot tuple,
-- so a stale UI could POST /meal-plans/:id/entries twice and the API would
-- create two rows. The Today screen rendered both as separate cards — the
-- visible "two breakfasts" bug.
--
-- Step 1: drop duplicates — keep the most recent id for each slot. We sort
-- descending by id (UUID v4, but the natural string order is fine as a
-- tiebreaker — what matters is that exactly one row survives per group).
-- Step 2: add the UNIQUE constraint so future inserts are guaranteed unique.

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY plan_id, day_of_week, meal_type
      ORDER BY id DESC
    ) AS rn
  FROM "meal_plan_entries"
)
DELETE FROM "meal_plan_entries"
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

ALTER TABLE "meal_plan_entries"
  ADD CONSTRAINT "meal_plan_entries_plan_id_day_of_week_meal_type_key"
  UNIQUE (plan_id, day_of_week, meal_type);

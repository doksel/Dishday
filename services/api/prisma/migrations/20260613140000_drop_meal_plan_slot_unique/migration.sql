-- MultiSlot M1: a single meal slot can hold multiple dishes again.
--
-- Original intent (migration 20260612190000_unique_meal_plan_slot) was to
-- prevent stale-UI duplicates by enforcing one row per
-- (plan_id, day_of_week, meal_type). UX evolved: the meal detail screen
-- (`apps/mobile/app/meal.tsx`) now renders a list of dishes per slot with
-- per-row delete buttons, so the user expects to compose a lunch from
-- soup + main + side. Drop the constraint accordingly.

alter table "meal_plan_entries"
  drop constraint if exists "meal_plan_entries_plan_id_day_of_week_meal_type_key";

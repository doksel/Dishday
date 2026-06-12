-- A4: optional translations for user-facing recipe text.
-- Canonical text stays in title/description/ingredients.name (always populated).
-- *_i18n holds an opaque JSONB map keyed by BCP-47 code:
--   { "en": "Greek Yogurt Parfait", "ru": "Йогуртовый парфе" }
-- Clients prefer i18n[locale] and fall back to the canonical column.

ALTER TABLE "recipes"
  ADD COLUMN "title_i18n"       JSONB,
  ADD COLUMN "description_i18n" JSONB;

ALTER TABLE "recipe_ingredients"
  ADD COLUMN "name_i18n" JSONB;

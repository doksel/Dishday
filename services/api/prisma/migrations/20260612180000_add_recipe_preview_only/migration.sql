-- Tier B1: mark AI-generated recipes that are title-only previews (Free tier).
-- For Pro users the body (ingredients/instructions) is generated as before;
-- Free users receive entries that reference rows with preview_only=true and the
-- API gates GET /recipes/:id with a 402 PLAN_REQUIRED response.

ALTER TABLE "recipes"
  ADD COLUMN "preview_only" BOOLEAN NOT NULL DEFAULT FALSE;

-- A1: add nullable BCP-47 locale to users
-- NULL means "follow device locale on each client" — explicit value pins the
-- preference across devices.

ALTER TABLE "users" ADD COLUMN "locale" VARCHAR(8);

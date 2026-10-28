BEGIN;
SET LOCAL search_path TO "app";

-- Suppliers are organization-owned business data. Archiving preserves their
-- identity for future imports, calculations and audit history.
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "notes" VARCHAR(1000),
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "suppliers_name_nonempty_check" CHECK (length(btrim(name)) > 0)
);

CREATE UNIQUE INDEX "suppliers_organization_id_id_key" ON "suppliers"("organization_id", "id");
CREATE INDEX "suppliers_organization_id_archived_at_name_id_idx" ON "suppliers"("organization_id", "archived_at", "name", "id");

ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

COMMIT;

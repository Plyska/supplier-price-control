BEGIN;

-- Application objects are isolated from Supabase and pg-boss schemas.
CREATE SCHEMA IF NOT EXISTS "app";
SET LOCAL search_path TO "app";

-- CreateEnum
CREATE TYPE "membership_role" AS ENUM ('owner', 'editor', 'viewer');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "time_zone" VARCHAR(100),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "display_name" VARCHAR(200),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "membership_role" NOT NULL DEFAULT 'viewer',
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("organization_id","user_id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" UUID,
    "request_id" VARCHAR(128),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

-- CreateIndex
CREATE INDEX "audit_events_organization_id_created_at_id_idx" ON "audit_events"("organization_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "audit_events_organization_id_actor_user_id_idx" ON "audit_events"("organization_id", "actor_user_id");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_actor_user_id_fkey" FOREIGN KEY ("organization_id", "actor_user_id") REFERENCES "memberships"("organization_id", "user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Normalize before writing; a unique email cannot differ only in case/spacing.
ALTER TABLE "users" ADD CONSTRAINT "users_email_normalized_check"
  CHECK (email = lower(btrim(email)) AND length(email) > 0);
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_name_nonempty_check"
  CHECK (length(btrim(name)) > 0);
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_action_nonempty_check"
  CHECK (length(btrim(action)) > 0 AND length(btrim(entity_type)) > 0);
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_metadata_object_check"
  CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object');

-- Preserve evidence even if a future application mutation is incorrect.
-- Runtime roles also lack TRUNCATE and schema ownership privileges.
CREATE FUNCTION "app"."reject_audit_event_mutation"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Audit events are append-only' USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER "audit_events_append_only"
BEFORE UPDATE OR DELETE ON "audit_events"
FOR EACH ROW EXECUTE FUNCTION "app"."reject_audit_event_mutation"();

COMMIT;

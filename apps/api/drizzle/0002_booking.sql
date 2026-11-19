CREATE TABLE "availability_blocks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"coach_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL
);

--> statement-breakpoint
-- Hand-written: drizzle-kit cannot express these. btree_gist is created in 0000_init.
-- A coach's blocks never overlap (half-open ranges, so back-to-back blocks are fine).
ALTER TABLE "availability_blocks" ADD CONSTRAINT "availability_blocks_no_overlap"
	EXCLUDE USING gist ("coach_id" WITH =, tstzrange("starts_at", "ends_at") WITH &&);
--> statement-breakpoint
-- Final guard for the length and :00/:30 UTC alignment rules.
ALTER TABLE "availability_blocks" ADD CONSTRAINT "availability_blocks_valid_slot" CHECK (
	"ends_at" - "starts_at" IN (interval '30 minutes', interval '60 minutes')
	AND extract(epoch FROM "starts_at")::bigint % 1800 = 0
	AND "starts_at" = date_trunc('minute', "starts_at")
);

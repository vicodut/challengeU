CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TABLE "enrollments" (
	"student_id" uuid PRIMARY KEY NOT NULL,
	"program_id" uuid NOT NULL,
	"status" "enrollment_status" NOT NULL,
	"status_changed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;
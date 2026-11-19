CREATE TABLE "program_coaches" (
	"program_id" uuid NOT NULL,
	"coach_id" uuid NOT NULL,
	CONSTRAINT "program_coaches_program_id_coach_id_pk" PRIMARY KEY("program_id","coach_id")
);
--> statement-breakpoint
ALTER TABLE "program_coaches" ADD CONSTRAINT "program_coaches_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;
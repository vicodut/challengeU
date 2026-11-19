CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "programs_name_unique" UNIQUE("name")
);

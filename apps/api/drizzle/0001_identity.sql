CREATE TYPE "public"."user_role" AS ENUM('student', 'coach', 'admin');--> statement-breakpoint
CREATE TABLE "admins" (
	"user_id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coaches" (
	"user_id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"user_id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"time_zone" text NOT NULL,
	"role" "user_role" NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
CREATE TABLE "schema_field_annotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schema_id" uuid NOT NULL,
	"table_name" varchar(255) NOT NULL,
	"column_name" varchar(255) NOT NULL,
	"json_structure" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schema_field_annotations" ADD CONSTRAINT "schema_field_annotations_schema_id_schemas_id_fk" FOREIGN KEY ("schema_id") REFERENCES "public"."schemas"("id") ON DELETE cascade ON UPDATE no action;
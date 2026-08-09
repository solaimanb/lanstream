CREATE TABLE "agent_pairing" (
	"id" text PRIMARY KEY NOT NULL,
	"secret_hash" text NOT NULL,
	"user_code_hash" text NOT NULL,
	"requested_name" text NOT NULL,
	"hostname" text NOT NULL,
	"platform" text NOT NULL,
	"version" text NOT NULL,
	"local_ip" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"owner_id" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"consumed_at" timestamp,
	CONSTRAINT "agent_pairing_secret_hash_unique" UNIQUE("secret_hash"),
	CONSTRAINT "agent_pairing_user_code_hash_unique" UNIQUE("user_code_hash")
);
--> statement-breakpoint
ALTER TABLE "agent_pairing" ADD CONSTRAINT "agent_pairing_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_pairing_expires_at_idx" ON "agent_pairing" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "agent_pairing_owner_id_idx" ON "agent_pairing" USING btree ("owner_id");
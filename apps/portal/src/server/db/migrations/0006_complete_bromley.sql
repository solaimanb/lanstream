CREATE TABLE "host_agent" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"token_prefix" text NOT NULL,
	"hostname" text,
	"platform" text,
	"version" text,
	"local_ip" text,
	"last_seen_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "host_agent_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "server" ADD COLUMN "host_agent_id" text;--> statement-breakpoint
ALTER TABLE "server" ADD COLUMN "desired_state" text DEFAULT 'running' NOT NULL;--> statement-breakpoint
ALTER TABLE "server" ADD COLUMN "preferred_port" integer;--> statement-breakpoint
ALTER TABLE "host_agent" ADD CONSTRAINT "host_agent_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "host_agent_owner_id_idx" ON "host_agent" USING btree ("owner_id");--> statement-breakpoint
ALTER TABLE "server" ADD CONSTRAINT "server_host_agent_id_host_agent_id_fk" FOREIGN KEY ("host_agent_id") REFERENCES "public"."host_agent"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "server_host_agent_id_idx" ON "server" USING btree ("host_agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "server_host_agent_port_idx" ON "server" USING btree ("host_agent_id","preferred_port");
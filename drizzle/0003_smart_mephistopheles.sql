CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"cart_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"shipping_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"email" text,
	"shipping_details" jsonb,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id"),
	CONSTRAINT "orders_status_valid" CHECK ("orders"."status" in ('pending', 'processing', 'paid', 'failed', 'expired')),
	CONSTRAINT "orders_items_not_empty" CHECK (jsonb_array_length("orders"."items") >= 1),
	CONSTRAINT "orders_amounts_non_negative" CHECK ("orders"."subtotal_cents" >= 0 and "orders"."shipping_cents" >= 0 and "orders"."total_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_cart_id_status_idx" ON "orders" USING btree ("cart_id","status");
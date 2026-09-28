CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"order_id" text,
	"product_id" integer,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_type_valid" CHECK ("notifications"."type" in ('order_paid', 'order_processing', 'payment_failed', 'refund', 'low_stock'))
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "refunds_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" text NOT NULL,
	"stripe_refund_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" text NOT NULL,
	"reason" text,
	"restocked" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_stripe_refund_id_unique" UNIQUE("stripe_refund_id"),
	CONSTRAINT "refunds_amount_positive" CHECK ("refunds"."amount_cents" > 0)
);
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_status_valid";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refunded_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stripe_fee_cents" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fulfilment_status" text DEFAULT 'unfulfilled' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "carrier" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipped_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_read_at_created_at_idx" ON "notifications" USING btree ("read_at","created_at");--> statement-breakpoint
CREATE INDEX "refunds_order_id_idx" ON "refunds" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "refunds_created_at_idx" ON "refunds" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_status_paid_at_idx" ON "orders" USING btree ("status","paid_at");--> statement-breakpoint
CREATE INDEX "orders_stripe_payment_intent_id_idx" ON "orders" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_fulfilment_status_valid" CHECK ("orders"."fulfilment_status" in ('unfulfilled', 'shipped', 'delivered'));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_refunded_within_total" CHECK ("orders"."refunded_cents" >= 0 and "orders"."refunded_cents" <= "orders"."total_cents");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_status_valid" CHECK ("orders"."status" in ('pending', 'processing', 'paid', 'failed', 'expired', 'partially_refunded', 'refunded'));--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_status_valid" CHECK ("products"."status" in ('active', 'draft', 'archived'));
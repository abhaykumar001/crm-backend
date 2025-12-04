/*
  Warnings:

  - Added the required column `updated_at` to the `source_users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."deals" ADD COLUMN     "agent_commission" DECIMAL(15,2),
ADD COLUMN     "approval_status" TEXT DEFAULT 'Pending',
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" INTEGER,
ADD COLUMN     "area_square_feet" DECIMAL(10,2),
ADD COLUMN     "booking_date" TIMESTAMP(3),
ADD COLUMN     "company_commission" DECIMAL(15,2),
ADD COLUMN     "contract_date" TIMESTAMP(3),
ADD COLUMN     "developer_id" INTEGER,
ADD COLUMN     "documents" JSONB,
ADD COLUMN     "down_payment" DECIMAL(15,2),
ADD COLUMN     "handover_date" TIMESTAMP(3),
ADD COLUMN     "payment_plan" JSONB,
ADD COLUMN     "per_unit_price" DECIMAL(15,2),
ADD COLUMN     "sale_type" TEXT DEFAULT 'Primary',
ADD COLUMN     "total_commission" DECIMAL(15,2),
ADD COLUMN     "total_sale_amount" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "public"."leads" ADD COLUMN     "activity_check" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "additional_phone" TEXT,
ADD COLUMN     "area" TEXT,
ADD COLUMN     "assign_leads_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "budget_max" DECIMAL(15,2),
ADD COLUMN     "budget_min" DECIMAL(15,2),
ADD COLUMN     "campaign_id" INTEGER,
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "deleted_reason" TEXT,
ADD COLUMN     "event_id" INTEGER,
ADD COLUMN     "interested_in" TEXT,
ADD COLUMN     "is_fresh" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lead_market" TEXT,
ADD COLUMN     "meeting_time" TIMESTAMP(3),
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "need_whatsapp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "no_answer_status_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "onboarding_date" TIMESTAMP(3),
ADD COLUMN     "preferences" JSONB,
ADD COLUMN     "property_ref" TEXT,
ADD COLUMN     "property_type" TEXT,
ADD COLUMN     "source_portal" TEXT,
ADD COLUMN     "type" TEXT DEFAULT 'Active';

-- AlterTable
ALTER TABLE "public"."source_users" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "next_lead_assign" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."sources" ADD COLUMN     "campaign_id" INTEGER,
ADD COLUMN     "is_croned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" INTEGER DEFAULT 0,
ADD COLUMN     "run_all_time" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" TEXT DEFAULT 'Normal';

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "address_in_uae" TEXT,
ADD COLUMN     "alternate_contact" TEXT,
ADD COLUMN     "availability" TEXT DEFAULT 'Available',
ADD COLUMN     "company_id" INTEGER,
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "department" TEXT,
ADD COLUMN     "designation_id" INTEGER,
ADD COLUMN     "device_token" TEXT,
ADD COLUMN     "device_type" TEXT,
ADD COLUMN     "education_details" TEXT,
ADD COLUMN     "emergency_contact_name" TEXT,
ADD COLUMN     "emergency_contact_phone" TEXT,
ADD COLUMN     "emergency_contact_relation" TEXT,
ADD COLUMN     "employee_id" TEXT,
ADD COLUMN     "is_excluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marital_status" TEXT,
ADD COLUMN     "medical_conditions" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "permission_menu" JSONB,
ADD COLUMN     "status" TEXT DEFAULT 'Active',
ADD COLUMN     "visa_type" TEXT;

-- CreateTable
CREATE TABLE "public"."lead_agents" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_accepted" INTEGER NOT NULL DEFAULT 0,
    "assign_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_time" TIMESTAMP(3),
    "activity_check" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaigns" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "secondary_name" TEXT,
    "description" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "budget" DECIMAL(15,2),
    "status" INTEGER NOT NULL DEFAULT 1,
    "is_international" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaign_managers" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "event_type" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sale_agents" (
    "id" SERIAL NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "brokerage" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(15,2),
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" INTEGER,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."commission_slabs" (
    "id" SERIAL NOT NULL,
    "designation_id" INTEGER,
    "slab_from" DECIMAL(15,2) NOT NULL,
    "slab_to" DECIMAL(15,2) NOT NULL,
    "commission" DECIMAL(5,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_slabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cold_calls" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT,
    "source_id" INTEGER,
    "agent_id" INTEGER,
    "priority" TEXT DEFAULT 'Normal',
    "status" TEXT DEFAULT 'pending',
    "comments" TEXT,
    "is_deleted" INTEGER NOT NULL DEFAULT 0,
    "deleted_date" TIMESTAMP(3),
    "converted_to_lead" BOOLEAN NOT NULL DEFAULT false,
    "converted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cold_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dnd_lists" (
    "id" SERIAL NOT NULL,
    "phone_number" TEXT NOT NULL,
    "ref_type" TEXT,
    "added_by" INTEGER,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dnd_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dump_calls" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT,
    "source_id" INTEGER,
    "agent_id" INTEGER,
    "reason" TEXT,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dump_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."penalty_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "penalty_amount" DECIMAL(10,2) NOT NULL,
    "penalty_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "issued_by" INTEGER NOT NULL,
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penalty_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaign_managers_campaign_id_user_id_key" ON "public"."campaign_managers"("campaign_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "dnd_lists_phone_number_key" ON "public"."dnd_lists"("phone_number");

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sources" ADD CONSTRAINT "sources_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_agents" ADD CONSTRAINT "lead_agents_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_agents" ADD CONSTRAINT "lead_agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_managers" ADD CONSTRAINT "campaign_managers_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_managers" ADD CONSTRAINT "campaign_managers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sale_agents" ADD CONSTRAINT "sale_agents_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sale_agents" ADD CONSTRAINT "sale_agents_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."penalty_logs" ADD CONSTRAINT "penalty_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

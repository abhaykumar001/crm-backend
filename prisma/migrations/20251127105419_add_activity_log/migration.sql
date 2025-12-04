-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "subject_type" TEXT,
    "subject_id" INTEGER,
    "causer_type" TEXT,
    "causer_id" INTEGER,
    "properties" JSONB,
    "event_type" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_logs_subject_type_subject_id_idx" ON "public"."activity_logs"("subject_type", "subject_id");

-- CreateIndex
CREATE INDEX "activity_logs_causer_type_causer_id_idx" ON "public"."activity_logs"("causer_type", "causer_id");

-- CreateIndex
CREATE INDEX "activity_logs_event_type_idx" ON "public"."activity_logs"("event_type");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "public"."activity_logs"("created_at");

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OPERATOR',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "greenhouses" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "greenhouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensors" (
    "id" BIGSERIAL NOT NULL,
    "greenhouse_id" BIGINT NOT NULL,
    "sensor_type" TEXT NOT NULL,
    "model" TEXT,
    "unit" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_readings" (
    "id" BIGSERIAL NOT NULL,
    "sensor_id" BIGINT NOT NULL,
    "value" DECIMAL(8,2) NOT NULL,
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actuators" (
    "id" BIGSERIAL NOT NULL,
    "greenhouse_id" BIGINT NOT NULL,
    "actuator_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFF',
    "control_mode" TEXT NOT NULL DEFAULT 'AUTO',
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actuators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" BIGSERIAL NOT NULL,
    "actuator_id" BIGINT NOT NULL,
    "sensor_id" BIGINT NOT NULL,
    "condition_operator" TEXT NOT NULL,
    "threshold_value" DECIMAL(8,2) NOT NULL,
    "action_duration_sec" INTEGER NOT NULL DEFAULT 0,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_logs" (
    "id" BIGSERIAL NOT NULL,
    "greenhouse_id" BIGINT NOT NULL,
    "actuator_id" BIGINT,
    "event_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" BIGSERIAL NOT NULL,
    "greenhouse_id" BIGINT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sensor_readings_sensor_id_recorded_at_idx" ON "sensor_readings"("sensor_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "event_logs_greenhouse_id_created_at_idx" ON "event_logs"("greenhouse_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "greenhouses" ADD CONSTRAINT "greenhouses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_greenhouse_id_fkey" FOREIGN KEY ("greenhouse_id") REFERENCES "greenhouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actuators" ADD CONSTRAINT "actuators_greenhouse_id_fkey" FOREIGN KEY ("greenhouse_id") REFERENCES "greenhouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_actuator_id_fkey" FOREIGN KEY ("actuator_id") REFERENCES "actuators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_greenhouse_id_fkey" FOREIGN KEY ("greenhouse_id") REFERENCES "greenhouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_actuator_id_fkey" FOREIGN KEY ("actuator_id") REFERENCES "actuators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_greenhouse_id_fkey" FOREIGN KEY ("greenhouse_id") REFERENCES "greenhouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

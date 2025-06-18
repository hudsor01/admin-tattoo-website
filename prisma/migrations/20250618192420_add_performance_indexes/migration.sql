-- CreateIndex
CREATE INDEX "appointments_scheduledDate_status_idx" ON "appointments"("scheduledDate", "status");

-- CreateIndex
CREATE INDEX "appointments_clientId_scheduledDate_idx" ON "appointments"("clientId", "scheduledDate");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_scheduledDate_idx" ON "appointments"("scheduledDate");

-- CreateIndex
CREATE INDEX "clients_createdAt_idx" ON "clients"("createdAt");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE INDEX "tattoo_sessions_appointmentDate_status_idx" ON "tattoo_sessions"("appointmentDate", "status");

-- CreateIndex
CREATE INDEX "tattoo_sessions_appointmentDate_totalCost_idx" ON "tattoo_sessions"("appointmentDate", "totalCost");

-- CreateIndex
CREATE INDEX "tattoo_sessions_status_idx" ON "tattoo_sessions"("status");

-- CreateIndex
CREATE INDEX "tattoo_sessions_appointmentDate_idx" ON "tattoo_sessions"("appointmentDate");

-- CreateIndex
CREATE INDEX "tattoo_sessions_updatedAt_idx" ON "tattoo_sessions"("updatedAt");

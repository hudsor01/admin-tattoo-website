import { NextRequest } from 'next/server';
import { getAppointments, createAppointment, updateAppointment } from '@/lib/db-operations';
import { appointmentFilterSchema, createAppointmentSchema, updateAppointmentSchema } from '@/lib/validations';
import { withApiHandler } from '@/lib/api-helpers';

export const GET = withApiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Parse and validate query parameters
  const statusParam = searchParams.get('status');
  const filters = appointmentFilterSchema.parse({
    status: statusParam ? statusParam.split(',') : undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    customerId: searchParams.get('customerId') || undefined,
    limit: parseInt(searchParams.get('limit') || '20'),
    offset: parseInt(searchParams.get('offset') || '0')
  });

  return await getAppointments(filters);
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedData = createAppointmentSchema.parse(body);

  // Transform string dates to Date objects
  const appointmentData = {
    ...validatedData,
    appointmentDate: new Date(validatedData.appointmentDate),
    startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
  };

  const appointment = await createAppointment(appointmentData);
  return { data: appointment, message: 'Appointment created successfully', status: 201 };
});

export const PATCH = withApiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedData = updateAppointmentSchema.parse(body);
  const { id, ...updateData } = validatedData;

  if (!id) {
    throw new Error('Appointment ID is required');
  }

  // Transform string dates to Date objects for update
  const updateDataWithDates = {
    ...updateData,
    appointmentDate: updateData.appointmentDate ? new Date(updateData.appointmentDate) : undefined,
    startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
  };

  const appointment = await updateAppointment(id, updateDataWithDates);
  return { data: appointment, message: 'Appointment updated successfully' };
});

import { NextRequest, NextResponse } from 'next/server';
import { getAppointments, createAppointment, updateAppointment } from '@/lib/db-operations';
import { appointmentFilterSchema, createAppointmentSchema, updateAppointmentSchema } from '@/lib/validations';
import { createSuccessResponse, createErrorResponse, handleApiError, handleZodError } from '@/lib/error-handling';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const statusParam = searchParams.get('status');
    const filters = appointmentFilterSchema.parse({
      status: statusParam ? statusParam.split(',') as any : undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    });

    const result = await getAppointments(filters);
    return NextResponse.json(createSuccessResponse(result));
  } catch (error) {
    console.error('Appointments API error:', error);

    if (error instanceof ZodError) {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError.message),
        { status: 400 }
      );
    }

    const apiError = handleApiError(error);
    return NextResponse.json(
      createErrorResponse(apiError.message),
      { status: apiError.statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = createAppointmentSchema.parse(body);

    // Transform string dates to Date objects
    const appointmentData = {
      ...validatedData,
      appointmentDate: new Date(validatedData.appointmentDate),
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
    };

    const appointment = await createAppointment(appointmentData);

    return NextResponse.json(
      createSuccessResponse(appointment, 'Appointment created successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Create appointment error:', error);

    if (error instanceof ZodError) {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError.message),
        { status: 400 }
      );
    }

    const apiError = handleApiError(error);
    return NextResponse.json(
      createErrorResponse(apiError.message),
      { status: apiError.statusCode }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = updateAppointmentSchema.parse(body);
    const { id, ...updateData } = validatedData;

    if (!id) {
      return NextResponse.json(
        createErrorResponse('Appointment ID is required'),
        { status: 400 }
      );
    }

    // Transform string dates to Date objects for update
    const updateDataWithDates = {
      ...updateData,
      appointmentDate: updateData.appointmentDate ? new Date(updateData.appointmentDate) : undefined,
      startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
    };

    const appointment = await updateAppointment(id, updateDataWithDates);

    return NextResponse.json(
      createSuccessResponse(appointment, 'Appointment updated successfully')
    );
  } catch (error) {
    console.error('Update appointment error:', error);

    if (error instanceof ZodError) {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError.message),
        { status: 400 }
      );
    }

    const apiError = handleApiError(error);
    return NextResponse.json(
      createErrorResponse(apiError.message),
      { status: apiError.statusCode }
    );
  }
}

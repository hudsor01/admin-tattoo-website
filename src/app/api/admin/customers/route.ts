import { NextRequest, NextResponse } from 'next/server';
import { customerFilterSchema, createCustomerSchema } from '@/lib/validations';
import { createSuccessResponse, createErrorResponse, handleZodError } from '@/lib/error-handling';
import { getCustomers, createCustomer } from '@/lib/db-operations';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    // In development, return mock customer data
    if (process.env.NODE_ENV === 'development') {
      const mockCustomers = [
        { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+1-555-0123', address: '123 Main St', notes: 'Regular customer', _count: { bookings: 3 }, bookings: [{ startDate: new Date().toISOString() }] },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1-555-0124', address: '456 Oak Ave', notes: 'Prefers afternoon appointments', _count: { bookings: 1 }, bookings: [{ startDate: new Date().toISOString() }] },
        { id: '3', name: 'Mike Johnson', email: 'mike@example.com', phone: '+1-555-0125', address: '789 Pine St', notes: 'New client', _count: { bookings: 0 }, bookings: [] },
        { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', phone: '+1-555-0126', address: '321 Elm St', notes: 'Large piece in progress', _count: { bookings: 5 }, bookings: [{ startDate: new Date().toISOString() }] },
        { id: '5', name: 'David Brown', email: 'david@example.com', phone: '+1-555-0127', address: '654 Maple Dr', notes: 'Touch-up specialist', _count: { bookings: 2 }, bookings: [{ startDate: new Date().toISOString() }] }
      ]
      return NextResponse.json(createSuccessResponse(mockCustomers))
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const filters = customerFilterSchema.parse({
      search: searchParams.get('search') || undefined,
      hasAppointments: searchParams.get('hasAppointments') === 'true' ? true : 
                      searchParams.get('hasAppointments') === 'false' ? false : undefined,
      limit: parseInt(searchParams.get('limit') || '10'),
      offset: parseInt(searchParams.get('offset') || '0')
    });

    // Use real database operations
    const result = await getCustomers(filters);

    return NextResponse.json(createSuccessResponse(result));
  } catch (error) {
    console.error('Customers API error:', error);
    
    if (error instanceof ZodError) {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError.message),
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      createErrorResponse('Failed to fetch customers'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = createCustomerSchema.parse(body);
    
    // Create new customer using real database operations
    const newCustomer = await createCustomer(validatedData);
    
    return NextResponse.json(
      createSuccessResponse(newCustomer, 'Customer created successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Create customer error:', error);
    
    if (error instanceof ZodError) {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError.message),
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      createErrorResponse('Failed to create customer'),
      { status: 500 }
    );
  }
}
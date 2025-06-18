import { type NextRequest, NextResponse } from 'next/server';
import { type CreateCustomer, createCustomerSchema, customerFilterSchema } from '@/lib/validations';
import { createErrorResponse, createSuccessResponse, handleZodError } from '@/lib/api-core';
import { createCustomer, getCustomers } from '@/lib/db-operations';
import { ZodError } from 'zod';
import { SecurityPresets, withSecurityValidation } from '@/lib/api-validation';

const getCustomersHandler = async (request: NextRequest, validatedData?: { query?: Record<string, unknown> }): Promise<NextResponse> => {
  try {
    // Use validated query data if available, otherwise parse manually
    const filters = validatedData?.query || ((): Record<string, unknown> => {
      const { searchParams } = new URL(request.url);
      return customerFilterSchema.parse({
        search: searchParams.get('search') || undefined,
        hasAppointments: searchParams.get('hasAppointments') === 'true' ? true : 
                        searchParams.get('hasAppointments') === 'false' ? false : undefined,
        limit: parseInt(searchParams.get('limit') || '10'),
        offset: parseInt(searchParams.get('offset') || '0')
      });
    })();

    // Use database operations with consistent validation across all environments
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

const createCustomerHandler = async (request: NextRequest, validatedData?: { body?: Record<string, unknown> }): Promise<NextResponse> => {
  try {
    // Use validated body data if available, otherwise parse manually
    const parsedData = validatedData?.body || await (async (): Promise<Record<string, unknown>> => {
      const body = await request.json();
      return createCustomerSchema.parse(body);
    })();
    
    // Type assertion to ensure we have the proper CreateCustomer type
    const validatedCustomerData = parsedData as CreateCustomer;
    
    // Transform name to firstName/lastName if needed
    const clientData = {
      ...validatedCustomerData,
      firstName: typeof validatedCustomerData.name === 'string' ? validatedCustomerData.name.split(' ')[0] || '' : '',
      lastName: typeof validatedCustomerData.name === 'string' ? validatedCustomerData.name.split(' ').slice(1).join(' ') || '' : '',
      // Ensure required fields are not undefined for TypeScript
      email: validatedCustomerData.email || '',
      phone: validatedCustomerData.phone || '',
    };
    
    // Create new customer using real database operations
    const newCustomer = await createCustomer(clientData);
    
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

// Apply security validation with new permission-based presets
export const GET = withSecurityValidation({
  ...SecurityPresets.CUSTOMER_READ,
  querySchema: customerFilterSchema
})(getCustomersHandler);

export const POST = withSecurityValidation({
  ...SecurityPresets.CUSTOMER_WRITE,
  bodySchema: createCustomerSchema
})(createCustomerHandler);

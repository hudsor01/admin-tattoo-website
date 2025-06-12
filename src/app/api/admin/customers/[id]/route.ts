import { NextRequest, NextResponse } from 'next/server';
import { getCustomerById, updateCustomer, deleteCustomer } from '@/lib/db-operations';
import { updateCustomerSchema } from '@/lib/validations';
import { createSuccessResponse, createErrorResponse, handleApiError, handleZodError } from '@/lib/error-handling';
import { ZodError } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const customer = await getCustomerById(params.id);
    return NextResponse.json(createSuccessResponse(customer));
  } catch (error) {
    console.error('Get customer error:', error);
    
    const apiError = handleApiError(error);
    return NextResponse.json(
      createErrorResponse(apiError.message),
      { status: apiError.statusCode }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = updateCustomerSchema.parse({ ...body, id: params.id });
    const { id, ...updateData } = validatedData;
    
    const customer = await updateCustomer(params.id, updateData);
    
    return NextResponse.json(
      createSuccessResponse(customer, 'Customer updated successfully')
    );
  } catch (error) {
    console.error('Update customer error:', error);
    
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await deleteCustomer(params.id);
    
    return NextResponse.json(
      createSuccessResponse(null, 'Customer deleted successfully')
    );
  } catch (error) {
    console.error('Delete customer error:', error);
    
    const apiError = handleApiError(error);
    return NextResponse.json(
      createErrorResponse(apiError.message),
      { status: apiError.statusCode }
    );
  }
}
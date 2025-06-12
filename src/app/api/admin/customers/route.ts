import { NextRequest, NextResponse } from 'next/server';
import { customerFilterSchema, createCustomerSchema } from '@/lib/validations';
import { createSuccessResponse, createErrorResponse, handleZodError } from '@/lib/error-handling';
import { getCustomers, createCustomer } from '@/lib/db-operations';
import { ZodError } from 'zod';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // In development, use real database data from Prisma
    if (process.env.NODE_ENV === 'development') {
      const prisma = new PrismaClient();
      
      try {
        const clients = await prisma.client.findMany({
          include: {
            sessions: {
              select: {
                id: true,
                appointmentDate: true,
                status: true
              }
            },
            appointments: {
              select: {
                id: true,
                scheduledDate: true,
                status: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        return NextResponse.json(createSuccessResponse(clients));
      } finally {
        await prisma.$disconnect();
      }
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
    
    // Transform name to firstName/lastName if needed
    const clientData = {
      ...validatedData,
      firstName: validatedData.name?.split(' ')[0] || '',
      lastName: validatedData.name?.split(' ').slice(1).join(' ') || '',
      // Ensure required fields are not undefined for TypeScript
      email: validatedData.email || '',
      phone: validatedData.phone || '',
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
import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';
import { createSuccessResponse, createErrorResponse, handleZodError, handleApiError } from '@/lib/error-handling';

export type ApiHandler<T = unknown> = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<T>;

export interface ApiRouteConfig {
  validateBody?: ZodSchema;
  validateQuery?: ZodSchema;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

/**
 * Wrapper for API routes to reduce boilerplate code
 * Handles validation, error handling, and response formatting
 */
export function withApiHandler<T>(
  handler: ApiHandler<T>,
  config: ApiRouteConfig = {}
) {
  return async function(
    request: NextRequest,
    context?: { params: Record<string, string> }
  ): Promise<NextResponse> {
    try {
      let validatedBody;
      let validatedQuery;

      // Validate request body if schema provided
      if (config.validateBody && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const body = await request.json();
        validatedBody = config.validateBody.parse(body);
      }

      // Validate query parameters if schema provided
      if (config.validateQuery) {
        const { searchParams } = new URL(request.url);
        const queryObject = Object.fromEntries(searchParams.entries());
        validatedQuery = config.validateQuery.parse(queryObject);
      }

      // Add validated data to request for handler use
      (request as any).validatedBody = validatedBody;
      (request as any).validatedQuery = validatedQuery;

      const result = await handler(request, context);
      
      // If result is already a NextResponse, return it
      if (result instanceof NextResponse) {
        return result;
      }

      // Otherwise wrap in success response
      return NextResponse.json(createSuccessResponse(result));
    } catch (error) {
      console.error('API route error:', error);

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
  };
}

/**
 * Higher-order function for CRUD operations
 */
export function createCrudHandlers<T>(
  entityName: string,
  operations: {
    getAll?: (filters?: any) => Promise<T[]>;
    getById?: (id: string) => Promise<T>;
    create?: (data: any) => Promise<T>;
    update?: (id: string, data: any) => Promise<T>;
    delete?: (id: string) => Promise<void>;
  },
  schemas: {
    create?: ZodSchema;
    update?: ZodSchema;
    query?: ZodSchema;
  } = {}
) {
  const handlers: Record<string, Function> = {};

  // GET handler (list all)
  if (operations.getAll) {
    handlers.GET = withApiHandler(
      async (request: NextRequest) => {
        const { searchParams } = new URL(request.url);
        const filters = Object.fromEntries(searchParams.entries());
        return operations.getAll!(filters);
      },
      { validateQuery: schemas.query }
    );
  }

  // POST handler (create)
  if (operations.create) {
    handlers.POST = withApiHandler(
      async (request: NextRequest) => {
        const data = (request as any).validatedBody;
        const result = await operations.create!(data);
        return NextResponse.json(
          createSuccessResponse(result, `${entityName} created successfully`),
          { status: 201 }
        );
      },
      { validateBody: schemas.create }
    );
  }

  return handlers;
}

/**
 * Higher-order function for single resource handlers
 */
export function createResourceHandlers<T>(
  entityName: string,
  operations: {
    getById?: (id: string) => Promise<T>;
    update?: (id: string, data: any) => Promise<T>;
    delete?: (id: string) => Promise<void>;
  },
  schemas: {
    update?: ZodSchema;
  } = {}
) {
  const handlers: Record<string, Function> = {};

  // GET handler (single item)
  if (operations.getById) {
    handlers.GET = withApiHandler(
      async (request: NextRequest, context) => {
        const id = context?.params?.id;
        if (!id) {
          throw new Error(`${entityName} ID is required`);
        }
        return operations.getById!(id);
      }
    );
  }

  // PATCH handler (update)
  if (operations.update) {
    handlers.PATCH = withApiHandler(
      async (request: NextRequest, context) => {
        const id = context?.params?.id;
        if (!id) {
          throw new Error(`${entityName} ID is required`);
        }
        const data = (request as any).validatedBody;
        const result = await operations.update!(id, data);
        return NextResponse.json(
          createSuccessResponse(result, `${entityName} updated successfully`)
        );
      },
      { validateBody: schemas.update }
    );
  }

  // DELETE handler
  if (operations.delete) {
    handlers.DELETE = withApiHandler(
      async (request: NextRequest, context) => {
        const id = context?.params?.id;
        if (!id) {
          throw new Error(`${entityName} ID is required`);
        }
        await operations.delete!(id);
        return NextResponse.json(
          createSuccessResponse(null, `${entityName} deleted successfully`)
        );
      }
    );
  }

  return handlers;
}

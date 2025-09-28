import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import {
  getEmployees,
  createEmployee,
} from "@/services/employee-server.service";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";
import {
  createEmployeeSchema,
  queryEmployeesSchema,
} from "@/schemas/employee.schema";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getCurrentSession();
    if (!session || !session.employee) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Check authorization - only HR_ADMIN and SUPER_ADMIN can view employees
    const userRole = session.employee.role;
    if (!["HR_ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Only HR administrators can view employees.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = {
      search: searchParams.get("search") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      role: searchParams.get("role") || undefined,
      isActive: searchParams.get("isActive") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
    };

    // Validate query parameters
    const validatedQuery = queryEmployeesSchema.parse(query);

    logger.info(
      `Getting employees for organization: ${session.employee.organizationId}`
    );

    // Get employees
    const result = await getEmployees(
      session.employee.organizationId,
      validatedQuery
    );

    return NextResponse.json(
      {
        success: true,
        message: "Employees retrieved successfully",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error in GET /api/employees:", { error: error as Error });

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getCurrentSession();
    if (!session || !session.employee) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Check authorization - only HR_ADMIN and SUPER_ADMIN can create employees
    const userRole = session.employee.role;
    if (!["HR_ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Only HR administrators can create employees.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = createEmployeeSchema.parse(body);

    logger.info(
      `Creating employee for organization: ${session.employee.organizationId}`
    );

    // Create employee
    const employee = await createEmployee(
      session.employee.organizationId,
      validatedData
    );

    logger.info(`Employee created successfully: ${employee.id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Employee created successfully",
        data: employee,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error in POST /api/employees:", { error: error as Error });

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

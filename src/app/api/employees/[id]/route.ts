import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import {
  getEmployeeById,
  getEmployeeWithLeaveBalances,
  updateEmployee,
  deleteEmployee,
} from "@/services/employee-server.service";
import {
  updateEmployeeSchema,
  employeeIdParamSchema,
} from "@/schemas/employee.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

/**
 * GET /api/employees/[id] - Get employee by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

    // Validate employee ID parameter
    const resolvedParams = await params;
    const validatedParams = employeeIdParamSchema.parse(resolvedParams);
    const { searchParams } = new URL(request.url);
    const includeLeaveBalances =
      searchParams.get("includeLeaveBalances") === "true";

    logger.info(`Getting employee: ${validatedParams.id}`);

    // Get employee
    const employee = includeLeaveBalances
      ? await getEmployeeWithLeaveBalances(
          validatedParams.id,
          session.employee.organizationId
        )
      : await getEmployeeById(
          validatedParams.id,
          session.employee.organizationId
        );

    return NextResponse.json(
      {
        success: true,
        message: "Employee retrieved successfully",
        data: employee,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error in GET /api/employees/${(await params).id}:`, {
      error: error as Error,
    });

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

    // Check authorization - only HR_ADMIN and SUPER_ADMIN can update employees
    const userRole = session.employee.role;
    if (!["HR_ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Only HR administrators can update employees.",
        },
        { status: 403 }
      );
    }

    // Validate employee ID parameter
    const resolvedParams = await params;
    const validatedParams = employeeIdParamSchema.parse(resolvedParams);

    const body = await request.json();

    // Validate request body
    const validatedData = updateEmployeeSchema.parse(body);

    logger.info(`Updating employee: ${validatedParams.id}`);

    // Update employee
    const employee = await updateEmployee(
      validatedParams.id,
      session.employee.organizationId,
      validatedData
    );

    logger.info(`Employee updated successfully: ${validatedParams.id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Employee updated successfully",
        data: employee,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error in PUT /api/employees/${(await params).id}:`, {
      error: error as Error,
    });

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

    // Check authorization - only HR_ADMIN and SUPER_ADMIN can delete employees
    const userRole = session.employee.role;
    if (!["HR_ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Only HR administrators can delete employees.",
        },
        { status: 403 }
      );
    }

    // Validate employee ID parameter
    const resolvedParams = await params;
    const validatedParams = employeeIdParamSchema.parse(resolvedParams);

    // Cannot delete yourself
    if (validatedParams.id === session.employee.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot delete your own account.",
        },
        { status: 400 }
      );
    }

    logger.info(`Deleting employee: ${validatedParams.id}`);

    // Delete employee (soft delete)
    await deleteEmployee(validatedParams.id, session.employee.organizationId);

    logger.info(`Employee deleted successfully: ${validatedParams.id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Employee deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Error in DELETE /api/employees/${(await params).id}:`, {
      error: error as Error,
    });

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

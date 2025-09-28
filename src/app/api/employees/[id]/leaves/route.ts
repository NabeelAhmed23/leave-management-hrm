import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import { getEmployeeWithLeaveBalances } from "@/services/employee-server.service";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";
import { employeeIdParamSchema } from "@/schemas/employee.schema";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Authenticate user
    const session = await getCurrentSession();
    if (!session || !session.employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission (HR_ADMIN or SUPER_ADMIN)
    const userRole = session.employee.role;
    if (!userRole || !["HR_ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // Validate employee ID
    const params = await context.params;
    const { id } = employeeIdParamSchema.parse(params);

    // Get employee with leave balances
    const employee = await getEmployeeWithLeaveBalances(
      id,
      session.employee.organizationId
    );

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    logger.info("Employee leave balances retrieved successfully", {
      employeeId: id,
      requestedBy: session.id,
      organizationId: session.employee.organizationId,
    });

    return NextResponse.json({
      employee,
      leaveBalances: employee.leaveBalances,
    });
  } catch (error) {
    const appError = AppError.from(error);
    logger.error("Error retrieving employee leave balances", {
      error: appError,
      stack: appError.stack,
      employeeId: (await context.params).id,
    });

    return NextResponse.json(
      { error: appError.message },
      { status: appError.statusCode }
    );
  }
}

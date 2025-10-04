import { prisma } from "@/lib/prisma";
import { logger } from "@/services/logger.service";
import { AppError } from "@/utils/app-error";
import { Role, LeaveStatus } from "@prisma/client";
import {
  ReportData,
  ReportStats,
  LeaveByType,
  LeaveByStatus,
  LeaveByMonth,
  LeaveByDepartment,
  TopEmployeeByLeave,
  QueryReportsDTO,
} from "@/types/report.types";

/**
 * Get comprehensive reports based on user role and filters
 */
export async function getReports(
  employeeId: string,
  organizationId: string,
  userRole: Role,
  filters: QueryReportsDTO = {}
): Promise<ReportData> {
  try {
    const currentYear = filters.year || new Date().getFullYear();
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(currentYear, 0, 1);
    const endDate = filters.endDate
      ? new Date(filters.endDate)
      : new Date(currentYear, 11, 31, 23, 59, 59);

    // Build base where clause based on role
    const baseWhere: Record<string, unknown> = {
      leaveType: {
        organizationId,
      },
      startDate: {
        gte: startDate,
      },
      endDate: {
        lte: endDate,
      },
    };

    // Apply role-based filtering
    if (userRole === Role.EMPLOYEE) {
      // Employees only see their own data
      baseWhere.employees = {
        some: {
          employeeId,
        },
      };
    } else if (userRole === Role.MANAGER) {
      // Managers see their subordinates' data
      const manager = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          departmentId: true,
          department: {
            select: {
              employees: {
                select: { id: true },
                where: { isActive: true },
              },
            },
          },
        },
      });

      if (manager?.department) {
        const subordinateIds = manager.department.employees.map(e => e.id);
        baseWhere.employees = {
          some: {
            employeeId: {
              in: subordinateIds,
            },
          },
        };
      }
    }
    // HR_ADMIN sees all data (no additional filtering needed)

    // Apply optional filters
    if (filters.departmentId) {
      baseWhere.employees = {
        some: {
          employee: {
            departmentId: filters.departmentId,
          },
        },
      };
    }

    if (filters.leaveTypeId) {
      baseWhere.leaveTypeId = filters.leaveTypeId;
    }

    // Fetch all leave requests matching criteria
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: baseWhere,
      include: {
        leaveType: true,
        employees: {
          include: {
            employee: {
              include: {
                user: true,
                department: true,
              },
            },
          },
        },
      },
    });

    // Calculate statistics
    const stats = calculateStats(leaveRequests);

    // Calculate leave by type
    const leaveByType = calculateLeaveByType(leaveRequests);

    // Calculate leave by status
    const leaveByStatus = calculateLeaveByStatus(leaveRequests);

    // Calculate leave by month
    const leaveByMonth = calculateLeaveByMonth(leaveRequests, currentYear);

    // Calculate leave by department
    const leaveByDepartment = await calculateLeaveByDepartment(
      leaveRequests,
      organizationId
    );

    // Get top employees by leave
    const topEmployeesByLeave = calculateTopEmployees(leaveRequests);

    logger.info(
      `Generated reports for employee: ${employeeId}, organization: ${organizationId}, role: ${userRole}`
    );

    return {
      stats,
      leaveByType,
      leaveByStatus,
      leaveByMonth,
      leaveByDepartment,
      topEmployeesByLeave,
    };
  } catch (error) {
    logger.error(`Get reports error: ${error}`);
    throw new AppError("Failed to generate reports", 500);
  }
}

/**
 * Calculate overall statistics
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateStats(leaveRequests: any[]): ReportStats {
  const totalLeaveRequests = leaveRequests.length;
  const pendingRequests = leaveRequests.filter(
    lr => lr.status === LeaveStatus.PENDING
  ).length;
  const approvedRequests = leaveRequests.filter(
    lr => lr.status === LeaveStatus.APPROVED
  ).length;
  const rejectedRequests = leaveRequests.filter(
    lr => lr.status === LeaveStatus.REJECTED
  ).length;

  const totalLeaveDaysTaken = leaveRequests
    .filter(lr => lr.status === LeaveStatus.APPROVED)
    .reduce((sum, lr) => sum + lr.totalDays, 0);

  // Get unique employees
  const uniqueEmployees = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leaveRequests.forEach((lr: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lr.employees.forEach((emp: any) => {
      uniqueEmployees.add(emp.employeeId);
    });
  });

  const totalEmployees = uniqueEmployees.size;
  const averageLeaveDaysPerEmployee =
    totalEmployees > 0 ? totalLeaveDaysTaken / totalEmployees : 0;

  return {
    totalEmployees,
    totalLeaveRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    totalLeaveDaysTaken,
    averageLeaveDaysPerEmployee:
      Math.round(averageLeaveDaysPerEmployee * 10) / 10,
  };
}

/**
 * Calculate leave distribution by type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateLeaveByType(leaveRequests: any[]): LeaveByType[] {
  const typeMap = new Map<string, LeaveByType>();

  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
    "#6366f1", // indigo
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leaveRequests.forEach((lr: any) => {
    const key = lr.leaveTypeId;
    if (!typeMap.has(key)) {
      typeMap.set(key, {
        leaveTypeName: lr.leaveType.name,
        leaveTypeId: lr.leaveTypeId,
        totalRequests: 0,
        approvedRequests: 0,
        totalDays: 0,
        color: colors[typeMap.size % colors.length],
      });
    }

    const data = typeMap.get(key)!;
    data.totalRequests++;
    if (lr.status === LeaveStatus.APPROVED) {
      data.approvedRequests++;
      data.totalDays += lr.totalDays;
    }
  });

  return Array.from(typeMap.values()).sort(
    (a, b) => b.totalRequests - a.totalRequests
  );
}

/**
 * Calculate leave distribution by status
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateLeaveByStatus(leaveRequests: any[]): LeaveByStatus[] {
  const total = leaveRequests.length;
  if (total === 0) {
    return [];
  }

  const statusCounts = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    CANCELLED: 0,
  };

  leaveRequests.forEach(lr => {
    if (lr.status in statusCounts) {
      statusCounts[lr.status as keyof typeof statusCounts]++;
    }
  });

  return Object.entries(statusCounts)
    .map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / total) * 100 * 10) / 10,
    }))
    .filter(item => item.count > 0);
}

/**
 * Calculate leave distribution by month
 */
function calculateLeaveByMonth(
  leaveRequests: any[],
  year: number
): LeaveByMonth[] {
  const monthMap = new Map<number, LeaveByMonth>();

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Initialize all months
  for (let i = 0; i < 12; i++) {
    monthMap.set(i, {
      month: monthNames[i],
      year,
      totalRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      pendingRequests: 0,
      totalDays: 0,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leaveRequests.forEach((lr: any) => {
    const month = new Date(lr.startDate).getMonth();
    const data = monthMap.get(month)!;

    data.totalRequests++;
    if (lr.status === LeaveStatus.APPROVED) {
      data.approvedRequests++;
      data.totalDays += lr.totalDays;
    } else if (lr.status === LeaveStatus.REJECTED) {
      data.rejectedRequests++;
    } else if (lr.status === LeaveStatus.PENDING) {
      data.pendingRequests++;
    }
  });

  return Array.from(monthMap.values());
}

/**
 * Calculate leave distribution by department
 */
 
  leaveRequests: any[],
  organizationId: string
): Promise<LeaveByDepartment[]> {
  const deptMap = new Map<string, LeaveByDepartment>();

  // Get all employees in organization
  const allEmployees = await prisma.employee.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    include: {
      department: true,
    },
  });

  // Initialize departments
  allEmployees.forEach(emp => {
    if (emp.department && !deptMap.has(emp.departmentId!)) {
      deptMap.set(emp.departmentId!, {
        departmentId: emp.departmentId!,
        departmentName: emp.department.name,
        totalEmployees: 0,
        totalRequests: 0,
        totalDays: 0,
        averageDaysPerEmployee: 0,
      });
    }
  });

  // Count employees per department
  allEmployees.forEach(emp => {
    if (emp.departmentId && deptMap.has(emp.departmentId)) {
      deptMap.get(emp.departmentId)!.totalEmployees++;
    }
  });

  // Calculate leave data per department
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leaveRequests.forEach((lr: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lr.employees.forEach((empLeave: any) => {
      const deptId = empLeave.employee.departmentId;
      if (deptId && deptMap.has(deptId)) {
        const data = deptMap.get(deptId)!;
        data.totalRequests++;
        if (lr.status === LeaveStatus.APPROVED) {
          data.totalDays += lr.totalDays;
        }
      }
    });
  });

  // Calculate averages
  deptMap.forEach(dept => {
    dept.averageDaysPerEmployee =
      dept.totalEmployees > 0
        ? Math.round((dept.totalDays / dept.totalEmployees) * 10) / 10
        : 0;
  });

  return Array.from(deptMap.values())
    .filter(d => d.totalEmployees > 0)
    .sort((a, b) => b.totalDays - a.totalDays);
}

/**
 * Get top employees by leave usage
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateTopEmployees(leaveRequests: any[]): TopEmployeeByLeave[] {
  const empMap = new Map<string, TopEmployeeByLeave>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leaveRequests.forEach((lr: any) => {
    if (lr.status === LeaveStatus.APPROVED) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lr.employees.forEach((empLeave: any) => {
        const empId = empLeave.employeeId;
        const emp = empLeave.employee;

        if (!empMap.has(empId)) {
          empMap.set(empId, {
            employeeId: empId,
            employeeName: `${emp.user.firstName} ${emp.user.lastName}`,
            employeeNumber: emp.employeeNumber,
            departmentName: emp.department?.name || null,
            totalRequests: 0,
            totalDays: 0,
            leaveTypes: [],
          });
        }

        const data = empMap.get(empId)!;
        data.totalRequests++;
        data.totalDays += lr.totalDays;

        if (!data.leaveTypes.includes(lr.leaveType.name)) {
          data.leaveTypes.push(lr.leaveType.name);
        }
      });
    }
  });

  return Array.from(empMap.values())
    .sort((a, b) => b.totalDays - a.totalDays)
    .slice(0, 10); // Top 10 employees
}

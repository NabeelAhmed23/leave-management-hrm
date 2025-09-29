"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Home,
  Calendar,
  FileText,
  Users,
  BarChart3,
  Settings,
  Building2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { formatRole } from "@/utils/format-role";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  badge?: string;
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "My Leaves",
    href: "/dashboard/leaves/my-leaves",
    icon: Calendar,
  },
  {
    title: "Leave Requests",
    href: "/dashboard/leaves/requests",
    icon: FileText,
    roles: ["MANAGER", "HR_ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Team Leaves",
    href: "/dashboard/leaves/team",
    icon: Users,
    roles: ["MANAGER", "HR_ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Employees",
    href: "/dashboard/employees",
    icon: Users,
    roles: ["HR_ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Leave Calendar",
    href: "/dashboard/calendar",
    icon: Clock,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["HR_ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Organization",
    href: "/dashboard/organization",
    icon: Building2,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["HR_ADMIN", "SUPER_ADMIN"],
  },
];

export function Sidebar({ className }: SidebarProps): React.ReactElement {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const userRole = user?.employee?.role;

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true;
    return userRole && item.roles.includes(userRole);
  });

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-white transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <div className="flex items-center">
            <Building2 className="mr-2 h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">LMS</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredNavigation.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href} className="block">
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    isCollapsed ? "px-2" : "px-3",
                    isActive && "bg-blue-50 text-blue-700 hover:bg-blue-50"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      !isCollapsed && "mr-3",
                      isActive && "text-blue-700"
                    )}
                  />
                  {!isCollapsed && (
                    <span className="truncate">{item.title}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">
                      {item.badge}
                    </span>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!isCollapsed && user && (
        <>
          <Separator />
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <span className="text-sm font-medium text-blue-700">
                  {user.firstName.charAt(0)}
                  {user.lastName.charAt(0)}
                </span>
              </div>
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                {user.employee?.role && (
                  <p className="truncate text-xs text-gray-500">
                    {formatRole(user.employee?.role)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

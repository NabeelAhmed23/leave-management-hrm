"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { QueryEmployeesDTO } from "@/types/employee.types";
import { Role } from "@prisma/client";
import { formatRole } from "@/utils/format-role";
import { Search, X } from "lucide-react";

interface EmployeeFiltersProps {
  filters: QueryEmployeesDTO;
  onFiltersChange: (filters: Partial<QueryEmployeesDTO>) => void;
}

export function EmployeeFilters({
  filters,
  onFiltersChange,
}: EmployeeFiltersProps): React.ReactElement {
  const [localFilters, setLocalFilters] = useState({
    search: filters.search || "",
    departmentId: filters.departmentId || "",
    role: filters.role || "",
    isActive: filters.isActive?.toString() || "",
  });

  // Update local filters when prop filters change
  useEffect(() => {
    setLocalFilters({
      search: filters.search || "",
      departmentId: filters.departmentId || "",
      role: filters.role || "",
      isActive: filters.isActive?.toString() || "",
    });
  }, [filters]);

  const handleSearchChange = (value: string): void => {
    setLocalFilters(prev => ({ ...prev, search: value }));
  };

  const handleSearchSubmit = (): void => {
    onFiltersChange({
      search: localFilters.search || undefined,
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const handleDepartmentChange = (value: string): void => {
    const departmentId = value === "all" ? undefined : value;
    setLocalFilters(prev => ({ ...prev, departmentId: value }));
    onFiltersChange({ departmentId });
  };

  const handleRoleChange = (value: string): void => {
    const role = value === "all" ? undefined : (value as Role);
    setLocalFilters(prev => ({ ...prev, role: value }));
    onFiltersChange({ role });
  };

  const handleStatusChange = (value: string): void => {
    const isActive = value === "all" ? undefined : value === "true";
    setLocalFilters(prev => ({ ...prev, isActive: value }));
    onFiltersChange({ isActive });
  };

  const clearFilters = (): void => {
    const clearedFilters = {
      search: "",
      departmentId: "",
      role: "",
      isActive: "",
    };
    setLocalFilters(clearedFilters);
    onFiltersChange({
      search: undefined,
      departmentId: undefined,
      role: undefined,
      isActive: undefined,
    });
  };

  const hasActiveFilters =
    localFilters.search ||
    localFilters.departmentId ||
    localFilters.role ||
    localFilters.isActive;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="search"
              placeholder="Search employees..."
              value={localFilters.search}
              onChange={e => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-10"
            />
          </div>
        </div>

        {/* Department Filter */}
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select
            value={localFilters.departmentId}
            onValueChange={handleDepartmentChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {/* TODO: Add department options from API */}
              <SelectItem value="no-department">No department</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Role Filter */}
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={localFilters.role} onValueChange={handleRoleChange}>
            <SelectTrigger>
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value={Role.EMPLOYEE}>
                {formatRole(Role.EMPLOYEE)}
              </SelectItem>
              <SelectItem value={Role.MANAGER}>
                {formatRole(Role.MANAGER)}
              </SelectItem>
              <SelectItem value={Role.HR_ADMIN}>
                {formatRole(Role.HR_ADMIN)}
              </SelectItem>
              <SelectItem value={Role.SUPER_ADMIN}>
                {formatRole(Role.SUPER_ADMIN)}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={localFilters.isActive}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter Actions */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          onClick={handleSearchSubmit}
          className="flex items-center"
        >
          <Search className="mr-2 h-4 w-4" />
          Apply Search
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}

        {hasActiveFilters && (
          <div className="text-sm text-gray-500">
            {[
              localFilters.search && `Search: "${localFilters.search}"`,
              localFilters.role &&
                `Role: ${formatRole(localFilters.role as Role)}`,
              localFilters.isActive &&
                `Status: ${localFilters.isActive === "true" ? "Active" : "Inactive"}`,
            ]
              .filter(Boolean)
              .join(" • ")}
          </div>
        )}
      </div>
    </div>
  );
}

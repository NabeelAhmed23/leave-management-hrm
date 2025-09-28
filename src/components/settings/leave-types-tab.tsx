"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useLeaveTypes } from "@/hooks/use-leave-types";
import { LeaveTypesTable } from "./leave-types-table";
import { CreateLeaveTypeDialog } from "./create-leave-type-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export function LeaveTypesTab(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const {
    data: leaveTypesData,
    isLoading,
    error,
  } = useLeaveTypes({
    search: searchQuery || undefined,
    page: currentPage,
    limit: 10,
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Leave Types</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage the types of leave available in your organization
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Leave Type
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex items-center space-x-2">
          <div className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search leave types..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center space-y-2 py-8">
            <p className="text-destructive text-sm">
              Failed to load leave types: {error.message}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && leaveTypesData && (
          <LeaveTypesTable
            leaveTypes={leaveTypesData.leaveTypes}
            pagination={leaveTypesData.pagination}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        )}

        {/* Empty State */}
        {!isLoading &&
          !error &&
          leaveTypesData &&
          leaveTypesData.leaveTypes.length === 0 && (
            <div className="flex flex-col items-center justify-center space-y-3 py-8">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {searchQuery ? "No leave types found" : "No leave types yet"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Create your first leave type to get started"}
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Leave Type
                </Button>
              )}
            </div>
          )}
      </CardContent>

      {/* Create Dialog */}
      <CreateLeaveTypeDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </Card>
  );
}

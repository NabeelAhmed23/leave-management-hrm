import React from "react";

interface GuestLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function GuestLayout({
  children,
  title,
  subtitle,
}: GuestLayoutProps): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-lg font-bold text-white">L</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Leave Management
            </h1>
          </div>
        </div>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="mt-2 text-gray-600">{subtitle}</p>
        </div>
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
      <footer className="mt-8 text-center text-sm text-gray-600">
        <p>© 2024 Leave Management System v1.0</p>
      </footer>
    </div>
  );
}

import React from "react";

interface AuthLayoutPageProps {
  children: React.ReactNode;
}

export default function AuthLayoutPage({
  children,
}: AuthLayoutPageProps): React.ReactElement {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}

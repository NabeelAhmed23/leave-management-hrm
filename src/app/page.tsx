import { redirect } from "next/navigation";

export default function HomePage(): void {
  return redirect("/dashboard");
}

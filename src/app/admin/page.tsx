import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminPanel from "@/components/AdminPanel";

// Marcar esta página como dinámica ya que usa cookies
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Verificar autenticación en el servidor
  const user = await getCurrentUser();

  if (!user) {
    console.log("⚠️ AdminPage: No user found, redirecting to login");
    redirect("/login");
  }

  console.log("✅ AdminPage: User authenticated:", user.email);
  return <AdminPanel />;
}

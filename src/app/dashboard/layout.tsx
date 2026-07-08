import { Sidebar } from "@/components/dashboard/sidebar";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifySession } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  let user = undefined;

  if (session?.userId) {
    const [fetchedUser] = await db
      .select({ name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, session.userId));
    
    if (fetchedUser) {
      user = fetchedUser;
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FDFBF7] text-[#1C2024]">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

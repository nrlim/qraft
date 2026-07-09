"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Database, History, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

const NAV_ITEMS = [
  { name: "Home", href: "/dashboard", icon: Home, roles: ["admin", "user"] },
  { name: "Schemas", href: "/dashboard/schemas", icon: Database, roles: ["admin"] },
  { name: "History", href: "/dashboard/history", icon: History, roles: ["admin", "user"] },
  { name: "Users", href: "/dashboard/users", icon: Users, roles: ["admin"] },
];

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : "US";
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out successfully");
      window.location.href = "/login";
    } catch {
      toast.error("Failed to sign out");
      setIsLoggingOut(false);
      setLogoutDialogOpen(false);
    }
  };

  return (
    <>
    <aside className="flex h-full w-56 flex-col border-r border-[#1C2024]/10 bg-[#FDFBF7]">
      {/* User Info */}
      <div className="flex flex-col items-center border-b border-[#1C2024]/10 px-6 py-8">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#002B5B] text-white mb-4 shadow-sm">
          <span className="font-medium text-lg">{initials}</span>
        </div>
        <div className="flex flex-col items-center w-full min-w-0 mb-5 text-center space-y-0.5">
          <span className="text-sm font-medium text-[#1C2024] truncate w-full">{user?.name || "User Name"}</span>
          <span className="text-xs text-[#1C2024]/50 truncate w-full">{user?.email || "user@example.com"}</span>
        </div>
        <button
          onClick={() => setLogoutDialogOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-[#1C2024]/10 bg-white px-3 py-2 text-xs font-medium text-[#1C2024]/60 shadow-sm transition-all hover:bg-red-50 hover:text-red-700 hover:border-red-100"
          title="Sign out"
        >
          <LogOut size={14} className="shrink-0" />
          Sign out
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          if (item.roles && !item.roles.includes(user?.role || "user")) return null;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#1C2024]/5 text-[#1C2024]"
                  : "text-[#1C2024]/60 hover:bg-[#1C2024]/5 hover:text-[#1C2024]"
              )}
            >
              <item.icon
                className={cn(
                  "shrink-0",
                  isActive ? "text-[#002B5B]" : "text-[#1C2024]/40 group-hover:text-[#002B5B]"
                )}
                size={18}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

    </aside>
      <ConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title="Sign Out"
        description="Are you sure you want to sign out? You will need to login again to access the dashboard."
        confirmText="Sign Out"
        onConfirm={handleLogout}
        isConfirming={isLoggingOut}
      />
    </>
  );
}

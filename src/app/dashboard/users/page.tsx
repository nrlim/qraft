"use client";

import { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Users as UsersIcon, Shield, User, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const [data, setData] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (res.ok && json.data) {
        setData(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsUpdating(userId);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (res.ok) {
        // Update local state
        setData((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        );
        toast.success("Role updated successfully.");
      } else {
        const error = await res.json();
        toast.error(error.message || error.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Failed to update role", error);
      toast.error("Failed to update role");
    } finally {
      setIsUpdating(null);
    }
  };

  const columns: ColumnDef<UserRecord>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium text-[#1C2024]">{row.original.name}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-sm text-[#1C2024]/70">{row.original.email}</div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <div className="flex items-center gap-2">
            <Select
              disabled={isUpdating === row.original.id}
              value={role || ""}
              onValueChange={(val) => handleRoleChange(row.original.id!, val!)}
            >
              <SelectTrigger className="w-[120px] h-8 bg-white border-[#1C2024]/20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <div className="flex items-center gap-2 text-xs">
                    <User className="size-3" />
                    User
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2 text-xs text-[#002B5B] font-medium">
                    <Shield className="size-3" />
                    Admin
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {isUpdating === row.original.id && (
              <Loader2 className="size-3 animate-spin text-[#002B5B]" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined Date",
      cell: ({ row }) => (
        <span className="text-sm text-[#1C2024]/60 whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#1C2024]/10 px-8 py-6">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#1C2024]">
            User Management
          </h1>
          <p className="mt-1 text-[#1C2024]/60">
            Manage your users and their roles in the system.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {isLoading && data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-[#1C2024]/40">
            Loading users...
          </div>
        ) : (
          <DataTable columns={columns} data={data} searchPlaceholder="Search users..." />
        )}
      </div>
    </div>
  );
}

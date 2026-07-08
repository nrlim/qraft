"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Upload, Trash2, FileText, Database, Settings } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface SchemaItem {
  id: string;
  name: string;
  description: string | null;
  fileName: string;
  createdAt: string;
  updatedAt: string;
}

export default function SchemasPage() {
  const [schemasList, setSchemasList] = useState<SchemaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSchemas = useCallback(async () => {
    try {
      const res = await fetch("/api/schemas");
      const json = await res.json();
      if (res.ok) {
        setSchemasList(json.data);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Schema name is required.");
      return;
    }
    if (!file) {
      toast.error("Please upload a .sql file.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", name.trim());
    if (description.trim()) {
      formData.append("description", description.trim());
    }
    formData.append("file", file);

    try {
      const res = await fetch("/api/schemas", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.message || "Failed to create schema.");
        return;
      }

      toast.success("Schema created successfully.");
      // Reset form and close dialog
      setName("");
      setDescription("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setDialogOpen(false);
      fetchSchemas();
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/schemas/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setSchemasList((prev) => prev.filter((s) => s.id !== deleteId));
        toast.success("Schema deleted successfully.");
      } else {
        toast.error("Failed to delete schema.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith(".sql")) {
        toast.error("Only .sql files are accepted.");
        e.target.value = "";
        return;
      }
      setFile(selected);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const columns: ColumnDef<SchemaItem>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const schema = row.original;
        return (
          <div>
            <Link href={`/dashboard/schemas/${schema.id}`} className="font-medium text-[#002B5B] hover:underline">
              {schema.name}
            </Link>
            {schema.description && (
              <p className="mt-0.5 text-xs text-[#1C2024]/50 line-clamp-1">
                {schema.description}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "fileName",
      header: "File",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2 text-[#1C2024]/70">
            <FileText className="size-4 shrink-0" />
            <span className="text-sm">{row.getValue("fileName")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        return (
          <span className="text-[#1C2024]/60">
            {formatDate(row.getValue("createdAt"))}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        return (
          <div className="flex justify-end gap-2">
            <Link href={`/dashboard/schemas/${row.original.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#002B5B] hover:text-[#002B5B] hover:bg-[#002B5B]/5"
              >
                <Settings className="size-4 mr-2" />
                Manage Knowledge
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-[#1C2024]/40 hover:text-red-700 hover:bg-red-50"
              onClick={() => setDeleteId(row.original.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#1C2024]/10 px-8 py-6">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#1C2024]">
            Schemas
          </h1>
          <p className="mt-1 text-[#1C2024]/60">
            Manage your database schemas as the AI knowledge base.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-[#002B5B] text-white hover:bg-[#002B5B]/90 rounded-[6px]" />
            }
          >
            <Plus className="mr-2 size-4" />
            New Schema
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Schema</DialogTitle>
              <DialogDescription>
                Give your schema a name and upload the SQL design file.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1C2024]">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. E-Commerce DB"
                  className="bg-white border-[#1C2024]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1C2024]">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional: describe what this schema represents"
                  rows={3}
                  className="bg-white border-[#1C2024]/20 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1C2024]">
                  SQL File <span className="text-red-500">*</span>
                </label>
                <div
                  className="flex cursor-pointer items-center justify-center rounded-[6px] border-2 border-dashed border-[#1C2024]/20 bg-white px-6 py-8 transition-colors hover:border-[#002B5B]/40 hover:bg-[#002B5B]/5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center">
                    <Upload className="mx-auto size-8 text-[#1C2024]/30" />
                    <p className="mt-2 text-sm font-medium text-[#1C2024]/70">
                      {file ? file.name : "Click to upload .sql file"}
                    </p>
                    {!file && (
                      <p className="mt-1 text-xs text-[#1C2024]/40">
                        Max 5MB
                      </p>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".sql"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#002B5B] text-white hover:bg-[#002B5B]/90 rounded-[6px]"
                >
                  {isSubmitting ? "Creating..." : "Create Schema"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-[#1C2024]/40">
            Loading schemas...
          </div>
        ) : schemasList.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <Database className="size-12 text-[#1C2024]/20" />
            <h3 className="mt-4 text-lg font-medium text-[#1C2024]">
              No schemas yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[#1C2024]/60">
              Create your first schema by uploading a SQL file. This will serve
              as the knowledge base for AI-powered SQL generation.
            </p>
            <Button
              className="mt-6 bg-[#002B5B] text-white hover:bg-[#002B5B]/90 rounded-[6px]"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-2 size-4" />
              New Schema
            </Button>
          </div>
        ) : (
          <DataTable columns={columns} data={schemasList} searchPlaceholder="Search schemas..." />
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Schema"
        description="Are you sure you want to delete this schema? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        isConfirming={isDeleting}
      />
    </div>
  );
}

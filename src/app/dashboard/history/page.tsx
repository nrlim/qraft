"use client";

import { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { History, Search, FileText, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HistoryRecord {
  id: string;
  prompt: string;
  sql: string;
  projectName: string;
  createdAt: string;
}

export default function HistoryPage() {
  const [data, setData] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/history?page=${p}&limit=10`);
      const json = await res.json();
      if (res.ok && json.data) {
        setData(json.data);
        setTotalPages(json.meta.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(page);
  }, [page, fetchHistory]);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const columns: ColumnDef<HistoryRecord>[] = [
    {
      accessorKey: "prompt",
      header: "User Prompt",
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <p className="line-clamp-2 text-sm font-medium text-[#1C2024]">
            {row.original.prompt}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "sql",
      header: "Generated SQL",
      cell: ({ row }) => (
        <div className="relative group max-w-[400px]">
          <pre className="line-clamp-2 text-xs text-[#1C2024]/60 font-mono bg-[#1C2024]/5 p-2 rounded-md">
            {row.original.sql}
          </pre>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleCopy(row.original.id, row.original.sql)}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 bg-white/90 border border-[#1C2024]/10 shadow-sm"
          >
            {copiedId === row.original.id ? (
              <Check className="size-3 text-green-600" />
            ) : (
              <Copy className="size-3 text-[#1C2024]/60" />
            )}
          </Button>
        </div>
      ),
    },
    {
      accessorKey: "projectName",
      header: "Project",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-full bg-[#002B5B]/10 px-2.5 py-0.5 text-xs font-medium text-[#002B5B]">
          {row.original.projectName}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-[#1C2024]/60 whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleString()}
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
            History
          </h1>
          <p className="mt-1 text-[#1C2024]/60">
            View your generated SQL queries and chat history.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {isLoading && data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-[#1C2024]/40">
            Loading history...
          </div>
        ) : (
          <div className="space-y-4">
            <DataTable columns={columns} data={data} searchPlaceholder="Search history..." hidePagination />
                
                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-2">
                  <div className="text-sm text-[#1C2024]/60">
                    Page {page} of {totalPages || 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoading}
                      className="border-[#1C2024]/20"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || totalPages === 0 || isLoading}
                      className="border-[#1C2024]/20"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
        )}
      </div>
    </div>
  );
}

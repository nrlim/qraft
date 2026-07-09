"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Code2, Database, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SchemaMap } from "@/components/schema/schema-map";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ParsedTable, ParsedColumn } from "@/lib/utils/sql-parser";

interface AnnotationItem {
  id: string;
  tableName: string;
  columnName: string;
  contextLabel: string | null;
  jsonStructure: string;
  description: string | null;
  createdAt: string;
}

export default function SchemaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const schemaId = params.id as string;

  const [schema, setSchema] = useState<any>(null);
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [tables, setTables] = useState<ParsedTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedColumn, setSelectedColumn] = useState("");
  const [contextLabel, setContextLabel] = useState("");
  const [jsonStructure, setJsonStructure] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [schemaRes, tablesRes, annotationsRes] = await Promise.all([
        fetch(`/api/schemas/${schemaId}`),
        fetch(`/api/schemas/${schemaId}/tables`),
        fetch(`/api/schemas/${schemaId}/annotations`),
      ]);

      if (!schemaRes.ok) {
        router.push("/dashboard/schemas");
        return;
      }

      const schemaData = await schemaRes.json();
      setSchema(schemaData.data);

      const tablesData = await tablesRes.json();
      if (tablesRes.ok) setTables(tablesData.data || []);

      const annotationsData = await annotationsRes.json();
      if (annotationsRes.ok) setAnnotations(annotationsData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [schemaId, router]);

  const refreshAnnotations = useCallback(async () => {
    try {
      const res = await fetch(`/api/schemas/${schemaId}/annotations`);
      if (res.ok) {
        const json = await res.json();
        setAnnotations(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [schemaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedTable || !selectedColumn || !jsonStructure.trim()) {
      setFormError("Table, column, and JSON structure are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editMode 
        ? `/api/schemas/${schemaId}/annotations/${editId}`
        : `/api/schemas/${schemaId}/annotations`;
        
      const res = await fetch(url, {
        method: editMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableName: selectedTable,
          columnName: selectedColumn,
          contextLabel: contextLabel || null,
          jsonStructure,
          description: description || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.message || `Failed to ${editMode ? 'update' : 'add'} annotation`);
        return;
      }

      setDialogOpen(false);
      setSelectedTable("");
      setSelectedColumn("");
      setContextLabel("");
      setJsonStructure("");
      setDescription("");
      setEditMode(false);
      setEditId(null);
      refreshAnnotations(); // refresh only annotations to avoid full reload
    } catch (err) {
      setFormError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/schemas/${schemaId}/annotations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAnnotations((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      // silently fail
    }
  };

  const handleEdit = (annotation: AnnotationItem) => {
    setSelectedTable(annotation.tableName);
    setSelectedColumn(annotation.columnName);
    setContextLabel(annotation.contextLabel || "");
    setJsonStructure(annotation.jsonStructure);
    setDescription(annotation.description || "");
    setEditMode(true);
    setEditId(annotation.id);
    setDialogOpen(true);
  };

  const handleOpenDialog = (open: boolean) => {
    if (!open) {
      setEditMode(false);
      setEditId(null);
      setSelectedTable("");
      setSelectedColumn("");
      setContextLabel("");
      setJsonStructure("");
      setDescription("");
      setFormError("");
    }
    setDialogOpen(open);
  };

  const availableColumns = tables.find(t => t.name === selectedTable)?.columns || [];

  const columns: ColumnDef<AnnotationItem>[] = [
    {
      accessorKey: "tableName",
      header: "Table",
      cell: ({ row }) => <span className="font-medium">{row.getValue("tableName")}</span>,
    },
    {
      accessorKey: "columnName",
      header: "JSON Column",
    },
    {
      accessorKey: "contextLabel",
      header: "Context / Product",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-[#002B5B]">
          {row.getValue("contextLabel") || <span className="text-[#1C2024]/40 font-normal italic">Default (Any)</span>}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <span className="text-[#1C2024]/60 truncate block max-w-[200px]">{row.getValue("description") || "-"}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-[#1C2024]/40 hover:text-[#002B5B] hover:bg-[#002B5B]/10"
            onClick={() => handleEdit(row.original)}
            title="Edit Annotation"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#1C2024]/40 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleDelete(row.original.id)}
            title="Delete Annotation"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <div className="p-8 flex justify-center text-[#1C2024]/40">Loading schema details...</div>;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-4 border-b border-[#1C2024]/10 px-8 py-6">
        <Link href="/dashboard/schemas">
          <Button variant="ghost" size="icon" className="hover:bg-[#1C2024]/5">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-[#1C2024]">
            {schema?.name}
          </h1>
          <p className="text-sm text-[#1C2024]/60">
            {schema?.fileName}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="map">Schema Map</TabsTrigger>
            <TabsTrigger value="derived">Derived Knowledge</TabsTrigger>
            <TabsTrigger value="source">SQL Source</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-0">
            <div className="mb-6">
              <h2 className="text-xl font-medium text-[#1C2024] flex items-center gap-2">
                <Database className="size-5 text-[#002B5B]" />
                Schema Map
              </h2>
              <p className="mt-1 text-sm text-[#1C2024]/60 max-w-2xl">
                Visual representation of your database tables and their relationships.
              </p>
            </div>
            <SchemaMap tables={tables} />
          </TabsContent>

          <TabsContent value="derived" className="mt-0">
            <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium text-[#1C2024] flex items-center gap-2">
                <Database className="size-5 text-[#002B5B]" />
                Derived Knowledge (JSON Fields)
              </h2>
              <p className="mt-1 text-sm text-[#1C2024]/60 max-w-2xl">
                Define the JSON structures of specific columns. The AI will use this derived knowledge to generate precise JSON extraction queries (e.g., OPENJSON) without hallucinating fields.
              </p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={handleOpenDialog}>
              <DialogTrigger 
                render={
                  <Button className="bg-[#002B5B] text-white hover:bg-[#002B5B]/90 rounded-[6px]">
                    <Plus className="mr-2 size-4" />
                    Add Annotation
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editMode ? "Edit JSON Field Annotation" : "Add JSON Field Annotation"}</DialogTitle>
                  <DialogDescription>
                    {editMode ? "Update the JSON structure and context label for this column." : "Select a table and column from your base schema, then provide its JSON structure."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddAnnotation} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#1C2024]">Table <span className="text-red-500">*</span></label>
                      <select 
                        className="flex h-9 w-full rounded-md border border-[#1C2024]/20 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#002B5B]/30"
                        value={selectedTable}
                        onChange={(e) => {
                          setSelectedTable(e.target.value);
                          setSelectedColumn("");
                        }}
                      >
                        <option value="" disabled>Select a table</option>
                        {tables.map(t => (
                          <option key={t.name} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#1C2024]">Column <span className="text-red-500">*</span></label>
                      <select 
                        className="flex h-9 w-full rounded-md border border-[#1C2024]/20 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#002B5B]/30 disabled:opacity-50"
                        value={selectedColumn}
                        onChange={(e) => setSelectedColumn(e.target.value)}
                        disabled={!selectedTable}
                      >
                        <option value="" disabled>Select a column</option>
                        {availableColumns.map(c => (
                          <option key={c.name} value={c.name}>{c.name} ({c.dataType})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1C2024]">Context / Product (Optional)</label>
                    <p className="text-xs text-[#1C2024]/60">Use this to disambiguate the JSON structure if it varies per product.</p>
                    <Input
                      value={contextLabel}
                      onChange={(e) => setContextLabel(e.target.value)}
                      placeholder="e.g. Motor, Health, Travel"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1C2024]">JSON Structure / Schema <span className="text-red-500">*</span></label>
                    <p className="text-xs text-[#1C2024]/60">Provide a JSON example or a schema definition.</p>
                    <Textarea
                      value={jsonStructure}
                      onChange={(e) => setJsonStructure(e.target.value)}
                      placeholder="{\n  'policyNumber': 'string',\n  'premium': 'number'\n}"
                      className="font-mono text-sm min-h-[150px] max-h-[300px] overflow-y-auto bg-[#F8F9FA]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1C2024]">Description (Optional)</label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Contains additional policy metadata"
                    />
                  </div>

                  {formError && (
                    <div className="rounded-sm bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                      {formError}
                    </div>
                  )}

                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting || !selectedTable || !selectedColumn || !jsonStructure.trim()} className="w-full bg-[#002B5B] hover:bg-[#002B5B]/90 text-white rounded-[6px]">
                      {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                      {editMode ? "Save Changes" : "Save Annotation"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {annotations.length === 0 ? (
            <div className="rounded-[8px] border border-dashed border-[#1C2024]/20 p-8 text-center bg-[#FDFBF7]">
              <Database className="mx-auto size-8 text-[#1C2024]/20 mb-3" />
              <p className="text-[#1C2024]/60 text-sm">No JSON annotations added yet.</p>
            </div>
          ) : (
            <DataTable columns={columns} data={annotations} searchPlaceholder="Search annotations..." />
          )}
          </section>
        </TabsContent>

        <TabsContent value="source" className="mt-0">
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-[#1C2024] flex items-center gap-2">
                <Code2 className="size-4 text-[#1C2024]/60" />
                Base SQL Knowledge
              </h2>
              <p className="mt-1 text-sm text-[#1C2024]/60">
                The original uploaded DDL script used as the primary context for SQL generation.
              </p>
            </div>
            <div className="rounded-[8px] border border-[#1C2024]/10 bg-[#F8F9FA] p-4 max-h-[600px] overflow-auto">
              <pre className="text-xs font-mono text-[#1C2024]/80">
                <code>{schema?.sqlContent}</code>
              </pre>
            </div>
          </section>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

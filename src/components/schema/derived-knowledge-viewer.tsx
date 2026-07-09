"use client";

import { useState } from "react";
import { Database, Braces, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AnnotationItem {
  id: string;
  tableName: string;
  columnName: string;
  jsonStructure: string;
  description: string | null;
  createdAt: string;
}

interface DerivedKnowledgeViewerProps {
  annotations: AnnotationItem[];
}

function JsonFieldRenderer({ jsonString }: { jsonString: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  let parsed: any = null;
  try {
    const strictString = jsonString.replace(/'/g, '"');
    parsed = JSON.parse(strictString);
  } catch (e) {
    parsed = null;
  }

  if (!parsed || typeof parsed !== 'object') {
    return (
      <div className="rounded-[6px] border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <AlertCircle className="size-4" />
          <span className="text-sm font-medium">Non-object JSON structure</span>
        </div>
        <pre className="text-xs text-red-600 font-mono overflow-auto max-h-[200px]">{jsonString}</pre>
      </div>
    );
  }

  const renderFields = (obj: any, prefix = ""): React.ReactNode[] => {
    return Object.entries(obj).flatMap(([key, value]) => {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return renderFields(value, currentPath);
      }
      
      const typeLabel = typeof value === "string" ? value : typeof value;

      return (
        <div key={currentPath} className="flex items-center gap-4 py-2 border-b border-[#1C2024]/5 last:border-0">
          <div className="w-[140px] shrink-0 truncate" title={`$.${currentPath}`}>
            <Label className="font-mono text-xs text-[#1C2024]/70">{key}</Label>
          </div>
          <div className="flex-1 relative">
            <Input disabled className="h-8 bg-white border-[#1C2024]/10 text-xs text-[#1C2024]/60" placeholder={`Type: ${typeLabel}`} />
          </div>
          <div className="w-[80px] shrink-0 flex justify-end">
            <Badge variant="secondary" className="font-mono text-[9px] uppercase px-1.5 py-0 bg-[#002B5B]/5 text-[#002B5B]">
              {String(typeLabel).substring(0, 10)}
            </Badge>
          </div>
        </div>
      );
    });
  };

  const allFields = renderFields(parsed);
  const MAX_VISIBLE = 3;
  const hasMore = allFields.length > MAX_VISIBLE;
  const visibleFields = isExpanded ? allFields : allFields.slice(0, MAX_VISIBLE);

  return (
    <div className="bg-[#F8F9FA] rounded-[6px] border border-[#1C2024]/10 p-4">
      <div className="space-y-1">
        {visibleFields}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 h-8 text-xs text-[#1C2024]/60 hover:bg-[#1C2024]/5 hover:text-[#1C2024]"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="size-3 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="size-3 mr-1" />
              Show {allFields.length - MAX_VISIBLE} More Fields
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export function DerivedKnowledgeViewer({ annotations }: DerivedKnowledgeViewerProps) {
  if (!annotations || annotations.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#1C2024]/20 p-12 text-center bg-[#FDFBF7] flex flex-col items-center justify-center min-h-[400px]">
        <Braces className="size-10 text-[#1C2024]/20 mb-4" />
        <h3 className="text-lg font-medium text-[#1C2024] mb-1">No Derived Knowledge</h3>
        <p className="text-[#1C2024]/60 text-sm max-w-sm mx-auto">
          There are no JSON field annotations defined for this knowledge base yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
      {annotations.map((annotation) => (
        <div key={annotation.id} className="rounded-[8px] border border-[#1C2024]/15 bg-white shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md hover:border-[#002B5B]/30">
          <div className="border-b border-[#1C2024]/10 bg-[#002B5B] px-5 py-4 text-white">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 overflow-hidden pr-2">
                <Database className="size-4 opacity-70 shrink-0" />
                <h3 className="font-mono text-sm font-semibold truncate" title={annotation.tableName}>
                  {annotation.tableName}
                </h3>
                <span className="text-white/40 shrink-0">/</span>
                <span className="font-mono text-sm font-bold text-amber-400 truncate" title={annotation.columnName}>
                  {annotation.columnName}
                </span>
              </div>
              <Badge className="bg-white/10 hover:bg-white/20 text-white border-0 font-mono text-[10px] shrink-0">JSON</Badge>
            </div>
            {annotation.description && (
              <p className="text-xs text-white/70 mt-2 leading-relaxed line-clamp-2" title={annotation.description}>
                {annotation.description}
              </p>
            )}
          </div>
          <div className="p-5 flex-1 bg-white">
            <h4 className="text-xs font-medium text-[#1C2024]/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Braces className="size-3.5" />
              Available JSON Fields
            </h4>
            <JsonFieldRenderer jsonString={annotation.jsonStructure} />
          </div>
        </div>
      ))}
    </div>
  );
}

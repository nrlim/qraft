"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { ParsedTable } from "@/lib/utils/sql-parser";
import { Key, Link as LinkIcon, Database, ZoomIn, ZoomOut, Maximize, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SchemaMapProps {
  tables: ParsedTable[];
  searchQuery?: string;
}

interface Connection {
  fromTableId: string;
  fromColId: string;
  toId: string;
}

export function SchemaMap({ tables, searchQuery = "" }: SchemaMapProps) {
  const [scale, setScale] = useState(1);
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  // Map each table to a set of tables it connects to (bidirectional)
  const connectionsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    tables.forEach(t => map.set(t.name, new Set()));
    
    tables.forEach(table => {
      table.columns.forEach(col => {
        if (col.foreignKey) {
          const target = col.foreignKey.targetTable;
          
          if (!map.has(target)) {
            map.set(target, new Set());
          }
          
          // Bidirectional mapping for highlight
          map.get(table.name)?.add(target);
          map.get(target)?.add(table.name);
        }
      });
    });
    return map;
  }, [tables]);

  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tables;
    const lowerQuery = searchQuery.toLowerCase();
    return tables.filter(table => 
      table.name.toLowerCase().includes(lowerQuery) || 
      table.columns.some(col => col.name.toLowerCase().includes(lowerQuery))
    );
  }, [tables, searchQuery]);

  // Draw lines logic removed in favor of pure hover interaction

  const handleZoomIn = () => setScale(s => Math.min(s + 0.15, 2));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.15, 0.4));
  const handleZoomReset = () => setScale(1);

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableName)) next.delete(tableName);
      else next.add(tableName);
      return next;
    });
  };

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#1C2024]/40">
        <Database className="size-12 mb-4 opacity-20" />
        <p>No tables found in this schema.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[600px] h-full w-full bg-[#F8F9FA] rounded-[8px] border border-[#1C2024]/10 overflow-hidden flex flex-col">
      {/* Top Bar Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-end pointer-events-none">
        {/* Zoom Controls - Top Right */}
        <div className="flex items-center gap-1 rounded-[6px] border border-[#1C2024]/10 bg-white p-1 shadow-sm pointer-events-auto">
          <button onClick={handleZoomOut} className="rounded p-1.5 text-[#1C2024]/60 hover:bg-[#F8F9FA] hover:text-[#002B5B]" title="Zoom Out">
            <ZoomOut className="size-4" />
          </button>
          <div className="w-12 text-center text-xs font-medium text-[#1C2024]/60">
            {Math.round(scale * 100)}%
          </div>
          <button onClick={handleZoomIn} className="rounded p-1.5 text-[#1C2024]/60 hover:bg-[#F8F9FA] hover:text-[#002B5B]" title="Zoom In">
            <ZoomIn className="size-4" />
          </button>
          <div className="mx-1 h-4 w-[1px] bg-[#1C2024]/10" />
          <button onClick={handleZoomReset} className="rounded p-1.5 text-[#1C2024]/60 hover:bg-[#F8F9FA] hover:text-[#002B5B]" title="Reset Zoom">
            <Maximize className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 pt-20">
        <div 
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: '0 0',
            width: `${100 / scale}%`,
            minHeight: `${100 / scale}%`
          }}
          className="relative transition-transform duration-200"
        >
          {/* Tables Layout */}
          <div className="flex flex-wrap items-start gap-8 relative z-10 pb-32">
            {filteredTables.length === 0 ? (
              <div className="flex w-full items-center justify-center py-20 text-[#1C2024]/40">
                <p>No tables or columns match your search.</p>
              </div>
            ) : (
              filteredTables.map((table) => {
              const isTableActive = hoveredTable
                ? table.name === hoveredTable || connectionsMap.get(hoveredTable)?.has(table.name)
                : true;

              return (
                <div
                  key={table.name}
                  id={`table-${table.name}`}
                  onMouseEnter={() => setHoveredTable(table.name)}
                  onMouseLeave={() => setHoveredTable(null)}
                  className={cn(
                    "z-10 w-72 rounded-[8px] border bg-white shadow-sm transition-all duration-300",
                    isTableActive ? "border-[#1C2024]/20 opacity-100 scale-100" : "border-[#1C2024]/5 opacity-30 scale-[0.98]"
                  )}
                >
                  {/* Table Header */}
                  <div className={cn(
                    "flex items-center gap-2 border-b border-[#1C2024]/10 px-4 py-3 rounded-t-[7px] transition-colors",
                    isTableActive ? "bg-[#002B5B] text-white" : "bg-[#F8F9FA] text-[#1C2024]/60"
                  )}>
                    <Database className={cn("size-4", isTableActive ? "opacity-70" : "opacity-40")} />
                    <h3 className="font-mono text-sm font-semibold">{table.name}</h3>
                  </div>

                  {/* Table Columns */}
                  <div className="flex flex-col py-2">
                    {table.columns.slice(0, expandedTables.has(table.name) ? undefined : 5).map((col) => {
                      // Check if this specific column is part of the highlighted relation
                      const isConnectedCol = hoveredTable && isTableActive && col.foreignKey?.targetTable === hoveredTable;
                      
                      return (
                        <div
                          key={col.name}
                          id={`col-${table.name}-${col.name}`}
                          className={cn(
                            "flex items-center justify-between px-4 py-1.5 transition-colors",
                            isConnectedCol ? "bg-amber-500/10" : "hover:bg-[#F8F9FA]"
                          )}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {col.isPrimaryKey ? (
                              <Key className={cn("size-3.5 shrink-0", isTableActive ? "text-amber-500" : "text-[#1C2024]/40")} />
                            ) : col.foreignKey ? (
                              <LinkIcon className={cn("size-3.5 shrink-0", isTableActive ? "text-[#002B5B]" : "text-[#1C2024]/40")} />
                            ) : (
                              <div className="size-3.5 shrink-0" /> // spacer
                            )}
                            <span className={cn(
                              "truncate font-mono text-xs font-medium",
                              isTableActive ? "text-[#1C2024]" : "text-[#1C2024]/50"
                            )}>
                              {col.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[10px] text-[#1C2024]/40 uppercase">
                              {col.dataType}
                            </span>
                            {col.foreignKey && (
                              <span className={cn(
                                "rounded px-1 py-0.5 text-[9px] font-bold",
                                isTableActive ? "bg-[#002B5B]/10 text-[#002B5B]" : "bg-[#1C2024]/5 text-[#1C2024]/40"
                              )}>
                                FK
                              </span>
                            )}
                            {col.isPrimaryKey && (
                              <span className={cn(
                                "rounded px-1 py-0.5 text-[9px] font-bold",
                                isTableActive ? "bg-amber-500/10 text-amber-600" : "bg-[#1C2024]/5 text-[#1C2024]/40"
                              )}>
                                PK
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {table.columns.length > 5 && (
                      <button
                        onClick={() => toggleTable(table.name)}
                        className={cn(
                          "mt-1 flex w-full items-center justify-center border-t border-[#1C2024]/5 py-2 text-[11px] font-medium hover:bg-[#F8F9FA]",
                          isTableActive ? "text-[#002B5B]" : "text-[#1C2024]/40"
                        )}
                      >
                        {expandedTables.has(table.name) 
                          ? "Collapse View" 
                          : `Expand View (${table.columns.length - 5} more)`}
                      </button>
                    )}
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      </div>
    </div>
  );
}

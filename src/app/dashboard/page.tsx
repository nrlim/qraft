"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
import { Sparkles, Copy, Check, Play, Database, Plus, Loader2, User } from "lucide-react";
import { toast } from "sonner";

interface SchemaOption {
  id: string;
  name: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function DashboardPage() {
  const [schemaId, setSchemaId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [schemaOptions, setSchemaOptions] = useState<SchemaOption[]>([]);
  const [isSchemasLoading, setIsSchemasLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredSchemas = schemaOptions.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchSchemas = useCallback(async () => {
    try {
      const res = await fetch("/api/schemas");
      const json = await res.json();
      if (res.ok && json.data) {
        setSchemaOptions(
          json.data.map((s: { id: string; name: string }) => ({
            id: s.id,
            name: s.name,
          }))
        );
      }
    } catch {
      // silently fail
    } finally {
      setIsSchemasLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  // Load chat history from DB when schema changes
  useEffect(() => {
    if (!schemaId) {
      setMessages([]);
      return;
    }
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/generations?schemaId=${schemaId}`);
        if (res.ok) {
          const json = await res.json();
          setMessages(
            json.data.map((m: any) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
          );
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [schemaId]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !schemaId || isLoading) return;

    const userMessage = input.trim();

    // Optimistically add the user message to the UI
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content: userMessage },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, schemaId }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to send message");
      }

      // Stream the AI response token by token
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = `assistant-${Date.now()}`;

      // Add an empty assistant message placeholder
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Vercel AI SDK data stream format: lines prefixed with "0:"
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              // The value after "0:" is a JSON-encoded string
              const text = JSON.parse(line.slice(2));
              assistantContent += text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            } catch {
              // ignore malformed chunks
            }
          }
        }
      }

      // Refresh messages from DB to get correct IDs (replacing temp IDs)
      const histRes = await fetch(`/api/generations?schemaId=${schemaId}`);
      if (histRes.ok) {
        const json = await histRes.json();
        setMessages(
          json.data.map((m: any) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate SQL. Please try again.");
      // Remove optimistic messages on error
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempId && !m.id.startsWith("assistant-"))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const hasSchemas = schemaOptions.length > 0;

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Header: Schema Selection */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#1C2024]/10 px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-[#002B5B]" />
          <h2 className="font-serif text-xl font-medium tracking-tight text-[#1C2024]">
            Qraft SQL
          </h2>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="w-[320px]">
            {isSchemasLoading ? (
              <div className="flex h-9 items-center rounded-[6px] border border-[#1C2024]/20 bg-[#F8F9FA] px-3 text-sm text-[#1C2024]/40">
                Loading schemas...
              </div>
            ) : hasSchemas ? (
              <Combobox 
                value={schemaOptions.find((s) => s.id === schemaId) || null} 
                onValueChange={(val: SchemaOption | null) => {
                  setSchemaId(val?.id || "");
                  setSearchQuery(val?.name || "");
                }}
              >
                <ComboboxInput 
                  placeholder="Select a schema to start chatting..." 
                  className="bg-white border-[#1C2024]/20 focus-visible:ring-[#002B5B]/30 h-9 w-full text-sm"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  value={searchQuery}
                />
                <ComboboxContent>
                  {filteredSchemas.length === 0 && (
                    <div className="w-full justify-center py-2 text-center text-sm text-muted-foreground flex">
                      No schema found.
                    </div>
                  )}
                  <ComboboxList>
                    {filteredSchemas.map((s) => (
                      <ComboboxItem key={s.id} value={s}>
                        {s.name}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/dashboard/schemas">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-[#002B5B]/30 text-[#002B5B] hover:bg-[#002B5B]/5"
                  >
                    <Plus className="mr-1.5 size-3.5" />
                    Create Schema
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div ref={scrollRef} className="flex-1 overflow-auto bg-[#FDFBF7] p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[#1C2024]/40">
            <div className="text-center space-y-4 max-w-md">
              <Database className="mx-auto size-12 opacity-20" />
              <h3 className="text-lg font-medium text-[#1C2024]">Welcome to Qraft</h3>
              <p className="text-sm">
                Select your database schema from the header above, then describe the data you need to query in natural language.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-6">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[85%] rounded-[8px] p-4 ${
                  m.role === 'user' 
                    ? 'bg-[#002B5B] text-white' 
                    : 'bg-white border border-[#1C2024]/10 shadow-sm text-[#1C2024]'
                }`}>
                  {m.role === 'user' ? (
                    <>
                      <div className="flex items-center gap-2 mb-2 opacity-80">
                        <User className="size-4" />
                        <span className="text-xs font-medium">You</span>
                      </div>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </>
                  ) : (
                    <div className="group relative">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="size-4 text-[#002B5B]" />
                        <span className="text-xs font-medium font-serif text-[#002B5B]">Qraft AI</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0 h-8 w-8 bg-white/90 shadow-sm border border-[#1C2024]/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleCopy(m.id, m.content)}
                      >
                        {copiedId === m.id ? (
                          <Check className="size-4 text-green-600" />
                        ) : (
                          <Copy className="size-4 text-[#1C2024]/60" />
                        )}
                      </Button>
                      <pre className="font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap">
                        <code>{m.content}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 max-w-[85%] rounded-[8px] p-4 bg-white border border-[#1C2024]/10 shadow-sm text-[#1C2024]/60">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-sm">Generating SQL...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="border-t border-[#1C2024]/10 bg-white p-4">
        <div className="w-full">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!schemaId || isLoading}
              placeholder={schemaId ? "e.g. Write a query to get active users with their total orders..." : "Please select a schema first..."}
              className="flex-1 min-h-[60px] max-h-[200px] resize-y bg-white border-[#1C2024]/20 p-3 text-base focus-visible:ring-[#002B5B]/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && schemaId && !isLoading) {
                    const event = new Event('submit', { bubbles: true, cancelable: true });
                    e.currentTarget.form?.dispatchEvent(event);
                  }
                }
              }}
            />
            <Button
              type="submit"
              disabled={!input.trim() || !schemaId || isLoading}
              className="shrink-0 h-[60px] px-8 bg-[#002B5B] text-white hover:bg-[#002B5B]/90 rounded-[6px] font-medium"
            >
              <Sparkles className="mr-2 size-5" />
              Generate
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

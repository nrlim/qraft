"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to register");
      } else {
        toast.success("Account created successfully");
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid min-h-[100dvh] grid-cols-1 md:grid-cols-2 bg-[#FDFBF7] text-[#1C2024]">
      <div className="hidden md:block relative overflow-hidden border-r border-[#1C2024]/10">
        <Image src="/auth-bg-pure.png" alt="Brand Background" fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-[#002B5B]/40 mix-blend-multiply"></div>
        <div className="relative z-10 flex h-full flex-col p-12 text-[#FDFBF7]">
          <Link href="/" className="flex items-center gap-0.5">
            <div className="flex size-9 items-center justify-center rounded-[6px] bg-[#FDFBF7] text-[#002B5B]">
              <span className="font-serif text-xl font-bold">Q</span>
            </div>
            <span className="text-4xl font-serif font-semibold tracking-tight text-[#FDFBF7]">raft</span>
          </Link>
          <div className="mt-auto max-w-lg">
            <h2 className="font-serif text-4xl font-medium tracking-tight leading-tight">
              Start building queries with intelligence.
            </h2>
            <p className="mt-6 text-[#FDFBF7]/80 text-lg leading-relaxed">
              Upload your schema and generate robust SQL scripts perfectly mapped to your database in seconds.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10">
            <Link href="/" className="flex items-center gap-0.5 md:hidden mb-8">
              <div className="flex size-9 items-center justify-center rounded-[6px] bg-[#002B5B] text-[#FDFBF7]">
                <span className="font-serif text-xl font-bold">Q</span>
              </div>
              <span className="text-4xl font-serif font-semibold tracking-tight text-[#1C2024]">raft</span>
            </Link>
            <h1 className="font-serif text-3xl font-medium tracking-tight text-[#1C2024]">Create an account</h1>
            <p className="mt-2 text-[#1C2024]/60">Sign up to start generating SQL queries.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name" className="text-[#1C2024]">Name <span className="text-red-500">*</span></FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white border-[#1C2024]/20 focus-visible:ring-[#002B5B]/30"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email" className="text-[#1C2024]">Email <span className="text-red-500">*</span></FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-[#1C2024]/20 focus-visible:ring-[#002B5B]/30"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password" className="text-[#1C2024]">Password <span className="text-red-500">*</span></FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white border-[#1C2024]/20 focus-visible:ring-[#002B5B]/30 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1C2024]/40 hover:text-[#1C2024]/70"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword" className="text-[#1C2024]">Confirm Password <span className="text-red-500">*</span></FieldLabel>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white border-[#1C2024]/20 focus-visible:ring-[#002B5B]/30 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1C2024]/40 hover:text-[#1C2024]/70"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            </FieldGroup>

            <Button type="submit" className="mt-6 w-full bg-[#002B5B] text-white hover:bg-[#002B5B]/90 rounded-[6px]" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[#1C2024]/60">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#002B5B] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

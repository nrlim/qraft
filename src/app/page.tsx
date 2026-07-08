import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7] text-[#1C2024] selection:bg-[#002B5B] selection:text-white">
      <header className="flex h-16 items-center justify-between border-b border-[#1C2024]/10 px-6 md:px-12">
        <div className="flex items-center gap-0.5">
          <div className="flex size-7 items-center justify-center rounded-[4px] bg-[#002B5B] text-[#FDFBF7]">
            <span className="font-serif text-base font-bold">Q</span>
          </div>
          <div className="font-serif text-2xl font-semibold tracking-tight text-[#1C2024]">raft</div>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-[#1C2024]/70 hover:text-[#1C2024] transition-colors">
            Sign in
          </Link>
          <Link href="/register" className={buttonVariants({ variant: "default", size: "sm", className: "bg-[#002B5B] text-[#FDFBF7] hover:bg-[#002B5B]/90" })}>
            Get started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 pb-24 pt-24 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <h1 className="font-serif text-5xl font-medium tracking-tighter sm:text-6xl md:text-7xl text-[#1C2024]">
                Production SQL, <br /> mapped instantly.
              </h1>
              <p className="mt-6 max-w-lg text-lg text-[#1C2024]/70">
                Upload your database schema. Describe the query you need. Get accurate, optimized SQL perfectly mapped to your structure in seconds.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/register" className={buttonVariants({ size: "lg", className: "bg-[#002B5B] text-white hover:bg-[#002B5B]/90 shadow-sm" })}>
                  Start generating
                </Link>
                <Link href="#features" className={buttonVariants({ variant: "outline", size: "lg", className: "bg-transparent border-[#1C2024]/20 text-[#1C2024] hover:bg-[#1C2024]/5" })}>
                  See how it works
                </Link>
              </div>
            </div>
            
            <div className="lg:col-span-6 flex items-center justify-center">
              {/* Product Visual / Minimal UI Mockup */}
              <div className="w-full max-w-xl rounded-sm border border-[#1C2024]/10 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-center gap-2 mb-4 border-b border-[#1C2024]/5 pb-4">
                  <div className="text-[10px] font-medium tracking-widest text-[#1C2024]/40 uppercase">Query Generation</div>
                </div>
                <div className="font-mono text-sm leading-relaxed">
                  <div className="text-[#1C2024]/50 mb-2">{">"} Describe query:</div>
                  <div className="text-[#1C2024] mb-6 font-medium">"Get all customers with their latest order and total spend"</div>
                  
                  <div className="text-[#1C2024]/50 mb-2">{">"} Generated SQL:</div>
                  <div className="text-[#002B5B] font-medium">
                    SELECT c.id, c.name, agg.total_spent <br />
                    FROM customers c <br />
                    LEFT JOIN (... <br />
                    <span className="animate-pulse opacity-50">_</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="border-t border-[#1C2024]/10 px-6 py-24 md:px-12 lg:px-24 bg-white">
          <div className="mb-16 max-w-2xl">
            <h2 className="font-serif text-3xl font-medium tracking-tight text-[#1C2024]">Intelligence built on your schema.</h2>
            <p className="mt-4 text-[#1C2024]/60">A visual architecture designed for trust, precision, and enterprise compliance.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border-l-2 border-[#002B5B] pl-6 flex flex-col">
              <h3 className="font-serif text-xl font-medium mb-3 text-[#1C2024]">Context Aware</h3>
              <p className="text-[#1C2024]/70">
                Stop fixing hallucinated columns. We map directly to your uploaded schema definitions to ensure correct fields every time.
              </p>
            </div>
            <div className="border-l-2 border-[#1C2024]/10 pl-6 flex flex-col">
              <h3 className="font-serif text-xl font-medium mb-3 text-[#1C2024]">Complex Joins</h3>
              <p className="text-[#1C2024]/70">
                From simple aggregations to multi-table recursive joins, Qraft understands relationships and constraints.
              </p>
            </div>
            <div className="border-l-2 border-[#1C2024]/10 pl-6 flex flex-col">
              <h3 className="font-serif text-xl font-medium mb-3 text-[#1C2024]">Copy & Execute</h3>
              <p className="text-[#1C2024]/70">
                SQL outputs are formatted, commented, and ready to be run in your production database client.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1C2024]/10 px-6 py-12 md:px-12 flex items-center justify-between bg-[#FDFBF7]">
        <div className="text-sm font-serif text-[#1C2024]/50">© 2026 Qraft. All rights reserved.</div>
        <div className="flex items-center gap-0.5 grayscale opacity-60">
          <div className="flex size-6 items-center justify-center rounded-[4px] bg-[#002B5B] text-[#FDFBF7]">
            <span className="font-serif text-sm font-bold">Q</span>
          </div>
          <div className="text-xl font-serif font-semibold tracking-tight text-[#1C2024]">raft</div>
        </div>
      </footer>
    </div>
  );
}

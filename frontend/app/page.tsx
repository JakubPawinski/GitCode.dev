import {
  ArrowRight,
  Code,
  Layers,
  Rocket,
  TrendingUp,
  Twitter,
  Github,
  Linkedin,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="bg-background text-foreground w-full">
      <section className="border-primary/10 from-background via-primary/5 to-background relative overflow-hidden border-b bg-gradient-to-b py-20 md:py-32">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="bg-primary/50 absolute top-0 left-0 h-64 w-64 rounded-full blur-3xl"></div>
          <div className="bg-accent/50 absolute right-0 bottom-0 h-64 w-64 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-6xl">
            From Task to Career
          </h1>
          <p className="text-foreground/60 mx-auto mt-4 max-w-2xl text-lg">
            Join the platform that transforms programming practice into a
            verified portfolio and opens doors to top tech companies.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/problems"
              className="from-primary to-accent text-foreground hover:shadow-primary/30 flex transform items-center justify-center gap-2 rounded-lg bg-gradient-to-r px-6 py-3 font-bold shadow-lg transition-all duration-300 hover:scale-105"
            >
              <span>Start Coding</span>
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/trending"
              className="border-primary/30 text-foreground/80 hover:bg-primary/10 hover:text-foreground flex transform items-center justify-center gap-2 rounded-lg border bg-transparent px-6 py-3 font-bold shadow-lg transition-all duration-300 hover:scale-105"
            >
              <span>Trending Problems</span>
              <TrendingUp size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="border-primary/20 bg-background/30 hover:border-accent/30 hover:shadow-accent/10 rounded-xl border p-8 text-center shadow-lg backdrop-blur-sm transition-all duration-300">
              <div className="from-primary/20 to-accent/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br">
                <Code className="text-accent h-8 w-8" />
              </div>
              <h3 className="mt-6 text-xl font-bold">Real-World Problems</h3>
              <p className="text-foreground/60 mt-2">
                Solve tasks that mirror real challenges in the tech industry.
              </p>
            </div>
            <div className="border-primary/20 bg-background/30 hover:border-accent/30 hover:shadow-accent/10 rounded-xl border p-8 text-center shadow-lg backdrop-blur-sm transition-all duration-300">
              <div className="from-primary/20 to-accent/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br">
                <Layers className="text-accent h-8 w-8" />
              </div>
              <h3 className="mt-6 text-xl font-bold">Verified Portfolio</h3>
              <p className="text-foreground/60 mt-2">
                Build a portfolio that speaks for itself, verified by our
                platform.
              </p>
            </div>
            <div className="border-primary/20 bg-background/30 hover:border-accent/30 hover:shadow-accent/10 rounded-xl border p-8 text-center shadow-lg backdrop-blur-sm transition-all duration-300">
              <div className="from-primary/20 to-accent/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br">
                <Rocket className="text-accent h-8 w-8" />
              </div>
              <h3 className="mt-6 text-xl font-bold">Career Opportunities</h3>
              <p className="text-foreground/60 mt-2">
                Get noticed by top companies looking for talent like you.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

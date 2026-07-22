import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      
      <div className="mb-6 p-4 rounded-full">
        <FileQuestion className="h-20 w-20 text-foreground/80" strokeWidth={1.5} />
      </div>

      <h1 className="bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent text-6xl font-extrabold tracking-tight sm:text-8xl">
        404
      </h1>

      <h2 className="mt-4 text-2xl font-semibold text-foreground">
        Page Not Found
      </h2>
      
      <p className="mt-2 text-lg text-foreground/60 max-w-md">
        It looks like the page you're looking for has vanished into cyberspace. Check the URL or go back to the homepage.
      </p>

      <div className="mt-8">
        <Link
          href="/"
          className="flex transform items-center justify-center gap-2 rounded-lg border border-primary/30 bg-transparent px-6 py-3 font-bold text-foreground/80 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-primary/10 hover:text-foreground"
        >
          <span>Go back to the homepage</span>
          <Home size={20} />
        </Link>
      </div>
    </div>
  );
}
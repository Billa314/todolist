import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Cognitive Flow - Mind Soothing Voice Todo',
  description: 'Manage tasks via voice and text. Experience intelligent, search-grounded research, energy-level filtering, and local preparation study space.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${outfit.variable} min-h-full flex flex-col font-sans select-none antialiased relative`}>
        {/* Background ambient glowing blobs */}
        <div className="bg-blob-indigo top-[10%] left-[-10%]"></div>
        <div className="bg-blob-teal top-[60%] right-[-10%]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

        {/* Global Premium Navigation */}
        <header className="w-full z-10 glass-panel border-b border-slate-800/80 sticky top-0">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
                <span className="text-xl">🧠</span>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                  Cognitive Flow
                </h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                  Voice Todo & Research
                </p>
              </div>
            </Link>

            <nav className="flex items-center gap-2">
              <Link
                href="/"
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/40 transition-all duration-300"
              >
                Dashboard
              </Link>
              <Link
                href="/prep"
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 text-cyan-400 hover:from-cyan-500/20 hover:to-indigo-500/20 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 flex items-center gap-1.5"
              >
                📚 <span className="hidden sm:inline">Study</span> Prep
              </Link>
            </nav>
          </div>
        </header>

        {/* Core Main Area */}
        <main className="flex-1 w-full z-10 max-w-6xl mx-auto px-4 py-6 md:py-8 flex flex-col">
          {children}
        </main>

        <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-900 z-10">
          <p>© 2026 Cognitive Flow • Senior Productivity Platform</p>
        </footer>
      </body>
    </html>
  );
}

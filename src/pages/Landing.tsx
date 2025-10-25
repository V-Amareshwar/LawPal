import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen font-sans text-white flex flex-col bg-gradient-to-b from-[#0b1220] via-[#0a0f1a] to-[#0b0f17]">
      {/* Top Nav */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="text-xl font-semibold tracking-tight">LawPal.ai</div>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link to="/signin" className="text-sm px-4 py-2 rounded-md hover:bg-white/10 transition-colors">Login</Link>
          <Link to="/signup" className="text-sm px-4 py-2 rounded-md bg-[#0f172a] text-[#facc15] hover:bg-[#1e293b] hover:text-white transition-colors">Sign Up</Link>
        </nav>
      </header>

      {/* Split Hero */}
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Copy */}
          <section className="animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Your AI Lawyer — Legal Help, Simplified.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-200 max-w-2xl">
              LawPal uses AI to answer your legal questions, draft documents, and explain complex law in plain English.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link to="/signup" className="px-6 py-3 rounded-md bg-[#1e293b] text-[#facc15] font-medium shadow-lg shadow-black/30 hover:bg-[#334155] hover:scale-105 transition-transform transition-colors">
                Get Started
              </Link>
            </div>

            {/* Trust badges / highlights */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Confidential</div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">AI-Powered</div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Fast Results</div>
            </div>
          </section>

          {/* Right: GIF placeholder frame */}
          <aside className="w-full animate-fade-in md:justify-self-end">
            <div className="relative w-full max-w-xl mx-auto aspect-[4/3] rounded-2xl overflow-hidden bg-white/5 ring-1 ring-blue-400/20 shadow-2xl shadow-black/30">
              {/* Embedded GIF */}
              <img
                src="https://media-s3-us-east-1.ceros.com/popsugar/images/2023/10/02/a24118515f8bd914f40e46d737f5e948/scale-gif.gif"
                alt="LawPal AI chat demonstration"
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              {/* Optional decorative gradient */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-blue-400/10 via-transparent to-blue-400/10" />
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-300">
          <div>© {new Date().getFullYear()} LawPal</div>
          <div className="flex items-center gap-4">
            <a className="hover:text-white transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-white transition-colors" href="#">Terms</a>
            <a className="hover:text-white transition-colors" href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

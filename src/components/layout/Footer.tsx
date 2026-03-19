export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; 2026 <span className="font-display" style={{ fontWeight: 700 }}>DACON</span> Platform
          </p>
          <div className="flex gap-4 text-sm text-slate-400 dark:text-slate-500">
            <span>Next.js + Tailwind CSS</span>
            <span>Deployed on Vercel</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

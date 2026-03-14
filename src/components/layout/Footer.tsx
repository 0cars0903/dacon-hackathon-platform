export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; 2026 <span className="font-display" style={{ fontWeight: 700 }}>DACON</span> Platform
          </p>
          <div className="flex gap-4 text-sm text-gray-400 dark:text-gray-500">
            <span>Next.js + Tailwind CSS</span>
            <span>Deployed on Vercel</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isTenant, setIsTenant] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setIsTenant(!!d.tenant); })
      .catch(() => { if (!cancelled) setIsTenant(false); });
    return () => { cancelled = true; };
  }, [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsTenant(false);
    router.push('/');
    router.refresh();
  }

  const link = (href: string) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-gray-900 hover:bg-gray-100 ${
      pathname === href ? 'bg-gray-100' : ''
    }`;
  const icon = 'flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-gray-900';

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 p-3" aria-label="Main">
        <div className="flex flex-wrap items-center gap-1">
          <Link href="/" className={link('/')} aria-current={pathname === '/' ? 'page' : undefined}>
            <span className={icon}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.6 21 3 13.4 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02L6.6 10.8Z" />
              </svg>
            </span>
            AI Calling
          </Link>

          {isTenant && (
            <Link href="/agent" className={link('/agent')} aria-current={pathname === '/agent' ? 'page' : undefined}>
              <span className={icon}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              Create Agent
            </Link>
          )}
        </div>

        <div>
          {isTenant ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-gray-400 px-3 py-2 text-gray-900 hover:bg-gray-100"
            >
              Log out
            </button>
          ) : (
            <Link href="/login" className="rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100">
              Tenant login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, ClipboardList, Trophy, MessageSquareWarning, Menu, LogOut } from 'lucide-react';
import { AdminNav, isNavItemActive } from '@/components/admin-nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const BOTTOM_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/fixtures', label: 'Results', icon: ClipboardList },
  { href: '/admin/table', label: 'Table', icon: Trophy },
  { href: '/admin/grievances', label: 'Issues', icon: MessageSquareWarning },
];

export function AdminShell({
  children,
  logoutAction,
}: {
  children: React.ReactNode;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const LogoutForm = (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" className="w-full justify-start gap-2.5 px-3">
        <LogOut className="size-4" aria-hidden="true" />
        Log out
      </Button>
    </form>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-(--line-card) bg-(--navy) px-3 py-4 lg:flex">
        <Link href="/admin" className="mb-4 flex items-center gap-1 px-3 font-heading text-lg uppercase tracking-(--tracking-headline)">
          TOURNAX <span className="text-(--color-accent)">admin</span>
        </Link>
        <AdminNav className="flex flex-1 flex-col gap-1 overflow-y-auto" />
        <div className="mt-4 border-t border-(--line-hairline) pt-3">{LogoutForm}</div>
      </aside>

      {/* Mobile / tablet sticky topbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-(--line-card) bg-(--navy)/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/admin" className="font-heading text-base uppercase tracking-(--tracking-headline)">
          TOURNAX <span className="text-(--color-accent)">admin</span>
        </Link>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <Button type="button" variant="ghost" size="icon" aria-label="Open admin menu" onClick={() => setSheetOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <SheetContent side="left" className="w-72 max-w-[80vw] px-3 py-4">
            <SheetHeader className="px-3 pb-2">
              <SheetTitle>TOURNAX admin</SheetTitle>
            </SheetHeader>
            <AdminNav className="flex flex-1 flex-col gap-1 overflow-y-auto" onNavigate={() => setSheetOpen(false)} />
            <div className="mt-4 border-t border-(--line-hairline) pt-3">{LogoutForm}</div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main content */}
      <main className="admin-safe-bottom min-h-[calc(100vh-3.5rem)] px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:ml-60 lg:px-8 lg:pb-8">
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </main>

      {/* Mobile / tablet bottom tab bar */}
      <nav
        aria-label="Admin"
        className="admin-safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-(--line-card) bg-(--navy)/95 backdrop-blur lg:hidden"
      >
        {BOTTOM_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.65rem] font-semibold text-foreground/60! aria-[current=page]:text-(--color-accent)!"
            >
              <Icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.65rem] font-semibold text-foreground/60"
        >
          <Menu className="size-5" aria-hidden="true" />
          More
        </button>
      </nav>
    </div>
  );
}

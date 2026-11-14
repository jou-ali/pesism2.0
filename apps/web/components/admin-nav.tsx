'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings2,
  Users,
  Shield,
  ScrollText,
  CalendarDays,
  ClipboardList,
  Trophy,
  MessageSquareWarning,
  Share2,
  type LucideIcon,
} from 'lucide-react';

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };
type NavGroup = { label?: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  { items: [{ href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true }] },
  {
    label: 'Season',
    items: [
      { href: '/admin/season', label: 'Season control', icon: Settings2 },
      { href: '/admin/players', label: 'Players', icon: Users },
      { href: '/admin/teams', label: 'Teams', icon: Shield },
      { href: '/admin/registration-audit', label: 'Reg audit', icon: ScrollText },
      { href: '/admin/share', label: 'Share images', icon: Share2 },
    ],
  },
  {
    label: 'Competition',
    items: [
      { href: '/admin/schedule', label: 'Fixtures', icon: CalendarDays },
      { href: '/admin/fixtures', label: 'Results', icon: ClipboardList },
      { href: '/admin/table', label: 'Table', icon: Trophy },
    ],
  },
  {
    label: 'Support',
    items: [{ href: '/admin/grievances', label: 'Grievances', icon: MessageSquareWarning }],
  },
];

export function isNavItemActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function AdminNav({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className={className}>
      {NAV_GROUPS.map((group, i) => (
        <div key={group.label ?? `group-${i}`} className="flex flex-col gap-1">
          {group.label ? (
            <p className="px-3 pt-4 pb-1 text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase first:pt-0">
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => {
            const active = isNavItemActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={onNavigate}
                className="flex min-h-11 items-center gap-2.5 rounded-[10px] px-3 text-sm font-semibold text-foreground/75! transition-colors hover:bg-(--color-paper-3) hover:text-foreground! aria-[current=page]:bg-(--color-accent) aria-[current=page]:text-(--color-accent-ink)!"
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

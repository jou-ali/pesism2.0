'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/players', label: 'Players' },
  { href: '/admin/teams', label: 'Teams' },
  { href: '/admin/registration-audit', label: 'Reg audit' },
  { href: '/admin/schedule', label: 'Fixtures' },
  { href: '/admin/fixtures', label: 'Results' },
  { href: '/admin/table', label: 'Table' },
  { href: '/admin/grievances', label: 'Grievances' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; badge?: number };

/** Menu des espaces privés : la page courante est mise en évidence. */
export default function SideNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  const root = items[0]?.href;
  return (
    <nav aria-label={label}>
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:pb-0">
        {items.map((i) => {
          const active = i.href === root ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/");
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between gap-3 whitespace-nowrap rounded-full px-4 py-2.5 text-sm transition-colors ${
                  active ? "bg-bone text-ink" : "hover:bg-ink-3"
                }`}
              >
                {i.label}
                {!!i.badge && (
                  <span
                    className="min-w-6 rounded-full border border-bone bg-[#ffd76a] px-2 py-0.5 text-center font-mono text-[0.72rem] font-bold text-[#3a2c00]"
                    aria-label={`${i.badge} à traiter`}
                  >
                    {i.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

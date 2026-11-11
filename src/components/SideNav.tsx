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
                  <span className="rounded-full border border-bone bg-accent px-2 py-0.5 font-mono text-[0.7rem] font-semibold text-on-accent">
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

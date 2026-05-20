"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Stethoscope, Users, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/screen", label: "Periksa", icon: Stethoscope },
  { href: "/roster", label: "Anak", icon: Users },
  { href: "/about", label: "Tentang", icon: Info },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-white border-t z-30"
      style={{ borderColor: "var(--color-line)" }}
    >
      <ul className="grid grid-cols-4 max-w-md mx-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
                  active ? "text-[var(--color-posy-blue)]" : "text-[var(--color-mute)]"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

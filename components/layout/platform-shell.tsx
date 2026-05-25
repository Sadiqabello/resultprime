"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Receipt,
  ScrollText,
  GraduationCap,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/modules/auth/actions";

/**
 * Platform Console chrome: a left sidebar matching the school app, instead of a
 * top menu. Fixed on desktop; on mobile it collapses behind a hamburger and
 * opens as a slide-out drawer (backdrop, Esc to close, scroll-locked). Client
 * component so it can track the active route + drawer state; the sign-out server
 * action is invoked from the footer form.
 */
interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/schools", label: "Schools", icon: Building2 },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/audit", label: "Audit", icon: ScrollText },
];

function Brand() {
  return (
    <span className="flex items-center gap-2 px-2 py-1 font-semibold">
      <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 text-white">
        <GraduationCap className="size-4" />
      </span>
      Platform Console
    </span>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
            isActive(href)
              ? "bg-secondary font-medium text-secondary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function SignOut() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <LogOut className="size-4" />
        Sign out
      </button>
    </form>
  );
}

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Close the drawer on Escape and lock body scroll while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r p-3 lg:flex">
        <div className="mb-2">
          <Brand />
        </div>
        <NavList />
        <SignOut />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center gap-3 border-b px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Menu className="size-5" />
          </button>
          <Brand />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-6">{children}</main>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-[1px]" aria-hidden onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 max-w-[80%] flex-col gap-1 border-r bg-background p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <SignOut />
          </aside>
        </div>
      ) : null}
    </div>
  );
}

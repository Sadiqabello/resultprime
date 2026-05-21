"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Calculator,
  TrendingUp,
  CheckSquare,
  FileText,
  PencilLine,
  Wallet,
  Upload,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { can, type AuthContext, type Permission } from "@/lib/authz";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Item shows only if the user has this permission (role-aware nav, §10.1). */
  permission?: Permission;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users, permission: "students.read" },
  { href: "/staff", label: "Staff", icon: GraduationCap, permission: "staff.read" },
  { href: "/classes", label: "Classes", icon: BookOpen, permission: "academics.manage" },
  { href: "/subjects", label: "Subjects", icon: BookOpen, permission: "academics.manage" },
  { href: "/scores", label: "Score Entry", icon: ClipboardList, permission: "scores.read" },
  { href: "/results", label: "Results", icon: Calculator, permission: "results.read" },
  { href: "/annual", label: "Annual", icon: TrendingUp, permission: "results.read" },
  { href: "/approvals", label: "Approvals", icon: CheckSquare, permission: "results.approve" },
  { href: "/reports", label: "Reports", icon: FileText, permission: "results.export" },
  { href: "/reports/remarks", label: "Remarks", icon: PencilLine, permission: "class.remarks.write" },
  { href: "/fees", label: "Fees", icon: Wallet, permission: "fees.manage" },
  { href: "/imports", label: "Bulk Import", icon: Upload, permission: "students.write" },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings, permission: "academics.manage" },
];

export function Sidebar({ ctx, unread = 0 }: { ctx: AuthContext; unread?: number }) {
  const pathname = usePathname();
  const items = NAV.filter((i) => !i.permission || can(ctx, i.permission));

  // The single active item is the most specific href that prefixes the path.
  const activeHref = items
    .map((i) => i.href)
    .filter((h) => pathname === h || pathname.startsWith(h + "/"))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r p-3">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
              active
                ? "bg-secondary font-medium text-secondary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="flex-1">{label}</span>
            {href === "/notifications" && unread > 0 ? (
              <span className="flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-medium text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

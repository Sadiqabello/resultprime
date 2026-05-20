import Link from "next/link";
import {
  UserPlus,
  ClipboardList,
  Calculator,
  CheckSquare,
  FileText,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { can, type AuthContext, type Permission } from "@/lib/authz";

const ACTIONS: {
  label: string;
  href: string;
  permission: Permission;
  icon: LucideIcon;
}[] = [
  { label: "Add students", href: "/students", permission: "students.write", icon: UserPlus },
  { label: "Enter scores", href: "/scores", permission: "scores.write", icon: ClipboardList },
  { label: "Compute results", href: "/results", permission: "results.compute", icon: Calculator },
  { label: "Review approvals", href: "/approvals", permission: "results.approve", icon: CheckSquare },
  { label: "Report cards", href: "/reports", permission: "results.export", icon: FileText },
  { label: "Grading setup", href: "/settings", permission: "grading.manage", icon: SlidersHorizontal },
];

export function QuickActions({ ctx }: { ctx: AuthContext }) {
  const items = ACTIONS.filter((a) => can(ctx, a.permission));
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Quick actions</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <Icon className="size-5 text-primary" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

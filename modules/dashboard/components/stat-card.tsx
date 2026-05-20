import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  href?: string;
}) {
  const body = (
    <CardContent className="flex items-center gap-4 p-5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold tabular-nums leading-none">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  );

  return href ? (
    <Link href={href} className="block">
      <Card className="transition-colors hover:border-primary/40 hover:bg-accent/40">
        {body}
      </Card>
    </Link>
  ) : (
    <Card>{body}</Card>
  );
}

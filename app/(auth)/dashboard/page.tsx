import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  Layers,
  BookOpen,
  GraduationCap,
  CheckSquare,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { getAuthContext } from "@/modules/auth/service";
import { dashboardService } from "@/modules/dashboard/service";
import { StatCard } from "@/modules/dashboard/components/stat-card";
import { OnboardingChecklist } from "@/modules/dashboard/components/onboarding-checklist";
import { QuickActions } from "@/modules/dashboard/components/quick-actions";
import { can, hasRole } from "@/lib/authz";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  // Platform super admins have no tenant — point them at the console.
  if (!ctx.schoolId) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Platform console</CardTitle>
          <CardDescription>
            You&apos;re signed in as a platform admin. Manage schools from the
            console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/schools" className="text-sm font-medium text-primary hover:underline">
            Go to schools →
          </Link>
        </CardContent>
      </Card>
    );
  }

  const data = await dashboardService.getOverview(ctx);
  const isStaff = can(ctx, "students.read");

  // Students & parents: a calm, read-only landing (full portal is Phase 2).
  if (!isStaff) {
    return (
      <section className="mx-auto max-w-md space-y-2 pt-8 text-center">
        <h1 className="text-2xl font-semibold">Hello, {data.firstName}</h1>
        <p className="text-sm text-muted-foreground">
          Your published results from {data.schoolName} will appear here once
          released.
        </p>
      </section>
    );
  }

  const showOnboarding = !data.setupComplete && can(ctx, "academics.manage");
  const showResults = data.results !== null && can(ctx, "results.read");
  const showApprovals = can(ctx, "results.approve");
  const showMyClasses = hasRole(ctx, "teacher") || hasRole(ctx, "form_teacher");

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {data.firstName}
          </h1>
          <p className="text-sm text-muted-foreground">{data.schoolName}</p>
        </div>
        {data.term ? (
          <Badge variant="secondary" className="h-7 px-3">
            {data.session ? `${data.session} · ` : ""}
            {data.term} Term
          </Badge>
        ) : (
          <Badge variant="warning" className="h-7 px-3">
            No active term
          </Badge>
        )}
      </header>

      {showOnboarding ? <OnboardingChecklist setup={data.setup} /> : null}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Students" value={data.stats.students} icon={Users} href="/students" />
        <StatCard label="Classes" value={data.stats.classes} icon={Layers} href="/classes" />
        <StatCard label="Subjects" value={data.stats.subjects} icon={BookOpen} href="/subjects" />
        <StatCard label="Staff" value={data.stats.staff} icon={GraduationCap} href="/staff" />
      </div>

      {/* Operational widgets */}
      {showResults || showApprovals || showMyClasses ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {showResults && data.results ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Results published</CardTitle>
                <CardDescription>{data.term} term</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-semibold tabular-nums">
                    {data.results.published}
                    <span className="text-base font-normal text-muted-foreground">
                      {" "}
                      / {data.results.enrolled}
                    </span>
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {data.results.percent}%
                  </span>
                </div>
                <Progress value={data.results.percent} className="mt-3" />
                <p className="mt-2 text-xs text-muted-foreground">
                  students with published results
                </p>
              </CardContent>
            </Card>
          ) : null}

          {showApprovals ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pending approvals</CardTitle>
                <CardDescription>awaiting your review</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <CheckSquare className="size-5" />
                  </span>
                  <span className="text-3xl font-semibold tabular-nums">
                    {data.pendingApprovals}
                  </span>
                </div>
                <Link
                  href="/approvals"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Review now <ArrowRight className="size-3.5" />
                </Link>
              </CardContent>
            </Card>
          ) : null}

          {showMyClasses ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">My classes</CardTitle>
                <CardDescription>assigned this term</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <ClipboardList className="size-5" />
                  </span>
                  <span className="text-3xl font-semibold tabular-nums">
                    {data.myClassSubjects}
                  </span>
                </div>
                <Link
                  href="/scores"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Enter scores <ArrowRight className="size-3.5" />
                </Link>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      <QuickActions ctx={ctx} />
    </div>
  );
}

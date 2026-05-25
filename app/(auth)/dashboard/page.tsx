import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  Layers,
  BookOpen,
  GraduationCap,
  ArrowRight,
  ClipboardList,
  Target,
  Gauge,
  BadgeCheck,
  Send,
  Award,
  AlertTriangle,
  Wallet,
  Activity as ActivityIcon,
} from "lucide-react";
import { getAuthContext } from "@/modules/auth/service";
import { dashboardService } from "@/modules/dashboard/service";
import { StatCard } from "@/modules/dashboard/components/stat-card";
import { KpiCard } from "@/modules/dashboard/components/kpi-card";
import {
  Ring,
  BarList,
  SegmentBar,
  RankedList,
  ActivityFeed,
  type BarItem,
} from "@/modules/dashboard/components/analytics-charts";
import { scoreTone } from "@/modules/dashboard/components/tones";
import { OnboardingChecklist } from "@/modules/dashboard/components/onboarding-checklist";
import { QuickActions } from "@/modules/dashboard/components/quick-actions";
import { can, hasRole } from "@/lib/authz";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
            You&apos;re signed in as a platform admin. Manage schools from the console.
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

  // Students & parents: send them to their results portal.
  if (!isStaff) {
    return (
      <section className="mx-auto max-w-md space-y-4 pt-8 text-center">
        <h1 className="text-2xl font-semibold">Hello, {data.firstName}</h1>
        <p className="text-sm text-muted-foreground">
          View {data.schoolName}&apos;s published results in your results portal.
        </p>
        <Link href="/portal" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Go to my results <ArrowRight className="size-3.5" />
        </Link>
      </section>
    );
  }

  const analytics = await dashboardService.getAnalytics(ctx, data.termId);
  const showOnboarding = !data.setupComplete && can(ctx, "academics.manage");
  const showApprovals = can(ctx, "results.approve");
  const showMyClasses = hasRole(ctx, "teacher") || hasRole(ctx, "form_teacher");

  const entityCounts = (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Students" value={data.stats.students} icon={Users} href="/students" />
      <StatCard label="Classes" value={data.stats.classes} icon={Layers} href="/classes" />
      <StatCard label="Subjects" value={data.stats.subjects} icon={BookOpen} href="/subjects" />
      <StatCard label="Staff" value={data.stats.staff} icon={GraduationCap} href="/staff" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {data.firstName}</h1>
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

      {/* Approvals nudge */}
      {showApprovals && data.pendingApprovals > 0 ? (
        <Link
          href="/approvals"
          className="flex items-center justify-between gap-3 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm transition-colors hover:bg-amber-100/70 dark:border-amber-500/30 dark:bg-amber-500/10"
        >
          <span className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200">
            <BadgeCheck className="size-4" />
            {data.pendingApprovals} class{data.pendingApprovals === 1 ? "" : "es"} awaiting your approval
          </span>
          <span className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-300">
            Review <ArrowRight className="size-3.5" />
          </span>
        </Link>
      ) : null}

      {analytics && analytics.computed > 0 ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label="Pass rate"
              value={analytics.passRate === null ? "—" : `${analytics.passRate}%`}
              icon={Target}
              tone={scoreTone(analytics.passRate, 50)}
              progress={analytics.passRate}
              sub={`pass mark ${analytics.passMark}% · ${analytics.computed} results`}
            />
            <KpiCard
              label="Average score"
              value={analytics.avgScore === null ? "—" : `${analytics.avgScore}%`}
              icon={Gauge}
              tone={scoreTone(analytics.avgScore, analytics.passMark)}
              sub="across computed students"
            />
            <KpiCard
              label="Computed"
              value={`${analytics.completionPct}%`}
              icon={ClipboardList}
              tone="good"
              progress={analytics.completionPct}
              sub={`${analytics.computed}/${analytics.enrolled} enrolled`}
              href="/results"
            />
            <KpiCard
              label="Published"
              value={`${analytics.publishedPct}%`}
              icon={Send}
              tone="excellent"
              progress={analytics.publishedPct}
              sub={`${analytics.published}/${analytics.enrolled} students`}
              href="/approvals"
            />
          </div>

          {/* Pipeline + pass-rate ring */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Results pipeline</CardTitle>
                <CardDescription>
                  {analytics.computedClasses}/{analytics.totalClasses} classes computed
                  {analytics.notComputedClasses > 0 ? ` · ${analytics.notComputedClasses} not yet` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SegmentBar segments={analytics.pipeline} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pass rate</CardTitle>
                <CardDescription>≥ {analytics.passMark}% average</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Ring
                  value={analytics.passRate ?? 0}
                  display={analytics.passRate === null ? "—" : `${analytics.passRate}%`}
                  caption="passing"
                  tone={scoreTone(analytics.passRate, 50)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Class comparison + distribution */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Class performance</CardTitle>
                <CardDescription>average score by class</CardDescription>
              </CardHeader>
              <CardContent>
                <BarList
                  max={100}
                  items={analytics.classes.map(
                    (c): BarItem => ({
                      label: c.label,
                      value: c.average ?? 0,
                      display: `${c.average ?? 0}%`,
                      meta: `n=${c.size}`,
                      tone: scoreTone(c.average, analytics.passMark),
                    }),
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Grade distribution</CardTitle>
                <CardDescription>students per band</CardDescription>
              </CardHeader>
              <CardContent>
                <BarList items={analytics.tiers.map((t): BarItem => ({ label: t.label, value: t.count, tone: t.tone }))} />
              </CardContent>
            </Card>
          </div>

          {/* Top performers · at-risk · fees/enrolment */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="size-4 text-emerald-600" /> Top performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RankedList items={analytics.topPerformers} tone="excellent" empty="No results yet." />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="size-4 text-rose-600" /> Needs attention
                </CardTitle>
                <CardDescription>below the pass mark</CardDescription>
              </CardHeader>
              <CardContent>
                <RankedList items={analytics.atRisk} tone="fail" empty="No students below the pass mark 🎉" />
              </CardContent>
            </Card>

            {analytics.fees ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wallet className="size-4 text-brand-600" /> Fee clearance
                  </CardTitle>
                  <CardDescription>{analytics.fees.total} records this term</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <Ring
                    value={analytics.fees.clearedPct}
                    display={`${analytics.fees.clearedPct}%`}
                    caption="cleared"
                    tone={analytics.fees.clearedPct >= 80 ? "excellent" : analytics.fees.clearedPct >= 50 ? "fair" : "fail"}
                    size={104}
                  />
                  <ul className="space-y-1.5 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-emerald-500" /> Cleared
                      <span className="ml-auto font-medium tabular-nums">{analytics.fees.cleared}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-amber-500" /> Partial
                      <span className="ml-auto font-medium tabular-nums">{analytics.fees.partial}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-rose-500" /> Owing
                      <span className="ml-auto font-medium tabular-nums">{analytics.fees.owing}</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="size-4 text-brand-600" /> Enrolment
                  </CardTitle>
                  <CardDescription>{analytics.enrolled} active this term</CardDescription>
                </CardHeader>
                <CardContent>
                  <BarList
                    items={[
                      { label: "Girls", value: analytics.gender.female, tone: "good" },
                      { label: "Boys", value: analytics.gender.male, tone: "fair" },
                      ...(analytics.gender.unknown
                        ? [{ label: "Unspecified", value: analytics.gender.unknown, tone: "weak" as const }]
                        : []),
                    ]}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent activity + a couple of counts */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ActivityIcon className="size-4 text-muted-foreground" /> Recent activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed items={analytics.activity} />
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              <StatCard label="Students" value={data.stats.students} icon={Users} href="/students" />
              <StatCard label="Staff" value={data.stats.staff} icon={GraduationCap} href="/staff" />
            </div>
          </div>
        </>
      ) : analytics ? (
        // Term set, but nothing computed yet.
        <>
          <Card>
            <CardContent className="flex flex-col items-start gap-2 p-6">
              <h2 className="text-lg font-semibold">No results yet this term</h2>
              <p className="text-sm text-muted-foreground">
                Once teachers enter scores and you compute a class, performance analytics appear here.
              </p>
              <Link
                href="/results"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Go to results <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
          {entityCounts}
        </>
      ) : (
        // No results.read (e.g. a subject teacher): counts + their class shortcut.
        <>
          {entityCounts}
          {showMyClasses ? (
            <Card className="max-w-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">My classes</CardTitle>
                <CardDescription>assigned this term</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <ClipboardList className="size-5" />
                  </span>
                  <span className="text-3xl font-semibold tabular-nums">{data.myClassSubjects}</span>
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
        </>
      )}

      <QuickActions ctx={ctx} />
    </div>
  );
}

import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SetupState } from "../service";

// Ordered by dependency (§18): you can't add students before classes, etc.
const STEPS: { key: keyof SetupState; label: string; href: string }[] = [
  { key: "hasTerm", label: "Create a session & term", href: "/settings" },
  { key: "hasClasses", label: "Add your classes", href: "/classes" },
  { key: "hasSubjects", label: "Add subjects", href: "/subjects" },
  { key: "hasGrading", label: "Set up a grading system", href: "/settings" },
  { key: "hasStudents", label: "Enrol students", href: "/students" },
  { key: "hasStaff", label: "Add staff & assign teachers", href: "/staff" },
];

export function OnboardingChecklist({ setup }: { setup: SetupState }) {
  const done = STEPS.filter((s) => setup[s.key]).length;
  const percent = Math.round((done / STEPS.length) * 100);
  const nextStep = STEPS.find((s) => !setup[s.key]);

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-brand-50/60 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Finish setting up your school</CardTitle>
            <CardDescription>
              {done} of {STEPS.length} steps done — complete these to start processing results.
            </CardDescription>
          </div>
          <span className="text-2xl font-semibold tabular-nums text-primary">{percent}%</span>
        </div>
        <Progress value={percent} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-1">
        {STEPS.map((step) => {
          const complete = setup[step.key];
          const isNext = step.key === nextStep?.key;
          return (
            <Link
              key={step.key}
              href={step.href}
              className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent"
            >
              {complete ? (
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground/40" />
              )}
              <span className={complete ? "text-muted-foreground line-through" : "font-medium"}>
                {step.label}
              </span>
              {isNext ? (
                <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Start <ArrowRight className="size-3.5" />
                </span>
              ) : null}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

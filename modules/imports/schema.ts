import { z } from "zod";
import { uuid } from "@/lib/validation";

/**
 * Bulk score import is keyed to a single class-subject (one generated sheet =
 * one class's roster × the assessment components, §12.1). The file itself is
 * binary (parsed server-side); only the target context is validated here.
 */
export const importContextSchema = z.object({
  classSubjectId: uuid,
});
export type ImportContextInput = z.infer<typeof importContextSchema>;

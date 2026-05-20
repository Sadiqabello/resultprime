/** Shared application types not derived from the DB or Zod schemas. */

export type { Database, Json } from "./database.types";

/** Standard shape for keyset-paginated list responses. */
export interface Paginated<T> {
  rows: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Supabase database types. PLACEHOLDER — regenerate from your schema once
 * migrations exist (db/migrations):
 *
 *   npm run db:types          # supabase gen types typescript --local
 *
 * Until then `Database` is intentionally untyped (`any`) so the typed Supabase
 * clients and repositories compile against tables that don't exist yet. After
 * you generate real types, this file is replaced wholesale with strict,
 * table-specific shapes and the compiler starts catching column/table mistakes.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

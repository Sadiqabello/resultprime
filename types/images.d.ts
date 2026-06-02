// Ambient declarations for static image imports (next/image's StaticImageData).
//
// Next.js normally provides these via `next/image-types/global`, referenced from
// the auto-generated `next-env.d.ts`. But `npm run typecheck` (tsc --noEmit) in CI
// runs without a prior `next build`, so that reference can't be relied on. Committing
// these keeps `import img from "@/public/.../foo.jpg"` type-checking everywhere.
//
// This file has NO top-level import/export on purpose: that keeps it a global
// *script*, so the `declare module "*.ext"` blocks are unambiguously global ambient
// declarations and always load — even if `next/image` type resolution hiccups in CI.
// The element type is referenced via an inline `import(...)` type, which degrades to
// `any` (rather than failing) if next's types aren't resolvable.

declare module "*.jpg" {
  const content: import("next/image").StaticImageData;
  export default content;
}

declare module "*.jpeg" {
  const content: import("next/image").StaticImageData;
  export default content;
}

declare module "*.png" {
  const content: import("next/image").StaticImageData;
  export default content;
}

declare module "*.webp" {
  const content: import("next/image").StaticImageData;
  export default content;
}

declare module "*.avif" {
  const content: import("next/image").StaticImageData;
  export default content;
}

declare module "*.gif" {
  const content: import("next/image").StaticImageData;
  export default content;
}

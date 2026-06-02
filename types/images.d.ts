// Ambient declarations for static image imports (next/image's StaticImageData).
//
// Next.js normally provides these via `next/image-types/global`, referenced from
// the auto-generated `next-env.d.ts`. But `npm run typecheck` (tsc --noEmit) in CI
// runs without a prior `next build`, so that reference can't be relied on. Committing
// these keeps `import img from "@/public/.../foo.jpg"` type-checking everywhere.
import type { StaticImageData } from "next/image";

declare module "*.jpg" {
  const content: StaticImageData;
  export default content;
}

declare module "*.jpeg" {
  const content: StaticImageData;
  export default content;
}

declare module "*.png" {
  const content: StaticImageData;
  export default content;
}

declare module "*.webp" {
  const content: StaticImageData;
  export default content;
}

declare module "*.avif" {
  const content: StaticImageData;
  export default content;
}

declare module "*.gif" {
  const content: StaticImageData;
  export default content;
}

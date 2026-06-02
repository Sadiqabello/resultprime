import Image, { type StaticImageData } from "next/image";

/**
 * A real product screenshot, framed as a browser "exhibit". Uses next/image with
 * the statically-imported source, so it ships a responsive srcset and a blur
 * placeholder that develops into the sharp shot on load (on-theme: results
 * developing). Shared by the hero and the tabbed exhibits.
 */
export function Exhibit({
  src,
  alt,
  url,
  aspect = "16 / 10",
  position = "top center",
  className = "",
  priority = false,
}: {
  src: StaticImageData;
  alt: string;
  url: string;
  aspect?: string;
  position?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure
      className={`overflow-hidden rounded-lg border border-[#0a1130]/20 bg-white shadow-[0_30px_60px_-30px_rgba(10,17,48,0.35)] ${className}`}
    >
      <figcaption className="flex items-center gap-2 border-b border-[#0a1130]/12 bg-[#0a1130]/[0.04] px-3 py-2">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#0a1130]/15" />
          <span className="size-2.5 rounded-full bg-[#0a1130]/15" />
          <span className="size-2.5 rounded-full bg-[#0a1130]/15" />
        </span>
        <span className="ml-2 truncate rounded bg-white px-2.5 py-0.5 font-sans text-[11px] text-[#0a1130]/45 ring-1 ring-[#0a1130]/10">
          {url}
        </span>
      </figcaption>
      <div className="relative bg-white" style={{ aspectRatio: aspect }}>
        <Image
          src={src}
          alt={alt}
          fill
          placeholder="blur"
          sizes="(min-width: 1024px) 640px, 100vw"
          className="object-cover"
          style={{ objectPosition: position }}
          priority={priority}
        />
      </div>
    </figure>
  );
}

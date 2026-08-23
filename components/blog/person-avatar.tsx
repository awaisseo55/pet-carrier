import type { Person } from "@/lib/people";

/**
 * Initials avatar shown until a real photo is supplied. Deliberately not an
 * AI-generated "photo" of a person who doesn't have one on file, presenting
 * a synthetic face as a real staff member's photograph would be misleading
 * to site visitors, an honest placeholder is the right call until Rebecca
 * and Daniel's real photos are uploaded.
 */
export function PersonAvatar({ person, size = "lg" }: { person: Person; size?: "lg" | "md" | "sm" }) {
  const initial = person.name.charAt(0).toUpperCase();
  const palette = "bg-blue-50 text-blue-700 border-blue-200";

  const dimensions = size === "lg" ? "size-28 text-4xl" : size === "md" ? "size-16 text-xl" : "size-10 text-sm";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border font-heading font-semibold ${palette} ${dimensions}`}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

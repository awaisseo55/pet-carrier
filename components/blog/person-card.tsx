import Link from "next/link";
import type { Person } from "@/lib/people";
import { PersonAvatar } from "@/components/blog/person-avatar";
import { Button } from "@/components/ui/button";

export function PersonCard({ person }: { person: Person }) {
  const roleLabel = person.role === "author" ? "Written by" : "Reviewed by";

  return (
    <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-gray-50 p-5 sm:flex-row sm:items-center">
      <PersonAvatar person={person} size="md" />
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{roleLabel}</p>
        <Link href={person.profileUrl} className="font-heading text-lg font-semibold text-foreground hover:text-blue-700">
          {person.name}
        </Link>
        <p className="text-sm text-gray-600">{person.title}</p>
        <p className="mt-2 text-sm text-gray-600">{person.shortBio}</p>
      </div>
      <Button variant="outline" size="sm" asChild className="w-full shrink-0 sm:w-auto">
        <Link href={person.profileUrl}>View {person.name}&apos;s Profile &rarr;</Link>
      </Button>
    </div>
  );
}

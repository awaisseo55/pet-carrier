export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{title}</h1>
      {updated && <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>}
      <div className="mt-8 flex flex-col gap-5 text-gray-500 [&_h2]:mt-6 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_a]:text-emerald-700 [&_a]:underline">
        {children}
      </div>
    </div>
  );
}

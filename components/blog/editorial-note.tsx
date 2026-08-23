export function EditorialNote({ note }: { note?: string }) {
  if (!note) return null;

  return (
    <div className="border-l-2 border-blue-300 bg-gray-50 py-3 pl-5 pr-4">
      <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Editor&apos;s Note</p>
      <p className="mt-1 text-sm italic text-gray-600">{note}</p>
    </div>
  );
}

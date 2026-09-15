import Link from "next/link";
import { Download } from "lucide-react";
import { getAllSubscribers } from "@/lib/subscribers";

const SOURCE_LABEL: Record<string, string> = {
  welcome_popup: "Welcome popup (£5 off)",
  footer: "Footer newsletter form",
};

export default async function AdminSubscribersPage() {
  const subscribers = await getAllSubscribers();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Subscribers</h1>
          <p className="mt-1 text-gray-500">
            {subscribers.length} email{subscribers.length === 1 ? "" : "s"} collected from the site, for use in
            email campaigns.
          </p>
        </div>
        {subscribers.length > 0 && (
          <Link
            href="/api/admin/subscribers/export"
            className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-gray-50"
          >
            <Download className="size-4" />
            Export CSV
          </Link>
        )}
      </div>

      <div className="mt-6">
        {subscribers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-gray-50 py-16 text-center text-gray-500">
            No subscribers yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-gray-500">
                  <th className="p-3">Email</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="p-3 font-medium">{s.email}</td>
                    <td className="p-3 text-gray-500">{SOURCE_LABEL[s.source] || s.source}</td>
                    <td className="p-3 text-gray-500">
                      {new Date(s.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

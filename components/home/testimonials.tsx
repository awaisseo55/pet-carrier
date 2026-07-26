import { Star } from "lucide-react";

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
          What Pet Owners Say
        </h2>
        <p className="mt-2 text-brown-soft">
          We’re just getting started, real reviews will appear here soon.
        </p>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-cream-dark/50 p-8 text-center"
          >
            <div className="flex gap-1 text-terracotta-300">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star key={idx} className="size-4 fill-current" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Customer reviews will appear here once we’ve helped our first pets travel in comfort.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

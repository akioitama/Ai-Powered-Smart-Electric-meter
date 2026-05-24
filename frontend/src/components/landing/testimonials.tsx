"use client";

import { motion } from "framer-motion";

const QUOTES = [
  {
    quote:
      "We rolled out 60,000 units across two municipalities in nine months. The AI Powered Smart Electric Meter cut our theft losses by 22% in the first quarter alone.",
    name: "Dr. Aisha Rehman",
    role: "Director · Lahore Power Authority",
  },
  {
    quote:
      "The control room finally feels like a control room. One screen, every meter, every anomaly — and a relay that just works.",
    name: "Marco Lindqvist",
    role: "Head of Grid Ops · Helios City",
  },
  {
    quote:
      "Their Isolation-Forest pipeline finds bypass attempts our SCADA never would. The auto cut-off has paid for itself five times over.",
    name: "Lt. Col. (R) Faisal Iqbal",
    role: "Cybersecurity Lead · National Grid",
  },
];

export function Testimonials() {
  return (
    <section id="partners" className="relative py-24 sm:py-32">
      <div className="container-tight">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="eyebrow">Field reports</span>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            From the operators who run{" "}
            <span className="holo-text">tomorrow&apos;s grid.</span>
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {QUOTES.map((q, i) => (
            <motion.figure
              key={q.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="holo-card flex h-full flex-col justify-between p-6"
            >
              <blockquote className="text-[15px] leading-relaxed text-ink/90">
                <span className="mr-1 align-top text-3xl text-electric-300">“</span>
                {q.quote}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-holo-gradient bg-[length:200%_200%] text-bg-deep">
                  <span className="text-xs font-bold">{q.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold">{q.name}</div>
                  <div className="text-xs text-ink-muted">{q.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

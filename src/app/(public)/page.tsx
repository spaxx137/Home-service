import Link from "next/link";

import { ISSUE_TYPE_ESTIMATES, ISSUE_TYPE_LABELS, formatPhp } from "@/lib/constants";
import type { IssueType } from "@/types/database";

const FEATURED_ISSUES: IssueType[] = [
  "screen_repair",
  "battery",
  "water_damage",
  "charging_port",
];

const STEPS = [
  {
    title: "Book online",
    description:
      "Tell us your device, the issue, and when you're free. Takes under 2 minutes.",
  },
  {
    title: "We assign a technician",
    description:
      "We match you with the nearest available technician and confirm your slot.",
  },
  {
    title: "Repair at your doorstep",
    description:
      "Your technician arrives at the scheduled time and fixes it on the spot.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Home Service Repair
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Phone repair that comes to you.
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Skip the trip to the shop. Book a certified Ceejay technician for
              screen repairs, battery replacements, water damage, and more —
              we come to your home or office.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/book"
                className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Book Now
              </Link>
              <Link
                href="#how-it-works"
                className="rounded-lg border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Common repairs we handle</h2>
        <p className="mt-2 text-slate-600">
          Estimated starting prices — your technician confirms the final price
          before starting any work.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_ISSUES.map((issue) => (
            <div
              key={issue}
              className="rounded-xl border border-slate-200 p-5 shadow-sm transition hover:shadow-md"
            >
              <p className="font-semibold text-slate-900">{ISSUE_TYPE_LABELS[issue]}</p>
              <p className="mt-1 text-sm text-slate-500">
                From {formatPhp(ISSUE_TYPE_ESTIMATES[issue])}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <p className="mt-4 font-semibold text-slate-900">{step.title}</p>
                <p className="mt-1 text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Ready to get started?</h2>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">
          Book your home-service repair now and pay securely online via GCash
          or Maya.
        </p>
        <Link
          href="/book"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Book Now
        </Link>
      </section>
    </div>
  );
}

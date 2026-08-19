import type { Metadata } from "next";

import { BookingForm } from "@/components/booking-form";

export const metadata: Metadata = {
  title: "Book Home Service — Ceejay Cellphone Repair Shop",
};

export default function BookPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Book Your Home Service Repair</h1>
      <p className="mt-2 text-slate-600">
        Fill out the details below and we&apos;ll confirm your appointment shortly.
      </p>
      <div className="mt-8">
        <BookingForm />
      </div>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Status — Ceejay Cellphone Repair Shop",
};

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; status?: string }>;
}) {
  const { ref, status } = await searchParams;
  const success = status === "success";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <div
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white ${
          success ? "bg-green-600" : "bg-slate-400"
        }`}
      >
        {success ? "✓" : "!"}
      </div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        {success ? "Payment Received!" : "Payment Not Completed"}
      </h1>
      <p className="mt-2 text-slate-600">
        {success
          ? "Thanks! We're confirming your payment now and will reach out shortly to finalize your appointment."
          : "It looks like the payment wasn't completed. Your booking is still on file — you can retry payment or contact us directly."}
      </p>
      {ref && (
        <p className="mt-4 text-sm text-slate-500">
          Reference number: <span className="font-mono font-semibold text-slate-900">{ref}</span>
        </p>
      )}
      <Link
        href="/"
        className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        Back to Home
      </Link>
    </div>
  );
}

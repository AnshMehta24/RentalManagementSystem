import Link from "next/link";

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Payment successful</h1>
      <p className="mt-2 text-gray-600">
        Thank you for your payment. Your rental order has been confirmed.
      </p>
      {session_id && (
        <p className="mt-1 text-xs text-gray-400">Session: {session_id.slice(0, 20)}…</p>
      )}
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Back to home
      </Link>
    </div>
  );
}

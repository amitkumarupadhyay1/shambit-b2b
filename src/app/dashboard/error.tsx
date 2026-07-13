'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard rendering error', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">We couldn&apos;t load this page</h2>
      <p className="mt-2 text-sm text-slate-600">Your booking data is safe. Please try again.</p>
      <button
        type="button"
        onClick={unstable_retry}
        className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Try again
      </button>
    </div>
  );
}

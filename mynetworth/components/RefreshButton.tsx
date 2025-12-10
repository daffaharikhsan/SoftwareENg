"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh(); // Trigger re-fetch dari server
    setLastRefresh(new Date());

    // Delay untuk animasi
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="flex items-center gap-3">
      {lastRefresh && (
        <span className="text-xs text-gray-500">
          Updated: {lastRefresh.toLocaleTimeString()}
        </span>
      )}

      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
        title="Refresh prices now"
      >
        <svg
          className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span className="font-medium">
          {isRefreshing ? "Updating..." : "Refresh Prices"}
        </span>
      </button>
    </div>
  );
}

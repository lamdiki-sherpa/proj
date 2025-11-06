import React from "react";

export default function MyBookings({ bookings, loading, onCancel, onRefresh }) {
  return (
    <div className="p-4 rounded-2xl shadow bg-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">My Bookings</h2>
        <button
          className="px-3 py-1 rounded bg-gray-100"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {loading && <div>Loading…</div>}
      {!loading && bookings.length === 0 && (
        <div className="text-gray-500 text-center py-4">You have no upcoming bookings.</div>
      )}

      {!loading &&
        bookings.map((b) => (
          <div
            key={b._id}
            className="border rounded-xl p-4 flex items-center justify-between"
          >
            <div className="min-w-0">
              <div className="font-semibold truncate">
                {b.designer?.name || "Designer"}
              </div>
              <div className="text-sm text-gray-600">
                {new Date(b.startTime).toLocaleString()} →{" "}
                {new Date(b.endTime).toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">Status: {b.status}</div>
            </div>
            {b.status !== "cancelled" && (
              <button
                className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                onClick={() => onCancel(b._id)}
              >
                Cancel
              </button>
            )}
          </div>
        ))}
    </div>
  );
}

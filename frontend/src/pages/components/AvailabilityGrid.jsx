import React, { useState } from "react";
import BookingModal from "./BookingModal";

export default function AvailabilityGrid({ designer, availability, onBook }) {
  const [selectedSlot, setSelectedSlot] = useState(null);

  return (
    <div className="space-y-4">
      {Object.entries(availability).length === 0 && (
        <div className="text-gray-500 text-center py-4">No available slots.</div>
      )}

      {Object.entries(availability).map(([date, times]) => (
        <div key={date} className="border rounded-xl p-4">
          <div className="font-semibold mb-2">{date}</div>
          <div className="flex flex-wrap gap-2">
            {times.map((t) => (
              <button
                key={t}
                className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                onClick={() => setSelectedSlot({ date, time: t })}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      ))}

      {selectedSlot && (
        <BookingModal
          designer={designer}
          date={selectedSlot.date}
          time={selectedSlot.time}
          onClose={() => setSelectedSlot(null)}
          onConfirm={onBook}
        />
      )}
    </div>
  );
}

import React, { useState } from "react";

export default function BookingModal({ designer, date, time, onClose, onConfirm }) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(designer._id, date, time, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-3">Confirm Booking</h2>
        <p className="mb-2">Designer: <strong>{designer.name}</strong></p>
        <p className="mb-2">Date: <strong>{date}</strong></p>
        <p className="mb-4">Time: <strong>{time}</strong></p>
        <textarea
          className="w-full border p-2 rounded mb-4"
          placeholder="Optional notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleConfirm}
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";

export default function DesignerList({
  designers,
  selectedDesigner,
  onSelect,
  search,
  setSearch,
  experienceFilter,
  setExperienceFilter,
  loading,
  error,
}) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl shadow bg-white">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search designers…"
            className="border p-2 rounded flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border p-2 rounded w-full md:w-48"
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
          >
            <option value="all">All experience</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
          </select>
        </div>
      </div>

      <div className="p-4 rounded-2xl shadow bg-white">
        <h2 className="font-semibold mb-3">Designers</h2>
        {loading && <div>Loading…</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && designers.length === 0 && (
          <div className="text-gray-500 text-center py-4">No designers found.</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {designers.map((d) => (
            <div
              key={d._id}
              className={`border rounded-xl p-3 flex gap-3 items-center cursor-pointer hover:shadow transition ${
                selectedDesigner?._id === d._id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => onSelect(d)}
            >
              <img
                src={d.profilePic || "/default-avatar.png"}
                alt={d.name}
                className="w-14 h-14 rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="font-semibold truncate">{d.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {d.experience || "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

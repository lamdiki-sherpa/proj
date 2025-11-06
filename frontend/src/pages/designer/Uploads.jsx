// src/pages/Upload.jsx
import React, { useState, useRef } from 'react';

const categories = ['Street', 'Casual', 'Formal'];

const Uploads = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [designName, setDesignName] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const fileInputRef = useRef(null);

  // Handle drag & drop files
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );
    if (files.length) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  // Handle manual file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).filter((file) =>
      file.type.startsWith('image/')
    );
    if (files.length) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  // Remove single selected file
  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!designName || !details || selectedFiles.length === 0) {
    alert("Please fill all fields and add at least one image.");
    return;
  }

  const formData = new FormData();
  formData.append("designName", designName);
  formData.append("details", details);
  formData.append("category", category);
  selectedFiles.forEach((file) => formData.append("images", file));

  try {
    const res = await fetch("http://localhost:5000/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      alert("Upload successful!");
      // Clear form
      setDesignName("");
      setDetails("");
      setCategory(categories[0]);
      setSelectedFiles([]);
    } else {
      alert("Upload failed: " + data.error);
    }
  } catch (err) {
    console.error("Error uploading:", err);
    alert("Something went wrong!");
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-50 via-white to-gray-100 py-16 px-6 sm:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-10">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-900 text-center">
          Upload Your Design
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Design Name */}
          <div>
            <label
              htmlFor="designName"
              className="block text-lg font-semibold mb-2 text-gray-700"
            >
              Design Name
            </label>
            <input
              id="designName"
              type="text"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="Enter design name"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              required
            />
          </div>

          {/* Details */}
          <div>
            <label
              htmlFor="details"
              className="block text-lg font-semibold mb-2 text-gray-700"
            >
              Details
            </label>
            <textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Write details about your design..."
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-lg font-semibold mb-2 text-gray-700"
            >
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload (Drag & Drop) */}
          <div>
            <label className="block text-lg font-semibold mb-3 text-gray-700">
              Upload Images
            </label>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
              className="cursor-pointer relative border-4 border-dashed border-indigo-300 rounded-xl py-16 flex flex-col items-center justify-center text-indigo-600 hover:border-indigo-500 transition"
              onClick={() => fileInputRef.current.click()}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16v-4m0 0V8m0 4h10m-7 4h4m0 0v4m0-4V8"
                />
              </svg>
              <p className="text-center text-indigo-600 font-semibold text-lg">
                Drag & Drop images here or click to browse
              </p>
              <p className="text-sm text-indigo-400 mt-1">
                (You can upload multiple images)
              </p>
            </div>
          </div>

          {/* Preview Selected Images */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Selected Images
              </h3>
              <div className="flex flex-wrap gap-4 max-h-64 overflow-y-auto">
                {selectedFiles.map((file, idx) => {
                  const url = URL.createObjectURL(file);
                  return (
                    <div
                      key={idx}
                      className="relative w-32 h-32 rounded-lg overflow-hidden shadow-lg"
                    >
                      <img
                        src={url}
                        alt={`upload preview ${idx + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition"
                        title="Remove image"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-6 text-center">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-14 py-4 rounded-full font-extrabold text-lg shadow-lg transition"
            >
              Upload Design
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Uploads;

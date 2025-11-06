import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

export default function Upload() {
  const navigate = useNavigate();
  const [designName, setDesignName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]); // Array of files
  const [previews, setPreviews] = useState([]); // Array of preview URLs
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const maxFileSizeMB = 5;

  // Validate and add multiple files
  const handleFilesChange = (files) => {
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png'];
    let validFiles = [];
    let validPreviews = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!allowedTypes.includes(file.type)) {
        toast.error(`File "${file.name}" is not JPEG or PNG.`);
        continue;
      }

      if (file.size > maxFileSizeMB * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds ${maxFileSizeMB}MB.`);
        continue;
      }

      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    if (validFiles.length === 0) {
      toast.error('No valid files selected.');
      return;
    }

    // Append new files and previews
    setImages((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...validPreviews]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFilesChange(e.dataTransfer.files);
  };

  const handleFileInputChange = (e) => {
    handleFilesChange(e.target.files);
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!designName.trim() || !description.trim() || images.length === 0) {
      toast.error('Please fill all required fields and select at least one image.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    images.forEach((file) => formData.append('images', file));
    formData.append('designName', designName.trim());

    // Ensure category is never empty, fallback to 'Uncategorized'
    const categoryToSend = category.trim() === '' ? 'Uncategorized' : category.trim();
    formData.append('category', categoryToSend);

    formData.append('description', description.trim());

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to upload.');
        navigate('/login');
        return;
      }

      await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Design uploaded successfully!');

      // Parse user info to get role
      const userData = localStorage.getItem('user');
      let userRole = null;

      if (userData) {
        try {
          const userObj = JSON.parse(userData);
          userRole = (userObj.role || '').trim().toLowerCase();
        } catch {
          userRole = null;
        }
      }

      if (!userRole) {
        toast.error('User role missing. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      setTimeout(() => {
        if (userRole === 'creator') {
          navigate('/creator/explore');
        } else if (userRole === 'designer') {
          navigate('/designer/explore');
        } else {
          navigate('/');
        }
      }, 1500);
    } catch (err) {
      console.error('Upload error:', err.response?.status, err.response?.data);

      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Session expired or unauthorized. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Upload failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="max-w-4xl mx-auto p-6 mt-10 rounded-xl shadow-md"
      style={{ backgroundColor: '#FAF8F7' /* offwhite */ }}
    >
      <h2
        className="text-2xl font-semibold mb-4"
        style={{ color: '#4B3F39' /* brown */ }}
      >
        Upload Your Design
      </h2>
      <form onSubmit={handleUpload} className="space-y-4">
        <input
          type="text"
          placeholder="Design Name"
          value={designName}
          onChange={(e) => setDesignName(e.target.value)}
          className="w-full p-2 rounded"
          required
          style={{
            border: '1.5px solid #E3BDAA', // peach border
            backgroundColor: '#F5E4DA', // beige background
            color: '#333333', // charcoal text
          }}
        />
        <input
          type="text"
          placeholder="Category (optional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 rounded"
          style={{
            border: '1.5px solid #E3BDAA', // peach border
            backgroundColor: '#F5E4DA', // beige background
            color: '#333333', // charcoal text
          }}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 rounded"
          rows="4"
          required
          style={{
            border: '1.5px solid #E3BDAA', // peach border
            backgroundColor: '#F5E4DA', // beige background
            color: '#333333', // charcoal text
          }}
        ></textarea>

        {/* Drag & Drop Zone */}
        <div
          className="border-2 border-dashed rounded p-6 text-center cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current.click()}
          style={{
            borderColor: '#C48E78', // rose border
            backgroundColor: '#FAF8F7', // offwhite background
            color: '#4B3F39', // brown text
          }}
        >
          {previews.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-4">
              {previews.map((src, index) => (
                <div key={index} className="relative">
                  <img
                    src={src}
                    alt={`preview-${index}`}
                    className="h-32 w-32 object-contain rounded"
                    style={{ border: '1px solid #A96B54' /* copper border */ }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(index);
                    }}
                    className="absolute top-1 right-1 rounded-full px-2 text-xs hover:bg-red-800"
                    style={{
                      backgroundColor: '#C48E78', // rose button background
                      color: '#FAF8F7', // offwhite text
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#4B3F39' /* brown text */ }}>
              Click or drag and drop to upload images (JPEG/PNG)
            </p>
          )}
          <input
            type="file"
            multiple
            hidden
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/jpeg,image/png"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 rounded text-white"
          disabled={loading}
          style={{
            backgroundColor: loading ? '#A96B54' : '#C48E78', // copper when loading, rose normally
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  );
}

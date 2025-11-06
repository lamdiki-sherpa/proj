import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const Portfolio = () => {
  const { id } = useParams();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDesign = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`/api/portfolio/${id}`);
        setDesign(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Failed to fetch portfolio. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDesign();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 text-center text-xl font-semibold">
        Loading portfolio...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-3xl font-extrabold mb-6 text-red-600">{error}</h2>
        <Link
          to="/explore"
          className="inline-block px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-3xl font-extrabold mb-6 text-red-600">Portfolio Not Found</h2>
        <Link
          to="/explore"
          className="inline-block px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-50 via-white to-gray-100 py-12 px-6 sm:px-12 lg:px-24">
      {/* Header */}
      <header className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-6 mb-12">
        <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center shadow-lg overflow-hidden">
          <img
            src={design.image}
            alt={`${design.designer} logo`}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-5xl font-extrabold text-gray-900">{design.name}</h1>
          <p className="mt-1 text-indigo-600 text-lg font-medium">{design.designer}</p>
          <p className="mt-2 text-gray-700 text-sm sm:text-base">
            Category: <span className="font-semibold">{design.category}</span>
          </p>
        </div>
      </header>

      {/* Description */}
      <section className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md mb-12">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">About this Collection</h2>
        <p className="text-gray-700 leading-relaxed text-lg">{design.description}</p>
      </section>

      {/* Gallery */}
      <section className="max-w-6xl mx-auto">
        <h3 className="text-3xl font-semibold mb-8 text-gray-900 text-center">Gallery</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {design.gallery.map((img, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-lg shadow-lg cursor-pointer transform transition-transform hover:scale-105"
            >
              <img
                src={img}
                alt={`${design.name} image ${idx + 1}`}
                className="object-cover w-full h-64"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Back Button */}
      <div className="max-w-4xl mx-auto mt-16 text-center">
        <Link
          to="/explore"
          className="inline-block px-8 py-3 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 shadow-lg transition"
        >
          ← Back to Explore
        </Link>
      </div>
    </div>
  );
};

export default Portfolio;

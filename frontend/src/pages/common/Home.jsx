import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaTshirt,
  FaFire,
  FaTags,
  FaStar,
  FaMugHot,
  FaShoppingBag,
} from "react-icons/fa";
import { motion } from "framer-motion";

const Home = () => {
  const [topPosts, setTopPosts] = useState([]);
  const [popularCategories, setPopularCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const heroImages = [
    "/uploads/1.jpg",
    "/uploads/2.jpg",
    "/uploads/3.jpg",
    "/uploads/4.jpg",
  ];

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/posts/home-data`);
        setTopPosts(response.data?.topPosts || []);
        setPopularCategories(response.data?.popularCategories || []);
      } catch (err) {
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-xl font-semibold text-[#4B3F39]">
        Loading home data...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen text-xl font-semibold text-red-600">
        {error}
      </div>
    );

  const categoryIcons = {
    "T-Shirts": <FaTshirt className="text-3xl text-[#4B3F39]" />,
    "Hot Deals": <FaFire className="text-3xl text-[#A96B54]" />,
    "Discounts": <FaTags className="text-3xl text-[#C48E78]" />,
    "Top Rated": <FaStar className="text-3xl text-yellow-500" />,
    Mugs: <FaMugHot className="text-3xl text-[#A96B54]" />,
    Bags: <FaShoppingBag className="text-3xl text-[#4B3F39]" />,
  };

  return (
    <div className="bg-gradient-to-b from-[#FAF8F7] via-[#E3BDAA]/10 to-[#FAF8F7] min-h-screen font-sans text-[#4B3F39] overflow-hidden">

      {/* Hero Section */}
      <section className="relative h-[90vh] overflow-hidden">
        {heroImages.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Hero background ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000
              ${index === heroImageIndex ? "opacity-100" : "opacity-0"}`}
            style={{ willChange: "opacity" }}
            loading="lazy"
          />
        ))}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-white h-full px-6 text-center">
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Design Your Own Style
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            Create, customize, and shop stunning designs from creators across the world.
          </motion.p>
          <motion.div
            className="mt-6 flex gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button className="bg-[#C48E78] hover:bg-[#A96B54] text-white px-8 py-3 rounded-full font-semibold shadow-lg transition-transform transform hover:scale-105">
              Start Creating
            </button>
            <button className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-full font-semibold border border-white/30 shadow-md transition-transform transform hover:scale-105">
              Explore Marketplace
            </button>
          </motion.div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <motion.h2
          className="text-4xl font-bold text-center mb-12 text-[#4B3F39]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Popular Categories
        </motion.h2>
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {popularCategories.slice(0, 4).map((cat, i) => (
            <motion.div
              key={i}
              className="bg-[#FAF8F7] rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 hover:shadow-2xl"
              whileHover={{ scale: 1.08 }}
            >
              {categoryIcons[cat] || <FaTshirt className="text-3xl text-[#4B3F39]" />}
              <p className="mt-3 font-semibold text-[#4B3F39]">{cat}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Trending Designs */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <motion.h2
          className="text-4xl font-bold text-center mb-12 text-[#4B3F39]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Trending Designs
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
        >
          {topPosts.slice(0, 6).map((post) => (
            <motion.div
              key={post._id}
              className="bg-[#FAF8F7] rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-transform hover:-translate-y-1 hover:scale-105"
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0 },
              }}
            >
              {post.imageUrls?.[0] && (
                <img
                  src={post.imageUrls[0]}
                  alt={post.designName}
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 truncate">{post.designName}</h3>
                <p className="text-[#4B3F39]/80 text-sm line-clamp-3">{post.description}</p>
                <div className="flex items-center mt-4">
                  <img
                    src={post.userId?.profilePic || "/default-profile.png"}
                    alt={post.userId?.name || "User"}
                    className="w-10 h-10 rounded-full border border-[#C48E78]"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-[#C48E78]">
                      {post.userId?.name || "Unknown"}
                    </p>
                    <p className="text-[#4B3F39]/60 text-xs">
                      ❤️ {post.likes?.length || 0} Likes
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Styles */}
      <style>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Home;

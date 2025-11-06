// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-[#3D2C8D] text-white py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">

        {/* Branding */}
        <div className="w-full md:w-1/3">
          <h2 className="text-2xl font-bold mb-3">
            Design<span className="text-[#F97373]">ByYou</span>
          </h2>
          <p className="text-sm text-[#F9C784]">
            Elevating design collaborations. Connect. Create. Inspire.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="#" className="hover:text-[#F97373]"><FaFacebookF /></a>
            <a href="#" className="hover:text-[#F9C784]"><FaInstagram /></a>
            <a href="#" className="hover:text-[#7DD3B0]"><FaLinkedinIn /></a>
            <a href="#" className="hover:text-[#F97373]"><FaTwitter /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="w-full md:w-1/3">
          <h3 className="text-xl font-semibold mb-3 text-[#F9C784]">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-[#F97373]">Home</Link></li>
            <li><Link to="/user/profile" className="hover:text-[#F97373]">Profile</Link></li>
            <li><Link to="/designer/home" className="hover:text-[#F97373]">Designer</Link></li>
            <li><Link to="/contact" className="hover:text-[#F97373]">Contact</Link></li>
          </ul>
        </div>

        {/* Subscribe */}
        <div className="w-full md:w-1/3">
          <h3 className="text-xl font-semibold mb-3 text-[#F9C784]">Stay in the Loop</h3>
          <p className="text-sm text-[#F9C784] mb-3">
            Subscribe to our newsletter for updates and offers.
          </p>
          <form className="flex items-center border border-[#7DD3B0] rounded overflow-hidden">
            <input
              type="email"
              placeholder="Your email"
              className="bg-transparent px-3 py-2 text-sm w-full focus:outline-none text-white placeholder-[#F9C784]"
            />
            <button
              type="submit"
              className="bg-[#F97373] hover:bg-[#D95D5D] text-white px-4 py-2 text-sm"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="text-center text-[#F9C784] text-xs mt-10 border-t border-[#7DD3B0] pt-4">
        &copy; {new Date().getFullYear()} DesignByYou. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;

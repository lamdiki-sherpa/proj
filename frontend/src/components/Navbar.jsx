import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = ({ user, logout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  if (!user) return null; // Hide Navbar if not authenticated

  const roleBase = `/${user.role}`;

  return (
    <nav className="bg-[#3D2C8D] shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-[#F97373]">
          DESIGNBYYOU
        </Link>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={toggleMenu} aria-label="Toggle menu" className="text-white">
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex space-x-6 font-medium items-center">
          <li>
            <Link to={roleBase} className="text-white hover:text-[#F9C784] transition">
              Home
            </Link>
          </li>
          <li>
            <Link to={`${roleBase}/explore`} className="text-white hover:text-[#F9C784] transition">
              Explore
            </Link>
          </li>
          <li>
            <Link to={`${roleBase}/uploads`} className="text-white hover:text-[#F9C784] transition">
              Uploads
            </Link>
          </li>
        
          {user.role === "creator" && (
            <li>
              <Link to="/creator/bookings" className="text-white hover:text-[#F9C784] transition">
                Book Designer
              </Link>
            </li>
          )}
          <li>
            <Link
              to={`${roleBase}/profile`}
              className="text-white hover:text-[#F9C784] flex items-center gap-2 transition"
            >
              <img
                src={user.avatar || "/default-avatar.png"}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover border-2 border-[#F97373]"
              />
              Profile
            </Link>
          </li>
          <li>
            <button
              onClick={logout}
              className="bg-[#F97373] text-white px-3 py-1 rounded hover:bg-[#D95D5D] transition"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-[#3D2C8D] shadow-md px-4 pb-4 pt-2 space-y-3">
          <Link to={roleBase} onClick={toggleMenu} className="block text-white hover:text-[#F9C784]">
            Home
          </Link>
          <Link to={`${roleBase}/explore`} onClick={toggleMenu} className="block text-white hover:text-[#F9C784]">
            Explore
          </Link>
          <Link to={`${roleBase}/uploads`} onClick={toggleMenu} className="block text-white hover:text-[#F9C784]">
            Uploads
          </Link>
          {user.role === "creator" && (
            <Link to="/creator/bookings" onClick={toggleMenu} className="block text-white hover:text-[#F9C784]">
              Book Designer
            </Link>
          )}
          <Link to={`${roleBase}/profile`} onClick={toggleMenu} className="block text-white hover:text-[#F9C784]">
            Profile
          </Link>
          <button
            onClick={() => {
              logout();
              toggleMenu();
            }}
            className="block w-full text-left bg-[#F97373] text-white px-3 py-1 rounded hover:bg-[#D95D5D] transition"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

import React from "react";

const DesignerCard = ({ name, profilePic, postCount }) => {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-md text-center cursor-pointer hover:shadow-xl transition">
      <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border-4 border-indigo-500">
        {profilePic ? (
          <img
            src={profilePic}
            alt={`${name} profile`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-400">
            No Image
          </div>
        )}
      </div>
      <h3 className="text-xl font-semibold">{name}</h3>
      <p className="text-gray-600">{postCount} Designs</p>
    </div>
  );
};

export default DesignerCard;

import React from "react";

const CATEGORY_COLORS = {
  Casual: "bg-indigo-500 text-white",
  Formal: "bg-green-600 text-white",
  Party: "bg-pink-500 text-white",
  Sportswear: "bg-yellow-400 text-black",
  Traditional: "bg-red-500 text-white",
  Default: "bg-gray-300 text-gray-800",
};

const DesignCard = ({
  image,
  name,
  category,
  designerName,
  description,
  showDetails = false,
}) => {
  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.Default;

  return (
    <div
      tabIndex={0}
      aria-label={`${name} by ${designerName}, category: ${category}`}
      className="bg-white rounded-3xl shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105 focus:scale-105 focus:outline-none"
    >
      <div className="overflow-hidden h-56 rounded-t-3xl">
        {image ? (
          <img
            src={image}
            alt={`${name} design`}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-200 text-gray-400">
            No Image
          </div>
        )}
      </div>
      <div className="p-6">
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3 ${categoryColor}`}
        >
          {category || "Uncategorized"}
        </span>
        <h3 className="text-lg font-bold mb-1 truncate" title={name}>
          {name || "Untitled Design"}
        </h3>
        {designerName && (
          <p
            className="text-sm text-gray-600 mb-3 truncate"
            title={`Designed by ${designerName}`}
          >
            by <span className="font-medium">{designerName}</span>
          </p>
        )}
        {showDetails && description && (
          <p className="text-gray-700 text-sm line-clamp-3" title={description}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default DesignCard;

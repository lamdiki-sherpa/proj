import React, { useEffect, useState } from "react";
import axios from "axios";

// Simple skeleton loader for loading state
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-300 rounded ${className}`} />
);

const Profile = () => {
  const token = localStorage.getItem("token");
  const uid = localStorage.getItem("uid");

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("posts");

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    email: "",
    name: "",
    experience: "",
    portfolio: "",
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState("");
  const [password, setPassword] = useState("");

  // Fetch user profile and posts on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, postsRes, allPostsRes] = await Promise.all([
          axios.get(`/api/auth/profile/${uid}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`/api/mine`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`/api/posts/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        console.log("Profile data:", profileRes.data);
        console.log("Posts data:", postsRes.data);
        console.log("All posts data:", allPostsRes.data);

        const profileData = profileRes.data;
        setUser(profileData);
        setPosts(postsRes.data?.uploadedPosts || []);
        setShares(postsRes.data?.sharedPosts || []);

        const allPosts = allPostsRes.data?.posts || [];

        setLikes(allPosts.filter((p) => p.likes?.includes(uid)));
        setComments(allPosts.filter((p) => p.comments?.some((c) => c.userId === uid)));
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [uid, token]);

  // Open edit modal and prefill data
  const openEditModal = () => {
    setEditForm({
      email: user.email || "",
      name: user.name || "",
      experience: user.experience || "",
      portfolio: user.portfolio || "",
    });
    setProfilePicPreview(user.profilePic || "");
    setPassword("");
    setProfilePicFile(null);
    setEditModalOpen(true);
  };

  // Handle edit form input changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  // Submit profile updates
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("email", editForm.email);
      formData.append("name", editForm.name);
      if (user.role === "designer") {
        formData.append("experience", editForm.experience);
        formData.append("portfolio", editForm.portfolio);
      }
      if (profilePicFile) {
        formData.append("profilePic", profilePicFile);
      }
      if (password) {
        formData.append("password", password);
      }

      await axios.put("/api/auth/profile/update", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Refresh profile data
      const profileRes = await axios.get(`/api/auth/profile/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(profileRes.data);
      setEditModalOpen(false);
      setPassword("");
      setProfilePicFile(null);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update profile. Please try again.");
    }
  };

  if (loading)
    return (
      <div className="max-w-6xl mx-auto p-6 my-10">
        <Skeleton className="w-28 h-28 rounded-full mb-6 mx-auto" />
        <Skeleton className="h-8 w-72 mb-4 mx-auto rounded" />
        <Skeleton className="h-6 w-48 mb-4 mx-auto rounded" />
        <Skeleton className="h-6 w-56 mb-8 mx-auto rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="flex justify-center items-center h-screen text-red-500 text-lg">
        User not found.
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg my-10">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start space-x-0 md:space-x-8">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.profilePic ? (
            <img
              src={user.profilePic}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover shadow-lg"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold uppercase shadow-lg">
              {user.email?.[0] || "U"}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="mt-4 md:mt-0 flex-1">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{user.name || user.email}</h1>
            <button
              onClick={openEditModal}
              className="text-indigo-600 font-semibold border border-indigo-600 px-4 py-2 rounded hover:bg-indigo-600 hover:text-white transition"
            >
              Edit Profile
            </button>
          </div>

          <p className="text-indigo-600 font-semibold capitalize mt-1">{user.role}</p>
          <p className="mt-2 text-gray-700">
            Member since:{" "}
            {user.createdAt
              ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
              : "N/A"}
          </p>

          {/* Followers / Following */}
          <div className="flex space-x-6 mt-4">
            <div>
              <span className="font-semibold text-gray-800">Followers:</span>{" "}
              <span className="text-indigo-600">{user.followers?.length || 0}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-800">Following:</span>{" "}
              <span className="text-indigo-600">{user.following?.length || 0}</span>
            </div>
          </div>

          {/* Designer extra info */}
          {user.role === "designer" && (
            <div className="mt-6 space-y-4">
              <div>
                <span className="font-semibold text-gray-800">Experience:</span>{" "}
                <span className="text-gray-600">{user.experience}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-800">Portfolio:</span>{" "}
                <a
                  href={user.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-500 underline hover:text-indigo-700"
                >
                  View Portfolio
                </a>
              </div>

              {/* Designs Gallery */}
              <div>
                <h3 className="font-semibold text-gray-900 mt-6 mb-2">
                  Designs ({user.designs?.length || 0})
                </h3>
                {user.designs?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {user.designs.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Design ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-md shadow-md hover:scale-105 transition-transform duration-300 cursor-pointer"
                        loading="lazy"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No designs uploaded yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12 border-b border-gray-300">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: "posts", label: `Posts (${posts.length})` },
            { id: "likes", label: `Likes (${likes.length})` },
            { id: "comments", label: `Comments (${comments.length})` },
            { id: "shares", label: `Shares (${shares.length})` },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {(activeTab === "posts" || activeTab === "shares") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(activeTab === "posts" ? posts : shares).length > 0 ? (
              (activeTab === "posts" ? posts : shares).map((post) => (
                <PostCard key={post.postId} post={post} />
              ))
            ) : (
              <p className="text-gray-500">
                No {activeTab === "posts" ? "uploaded" : "shared"} posts yet.
              </p>
            )}
          </div>
        )}

        {activeTab === "likes" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {likes.length > 0 ? (
              likes.map((post) => <PostCard key={post.postId} post={post} />)
            ) : (
              <p className="text-gray-500">No liked posts yet.</p>
            )}
          </div>
        )}

        {activeTab === "comments" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comments.length > 0 ? (
              comments.map((post) => <PostCard key={post.postId} post={post} />)
            ) : (
              <p className="text-gray-500">No commented posts yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 relative shadow-lg max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              aria-label="Close modal"
            >
              &times;
            </button>

            <h2 className="text-2xl font-semibold mb-4">Edit Profile</h2>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Profile Picture */}
              <div>
                <label
                  className="block font-medium text-gray-700 mb-1"
                  htmlFor="profilePic"
                >
                  Profile Picture
                </label>
                <div className="mb-2">
                  {profilePicPreview ? (
                    <img
                      src={profilePicPreview}
                      alt="Profile Preview"
                      className="w-24 h-24 rounded-full object-cover border border-gray-300"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  id="profilePic"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  className="w-full"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  className="block font-medium text-gray-700 mb-1"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Name */}
              <div>
                <label
                  className="block font-medium text-gray-700 mb-1"
                  htmlFor="name"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Experience */}
              {user.role === "designer" && (
                <div>
                  <label
                    className="block font-medium text-gray-700 mb-1"
                    htmlFor="experience"
                  >
                    Experience
                  </label>
                  <input
                    id="experience"
                    name="experience"
                    type="text"
                    value={editForm.experience}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Portfolio */}
              {user.role === "designer" && (
                <div>
                  <label
                    className="block font-medium text-gray-700 mb-1"
                    htmlFor="portfolio"
                  >
                    Portfolio URL
                  </label>
                  <input
                    id="portfolio"
                    name="portfolio"
                    type="url"
                    value={editForm.portfolio}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <label
                  className="block font-medium text-gray-700 mb-1"
                  htmlFor="password"
                >
                  New Password (leave blank if no change)
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PostCard = ({ post }) => {
  const createdAt = post.createdAt
    ? new Date(post.createdAt.seconds * 1000).toLocaleDateString()
    : "Unknown";

  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow duration-300">
      <div className="mb-3">
        <h4 className="text-lg font-semibold text-gray-900">{post.designName}</h4>
        <p className="text-sm text-indigo-600 font-medium capitalize">{post.category}</p>
        <p className="text-gray-700 mt-2 line-clamp-3">{post.description}</p>
      </div>
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt={post.designName}
          className="w-full max-h-48 object-cover rounded-md mt-2"
          loading="lazy"
        />
      )}
      <div className="mt-3 text-sm text-gray-500">Posted on: {createdAt}</div>
    </div>
  );
};

export default Profile;

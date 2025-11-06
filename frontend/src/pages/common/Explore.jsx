import React, { useEffect, useState, useCallback } from 'react';
import { FaThumbsUp, FaShareAlt, FaRegComment, FaEllipsisH } from 'react-icons/fa';
import { motion } from 'framer-motion';

const PAGE_SIZE = 10;

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showShareModal, setShowShareModal] = useState({});
  const [shareMessage, setShareMessage] = useState({});
  const [commentText, setCommentText] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [showComments, setShowComments] = useState({});
  const token = localStorage.getItem('token');

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      
      const res = await fetch(`http://localhost:5000/api/posts/explore`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch posts');

      setPosts(data.posts);
      setHasMore(false); // Backend returns fixed 50 posts
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Load comments for a post
  const loadComments = async postId => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setCommentsData(prev => ({ ...prev, [postId]: data.comments }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // Toggle comments visibility
  const toggleShowComments = postId => {
    setShowComments(prev => {
      const newShow = { ...prev, [postId]: !prev[postId] };
      if (newShow[postId] && !commentsData[postId]) {
        loadComments(postId);
      }
      return newShow;
    });
  };

  // Share post function
  const sharePost = async postId => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: shareMessage[postId] || 'Check out this design!'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Update UI
      setPosts(prev => prev.map(post => 
        post._id === postId ? { 
          ...post, 
          sharesCount: post.sharesCount + 1,
          isShared: true,
          sharedBy: { name: data.sharedPost.userName }
        } : post
      ));

      setShowShareModal(prev => ({ ...prev, [postId]: false }));
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  // Like toggle
  const toggleLike = async postId => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setPosts(prev => prev.map(p => 
        p._id === postId ? { 
          ...p, 
          likesCount: data.likesCount, 
          hasLiked: !p.hasLiked 
        } : p
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  // Add reaction
  const addReaction = async (postId, reactionType) => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reactionType })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setPosts(prev => prev.map(p => 
        p._id === postId ? { 
          ...p, 
          reactions: data.reactions,
          likesCount: data.likesCount
        } : p
      ));
    } catch (error) {
      console.error('Error reacting to post:', error);
    }
  };

  // Add comment
  const addComment = async (postId, text) => {
    if (!text.trim()) return;

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment: text })
      });

      const data = await res.json();
      if (res.ok && data.comment) {
        // Update UI
        setCommentsData(prev => ({
          ...prev,
          [postId]: [data.comment, ...(prev[postId] || [])]
        }));

        setCommentText(prev => ({ ...prev, [postId]: '' }));

        setPosts(prev => prev.map(post => 
          post._id === postId ? { 
            ...post, 
            commentsCount: post.commentsCount + 1 
          } : post
        ));
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  if (loading) return (
    <div className='flex justify-center items-center h-screen text-xl font-semibold text-gray-800 bg-white'>
      <div className='animate-pulse'>Loading explore feed...</div>
    </div>
  );

  return (
    <div className='flex min-h-screen bg-gray-50 text-gray-900'>
      {/* Sidebar */}
      <aside className='w-72 bg-white shadow-md sticky top-0 h-screen p-5 pt-10 overflow-y-auto flex flex-col space-y-4'>
        <h2 className='text-2xl font-bold mb-4 text-indigo-700'>
          Filters & Sort
        </h2>

        {/* Search */}
        <div>
          <label htmlFor='search' className='block mb-1 font-semibold text-gray-700'>
            Search Designs
          </label>
          <input
            id='search'
            type='search'
            placeholder='Search designs...'
            className='w-full px-3 py-2 border border-gray-300 rounded placeholder-gray-400 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500'
          />
        </div>

        {/* Sort by */}
        <div>
          <label htmlFor='sort' className='block mb-1 font-semibold text-gray-700'>
            Sort By
          </label>
          <select
            id='sort'
            className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500'
          >
            <option value='recent'>Most Recent</option>
            <option value='liked'>Most Liked</option>
            <option value='trending'>Trending</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <p className='mb-2 font-semibold text-gray-700'>Categories</p>
          <div className='flex flex-col space-y-1 max-h-48 overflow-y-auto'>
            {['Fashion', 'Art', 'Technology', 'Photography', 'Design'].map(cat => (
              <label key={cat} className='inline-flex items-center space-x-2 cursor-pointer text-gray-600'>
                <input
                  type='checkbox'
                  className='form-checkbox text-indigo-600'
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Apply filters button */}
        <button className='mt-auto bg-indigo-600 text-white rounded py-2 font-semibold hover:bg-indigo-700 transition'>
          Apply Filters
        </button>
      </aside>

      {/* Main Content */}
      <main className='flex-1 p-4 md:p-6 pt-10 max-w-2xl mx-auto w-full'>
        <h1 className='text-2xl md:text-3xl font-bold mb-6 text-indigo-700 px-4'>
          Explore Feed
        </h1>

        {posts.length === 0 ? (
          <div className='bg-white rounded-xl p-8 text-center shadow-sm'>
            <p className='text-gray-600 font-medium'>
              No posts found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className='space-y-6'>
            {posts.map(post => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='bg-white rounded-xl shadow-sm overflow-hidden'
              >
                {/* Post Header */}
                <div className='flex items-center justify-between p-4 border-b'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg'>
                      {post.userName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className='font-semibold text-gray-900'>
                        {post.userName || 'Unknown User'}
                      </h3>
                      <div className='flex items-center space-x-2'>
                        <span className='text-xs text-gray-500'>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <span className='text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full'>
                          {post.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className='text-gray-400 hover:text-gray-600'>
                    <FaEllipsisH />
                  </button>
                </div>

                {/* Post Content */}
                <div className='p-4'>
                  {/* Shared post indicator */}
                  {post.isShared && post.sharedBy && (
                    <div className='mb-3 text-sm text-gray-500 flex items-center'>
                      <FaShareAlt className='mr-1' />
                      <span>Shared by {post.sharedBy.name}</span>
                    </div>
                  )}

                  <h2 className='text-xl font-bold text-gray-900 mb-2'>
                    {post.designName}
                  </h2>
                  <p className='mb-4 text-gray-700 whitespace-pre-wrap'>
                    {post.description}
                  </p>

                  {/* Images Gallery */}
                  {post.imageUrls?.length > 0 && (
                    <div className={`grid gap-2 mb-4 ${post.imageUrls.length === 1 ? '' : 'grid-cols-2'}`}>
                      {post.imageUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className={`${post.imageUrls.length === 1 ? 'h-96' : 'h-48 sm:h-64'} overflow-hidden rounded-lg`}
                        >
                          <img
                            src={url}
                            alt={`Design ${idx + 1}`}
                            className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats Bar */}
                <div className='px-4 py-2 border-t border-b border-gray-100 text-sm text-gray-500 flex justify-between'>
                  <div className='flex items-center space-x-2'>
                    <div className='flex -space-x-1'>
                      <div className='w-5 h-5 rounded-full bg-indigo-500 border border-white'></div>
                      <div className='w-5 h-5 rounded-full bg-red-500 border border-white'></div>
                      <div className='w-5 h-5 rounded-full bg-yellow-500 border border-white'></div>
                    </div>
                    <span>
                      {post.likesCount} likes • {post.commentsCount || 0} comments • {post.sharesCount || 0} shares
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='grid grid-cols-3 py-1 text-center text-gray-600'>
                  <button
                    onClick={() => toggleLike(post._id)}
                    className={`py-3 flex items-center justify-center space-x-2 transition-colors ${
                      post.hasLiked ? 'text-indigo-600' : 'hover:text-indigo-600'
                    }`}
                  >
                    <FaThumbsUp className='text-lg' />
                    <span>Like</span>
                  </button>
                  <button
                    onClick={() => toggleShowComments(post._id)}
                    className='py-3 flex items-center justify-center space-x-2 hover:text-indigo-600 transition-colors'
                  >
                    <FaRegComment className='text-lg' />
                    <span>Comment</span>
                  </button>
                  <button
                    onClick={() => setShowShareModal(prev => ({ ...prev, [post._id]: true }))}
                    className='py-3 flex items-center justify-center space-x-2 hover:text-indigo-600 transition-colors'
                  >
                    <FaShareAlt className='text-lg' />
                    <span>Share</span>
                  </button>
                </div>

                {/* Share Modal */}
                {showShareModal[post._id] && (
                  <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg p-6 w-full max-w-md'>
                      <h3 className='text-xl font-semibold mb-4'>
                        Share this post
                      </h3>
                      <textarea
                        placeholder='Add a message (optional)'
                        className='w-full p-3 border border-gray-300 rounded mb-4'
                        rows='3'
                        value={shareMessage[post._id] || ''}
                        onChange={e => setShareMessage(prev => ({
                          ...prev,
                          [post._id]: e.target.value
                        }))}
                      ></textarea>
                      <div className='flex justify-end space-x-3'>
                        <button
                          onClick={() => setShowShareModal(prev => ({ ...prev, [post._id]: false }))}
                          className='px-4 py-2 border border-gray-300 rounded hover:bg-gray-100'
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => sharePost(post._id)}
                          className='px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700'
                        >
                          Share Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                {showComments[post._id] && (
                  <div className='border-t border-gray-100 p-4 bg-gray-50'>
                    <div className='max-h-64 overflow-y-auto mb-4 space-y-4'>
                      {(commentsData[post._id]?.length || 0) === 0 && (
                        <p className='text-gray-500 italic text-center py-4'>
                          No comments yet. Be the first to comment!
                        </p>
                      )}

                      {commentsData[post._id]?.map(comment => (
                        <div key={comment._id} className='flex space-x-3'>
                          <div className='flex-shrink-0'>
                            {comment.userProfilePic ? (
                              <img
                                src={comment.userProfilePic}
                                alt={comment.userName}
                                className='w-8 h-8 rounded-full object-cover'
                              />
                            ) : (
                              <div className='w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-sm font-medium text-indigo-800'>
                                {comment.userName?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className='flex-1'>
                            <div className='bg-white rounded-xl p-3 shadow-sm'>
                              <div className='flex justify-between'>
                                <span className='font-medium text-sm'>
                                  {comment.userName}
                                </span>
                                <span className='text-xs text-gray-400'>
                                  {new Date(comment.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className='text-gray-700 mt-1 text-sm'>
                                {comment.comment}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className='flex space-x-2'>
                      <div className='flex-1 bg-white rounded-full border border-gray-200'>
                        <input
                          type='text'
                          placeholder='Write a comment...'
                          value={commentText[post._id] || ''}
                          onChange={e => setCommentText(prev => ({
                            ...prev,
                            [post._id]: e.target.value
                          }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              addComment(post._id, commentText[post._id]);
                            }
                          }}
                          className='w-full px-4 py-2 text-sm bg-transparent focus:outline-none rounded-full'
                        />
                      </div>
                      <button
                        onClick={() => addComment(post._id, commentText[post._id])}
                        className='w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-5 w-5'
                          viewBox='0 0 20 20'
                          fill='currentColor'
                        >
                          <path
                            fillRule='evenodd'
                            d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Load More button */}
            <div className='py-6'>
              {hasMore ? (
                <div className='flex justify-center'>
                  <button
                    onClick={() => {}}
                    className='px-6 py-3 bg-white text-indigo-600 rounded-full font-medium shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-indigo-300 min-w-[150px]'
                  >
                    Load More
                  </button>
                </div>
              ) : (
                <p className='text-center text-gray-500 font-medium'>
                  You've reached the end of the feed
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
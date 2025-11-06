const User = require('../models/User');
const Post = require('../models/Post');

// 1. Get all users (designers + creators, exclude superadmins if needed)
exports.getAllUsers = async (req, res) => {
  try {
    // Fetch designers and creators only
    const users = await User.find({ role: { $in: ['designer', 'creator'] } });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error getting users', error: error.message });
  }
};

// 2. Get all designers
exports.getAllDesigners = async (req, res) => {
  try {
    const designers = await User.find({ role: 'designer' });
    res.status(200).json(designers);
  } catch (error) {
    res.status(500).json({ message: 'Error getting designers', error: error.message });
  }
};

// 3. Delete a user by ID
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// 4. Change user role
exports.changeUserRole = async (req, res) => {
  const { id } = req.params;
  const { newRole } = req.body;

  if (!['designer', 'creator', 'superadmin'].includes(newRole)) {
    return res.status(400).json({ message: 'Invalid role specified' });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = newRole;
    await user.save();

    res.status(200).json({ message: `User role updated to ${newRole}.` });
  } catch (error) {
    res.status(500).json({ message: 'Error updating role', error: error.message });
  }
};

// 5. Suspend user (sets suspended: true)
exports.suspendUser = async (req, res) => {
  const { id } = req.params;
  try {
    await User.findByIdAndUpdate(id, { suspended: true });
    res.status(200).json({ message: 'User suspended successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error suspending user', error: error.message });
  }
};

// 6. Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $in: ['designer', 'creator'] } });
    const totalDesigners = await User.countDocuments({ role: 'designer' });
    const totalCreators = await User.countDocuments({ role: 'creator' });
    const totalPosts = await Post.countDocuments();

    res.status(200).json({ totalUsers, totalDesigners, totalCreators, totalPosts });
  } catch (error) {
    res.status(500).json({ message: 'Error getting dashboard stats', error: error.message });
  }
};

// 7. Get latest posts
exports.getLatestPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(10);
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching latest posts', error: error.message });
  }
};

// 8. Engagement stats (likes and comments)
exports.getEngagementStats = async (req, res) => {
  try {
    const posts = await Post.find();

    let totalLikes = 0;
    let totalComments = 0;

    posts.forEach(post => {
      totalLikes += post.likesCount || 0;
      totalComments += post.commentsCount || 0;
    });

    res.status(200).json({ totalLikes, totalComments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching engagement stats', error: error.message });
  }
};

// 9. Weekly analysis (posts last 7 days)
exports.getWeeklyAnalysis = async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const count = await Post.countDocuments({ createdAt: { $gte: oneWeekAgo } });
    res.status(200).json({ weeklyPosts: count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching weekly data', error: error.message });
  }
};

// 10. Daily posts count (last 7 days)
exports.getDailyPostsCount = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const posts = await Post.find({ createdAt: { $gte: sevenDaysAgo } });

    const counts = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      counts[key] = 0;
    }

    posts.forEach(post => {
      const key = post.createdAt.toISOString().slice(0, 10);
      if (counts[key] !== undefined) counts[key]++;
    });

    const dailyCounts = Object.entries(counts).map(([date, count]) => ({ date, count }));
    res.status(200).json(dailyCounts);
  } catch (error) {
    res.status(500).json({ message: 'Error getting daily posts count', error: error.message });
  }
};

// 11. Daily analysis (posts last 24 hours)
exports.getDailyAnalysis = async (req, res) => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const count = await Post.countDocuments({ createdAt: { $gte: oneDayAgo } });
    res.status(200).json({ dailyPosts: count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching daily data', error: error.message });
  }
};

// 12. Weekly posts count (last 4 weeks)
const getWeekNumber = (date) => {
  const temp = new Date(date.getTime());
  temp.setHours(0, 0, 0, 0);
  temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
  const week1 = new Date(temp.getFullYear(), 0, 4);
  return 1 + Math.round(((temp - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

exports.getWeeklyPostsCount = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fourWeeksAgo = new Date(today);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 27);

    const posts = await Post.find({ createdAt: { $gte: fourWeeksAgo } });

    const counts = {};
    for (let i = 0; i < 4; i++) {
      const date = new Date(fourWeeksAgo);
      date.setDate(date.getDate() + i * 7);
      const key = `${date.getFullYear()}-W${getWeekNumber(date).toString().padStart(2, '0')}`;
      counts[key] = 0;
    }

    posts.forEach(post => {
      const d = post.createdAt;
      const key = `${d.getFullYear()}-W${getWeekNumber(d).toString().padStart(2, '0')}`;
      if (counts[key] !== undefined) counts[key]++;
    });

    const weeklyCounts = Object.entries(counts).map(([week, count]) => ({ week, count }));
    res.status(200).json(weeklyCounts);
  } catch (error) {
    res.status(500).json({ message: 'Error getting weekly posts count', error: error.message });
  }
};

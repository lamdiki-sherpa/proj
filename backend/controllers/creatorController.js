// controllers/creatorController.js
import createError from 'http-errors';
import { User } from '../models/User.js';

export const listDesigners = async (req, res, next) => {
  try {
    const { q, skill, minRating, location, sort = 'top', page = 1, limit = 12 } = req.query;
    const filter = { role: 'designer', suspended: { $ne: true } };

    if (q) filter.name = { $regex: q, $options: 'i' };
    if (skill) filter.skills = { $in: skill.split(',').map(s => s.trim()) };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minRating) filter.rating = { $gte: Number(minRating) };

    let sortObj = {};
    if (sort === 'top') sortObj = { rating: -1, createdAt: -1 };
    else if (sort === 'new') sortObj = { createdAt: -1 };
    else if (sort === 'popular') sortObj = { rating: -1 }; // plug in your own metric

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      User.find(filter)
        .select('name profilePic rating skills location portfolio experience designs availability')
        .sort(sortObj).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

export const getDesignerProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const designer = await User.findOne({ _id: id, role: 'designer' })
      .select('-password -bookmarks -suspended');
    if (!designer) return next(createError(404, 'Designer not found'));
    res.json(designer);
  } catch (err) {
    next(err);
  }
};

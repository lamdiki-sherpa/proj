import { User } from '../models/User.js';

/**
 * List designers with optional search/filter
 * Query params:
 *  - q: search by name
 *  - skill
 *  - minRating
 *  - location
 *  - sort: top (rating desc) | new (createdAt desc)
 */
export const listDesigners = async (req, res) => {
  try {
    const { q, skill, minRating, location, sort = 'top' } = req.query;

    const filter = { role: 'designer', suspended: false };

    if (q) filter.name = { $regex: q, $options: 'i' };
    if (skill) filter.skills = skill;
    if (minRating) filter.rating = { $gte: Number(minRating) };
    if (location) filter.location = { $regex: location, $options: 'i' };

    const sortOption = sort === 'new' ? { createdAt: -1 } : { rating: -1 };

    const designers = await User.find(filter)
      .select('-password -bookmarks')
      .sort(sortOption)
      .limit(50);

    return res.json({ designers });
  } catch (err) {
    console.error('listDesigners error:', err);
    return res.status(500).json({ message: 'Failed to fetch designers' });
  }
};

// Get single designer profile
export const getDesignerProfile = async (req, res) => {
  try {
    const designer = await User.findById(req.params.id)
      .select('-password -bookmarks');

    if (!designer) return res.status(404).json({ message: 'Designer not found' });

    return res.json({ designer });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch designer profile' });
  }
};

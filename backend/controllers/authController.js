const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const User = require('../models/User');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2d' });

const deleteUploadedFiles = (files) => {
  if (!files || !files.length) return;

  files.forEach(file => {
    fs.unlink(file.path, err => {
      if (err) console.error('Error deleting file:', file.filename, err.message);
    });
  });
};

exports.getMe = async (req, res) => {
  try {
    const user = req.user.toObject();
    delete user.password;
    delete user.suspended;
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'creator', experience, portfolio } = req.body;
    const files = req.files; // req.files is an array when using upload.array('designs', 5)

    // Basic required fields
    if (!email || !password || !role) {
      deleteUploadedFiles(files);
      return res.status(400).json({ message: 'Email, password and role are required' });
    }

    if (password.length < 6) {
      deleteUploadedFiles(files);
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Designer-specific validation
    if (role === 'designer') {
      if (!experience || !portfolio) {
        deleteUploadedFiles(files);
        return res.status(400).json({ message: 'Designer must provide experience and portfolio' });
      }

      if (!files || files.length < 2) {
        deleteUploadedFiles(files);
        return res.status(400).json({ message: 'At least 2 design files are required' });
      }
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      deleteUploadedFiles(files);
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare design file URLs
    let designUrls = [];
    if (role === 'designer') {
      designUrls = files.map(file => `/uploads/${file.filename}`);
    }

    // Create and save user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      experience,
      portfolio,
      designs: designUrls,
    });

    await newUser.save();

    // Remove password before sending response
    const { password: _, ...userWithoutPassword } = newUser._doc;

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('Registration error:', error);
    deleteUploadedFiles(req.files);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};
// Updated login function


exports.login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Both email and password are required' });
  }

  try {
    const emailLower = String(email).toLowerCase().trim();

    // Password is select:false in the model; include explicitly
    const user = await User.findOne({ email: emailLower }).select('+password +suspended');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.suspended) {
      return res.status(403).json({ message: 'Account suspended. Contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ id: user._id, role: user.role });

    // remove sensitive fields
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.suspended;

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: userObj,
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.uid);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const uid = req.user.id;
    const { experience, portfolio, password, email, name, oldPassword } = req.body;
    const file = req.file;

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updateData = { updatedAt: new Date() };

    // Handle designer validation
    if (user.role === 'designer') {
      if (experience?.trim() === '') 
        return res.status(400).json({ message: 'Experience cannot be empty' });
      if (portfolio?.trim() === '') 
        return res.status(400).json({ message: 'Portfolio cannot be empty' });
      
      if (experience) updateData.experience = experience;
      if (portfolio) updateData.portfolio = portfolio;
    }

    // Handle password update
    if (password) {
      if (!oldPassword) 
        return res.status(400).json({ message: 'Old password is required' });
      
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) 
        return res.status(401).json({ message: 'Old password is incorrect' });
      
      if (password.length < 6) 
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Handle file uploads
    if (file) {
      // Delete old profile pic
      if (user.profilePic) {
        const oldPath = path.join(__dirname, '..', user.profilePic);
        fs.unlink(oldPath, err => err && console.error(err));
      }
      updateData.profilePic = `/uploads/${file.filename}`;
    }

    // Handle design updates
    if (req.files?.length) {
      user.designs.forEach(design => {
        const filePath = path.join(__dirname, '..', design);
        fs.unlink(filePath, err => err && console.error(err));
      });
      updateData.designs = req.files.map(f => `/uploads/${f.filename}`);
    }

    // Handle availability
    if (req.body.availability) {
      try {
        updateData.availability = JSON.parse(req.body.availability);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid availability format' });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(uid, updateData, { new: true })
                                 .select('-password');

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};



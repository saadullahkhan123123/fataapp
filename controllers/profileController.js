const User = require('../models/User');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    // authMiddleware provides req.user.id, protect provides req.user._id
    const userId = req.user._id || req.user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    const { name, email, username, phone, location } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    const updateData = {};
    
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone;
    if (location !== undefined) updateData.location = location.trim();

    // Check if email is being changed
    if (email && email !== user.email) {
      // Check if new email already exists
      const existingEmail = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: userId }
      });
      
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      
      updateData.email = email.toLowerCase();
      // If email changes, user needs to verify again
      updateData.isVerified = false;
    }

    // Check if username is being changed
    if (username && username !== user.username) {
      // Check if new username already exists
      const existingUsername = await User.findOne({ 
        username: username.trim(),
        _id: { $ne: userId }
      });
      
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      
      updateData.username = username.trim();
    }

    // Update user
    Object.assign(user, updateData);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile'
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/profile/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login with your new password.'
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error changing password'
    });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile/picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      // Handle both full paths and relative paths
      let oldImagePath;
      if (user.profilePicture.startsWith('/uploads/')) {
        oldImagePath = path.join(__dirname, '..', 'public', user.profilePicture);
      } else if (user.profilePicture.startsWith('uploads/')) {
        oldImagePath = path.join(__dirname, '..', 'public', user.profilePicture);
      } else {
        // Assume it's already a full path
        oldImagePath = path.join(__dirname, '..', 'public', 'uploads', 'profile-pictures', path.basename(user.profilePicture));
      }
      
      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
        } catch (err) {
          console.error('Error deleting old profile picture:', err);
        }
      }
    }

    // Save new profile picture path
    const imagePath = `/uploads/profile-pictures/${req.file.filename}`;
    user.profilePicture = imagePath;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: imagePath,
        fullUrl: `${req.protocol}://${req.get('host')}${imagePath}`
      }
    });
  } catch (error) {
    console.error('Upload Profile Picture Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading profile picture'
    });
  }
};

// @desc    Delete profile picture
// @route   DELETE /api/users/profile/picture
// @access  Private
exports.deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete file if exists
    if (user.profilePicture) {
      let imagePath;
      if (user.profilePicture.startsWith('/uploads/')) {
        imagePath = path.join(__dirname, '..', 'public', user.profilePicture);
      } else if (user.profilePicture.startsWith('uploads/')) {
        imagePath = path.join(__dirname, '..', 'public', user.profilePicture);
      } else {
        imagePath = path.join(__dirname, '..', 'public', 'uploads', 'profile-pictures', path.basename(user.profilePicture));
      }
      
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (err) {
          console.error('Error deleting profile picture:', err);
        }
      }
    }

    // Clear profile picture
    user.profilePicture = '';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully'
    });
  } catch (error) {
    console.error('Delete Profile Picture Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting profile picture'
    });
  }
};


import mongoose from 'mongoose';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { sendNotificationToUser } from '../socket/socketHandler.js';

// Pre-seeded users for suggestions when offline
const fallbackSuggestions = [
  {
    _id: '65f000000000000000000003',
    name: 'Khánh Linh',
    username: 'khanhlinh_wander',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    bio: 'Foodie & Travel Blogger. Tìm kiếm quán cà phê chill và biển xanh cát trắng 🏝️.',
    reason: 'Cùng từng check-in tại Phú Quốc'
  },
  {
    _id: '65f000000000000000000004',
    name: 'Minh Hoàng',
    username: 'hoang_backpacker',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    bio: 'Nhiếp ảnh gia nghiệp dư. Đam mê săn mây và cắm trại ngoài trời ⛺.',
    reason: 'Có 2 bạn chung'
  }
];

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
export const followUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự theo dõi chính mình' });
    }

    if (mongoose.connection.readyState === 1) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

      await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } });
      await User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } });

      sendNotificationToUser(targetUserId, {
        type: 'follow',
        sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar },
        message: `${req.user.name} đã bắt đầu theo dõi bạn`,
        createdAt: new Date()
      });
    }

    res.status(200).json({ success: true, message: 'Đã theo dõi người dùng', isFollowing: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow a user
// @route   POST /api/users/:id/unfollow
// @access  Private
export const unfollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (mongoose.connection.readyState === 1) {
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });
      await User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
    }

    res.status(200).json({ success: true, message: 'Đã hủy theo dõi người dùng', isFollowing: false });
  } catch (error) {
    next(error);
  }
};

// @desc    Lock / Unlock User account
// @route   PUT /api/users/:id/lock
// @access  Private (Admin Only)
export const toggleLockUser = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Không thể khóa tài khoản Admin' });

      user.isLocked = !user.isLocked;
      await user.save();
      return res.status(200).json({ success: true, message: user.isLocked ? `Đã khóa tài khoản` : `Đã mở khóa tài khoản`, isLocked: user.isLocked });
    }
    res.status(200).json({ success: true, message: 'Đã cập nhật trạng thái tài khoản', isLocked: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Get smart follow suggestions
// @route   GET /api/users/suggestions
// @access  Private
export const getSuggestedUsers = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ success: true, count: fallbackSuggestions.length, data: fallbackSuggestions });
    }

    const currentUserId = req.user._id;
    const followingIds = req.user.following || [];

    const myPosts = await Post.find({ author: currentUserId }).select('location');
    const myLocations = Array.from(new Set(myPosts.map((p) => p.location.trim().toLowerCase())));

    const candidateUsers = await User.find({
      _id: { $nin: [...followingIds, currentUserId] },
      isLocked: false
    }).select('name username avatar bio followers following').limit(20);

    const scoredUsers = await Promise.all(
      candidateUsers.map(async (candidate) => {
        const candidatePosts = await Post.find({ author: candidate._id }).select('location');
        const candidateLocations = candidatePosts.map((p) => p.location.trim().toLowerCase());

        let commonCount = 0;
        let matchedLocationName = '';
        for (const loc of candidateLocations) {
          if (myLocations.includes(loc)) {
            commonCount++;
            matchedLocationName = loc;
          }
        }

        const mutualFollowersCount = candidate.followers.filter((fId) =>
          followingIds.some((myFollowId) => myFollowId.toString() === fId.toString())
        ).length;

        let reason = 'Người dùng năng nổ';
        if (commonCount > 0) reason = `Cùng từng check-in tại ${matchedLocationName}`;
        else if (mutualFollowersCount > 0) reason = `Có ${mutualFollowersCount} bạn chung`;

        return {
          _id: candidate._id,
          name: candidate.name,
          username: candidate.username,
          avatar: candidate.avatar,
          bio: candidate.bio,
          postsCount: candidatePosts.length,
          followersCount: candidate.followers.length,
          reason,
          score: commonCount * 3 + mutualFollowersCount * 2 + candidate.followers.length
        };
      })
    );

    scoredUsers.sort((a, b) => b.score - a.score);
    res.status(200).json({ success: true, count: scoredUsers.length, data: scoredUsers.slice(0, 6) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/users/:id/profile
// @access  Public (Optional Auth)
export const getUserProfile = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        data: {
          _id: req.params.id,
          name: 'Hoàng Nam',
          username: 'hoangnam_traveler',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
          bio: 'Kẻ mê xê dịch, thích ngắm bình minh trên các cung đèo Tây Bắc 🌄.',
          postsCount: 3,
          followersCount: 15,
          followingCount: 8,
          isFollowing: false
        }
      });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    const postsCount = await Post.countDocuments({ author: user._id });
    const isFollowing = req.user
      ? user.followers.some((fId) => fId.toString() === req.user._id.toString())
      : false;

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        postsCount,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing
      }
    });
  } catch (error) {
    next(error);
  }
};

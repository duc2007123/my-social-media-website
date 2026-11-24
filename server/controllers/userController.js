import User from '../models/User.js';
import Post from '../models/Post.js';
import { sendNotificationToUser } from '../socket/socketHandler.js';

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

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng này' });
    }

    // Add to following of current user, and followers of target user
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: targetUserId }
    });

    await User.findByIdAndUpdate(targetUserId, {
      $addToSet: { followers: currentUserId }
    });

    // Send real-time notification via Socket.IO
    sendNotificationToUser(targetUserId, {
      type: 'follow',
      sender: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar
      },
      message: `${req.user.name} đã bắt đầu theo dõi bạn`,
      createdAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: `Đã theo dõi người dùng ${targetUser.name}`,
      isFollowing: true
    });
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

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: targetUserId }
    });

    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUserId }
    });

    res.status(200).json({
      success: true,
      message: 'Đã hủy theo dõi người dùng',
      isFollowing: false
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lock / Unlock User account (Admin only - Lead task)
// @route   PUT /api/users/:id/lock
// @access  Private (Admin Only)
export const toggleLockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Không thể khóa tài khoản Quản trị viên' });
    }

    user.isLocked = !user.isLocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isLocked ? `Đã khóa tài khoản ${user.username}` : `Đã mở khóa tài khoản ${user.username}`,
      isLocked: user.isLocked
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get smart follow suggestions based on common travel locations & mutuals
// @route   GET /api/users/suggestions
// @access  Private
export const getSuggestedUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const followingIds = req.user.following || [];

    // 1. Find locations current user has traveled to
    const myPosts = await Post.find({ author: currentUserId }).select('location');
    const myLocations = Array.from(new Set(myPosts.map((p) => p.location.trim().toLowerCase())));

    // 2. Query other users who are NOT current user and NOT already followed, and NOT locked
    const candidateUsers = await User.find({
      _id: { $nin: [...followingIds, currentUserId] },
      isLocked: false
    })
      .select('name username avatar bio followers following')
      .limit(20);

    // 3. Score each candidate based on common destinations or popularity
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

        // Mutual followers score
        const mutualFollowersCount = candidate.followers.filter((fId) =>
          followingIds.some((myFollowId) => myFollowId.toString() === fId.toString())
        ).length;

        let reason = 'Người dùng năng nổ';
        if (commonCount > 0) {
          reason = `Cùng từng check-in tại ${matchedLocationName}`;
        } else if (mutualFollowersCount > 0) {
          reason = `Có ${mutualFollowersCount} bạn chung`;
        } else if (candidate.followers.length > 0) {
          reason = `${candidate.followers.length} người theo dõi`;
        }

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

    // Sort by recommendation score descending
    scoredUsers.sort((a, b) => b.score - a.score);

    res.status(200).json({
      success: true,
      count: scoredUsers.length,
      data: scoredUsers.slice(0, 6)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile with posts
// @route   GET /api/users/:id/profile
// @access  Public (Optional Auth)
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

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

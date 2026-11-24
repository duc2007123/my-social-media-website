import Post from '../models/Post.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import { broadcastNewPost, broadcastPostLikeUpdate, sendNotificationToUser } from '../socket/socketHandler.js';

// Pre-defined city coordinates helper for Vietnam travel destinations
const cityCoordinatesMap = {
  'hà nội': { lat: 21.0285, lng: 105.8542 },
  'hà giang': { lat: 22.8233, lng: 104.9839 },
  'sapa': { lat: 22.3364, lng: 103.8438 },
  'lào cai': { lat: 22.4856, lng: 103.9707 },
  'hạ long': { lat: 20.9505, lng: 107.0734 },
  'quảng ninh': { lat: 21.0069, lng: 107.2925 },
  'ninh bình': { lat: 20.2506, lng: 105.9745 },
  'huế': { lat: 16.4637, lng: 107.5909 },
  'thừa thiên huế': { lat: 16.4637, lng: 107.5909 },
  'đà nẵng': { lat: 16.0544, lng: 108.2022 },
  'hội an': { lat: 15.8801, lng: 108.3380 },
  'quảng nam': { lat: 15.5394, lng: 108.0179 },
  'quy nhơn': { lat: 13.7820, lng: 109.2197 },
  'bình định': { lat: 14.1667, lng: 109.0000 },
  'nha trang': { lat: 12.2388, lng: 109.1967 },
  'khánh hòa': { lat: 12.2500, lng: 109.0000 },
  'đà lạt': { lat: 11.9404, lng: 108.4583 },
  'lâm đồng': { lat: 11.6500, lng: 108.1333 },
  'phú quốc': { lat: 10.2899, lng: 103.9840 },
  'kiên giang': { lat: 10.0133, lng: 105.0809 },
  'vũng tàu': { lat: 10.3460, lng: 107.0843 },
  'bà rịa vũng tàu': { lat: 10.5333, lng: 107.2500 },
  'hồ chí minh': { lat: 10.8231, lng: 106.6297 },
  'sài gòn': { lat: 10.8231, lng: 106.6297 },
  'cần thơ': { lat: 10.0452, lng: 105.7469 }
};

const resolveCoordinates = (locationName, inputCoords) => {
  if (inputCoords && inputCoords.lat && inputCoords.lng) {
    return inputCoords;
  }
  const cleanName = (locationName || '').toLowerCase().trim();
  for (const [key, coords] of Object.entries(cityCoordinatesMap)) {
    if (cleanName.includes(key)) {
      return coords;
    }
  }
  // Default coordinates in Vietnam
  return { lat: 16.0544, lng: 108.2022 };
};

// @desc    Get Feed Posts with server pagination & follower-only privacy filter
// @route   GET /api/posts
// @access  Public (Optional Auth)
export const getFeedPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6;
    const skip = (page - 1) * limit;

    const { search, location, hashtag, feedType, authorId } = req.query;
    const queryConditions = [];

    // Filter by author if requested (e.g. on profile page)
    if (authorId) {
      queryConditions.push({ author: authorId });
    }

    // Keyword Search
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      queryConditions.push({
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { location: searchRegex },
          { hashtags: { $in: [search.replace(/^#/, '').toLowerCase()] } }
        ]
      });
    }

    // Specific Location filter
    if (location) {
      queryConditions.push({ location: new RegExp(location, 'i') });
    }

    // Specific Hashtag filter
    if (hashtag) {
      queryConditions.push({ hashtags: hashtag.replace(/^#/, '').toLowerCase() });
    }

    // Privacy & Follower Filter (Requirement Topic 5)
    if (!req.user) {
      // Guest: only public posts
      queryConditions.push({ visibility: 'public' });
    } else {
      const currentUserId = req.user._id;
      const followingIds = req.user.following || [];

      if (feedType === 'following') {
        // Tab "Đang theo dõi": Only posts from followed users and user's own posts
        queryConditions.push({
          author: { $in: [...followingIds, currentUserId] }
        });
      }

      // Visibility permission logic:
      // Can view if public, OR author is yourself, OR visibility is followers and author is in your following list
      queryConditions.push({
        $or: [
          { visibility: 'public' },
          { author: currentUserId },
          {
            visibility: 'followers',
            author: { $in: followingIds }
          }
        ]
      });
    }

    const finalQuery = queryConditions.length > 0 ? { $and: queryConditions } : {};

    const totalPosts = await Post.countDocuments(finalQuery);
    const posts = await Post.find(finalQuery)
      .populate('author', 'name username avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Attach comments count for each post
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ post: post._id });
        const postObj = post.toObject();
        postObj.commentsCount = commentCount;
        postObj.isLiked = req.user ? post.likes.some((id) => id.toString() === req.user._id.toString()) : false;
        return postObj;
      })
    );

    res.status(200).json({
      success: true,
      count: postsWithCounts.length,
      total: totalPosts,
      page,
      pages: Math.ceil(totalPosts / limit),
      hasMore: skip + postsWithCounts.length < totalPosts,
      data: postsWithCounts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post details with strict follower-only access check
// @route   GET /api/posts/:id
// @access  Public (Optional Auth)
export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name username avatar role followers');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    // Strict Security Check:
    // If post is followers-only, verify viewer is author or following author
    if (post.visibility === 'followers') {
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: 'Bài viết này ở chế độ "Chỉ người theo dõi". Vui lòng đăng nhập và theo dõi tác giả để xem.'
        });
      }

      const isAuthor = post.author._id.toString() === req.user._id.toString();
      const isFollowing = post.author.followers.some((fId) => fId.toString() === req.user._id.toString());

      if (!isAuthor && !isFollowing && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Bạn chưa theo dõi tác giả của bài viết này.'
        });
      }
    }

    const commentCount = await Comment.countDocuments({ post: post._id });
    const postObj = post.toObject();
    postObj.commentsCount = commentCount;
    postObj.isLiked = req.user ? post.likes.some((id) => id.toString() === req.user._id.toString()) : false;

    res.status(200).json({ success: true, data: postObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new Travel Post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res, next) => {
  try {
    const { title, content, location, travelDate, cost, visibility, lat, lng } = req.body;

    if (!title || !content || !location) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ tiêu đề, nội dung và địa điểm' });
    }

    // Process images: from file upload or existing URLs
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => `/uploads/${file.filename}`);
    } else if (req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    if (images.length > 6) {
      return res.status(400).json({ success: false, message: 'Mỗi bài viết chỉ được đính kèm tối đa 6 ảnh' });
    }

    // Extract hashtags from content
    const hashtagRegex = /#([\p{L}\p{N}_]+)/gu;
    const matches = content.match(hashtagRegex) || [];
    const hashtags = Array.from(new Set(matches.map((h) => h.replace(/^#/, '').toLowerCase())));

    // Resolve coordinates for Leaflet map
    const coords = resolveCoordinates(location, { lat: parseFloat(lat), lng: parseFloat(lng) });

    const post = await Post.create({
      title,
      content,
      images,
      location,
      coordinates: coords,
      travelDate: travelDate || Date.now(),
      cost: cost ? parseFloat(cost) : 0,
      visibility: visibility || 'public',
      author: req.user._id,
      hashtags
    });

    const populatedPost = await Post.findById(post._id).populate('author', 'name username avatar role');

    // Broadcast new post in realtime via Socket.IO
    broadcastNewPost(populatedPost);

    res.status(201).json({
      success: true,
      message: 'Đăng bài viết nhật ký du lịch thành công',
      data: populatedPost
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    // Ownership or admin check
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa bài viết này' });
    }

    const { title, content, location, travelDate, cost, visibility, lat, lng } = req.body;

    if (title) post.title = title;
    if (content) {
      post.content = content;
      const hashtagRegex = /#([\p{L}\p{N}_]+)/gu;
      const matches = content.match(hashtagRegex) || [];
      post.hashtags = Array.from(new Set(matches.map((h) => h.replace(/^#/, '').toLowerCase())));
    }
    if (location) {
      post.location = location;
      post.coordinates = resolveCoordinates(location, { lat: parseFloat(lat), lng: parseFloat(lng) });
    }
    if (travelDate) post.travelDate = travelDate;
    if (cost !== undefined) post.cost = parseFloat(cost);
    if (visibility) post.visibility = visibility;

    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/${file.filename}`);
      const combined = [...post.images, ...newImages];
      if (combined.length > 6) {
        return res.status(400).json({ success: false, message: 'Tổng số ảnh không được vượt quá 6 ảnh' });
      }
      post.images = combined;
    }

    await post.save();
    const updatedPost = await Post.findById(post._id).populate('author', 'name username avatar role');

    res.status(200).json({ success: true, message: 'Cập nhật bài viết thành công', data: updatedPost });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    // Ownership or admin check
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bài viết này' });
    }

    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });

    res.status(200).json({ success: true, message: 'Đã xóa bài viết thành công' });
  } catch (error) {
    next(error);
  }
};

// @desc    Like / Unlike post with Anti-duplicate mechanism (Topic 5 requirement)
// @route   POST /api/posts/:id/like
// @access  Private
export const toggleLikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    const userId = req.user._id;
    const isLiked = post.likes.some((id) => id.toString() === userId.toString());

    if (isLiked) {
      // Unlike: remove userId
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      await post.save();

      broadcastPostLikeUpdate(post._id, post.likes.length, post.likes);

      return res.status(200).json({
        success: true,
        message: 'Đã bỏ thích bài viết',
        isLiked: false,
        likesCount: post.likes.length
      });
    } else {
      // Like: ensure anti-duplicate by checking again before push
      if (!post.likes.includes(userId)) {
        post.likes.push(userId);
        await post.save();

        // Send real-time notification to post author if not liking own post
        if (post.author.toString() !== userId.toString()) {
          sendNotificationToUser(post.author, {
            type: 'like',
            sender: {
              _id: req.user._id,
              name: req.user.name,
              avatar: req.user.avatar
            },
            post: {
              _id: post._id,
              title: post.title
            },
            message: `${req.user.name} đã thích bài viết của bạn: "${post.title}"`,
            createdAt: new Date()
          });
        }
      }

      broadcastPostLikeUpdate(post._id, post.likes.length, post.likes);

      return res.status(200).json({
        success: true,
        message: 'Đã thích bài viết',
        isLiked: true,
        likesCount: post.likes.length
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for post (supporting 1-level nesting)
// @route   GET /api/posts/:id/comments
// @access  Public
export const getPostComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'name username avatar')
      .sort({ createdAt: 1 });

    // Separate top-level comments (parentId: null) and replies (parentId: ID)
    const topLevelComments = [];
    const repliesMap = {};

    comments.forEach((c) => {
      const obj = c.toObject();
      if (!c.parentId) {
        obj.replies = [];
        topLevelComments.push(obj);
      } else {
        const pId = c.parentId.toString();
        if (!repliesMap[pId]) repliesMap[pId] = [];
        repliesMap[pId].push(obj);
      }
    });

    // Embed level 1 replies into their parents
    topLevelComments.forEach((parent) => {
      parent.replies = repliesMap[parent._id.toString()] || [];
    });

    res.status(200).json({ success: true, count: comments.length, data: topLevelComments });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment or 1-level reply to post
// @route   POST /api/posts/:id/comments
// @access  Private
export const addPostComment = async (req, res, next) => {
  try {
    const { content, parentId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung bình luận không được để trống' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    // Verify parent comment exists if this is a reply (max 1 level depth)
    let parentComment = null;
    if (parentId) {
      parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return res.status(404).json({ success: false, message: 'Bình luận gốc không tồn tại' });
      }
      // If the parent already has a parentId, attach reply to the root parent (keep strictly 1 level)
      if (parentComment.parentId) {
        return res.status(400).json({ success: false, message: 'Hệ thống chỉ hỗ trợ phản hồi 1 cấp' });
      }
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      content: content.trim(),
      parentId: parentId || null
    });

    const populatedComment = await Comment.findById(comment._id).populate('author', 'name username avatar');

    // Notify post author or parent comment author
    const targetUserId = parentComment ? parentComment.author : post.author;
    if (targetUserId.toString() !== req.user._id.toString()) {
      sendNotificationToUser(targetUserId, {
        type: 'comment',
        sender: {
          _id: req.user._id,
          name: req.user.name,
          avatar: req.user.avatar
        },
        post: {
          _id: post._id,
          title: post.title
        },
        message: `${req.user.name} đã bình luận về bài viết: "${post.title}"`,
        createdAt: new Date()
      });
    }

    res.status(201).json({ success: true, message: 'Đã gửi bình luận', data: populatedComment });
  } catch (error) {
    next(error);
  }
};

import mongoose from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import { broadcastNewPost, broadcastPostLikeUpdate, sendNotificationToUser } from '../socket/socketHandler.js';

// Pre-seeded posts for fallback offline mode if MongoDB Atlas is not yet connected
const fallbackPosts = [
  {
    _id: '65f000000000000000000101',
    title: 'Chinh phục Mã Pí Lèng - 3 ngày 2 đêm săn mây Hà Giang',
    content: 'Chuyến đi Hà Giang mùa tam giác mạch thật tuyệt vời! Đèo Mã Pí Lèng hùng vĩ với dòng sông Nho Quế xanh như ngọc bích. Đường cua tay áo khá dốc nhưng cảnh đẹp mê mẩn lòng người. #hagiang #mapileng #travel #vietnam',
    images: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80'
    ],
    location: 'Hà Giang',
    coordinates: { lat: 22.8233, lng: 104.9839 },
    travelDate: new Date('2026-10-15'),
    cost: 3200000,
    visibility: 'public',
    author: {
      _id: '65f000000000000000000002',
      name: 'Hoàng Nam',
      username: 'hoangnam_traveler',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      role: 'member'
    },
    likes: [],
    hashtags: ['hagiang', 'mapileng', 'travel', 'vietnam'],
    commentsCount: 2,
    createdAt: new Date('2026-10-15T08:00:00Z')
  },
  {
    _id: '65f000000000000000000102',
    title: 'Phú Quốc hoàng hôn bãi Sao - Biển xanh cát trắng',
    content: 'Hoàng hôn Phú Quốc chưa bao giờ làm mình thất vọng. Biển trong vắt nhìn thấy cả sao biển, chiều ngồi nghe acoustic ngắm mặt trời lặn thì tuyệt vời! #phuquoc #baisao #beach #sunset',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
    ],
    location: 'Phú Quốc',
    coordinates: { lat: 10.2899, lng: 103.9840 },
    travelDate: new Date('2026-09-20'),
    cost: 5800000,
    visibility: 'public',
    author: {
      _id: '65f000000000000000000003',
      name: 'Khánh Linh',
      username: 'khanhlinh_wander',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      role: 'member'
    },
    likes: [],
    hashtags: ['phuquoc', 'baisao', 'beach', 'sunset'],
    commentsCount: 1,
    createdAt: new Date('2026-09-20T10:00:00Z')
  },
  {
    _id: '65f000000000000000000103',
    title: 'Check-in cầu Rồng & Cù Lao Chàm - Đà Nẵng Hội An đáng sống',
    content: 'Đà Nẵng luôn đem lại cảm giác yên bình và văn minh. Tối xem Cầu Rồng phun lửa, ban ngày lặn ngắm san hô ở Cù Lao Chàm, tối ghé phố cổ Hội An thả đèn hoa đăng lung linh. #danang #hoian #culaocham',
    images: [
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80'
    ],
    location: 'Đà Nẵng',
    coordinates: { lat: 16.0544, lng: 108.2022 },
    travelDate: new Date('2026-08-10'),
    cost: 4100000,
    visibility: 'public',
    author: {
      _id: '65f000000000000000000004',
      name: 'Minh Hoàng',
      username: 'hoang_backpacker',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      role: 'member'
    },
    likes: [],
    hashtags: ['danang', 'hoian', 'culaocham'],
    commentsCount: 0,
    createdAt: new Date('2026-08-10T14:00:00Z')
  }
];

const cityCoordinatesMap = {
  'hà nội': { lat: 21.0285, lng: 105.8542 },
  'hà giang': { lat: 22.8233, lng: 104.9839 },
  'sapa': { lat: 22.3364, lng: 103.8438 },
  'lào cai': { lat: 22.4856, lng: 103.9707 },
  'hạ long': { lat: 20.9505, lng: 107.0734 },
  'quảng ninh': { lat: 21.0069, lng: 107.2925 },
  'ninh bình': { lat: 20.2506, lng: 105.9745 },
  'huế': { lat: 16.4637, lng: 107.5909 },
  'đà nẵng': { lat: 16.0544, lng: 108.2022 },
  'hội an': { lat: 15.8801, lng: 108.3380 },
  'quy nhơn': { lat: 13.7820, lng: 109.2197 },
  'nha trang': { lat: 12.2388, lng: 109.1967 },
  'đà lạt': { lat: 11.9404, lng: 108.4583 },
  'phú quốc': { lat: 10.2899, lng: 103.9840 },
  'vũng tàu': { lat: 10.3460, lng: 107.0843 },
  'hồ chí minh': { lat: 10.8231, lng: 106.6297 },
  'sài gòn': { lat: 10.8231, lng: 106.6297 },
  'cần thơ': { lat: 10.0452, lng: 105.7469 }
};

const resolveCoordinates = (locationName, inputCoords) => {
  if (inputCoords && inputCoords.lat && inputCoords.lng) return inputCoords;
  const cleanName = (locationName || '').toLowerCase().trim();
  for (const [key, coords] of Object.entries(cityCoordinatesMap)) {
    if (cleanName.includes(key)) return coords;
  }
  return { lat: 16.0544, lng: 108.2022 };
};

// @desc    Get Feed Posts with server pagination & follower-only privacy filter
// @route   GET /api/posts
// @access  Public (Optional Auth)
export const getFeedPosts = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      // Offline fallback with follower-only privacy filter
      let visibleFallback = fallbackPosts;
      if (!req.user) {
        visibleFallback = fallbackPosts.filter((p) => p.visibility === 'public');
      } else if (req.user.role !== 'admin') {
        const uId = req.user._id.toString();
        const following = (req.user.following || []).map((id) => id.toString());
        visibleFallback = fallbackPosts.filter((p) => {
          if (p.visibility === 'public') return true;
          const authorId = (p.author?._id || p.author).toString();
          return authorId === uId || following.includes(authorId);
        });
      }

      return res.status(200).json({
        success: true,
        count: visibleFallback.length,
        total: visibleFallback.length,
        page: 1,
        pages: 1,
        hasMore: false,
        data: visibleFallback
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6;
    const skip = (page - 1) * limit;

    const { search, location, hashtag, feedType, authorId } = req.query;
    const queryConditions = [];

    if (authorId) queryConditions.push({ author: authorId });

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

    if (location) queryConditions.push({ location: new RegExp(location, 'i') });
    if (hashtag) queryConditions.push({ hashtags: hashtag.replace(/^#/, '').toLowerCase() });

    // Privacy & Follower Filter (Topic 5 technical requirement)
    if (!req.user) {
      queryConditions.push({ visibility: 'public' });
    } else {
      const currentUserId = req.user._id;
      const followingIds = req.user.following || [];

      if (feedType === 'following') {
        queryConditions.push({
          author: { $in: [...followingIds, currentUserId] }
        });
      }

      queryConditions.push({
        $or: [
          { visibility: 'public' },
          { author: currentUserId },
          { visibility: 'followers', author: { $in: followingIds } }
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
    if (mongoose.connection.readyState !== 1) {
      const post = fallbackPosts.find((p) => p._id === req.params.id) || fallbackPosts[0];
      return res.status(200).json({ success: true, data: post });
    }

    const post = await Post.findById(req.params.id).populate('author', 'name username avatar role followers');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    // Strict Security Check:
    if (post.visibility === 'followers') {
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: 'Bài viết này ở chế độ "Chỉ người theo dõi". Vui lòng đăng nhập và theo dõi tác giả để xem.'
        });
      }

      const isAuthor = post.author._id.toString() === req.user._id.toString();
      const authorFollowers = post.author?.followers || [];
      const isFollowing = authorFollowers.some((fId) => (fId._id || fId).toString() === req.user._id.toString());

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

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => `/uploads/${file.filename}`);
    } else if (req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    if (images.length > 6) {
      return res.status(400).json({ success: false, message: 'Mỗi bài viết chỉ được đính kèm tối đa 6 ảnh' });
    }

    const hashtagRegex = /#([\p{L}\p{N}_]+)/gu;
    const matches = content.match(hashtagRegex) || [];
    const hashtags = Array.from(new Set(matches.map((h) => h.replace(/^#/, '').toLowerCase())));
    const coords = resolveCoordinates(location, { lat: parseFloat(lat), lng: parseFloat(lng) });

    if (mongoose.connection.readyState === 1) {
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
      broadcastNewPost(populatedPost);

      return res.status(201).json({
        success: true,
        message: 'Đăng bài viết nhật ký du lịch thành công',
        data: populatedPost
      });
    } else {
      // In-Memory post
      const newPost = {
        _id: new mongoose.Types.ObjectId().toString(),
        title,
        content,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80'],
        location,
        coordinates: coords,
        travelDate: travelDate || new Date(),
        cost: cost ? parseFloat(cost) : 0,
        visibility: visibility || 'public',
        author: {
          _id: req.user._id,
          name: req.user.name || 'Thành viên',
          username: req.user.username || 'user',
          avatar: req.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          role: req.user.role || 'member'
        },
        likes: [],
        hashtags,
        commentsCount: 0,
        createdAt: new Date()
      };
      fallbackPosts.unshift(newPost);
      broadcastNewPost(newPost);

      return res.status(201).json({
        success: true,
        message: 'Đăng bài viết nhật ký du lịch thành công (Chế độ offline)',
        data: newPost
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res, next) => {
  try {
    const { title, content, location, travelDate, cost, visibility, lat, lng } = req.body;
    let newImages = null;
    if (req.files && req.files.length > 0) {
      newImages = req.files.map((file) => `/uploads/${file.filename}`);
    } else if (req.body.images) {
      const parsedImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
      if (parsedImages.length <= 6) {
        newImages = parsedImages;
      }
    }

    let hashtags = null;
    if (content) {
      const hashtagRegex = /#([\p{L}\p{N}_]+)/gu;
      const matches = content.match(hashtagRegex) || [];
      hashtags = Array.from(new Set(matches.map((h) => h.replace(/^#/, '').toLowerCase())));
    }

    if (mongoose.connection.readyState !== 1) {
      const post = fallbackPosts.find((p) => p._id === req.params.id);
      if (post) {
        if (title) post.title = title;
        if (content) {
          post.content = content;
          post.hashtags = hashtags;
        }
        if (location) {
          post.location = location;
          post.coordinates = resolveCoordinates(location, { lat: parseFloat(lat), lng: parseFloat(lng) });
        }
        if (travelDate) post.travelDate = travelDate;
        if (cost !== undefined) post.cost = parseFloat(cost);
        if (visibility) post.visibility = visibility;
        if (newImages) post.images = newImages;

        return res.status(200).json({ success: true, message: 'Cập nhật bài viết thành công', data: post });
      }
      return res.status(200).json({ success: true, message: 'Cập nhật bài viết thành công' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa bài viết này' });
    }

    if (title) post.title = title;
    if (content) {
      post.content = content;
      post.hashtags = hashtags;
    }
    if (location) {
      post.location = location;
      post.coordinates = resolveCoordinates(location, { lat: parseFloat(lat), lng: parseFloat(lng) });
    }
    if (travelDate) post.travelDate = travelDate;
    if (cost !== undefined) post.cost = parseFloat(cost);
    if (visibility) post.visibility = visibility;
    if (newImages) post.images = newImages;

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
    if (mongoose.connection.readyState === 1) {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
      }

      if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bài viết này' });
      }

      await Post.findByIdAndDelete(req.params.id);
      await Comment.deleteMany({ post: req.params.id });
    } else {
      const index = fallbackPosts.findIndex((p) => p._id === req.params.id);
      if (index !== -1) {
        fallbackPosts.splice(index, 1);
      }
    }
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
    if (mongoose.connection.readyState !== 1) {
      // In-Memory Like toggle
      const post = fallbackPosts.find((p) => p._id === req.params.id);
      if (post) {
        const uId = req.user._id.toString();
        const hasLiked = post.likes.some((id) => id.toString() === uId);
        if (hasLiked) {
          post.likes = post.likes.filter((id) => id.toString() !== uId);
        } else {
          post.likes.push(uId);
        }
        broadcastPostLikeUpdate(post._id, post.likes.length, post.likes);
        return res.status(200).json({
          success: true,
          isLiked: !hasLiked,
          likesCount: post.likes.length
        });
      }
      return res.status(200).json({ success: true, isLiked: true, likesCount: 1 });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    const userId = req.user._id;
    const isLiked = post.likes.some((id) => id.toString() === userId.toString());

    if (isLiked) {
      // Atomic anti-duplicate unlike
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { $pull: { likes: userId } },
        { new: true }
      );
      broadcastPostLikeUpdate(updatedPost._id, updatedPost.likes.length, updatedPost.likes);

      return res.status(200).json({
        success: true,
        message: 'Đã bỏ thích bài viết',
        isLiked: false,
        likesCount: updatedPost.likes.length
      });
    } else {
      // Atomic anti-duplicate like via $addToSet
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { likes: userId } },
        { new: true }
      );

      if (post.author.toString() !== userId.toString()) {
        sendNotificationToUser(post.author, {
          type: 'like',
          sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar },
          post: { _id: post._id, title: post.title },
          message: `${req.user.name} đã thích bài viết của bạn`,
          createdAt: new Date()
        });
      }

      broadcastPostLikeUpdate(updatedPost._id, updatedPost.likes.length, updatedPost.likes);

      return res.status(200).json({
        success: true,
        message: 'Đã thích bài viết',
        isLiked: true,
        likesCount: updatedPost.likes.length
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for post
// @route   GET /api/posts/:id/comments
// @access  Public
export const getPostComments = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: 1,
        data: [
          {
            _id: '65f000000000000000000301',
            content: 'Chuyến đi đẹp quá bạn ơi! Có thể chia sẻ thêm lịch trình không ạ?',
            createdAt: new Date(),
            author: { name: 'Khánh Linh', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
            replies: [
              {
                _id: '65f000000000000000000302',
                content: 'Cảm ơn bạn nhé! Bạn có thể xem thêm ở bài viết chi tiết nhé.',
                createdAt: new Date(),
                author: { name: 'Hoàng Nam', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' }
              }
            ]
          }
        ]
      });
    }

    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'name username avatar')
      .sort({ createdAt: 1 });

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

    topLevelComments.forEach((parent) => {
      parent.replies = repliesMap[parent._id.toString()] || [];
    });

    res.status(200).json({ success: true, count: comments.length, data: topLevelComments });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
export const addPostComment = async (req, res, next) => {
  try {
    const { content, parentId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung bình luận không được để trống' });
    }

    if (mongoose.connection.readyState !== 1) {
      const mockComment = {
        _id: new mongoose.Types.ObjectId().toString(),
        content: content.trim(),
        parentId: parentId || null,
        author: {
          _id: req.user._id,
          name: req.user.name || 'Bạn',
          avatar: req.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
        },
        createdAt: new Date()
      };
      return res.status(201).json({ success: true, message: 'Đã gửi bình luận', data: mockComment });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    let parentComment = null;
    if (parentId) {
      parentComment = await Comment.findById(parentId);
      if (!parentComment) return res.status(404).json({ success: false, message: 'Bình luận gốc không tồn tại' });
      if (parentComment.parentId) return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ trả lời 1 cấp' });
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      content: content.trim(),
      parentId: parentId || null
    });

    const populatedComment = await Comment.findById(comment._id).populate('author', 'name username avatar');
    res.status(201).json({ success: true, message: 'Đã gửi bình luận', data: populatedComment });
  } catch (error) {
    next(error);
  }
};

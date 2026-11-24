import express from 'express';
import {
  getFeedPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLikePost,
  getPostComments,
  addPostComment
} from '../controllers/postController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { uploadPostImages } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Feed posts (public & followers logic) and Create post
router.route('/')
  .get(optionalAuth, getFeedPosts)
  .post(protect, uploadPostImages.array('images', 6), createPost);

// Single post operations
router.route('/:id')
  .get(optionalAuth, getPostById)
  .put(protect, uploadPostImages.array('images', 6), updatePost)
  .delete(protect, deletePost);

// Like/Unlike post with anti-duplicate
router.post('/:id/like', protect, toggleLikePost);

// Comments & 1-level replies for post
router.route('/:id/comments')
  .get(getPostComments)
  .post(protect, addPostComment);

export default router;

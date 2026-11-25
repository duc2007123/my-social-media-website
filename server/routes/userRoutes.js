import express from 'express';
import {
  followUser,
  unfollowUser,
  toggleLockUser,
  lockUser,
  unlockUser,
  getSuggestedUsers,
  getUserProfile
} from '../controllers/userController.js';
import { protect, optionalAuth, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Suggestions algorithm (Topic 5 advanced recommendation)
router.get('/suggestions', protect, getSuggestedUsers);

// User profile
router.get('/:id/profile', optionalAuth, getUserProfile);

// Follow / Unfollow APIs
router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);
router.delete('/:id/follow', protect, unfollowUser);

// Admin lock / unlock user account
router.put('/:id/lock', protect, adminOnly, toggleLockUser);
router.put('/:id/unlock', protect, adminOnly, unlockUser);
router.patch('/:id/lock', protect, adminOnly, toggleLockUser);
router.patch('/:id/unlock', protect, adminOnly, unlockUser);

export default router;

import mongoose from 'mongoose';
import Post from '../models/Post.js';

// Pre-calculated stats for instant display when MongoDB is offline
const fallbackLocationStats = [
  { location: 'Hà Giang', postCount: 5, totalLikes: 14, avgCost: 3200000, coordinates: { lat: 22.8233, lng: 104.9839 } },
  { location: 'Đà Nẵng', postCount: 4, totalLikes: 12, avgCost: 4100000, coordinates: { lat: 16.0544, lng: 108.2022 } },
  { location: 'Đà Lạt', postCount: 3, totalLikes: 9, avgCost: 2500000, coordinates: { lat: 11.9404, lng: 108.4583 } },
  { location: 'Phú Quốc', postCount: 3, totalLikes: 8, avgCost: 5800000, coordinates: { lat: 10.2899, lng: 103.9840 } },
  { location: 'Ninh Bình', postCount: 2, totalLikes: 6, avgCost: 1800000, coordinates: { lat: 20.2506, lng: 105.9745 } },
  { location: 'Sapa', postCount: 2, totalLikes: 5, avgCost: 2900000, coordinates: { lat: 22.3364, lng: 103.8438 } }
];

// @desc    Get top travel locations using MongoDB Aggregation Pipeline
// @route   GET /api/stats/top-locations
// @access  Public
export const getTopLocations = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: fallbackLocationStats.length,
        data: fallbackLocationStats.slice(0, limit)
      });
    }

    // MongoDB Aggregation Pipeline
    const stats = await Post.aggregate([
      {
        $match: {
          location: { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$location' } } },
          locationName: { $first: '$location' },
          postCount: { $sum: 1 },
          totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
          avgCost: { $avg: '$cost' },
          sampleCoordinates: { $first: '$coordinates' }
        }
      },
      {
        $sort: {
          postCount: -1,
          totalLikes: -1
        }
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 0,
          location: '$locationName',
          postCount: 1,
          totalLikes: 1,
          avgCost: { $round: ['$avgCost', 0] },
          coordinates: '$sampleCoordinates'
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: stats.length,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

import Post from '../models/Post.js';

// @desc    Get top travel locations using MongoDB Aggregation Pipeline
// @route   GET /api/stats/top-locations
// @access  Public
export const getTopLocations = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    // MongoDB Aggregation Pipeline
    const stats = await Post.aggregate([
      // Stage 1: Filter out posts without valid location
      {
        $match: {
          location: { $exists: true, $ne: '' }
        }
      },
      // Stage 2: Group by location and calculate metrics
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
      // Stage 3: Sort by postCount descending, then by totalLikes
      {
        $sort: {
          postCount: -1,
          totalLikes: -1
        }
      },
      // Stage 4: Limit to top N locations
      {
        $limit: limit
      },
      // Stage 5: Project friendly response format
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

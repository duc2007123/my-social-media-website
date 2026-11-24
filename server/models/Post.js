import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Vui lòng nhập tiêu đề chuyến đi'],
      trim: true,
      maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự']
    },
    content: {
      type: String,
      required: [true, 'Vui lòng nhập nội dung nhật ký chuyến đi']
    },
    images: {
      type: [String],
      validate: [
        function (val) {
          return val.length <= 6;
        },
        'Mỗi bài viết chỉ được đăng tối đa 6 ảnh'
      ],
      default: []
    },
    location: {
      type: String,
      required: [true, 'Vui lòng nhập địa điểm chuyến đi'],
      trim: true
    },
    coordinates: {
      lat: {
        type: Number,
        default: 16.0544 // Default coordinates around Vietnam central
      },
      lng: {
        type: Number,
        default: 108.2022
      }
    },
    travelDate: {
      type: Date,
      default: Date.now
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Chi phí không thể âm']
    },
    visibility: {
      type: String,
      enum: ['public', 'followers'],
      default: 'public'
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    hashtags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for comments count
postSchema.virtual('likesCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

// Indexing for search optimization
postSchema.index({ location: 'text', title: 'text', content: 'text', hashtags: 'text' });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;

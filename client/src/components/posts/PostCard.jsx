import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, DollarSign, Calendar, Lock, Globe, Trash2, Edit3, Share2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import CommentSection from '../comments/CommentSection';

export const PostCard = ({ post, onPostDeleted }) => {
  const { user, token, isAuthenticated } = useAuth();

  // Optimistic State for Like
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || (post.likes ? post.likes.length : 0));
  const [isLiking, setIsLiking] = useState(false);

  // Comments section toggle
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);

  // Image lightbox / active image index
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Format currency with useMemo for performance (Requirement: useMemo ở chỗ có lý do)
  const formattedCost = useMemo(() => {
    if (!post.cost) return null;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(post.cost);
  }, [post.cost]);

  // Format date
  const formattedDate = useMemo(() => {
    if (!post.travelDate) return null;
    return new Date(post.travelDate).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, [post.travelDate]);

  // Optimistic Update Like Handler (Requirement Topic 5)
  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để thích bài viết này');
      return;
    }
    if (isLiking) return;

    // Snapshot previous state for rollback
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;

    // 1. Optimistic Update immediately on UI
    setIsLiked(!previousIsLiked);
    setLikesCount(previousIsLiked ? previousLikesCount - 1 : previousLikesCount + 1);
    setIsLiking(true);

    try {
      // 2. Call backend API
      const res = await axios.post(
        `/api/posts/${post._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Synchronize with server response
      setIsLiked(res.data.isLiked);
      setLikesCount(res.data.likesCount);
    } catch (err) {
      // 3. Rollback on failure! (Requirement: "API lỗi thì hoàn tác")
      console.error('[Like Error] Rollback optimistic update:', err);
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      alert('Không thể cập nhật lượt thích. Đã hoàn tác.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    try {
      await axios.delete(`/api/posts/${post._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onPostDeleted) onPostDeleted(post._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa bài viết');
    }
  };

  const isAuthor = user && (user._id === post.author?._id || user._id === post.author);
  const isAdmin = user?.role === 'admin';

  return (
    <article className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden transition-all hover:shadow-md">
      {/* Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
        <Link to={`/profile/${post.author?._id}`} className="flex items-center gap-3 group">
          <img
            src={post.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt={post.author?.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20 group-hover:ring-emerald-500 transition-all"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                {post.author?.name || 'Thành viên'}
              </h2>
              {post.author?.role === 'admin' && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-md">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">@{post.author?.username || 'user'}</p>
          </div>
        </Link>

        {/* Visibility Badge & Actions */}
        <div className="flex items-center gap-2">
          {post.visibility === 'followers' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
              <Lock className="w-3 h-3" /> Chỉ người theo dõi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              <Globe className="w-3 h-3" /> Công khai
            </span>
          )}

          {(isAuthor || isAdmin) && (
            <Link
              to={`/edit-post/${post._id}`}
              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
              title="Chỉnh sửa bài viết"
              aria-label="Chỉnh sửa bài viết"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
          )}

          {(isAuthor || isAdmin) && (
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Xóa bài viết"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Image Banner / Carousel */}
      {post.images && post.images.length > 0 && (
        <div className="relative bg-slate-900 aspect-video sm:aspect-[16/10] overflow-hidden">
          <img
            src={post.images[activeImageIndex]}
            alt={post.title}
            className="w-full h-full object-cover"
          />

          {/* Dots Indicator for multiple images */}
          {post.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full">
              {post.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeImageIndex === idx ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}

          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-xs text-white text-[11px] px-2 py-1 rounded-md font-medium">
            {activeImageIndex + 1}/{post.images.length} ảnh
          </div>
        </div>
      )}

      {/* Body Content */}
      <div className="p-4 sm:p-5 space-y-3">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug hover:text-emerald-700 transition-colors">
          {post.title}
        </h3>

        {/* Travel Highlights Bar (Location, Date, Cost) */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            {post.location}
          </span>

          {formattedDate && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
          )}

          {formattedCost && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold">
              <DollarSign className="w-3.5 h-3.5" />
              {formattedCost}
            </span>
          )}
        </div>

        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
          {post.content}
        </p>

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.hashtags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer (Like, Comments, Share) */}
      <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-4">
          {/* Optimistic Like Button */}
          <button
            onClick={handleLikeToggle}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-all active:scale-95 ${
              isLiked ? 'text-rose-600' : 'text-slate-600 hover:text-rose-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{likesCount}</span>
          </button>

          {/* Comment toggle button */}
          <button
            onClick={() => setShowComments((prev) => !prev)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{commentsCount}</span>
          </button>
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.origin + `/posts/${post._id}`);
            alert('Đã sao chép liên kết bài viết!');
          }}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Chia sẻ liên kết"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* 1-Level Nested Comments Section */}
      {showComments && (
        <CommentSection
          postId={post._id}
          onCommentAdded={() => setCommentsCount((c) => c + 1)}
        />
      )}
    </article>
  );
};

export default PostCard;

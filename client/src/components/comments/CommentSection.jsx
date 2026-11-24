import { useState, useEffect } from 'react';
import { Send, CornerDownRight, Reply, MessageSquare, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export const CommentSection = ({ postId, onCommentAdded }) => {
  const { user, token, isAuthenticated } = useAuth();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Top-level comment input
  const [newCommentText, setNewCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Active reply target: parentId currently being replied to
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Fetch comments
  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/posts/${postId}/comments`);
      setComments(res.data.data || []);
    } catch (err) {
      setError('Không thể tải bình luận');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Submit top-level comment (parentId: null)
  const handleTopLevelSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để bình luận');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(
        `/api/posts/${postId}/comments`,
        { content: newCommentText.trim(), parentId: null },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const added = { ...res.data.data, replies: [] };
      setComments((prev) => [added, ...prev]);
      setNewCommentText('');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gửi bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit 1-level reply (parentId: targetCommentId)
  const handleReplySubmit = async (parentId) => {
    if (!replyText.trim()) return;
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để phản hồi');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(
        `/api/posts/${postId}/comments`,
        { content: replyText.trim(), parentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newReply = res.data.data;
      // Append reply to the matching parent comment
      setComments((prev) =>
        prev.map((c) => {
          if (c._id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newReply]
            };
          }
          return c;
        })
      );

      setReplyingToId(null);
      setReplyText('');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi gửi phản hồi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-4">
      {/* Input box for new comment */}
      {isAuthenticated ? (
        <form onSubmit={handleTopLevelSubmit} className="flex gap-2">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt={user?.name}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Chia sẻ cảm nghĩ về chuyến đi này..."
              className="w-full pl-3 pr-10 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all"
            />
            <button
              type="submit"
              disabled={submitting || !newCommentText.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-emerald-600 hover:text-emerald-700 disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-center text-slate-500 py-2">
          Vui lòng <a href="/login" className="text-emerald-600 font-semibold underline">đăng nhập</a> để tham gia bình luận.
        </p>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-4 text-xs text-slate-400">Đang tải bình luận...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-3 text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <MessageSquare className="w-4 h-4" />
          Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ!
        </div>
      ) : (
        <div className="space-y-3.5">
          {comments.map((comment) => (
            <div key={comment._id} className="space-y-2">
              {/* Level 0: Top-level comment */}
              <div className="flex gap-2.5 items-start">
                <img
                  src={comment.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={comment.author?.name}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 bg-white p-3 rounded-2xl rounded-tl-xs border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {comment.author?.name || 'Thành viên'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    {comment.content}
                  </p>

                  {/* Reply Button (Level 1 trigger) */}
                  {isAuthenticated && (
                    <button
                      onClick={() => {
                        setReplyingToId(replyingToId === comment._id ? null : comment._id);
                        setReplyText('');
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
                    >
                      <Reply className="w-3 h-3" />
                      {replyingToId === comment._id ? 'Đóng' : 'Trả lời'}
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Reply Input for this comment */}
              {replyingToId === comment._id && (
                <div className="ml-9 flex gap-2 items-center">
                  <CornerDownRight className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Phản hồi ${comment.author?.name}...`}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                    autoFocus
                  />
                  <button
                    onClick={() => handleReplySubmit(comment._id)}
                    disabled={submitting || !replyText.trim()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl disabled:opacity-40"
                  >
                    Gửi
                  </button>
                </div>
              )}

              {/* Level 1: Nested replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-9 space-y-2 border-l-2 border-emerald-100 pl-3">
                  {comment.replies.map((reply) => (
                    <div key={reply._id} className="flex gap-2 items-start">
                      <img
                        src={reply.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                        alt={reply.author?.name}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 bg-white p-2.5 rounded-2xl rounded-tl-xs border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {reply.author?.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(reply.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;

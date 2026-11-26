import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PostForm from '../components/posts/PostForm';

export const EditPostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError('');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`/api/posts/${id}`, { headers });
        const postData = res.data.data;

        // Verify author or admin permission
        const authorId = postData.author?._id || postData.author;
        const currentUserId = user?._id;
        const isAdmin = user?.role === 'admin';

        if (currentUserId && authorId && currentUserId.toString() !== authorId.toString() && !isAdmin) {
          setError('Bạn không có quyền chỉnh sửa bài viết này');
          return;
        }

        setPost(postData);
      } catch (err) {
        console.error('[EditPost Error]:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin bài viết để chỉnh sửa');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id, token, user]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu bài viết...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white rounded-2xl border border-rose-200 shadow-xs text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-2">Không thể chỉnh sửa</h2>
        <p className="text-sm text-slate-600 mb-6">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          Quay lại Bảng tin
        </button>
      </div>
    );
  }

  return (
    <div className="py-2">
      {post && <PostForm postToEdit={post} isEdit={true} />}
    </div>
  );
};

export default EditPostPage;

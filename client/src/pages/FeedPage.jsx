import { useState, useEffect, useRef, useCallback } from 'react';
import { Compass, Users, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/posts/PostCard';
import FollowSuggestions from '../components/suggestions/FollowSuggestions';

export const FeedPage = () => {
  const { token, isAuthenticated } = useAuth();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedType, setFeedType] = useState('explore'); // 'explore' or 'following'

  // Filter states
  const [selectedLocation, setSelectedLocation] = useState('');

  // Ref for the sentinel element observed by IntersectionObserver (Requirement Topic 5)
  const observerTargetRef = useRef(null);
  const observerInstanceRef = useRef(null);
  const activeRequestRef = useRef(null);

  // Fetch posts from backend with server pagination
  const fetchPosts = useCallback(async (pageNum, isReset = false) => {
    if (activeRequestRef.current && !isReset) return;
    if (activeRequestRef.current) activeRequestRef.current.abort();

    const controller = new AbortController();
    activeRequestRef.current = controller;
    try {
      setLoading(true);
      const params = {
        page: pageNum,
        limit: 5,
        feedType: isAuthenticated ? feedType : 'explore'
      };
      if (selectedLocation) params.location = selectedLocation;

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('/api/posts', { params, headers, signal: controller.signal });

      const newPosts = res.data.data || [];
      setPosts((prev) => (isReset ? newPosts : [...prev, ...newPosts]));
      setHasMore(res.data.hasMore);
      setPage(pageNum);
    } catch (err) {
      if (!axios.isCancel(err)) console.error('[Feed Error]:', err);
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setLoading(false);
      }
    }
  }, [feedType, selectedLocation, token, isAuthenticated]);

  // Initial load or when filters change
  useEffect(() => {
    let isCancelled = false;
    Promise.resolve().then(() => {
      if (!isCancelled) fetchPosts(1, true);
    });
    return () => {
      isCancelled = true;
      activeRequestRef.current?.abort();
    };
  }, [feedType, selectedLocation, fetchPosts]);

  // Setup IntersectionObserver for Infinite Scroll (Requirement Topic 5)
  useEffect(() => {
    // Disconnect any existing observer
    if (observerInstanceRef.current) {
      observerInstanceRef.current.disconnect();
    }

    if (!hasMore || loading) return;

    // Create new IntersectionObserver
    observerInstanceRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          fetchPosts(page + 1, false);
        }
      },
      {
        root: null,
        rootMargin: '100px', // Preload when 100px away from bottom
        threshold: 0.1
      }
    );

    // Observe sentinel target
    if (observerTargetRef.current) {
      observerInstanceRef.current.observe(observerTargetRef.current);
    }

    // MANDATORY REQUIREMENT: Cleanup observer on unmount or deps change!
    return () => {
      if (observerInstanceRef.current) {
        observerInstanceRef.current.disconnect();
      }
    };
  }, [hasMore, loading, page, fetchPosts]);

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Main Feed Column (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Feed Type Switcher (Khám phá vs Đang theo dõi) */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFeedType('explore')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                feedType === 'explore'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              Khám phá chung
            </button>

            {isAuthenticated && (
              <button
                onClick={() => setFeedType('following')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  feedType === 'following'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                Đang theo dõi
              </button>
            )}
          </div>

          <button
            onClick={() => fetchPosts(1, true)}
            className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Làm mới bảng tin"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Location Quick Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap">Gợi ý điểm đến:</span>
          {['Tất cả', 'Hà Giang', 'Đà Lạt', 'Phú Quốc', 'Đà Nẵng', 'Ninh Bình', 'Sapa'].map((loc) => {
            const isAll = loc === 'Tất cả';
            const isSelected = isAll ? selectedLocation === '' : selectedLocation === loc;
            return (
              <button
                key={loc}
                onClick={() => setSelectedLocation(isAll ? '' : loc)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
                  isSelected
                    ? 'bg-emerald-100 text-emerald-800 font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {loc}
              </button>
            );
          })}
        </div>

        {/* Posts List */}
        {posts.length === 0 && !loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Chưa có bài viết nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {feedType === 'following'
                ? 'Những người bạn theo dõi chưa đăng bài mới nào. Hãy theo dõi thêm những người bạn mới!'
                : 'Hãy là người đầu tiên chia sẻ hành trình du lịch tuyệt vời của bạn.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPostDeleted={handlePostDeleted}
              />
            ))}
          </div>
        )}

        {/* Infinite Scroll Sentinel Element & Loading Spinner */}
        <div ref={observerTargetRef} className="py-6 text-center">
          {loading && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-xs text-xs font-semibold text-slate-600">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Đang tải thêm nhật ký chuyến đi...</span>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <p className="text-xs text-slate-400 font-medium">
              ✨ Bạn đã xem hết tất cả bài viết mới nhất
            </p>
          )}
        </div>
      </div>

      {/* Right Sidebar Column (4 cols) */}
      <div className="hidden lg:block lg:col-span-4 space-y-6 sticky top-20">
        {/* Follow Suggestions Widget */}
        <FollowSuggestions />
      </div>
    </div>
  );
};

export default FeedPage;

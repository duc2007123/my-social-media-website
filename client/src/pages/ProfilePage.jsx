import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { UserCheck, UserPlus, MapPin, Calendar, Grid, Map as MapIcon, Lock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/posts/PostCard';
import LeafletMap from '../components/map/LeafletMap';

export const ProfilePage = () => {
  const { id } = useParams(); // Requirement: dynamic route + useParams
  const { user: currentUser, token, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'map'
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const isMe = currentUser && currentUser._id === id;

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      try {
        setLoading(true);
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch User Info
        const userRes = await axios.get(`/api/users/${id}/profile`, { headers });
        setProfile(userRes.data.data);
        setIsFollowing(userRes.data.data.isFollowing || false);

        // Fetch User's Posts
        const postsRes = await axios.get(`/api/posts?authorId=${id}&limit=50`, { headers });
        setUserPosts(postsRes.data.data || []);
      } catch (err) {
        console.error('[Profile Fetch Error]:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndPosts();
  }, [id, token]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để theo dõi');
      return;
    }
    const prevFollowing = isFollowing;
    // Optimistic Update
    setIsFollowing(!prevFollowing);
    setProfile((prev) => ({
      ...prev,
      followersCount: prevFollowing ? prev.followersCount - 1 : prev.followersCount + 1
    }));

    try {
      const endpoint = prevFollowing ? `/api/users/${id}/unfollow` : `/api/users/${id}/follow`;
      await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      // Rollback
      setIsFollowing(prevFollowing);
      setProfile((prev) => ({
        ...prev,
        followersCount: prevFollowing ? prev.followersCount + 1 : prev.followersCount - 1
      }));
      alert('Lỗi khi cập nhật theo dõi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-bold text-slate-800">Không tìm thấy người dùng</h2>
      </div>
    );
  }

  // Extract locations with coordinates from user's posts for their personal map
  const userLocations = userPosts
    .filter((p) => p.coordinates && p.coordinates.lat && p.coordinates.lng)
    .map((p) => ({
      location: p.location,
      coordinates: p.coordinates,
      postCount: 1,
      avgCost: p.cost
    }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <img
            src={profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt={profile.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-emerald-500/20 shadow-md"
          />

          <div className="flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{profile.name}</h1>
                <p className="text-xs text-slate-400 font-medium">@{profile.username}</p>
              </div>

              {!isMe && isAuthenticated && (
                <button
                  onClick={handleFollowToggle}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                    isFollowing
                      ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Đang theo dõi
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Theo dõi
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
              {profile.bio || 'Chưa cập nhật phần giới thiệu bản thân.'}
            </p>

            {/* Metrics Bar */}
            <div className="flex items-center justify-center sm:justify-start gap-6 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="font-black text-slate-900 text-sm">{profile.postsCount || userPosts.length}</span>{' '}
                <span className="text-slate-500">Bài viết</span>
              </div>
              <div>
                <span className="font-black text-slate-900 text-sm">{profile.followersCount || 0}</span>{' '}
                <span className="text-slate-500">Người theo dõi</span>
              </div>
              <div>
                <span className="font-black text-slate-900 text-sm">{profile.followingCount || 0}</span>{' '}
                <span className="text-slate-500">Đang theo dõi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Bài viết vs Bản đồ check-in cá nhân */}
      <div className="flex items-center justify-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'posts'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Grid className="w-4 h-4" />
          Bài viết ({userPosts.length})
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'map'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          Bản đồ hành trình cá nhân ({userLocations.length} điểm)
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' ? (
        userPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
            <p className="text-xs text-slate-400 font-medium">Người dùng này chưa có bài viết nào được hiển thị.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {userPosts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Tất cả những điểm đến đã được ghi nhận trong nhật ký du lịch của <strong>{profile.name}</strong>:
          </p>
          <LeafletMap locations={userLocations} />
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Check, Sparkles, MapPin } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export const FollowSuggestions = () => {
  const { token, isAuthenticated } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [followedMap, setFollowedMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/users/suggestions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuggestions(res.data.data || []);
      } catch (err) {
        console.error('[Suggestions Error]:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [isAuthenticated, token]);

  const handleFollow = async (userId) => {
    try {
      setFollowedMap((prev) => ({ ...prev, [userId]: true }));
      await axios.post(
        `/api/users/${userId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      // Rollback on error
      setFollowedMap((prev) => ({ ...prev, [userId]: false }));
      alert('Không thể theo dõi người dùng này');
    }
  };

  if (!isAuthenticated || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Gợi ý bạn đồng hành</h3>
          <p className="text-[11px] text-slate-400">Dựa trên điểm đến & bạn chung</p>
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.map((item) => {
          const isFollowed = followedMap[item._id];
          return (
            <div key={item._id} className="flex items-center justify-between gap-3">
              <Link to={`/profile/${item._id}`} className="flex items-center gap-2.5 min-w-0 group">
                <img
                  src={item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={item.name}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 group-hover:ring-emerald-500 transition-all flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium truncate flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                    {item.reason}
                  </p>
                </div>
              </Link>

              <button
                onClick={() => handleFollow(item._id)}
                disabled={isFollowed}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 flex-shrink-0 ${
                  isFollowed
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                {isFollowed ? (
                  <>
                    <Check className="w-3 h-3" />
                    Đã theo dõi
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3" />
                    Theo dõi
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FollowSuggestions;

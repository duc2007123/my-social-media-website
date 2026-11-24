import { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, Users, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const AdminPage = () => {
  const { token } = useAuth();
  const [locationsStats, setLocationsStats] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Aggregation Pipeline Stats
      const statsRes = await axios.get('/api/stats/top-locations?limit=10', { headers });
      setLocationsStats(statsRes.data.data || []);

      // 2. Fetch users for moderation (sample suggestions / list)
      const usersRes = await axios.get('/api/users/suggestions', { headers });
      setUsers(usersRes.data.data || []);
    } catch (err) {
      console.error('[Admin Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle lock / unlock user account (Lead API task)
  const handleToggleLock = async (userId, currentLocked) => {
    try {
      const res = await axios.put(
        `/api/users/${userId}/lock`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setActionMessage(res.data.message);
      setTimeout(() => setActionMessage(''), 3000);

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isLocked: !currentLocked } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi thao tác khóa/mở khóa tài khoản');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Bảng điều khiển Quản trị viên (Admin)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản trị người dùng, khóa tài khoản vi phạm và phân tích dữ liệu du lịch
            </p>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Aggregation Pipeline Stats (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800">
              Thống kê Top địa điểm (MongoDB Aggregation)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Dữ liệu tổng hợp từ các bài viết, tính toán tổng số lượt thích và chi phí trung bình.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Địa điểm</th>
                  <th className="py-2.5 px-3 text-center">Số bài viết</th>
                  <th className="py-2.5 px-3 text-center">Lượt thích</th>
                  <th className="py-2.5 px-3 text-right">Chi phí TB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locationsStats.map((loc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{loc.location}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-emerald-600">
                      {loc.postCount}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{loc.totalLikes}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700 font-mono">
                      {loc.avgCost ? `${new Intl.NumberFormat('vi-VN').format(loc.avgCost)} đ` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: User Management & Lock/Unlock (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">Quản lý Tài khoản & Kiểm duyệt</h2>
          </div>
          <p className="text-xs text-slate-500">
            Khóa hoặc mở khóa tài khoản khi có hành vi vi phạm tiêu chuẩn cộng đồng.
          </p>

          <div className="space-y-3">
            {users.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Không có tài khoản nào cần duyệt.</p>
            ) : (
              users.map((u) => (
                <div
                  key={u._id}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 flex items-center justify-between gap-3 bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{u.name}</p>
                      <p className="text-[11px] text-slate-400">@{u.username}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleLock(u._id, u.isLocked)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      u.isLocked
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {u.isLocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Đang bị khóa
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        Khóa tài khoản
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

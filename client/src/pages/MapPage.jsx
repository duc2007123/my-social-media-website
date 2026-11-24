import { useState, useEffect } from 'react';
import { MapPin, TrendingUp, DollarSign, Award, Compass } from 'lucide-react';
import axios from 'axios';
import LeafletMap from '../components/map/LeafletMap';

export const MapPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopLocations = async () => {
      try {
        setLoading(true);
        // Call MongoDB Aggregation Pipeline endpoint
        const res = await axios.get('/api/stats/top-locations?limit=12');
        setLocations(res.data.data || []);
      } catch (err) {
        console.error('[Map Stats Error]:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopLocations();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <Compass className="w-3.5 h-3.5" />
            Bản đồ tương tác Leaflet
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Khám phá Tọa độ Check-in Du lịch
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dữ liệu tổng hợp từ các bài viết nhật ký chuyến đi trên toàn hệ thống (MongoDB Aggregation Pipeline)
          </p>
        </div>
      </div>

      {/* Interactive Map */}
      <LeafletMap locations={locations} />

      {/* Top Destination Stats Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-800">
            Bảng xếp hạng Top điểm đến được nhắc đến nhiều nhất
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Đang tải thống kê địa điểm...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {locations.map((loc, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-xs transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {loc.postCount} bài viết
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{loc.location}</h3>
                {loc.avgCost > 0 && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-amber-500" />
                    TB: ~{new Intl.NumberFormat('vi-VN').format(loc.avgCost)} đ
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;

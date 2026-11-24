import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Compass, PlusCircle, MapPin, Bell, User as UserIcon, LogOut, Search, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { socket } from '../../socket/socketClient';

export const Navbar = ({ onSearchChange }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Socket listener for real-time notifications
  useEffect(() => {
    const handleNewNotification = (data) => {
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(searchTerm);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-50 text-emerald-600 font-semibold shadow-xs'
        : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
              TravelGram
            </span>
            <span className="hidden sm:inline-block text-xs font-semibold px-1.5 py-0.5 ml-1.5 bg-emerald-100 text-emerald-800 rounded-md">
              Nhật ký du lịch
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (onSearchChange) onSearchChange(e.target.value);
            }}
            placeholder="Tìm địa điểm, tiêu đề hoặc #hashtag..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-full text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </form>

        {/* Navigation Items */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/" end className={navLinkClass}>
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Bảng tin</span>
          </NavLink>

          <NavLink to="/map" className={navLinkClass}>
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Bản đồ</span>
          </NavLink>

          {isAuthenticated && (
            <NavLink to="/create-post" className={navLinkClass}>
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline font-semibold text-emerald-600">Đăng bài</span>
            </NavLink>
          )}

          {isAuthenticated && user?.role === 'admin' && (
            <NavLink to="/admin" className={navLinkClass}>
              <Shield className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Quản trị</span>
            </NavLink>
          )}

          {/* User actions */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              {/* Notification icon */}
              <div className="relative cursor-pointer p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>

              {/* Profile avatar link */}
              <Link
                to={`/profile/${user._id}`}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-slate-100 transition-colors"
                title="Trang cá nhân"
              >
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
                <span className="hidden lg:inline text-sm font-semibold text-slate-700 max-w-[100px] truncate">
                  {user.name}
                </span>
              </Link>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all hover:scale-[1.02]"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

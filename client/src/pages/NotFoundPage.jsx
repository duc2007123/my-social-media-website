import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 shadow-inner">
        <Compass className="w-10 h-10 animate-bounce" />
      </div>
      <h1 className="text-6xl font-black text-slate-900 tracking-tight">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 mt-2">Lạc bước trên hành trình?</h2>
      <p className="text-slate-500 max-w-md mt-2 text-sm leading-relaxed">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển đến một điểm đến khác trong cuốn nhật ký du lịch.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-105 text-sm"
      >
        <Home className="w-4 h-4" />
        Về trang chủ Bảng tin
      </Link>
    </div>
  );
};

export default NotFoundPage;

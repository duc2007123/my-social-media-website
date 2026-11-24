import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 TravelGram - Mạng xã hội Nhật ký du lịch (BTL Lập trình Web - Đề tài 5)</p>
          <p className="mt-1 text-slate-400">React + Vite + Tailwind CSS + Node.js + Express + MongoDB</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

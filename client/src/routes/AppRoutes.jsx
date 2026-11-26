import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';

import FeedPage from '../pages/FeedPage';
import MapPage from '../pages/MapPage';
import ProfilePage from '../pages/ProfilePage';
import CreatePostPage from '../pages/CreatePostPage';
import EditPostPage from '../pages/EditPostPage';
import AdminPage from '../pages/AdminPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Nested Routes inside MainLayout with <Outlet /> */}
      <Route path="/" element={<MainLayout />}>
        {/* Index: Feed with infinite scroll */}
        <Route index element={<FeedPage />} />

        {/* Interactive Leaflet Map */}
        <Route path="map" element={<MapPage />} />

        {/* Dynamic User Profile Route */}
        <Route path="profile/:id" element={<ProfilePage />} />

        {/* Protected Route: Create Post */}
        <Route
          path="create-post"
          element={
            <ProtectedRoute>
              <CreatePostPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Route: Edit Post */}
        <Route
          path="edit-post/:id"
          element={
            <ProtectedRoute>
              <EditPostPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Route: Admin Dashboard */}
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Auth Pages */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* 404 Not Found Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;

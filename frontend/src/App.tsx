import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/authStore';
import { canAccessAdminPanel, isEditorLike } from './lib/permissions';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import HomePage from './pages/HomePage';
import ArticleListPage from './pages/articles/ArticleListPage';
import ArticleViewPage from './pages/articles/ArticleViewPage';
import ArticleEditPage from './pages/articles/ArticleEditPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminRolesPage from './pages/admin/AdminRolesPage';
import AdminArticlesPage from './pages/admin/AdminArticlesPage';
import AdminReportPage from './pages/admin/AdminReportPage';
import AdminActivityLogPage from './pages/admin/AdminActivityLogPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/" replace />;
  if (!canAccessAdminPanel(user)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RequireEditor({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/" replace />;
  if (!isEditorLike(user)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { token, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token) fetchMe();
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="articles" element={<ArticleListPage />} />
          <Route path="articles/:slug" element={<ArticleViewPage />} />
          <Route path="articles/new" element={
            <RequireAuth><RequireEditor><ArticleEditPage /></RequireEditor></RequireAuth>
          } />
          <Route path="articles/:id/edit" element={
            <RequireAuth><RequireEditor><ArticleEditPage /></RequireEditor></RequireAuth>
          } />
          <Route path="articles-manage" element={
            <RequireAuth><RequireEditor><AdminArticlesPage /></RequireEditor></RequireAuth>
          } />

          {/* Admin routes */}
          <Route path="admin" element={<RequireAuth><RequireAdmin><Navigate to="/admin/articles" /></RequireAdmin></RequireAuth>} />
          <Route path="admin/articles" element={<RequireAuth><RequireAdmin><AdminArticlesPage /></RequireAdmin></RequireAuth>} />
          <Route path="admin/categories" element={<RequireAuth><RequireAdmin><AdminCategoriesPage /></RequireAdmin></RequireAuth>} />
          <Route path="admin/users" element={<RequireAuth><RequireAdmin><AdminUsersPage /></RequireAdmin></RequireAuth>} />
          <Route path="admin/roles" element={<RequireAuth><RequireAdmin><AdminRolesPage /></RequireAdmin></RequireAuth>} />
          <Route path="admin/report" element={<RequireAuth><RequireAdmin><AdminReportPage /></RequireAdmin></RequireAuth>} />
          <Route path="admin/activity-log" element={<RequireAuth><RequireAdmin><AdminActivityLogPage /></RequireAdmin></RequireAuth>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/authStore';
import {
  BookOpen, Home, Search, Settings, Users, Shield,
  FolderOpen, FileText, LogOut, Menu, X, ChevronDown, Terminal, BarChart2
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(location.pathname.startsWith('/admin'));
  const isAdmin = user?.role?.name === 'admin';
  const isEditor = user?.role?.name === 'editor' || isAdmin;

  const navLink = (to: string) =>
    `nav-item ${location.pathname === to || location.pathname.startsWith(to + '/') ? 'nav-item-active' : ''}`;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} style={{
        width: 240, background: 'var(--bg-2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0,
        height: '100vh', zIndex: 100,
        transform: sidebarOpen || window.innerWidth > 768 ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.2s',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, background: 'var(--accent)', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Terminal size={16} color="#000" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', letterSpacing: '-0.02em' }}>IT Guide</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Knowledge Base</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          <NavItem to="/" icon={<Home size={15} />} label="หน้าหลัก" active={location.pathname === '/'} />
          <NavItem to="/articles" icon={<BookOpen size={15} />} label="บทความทั้งหมด" active={location.pathname.startsWith('/articles') && !location.pathname.includes('edit') && !location.pathname.includes('new')} />

          {isEditor && (
            <NavItem to="/articles/new" icon={<FileText size={15} />} label="เขียนบทความใหม่" active={location.pathname === '/articles/new'} />
          )}

          {isAdmin && (
            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => setAdminOpen(!adminOpen)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-3)', fontSize: '0.7rem', textTransform: 'uppercase',
                  letterSpacing: '0.08em', fontFamily: 'var(--font-sans)', fontWeight: 600,
                  borderRadius: 'var(--radius)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Settings size={12} /> การจัดการ
                </span>
                <ChevronDown size={12} style={{ transform: adminOpen ? 'rotate(180deg)' : '', transition: '0.2s' }} />
              </button>
              {adminOpen && (
                <div style={{ paddingLeft: 8 }}>
                  <NavItem to="/admin/articles" icon={<FileText size={15} />} label="จัดการบทความ" active={location.pathname === '/admin/articles'} />
                  <NavItem to="/admin/categories" icon={<FolderOpen size={15} />} label="หมวดหมู่" active={location.pathname === '/admin/categories'} />
                  <NavItem to="/admin/users" icon={<Users size={15} />} label="ผู้ใช้งาน" active={location.pathname === '/admin/users'} />
                  <NavItem to="/admin/roles" icon={<Shield size={15} />} label="Role & สิทธิ์" active={location.pathname === '/admin/roles'} />
                  <NavItem to="/admin/report" icon={<BarChart2 size={15} />} label="รายงาน" active={location.pathname === '/admin/report'} />
                </div>
              )}
            </div>
          )}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          {user ? (
            <div>
              <div style={{
                padding: '10px', background: 'var(--bg-3)', borderRadius: 'var(--radius)',
                marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600,
                }}>
                  {user.username[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.fullName || user.username}</div>
                  <span className={`badge badge-${user.role?.name}`} style={{ fontSize: '0.65rem' }}>{user.role?.name}</span>
                </div>
              </div>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
                <LogOut size={14} /> ออกจากระบบ
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>เข้าสู่ระบบ</Link>
          )}
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99
        }} />
      )}

      {/* Main */}
      <div style={{ flex: 1, marginLeft: 240, minWidth: 0 }}>
        {/* Topbar mobile */}
        <header style={{
          display: 'none', padding: '12px 16px',
          background: 'var(--bg-2)', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 50,
        }} className="mobile-header">
          <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>IT Guide</span>
        </header>

        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          aside { transform: translateX(-100%) !important; }
          aside.sidebar-open { transform: translateX(0) !important; }
          .mobile-header { display: flex !important; align-items: center; gap: 12px; }
          main { padding: 20px 16px !important; }
          div[style*="margin-left: 240px"] { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}

function NavItem({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
      borderRadius: 'var(--radius)', textDecoration: 'none', fontSize: '0.875rem',
      color: active ? 'var(--accent)' : 'var(--text-2)',
      background: active ? 'var(--accent-dim)' : 'transparent',
      fontWeight: active ? 500 : 400,
      marginBottom: 2, transition: 'all 0.15s',
    }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {icon} {label}
    </Link>
  );
}

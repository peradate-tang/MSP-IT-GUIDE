import { useQuery } from '@tanstack/react-query';
import { Printer, BarChart2, Users, FileText, FolderOpen, Clock } from 'lucide-react';
import api from '../../lib/api';

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </div>
  );
}

export default function AdminReportPage() {
  const { data: articles } = useQuery({
    queryKey: ['report-articles'],
    queryFn: () => api.get('/articles', { params: { limit: 999 } }).then(r => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['report-categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  });

  const { data: users } = useQuery({
    queryKey: ['report-users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const { data: roles } = useQuery({
    queryKey: ['report-roles'],
    queryFn: () => api.get('/roles').then(r => r.data),
  });

  const allArticles: any[] = Array.isArray(articles?.data) ? articles.data : [];
  const allCategories: any[] = Array.isArray(categories) ? categories : [];
  const allUsers: any[] = Array.isArray(users) ? users : [];
  const allRoles: any[] = Array.isArray(roles) ? roles : [];

  const published = allArticles.filter(a => a.status === 'published').length;
  const draft = allArticles.filter(a => a.status === 'draft').length;
  const archived = allArticles.filter(a => a.status === 'archived').length;

  const articlesByCategory = allCategories.map(cat => ({
    ...cat,
    total: allArticles.filter(a => a.category?.id === cat.id).length,
    published: allArticles.filter(a => a.category?.id === cat.id && a.status === 'published').length,
    draft: allArticles.filter(a => a.category?.id === cat.id && a.status === 'draft').length,
  })).sort((a, b) => b.total - a.total);

  const usersByRole = allRoles.map(role => ({
    ...role,
    count: allUsers.filter(u => u.role?.id === role.id).length,
  }));

  const recentArticles = [...allArticles]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 10);

  const printDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      {/* Header */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <BarChart2 size={20} style={{ color: 'var(--accent)' }} />
        <h1 style={{ flex: 1, fontSize: '1.1rem', fontWeight: 700 }}>รายงานภาพรวมระบบ</h1>
        <button
          className="btn btn-primary"
          onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Printer size={15} /> พิมพ์รายงาน
        </button>
      </div>

      {/* Print header */}
      <div className="print-only" style={{ marginBottom: 24, borderBottom: '2px solid #000', paddingBottom: 12 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>IT Guide — รายงานภาพรวมระบบ</h1>
        <div style={{ fontSize: '0.85rem', color: '#555', marginTop: 4 }}>สร้างเมื่อ: {printDate}</div>
      </div>

      {/* Section 1: Overview */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={15} /> ภาพรวมระบบ
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          <StatCard label="บทความทั้งหมด" value={allArticles.length} />
          <StatCard label="เผยแพร่แล้ว" value={published} sub="published" />
          <StatCard label="ฉบับร่าง" value={draft} sub="draft" />
          <StatCard label="เก็บถาวร" value={archived} sub="archived" />
          <StatCard label="หมวดหมู่" value={allCategories.length} />
          <StatCard label="ผู้ใช้งาน" value={allUsers.length} />
        </div>
      </section>

      {/* Section 2: Articles by Category */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FolderOpen size={15} /> บทความตามหมวดหมู่
        </h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-3)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>หมวดหมู่</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600 }}>ทั้งหมด</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600 }}>เผยแพร่</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600 }}>ร่าง</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>สัดส่วน</th>
              </tr>
            </thead>
            <tbody>
              {articlesByCategory.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)' }}>ไม่มีข้อมูล</td></tr>
              ) : articlesByCategory.map((cat, i) => (
                <tr key={cat.id} style={{ borderBottom: i < articlesByCategory.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ marginRight: 8 }}>{cat.icon}</span>{cat.name}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600 }}>{cat.total}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <span className="badge badge-published">{cat.published}</span>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <span className="badge badge-draft">{cat.draft}</span>
                  </td>
                  <td style={{ padding: '10px 16px', minWidth: 120 }}>
                    {cat.total > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.round(cat.published / cat.total * 100)}%`, background: 'var(--success)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                          {Math.round(cat.published / cat.total * 100)}%
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Users by Role */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={15} /> ผู้ใช้งานตาม Role
        </h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-3)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600 }}>จำนวนผู้ใช้</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>สัดส่วน</th>
              </tr>
            </thead>
            <tbody>
              {usersByRole.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)' }}>ไม่มีข้อมูล</td></tr>
              ) : usersByRole.map((role, i) => (
                <tr key={role.id} style={{ borderBottom: i < usersByRole.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <span className={`badge badge-${role.name}`}>{role.name}</span>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600 }}>{role.count}</td>
                  <td style={{ padding: '10px 16px', minWidth: 120 }}>
                    {allUsers.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.round(role.count / allUsers.length * 100)}%`, background: 'var(--accent)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                          {allUsers.length > 0 ? Math.round(role.count / allUsers.length * 100) : 0}%
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Recent Activity */}
      <section>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={15} /> บทความล่าสุด (10 รายการ)
        </h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-3)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>ชื่อบทความ</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>หมวดหมู่</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>สถานะ</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>แก้ไขล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {recentArticles.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)' }}>ไม่มีข้อมูล</td></tr>
              ) : recentArticles.map((article, i) => (
                <tr key={article.id} style={{ borderBottom: i < recentArticles.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 16px', maxWidth: 280 }}>
                    <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.title}</div>
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-2)' }}>
                    {article.category?.icon} {article.category?.name || '-'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className={`badge badge-${article.status}`}>{article.status}</span>
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {new Date(article.updatedAt || article.createdAt).toLocaleDateString('th-TH')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { BookOpen, FolderOpen, TrendingUp, Clock, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  });

  const { data: articles } = useQuery({
    queryKey: ['articles', 'recent'],
    queryFn: () => api.get('/articles?status=published&limit=6').then(r => r.data),
  });

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--bg-3) 100%)',
        border: '1px solid var(--border)', borderRadius: 12,
        padding: '48px 40px', marginBottom: 40, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          background: 'var(--accent)', borderRadius: '50%', opacity: 0.04,
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', background: 'var(--accent-dim)',
            border: '1px solid rgba(0,212,255,0.2)', borderRadius: 100,
            fontSize: '0.75rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)',
            marginBottom: 16,
          }}>
            📖 IT Knowledge Base
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 12 }}>
            ค้นหาคำตอบด้านไอที<br />ที่คุณต้องการ
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '1rem', maxWidth: 480, marginBottom: 24 }}>
            รวมคู่มือ, How-to guide, และเอกสารทางเทคนิคสำหรับทีม IT ของคุณ
          </p>
          <Link to="/articles" className="btn btn-primary">
            ดูบทความทั้งหมด <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
        {[
          { icon: <BookOpen size={20} />, label: 'บทความ', value: articles?.total || 0 },
          { icon: <FolderOpen size={20} />, label: 'หมวดหมู่', value: categories?.length || 0 },
          { icon: <TrendingUp size={20} />, label: 'ยอดอ่านวันนี้', value: '—' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ color: 'var(--accent)', marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Categories */}
      {categories?.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, color: 'var(--text-2)' }}>หมวดหมู่</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {Array.isArray(categories) && categories.map((cat: any) => (
              <Link key={cat.id} to={`/articles?categoryId=${cat.id}`}
                style={{ textDecoration: 'none' }}>
                <div className="card" style={{ textAlign: 'center', padding: '20px 12px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{cat.icon}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{cat.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent articles */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-2)' }}>บทความล่าสุด</h2>
          <Link to="/articles" style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>ดูทั้งหมด →</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {articles?.data?.map((article: any) => (
            <Link key={article.id} to={`/articles/${article.slug}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ transition: 'border-color 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      {article.category && <span className="tag">{article.category.icon} {article.category.name}</span>}
                      {article.tags?.slice(0, 2).map((t: string) => <span key={t} className="tag">#{t}</span>)}
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{article.title}</h3>
                    {article.excerpt && <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', lineHeight: 1.5 }}>{article.excerpt}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                    <Clock size={12} />
                    {new Date(article.createdAt).toLocaleDateString('th-TH')}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

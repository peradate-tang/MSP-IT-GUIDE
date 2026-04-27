import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { Search, Clock, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ArticleListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const page = Number(searchParams.get('page') || 1);
  const categoryId = searchParams.get('categoryId') || '';

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['articles', { search, categoryId, page }],
    queryFn: () => api.get('/articles', { params: { search, categoryId, status: 'published', page, limit: 12 } }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(p => { p.set('search', search); p.set('page', '1'); return p; });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, flex: 1 }}>บทความทั้งหมด</h1>
        <form onSubmit={doSearch} style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              className="input"
              style={{ paddingLeft: 34, width: 240 }}
              placeholder="ค้นหาบทความ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" type="submit">ค้นหา</button>
        </form>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${!categoryId ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSearchParams(p => { p.delete('categoryId'); p.set('page', '1'); return p; })}
        >ทั้งหมด</button>
        {categories?.map((cat: any) => (
          <button
            key={cat.id}
            className={`btn btn-sm ${categoryId == cat.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSearchParams(p => { p.set('categoryId', cat.id); p.set('page', '1'); return p; })}
          >{cat.icon} {cat.name}</button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : data?.data?.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>ไม่พบบทความ</h3>
          <p>ลองเปลี่ยนคำค้นหาหรือหมวดหมู่</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {data?.data?.map((article: any) => (
            <Link key={article.id} to={`/articles/${article.slug}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ height: '100%', transition: 'border-color 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  {article.category && <span className="tag">{article.category.icon} {article.category.name}</span>}
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 8, color: 'var(--text)', lineHeight: 1.4 }}>{article.title}</h3>
                {article.excerpt && (
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 12 }}>
                    {article.excerpt.slice(0, 120)}{article.excerpt.length > 120 ? '...' : ''}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 'auto' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {new Date(article.createdAt).toLocaleDateString('th-TH')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={11} /> {article.viewCount}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32, alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setSearchParams(p => { p.set('page', String(page - 1)); return p; })}
          ><ChevronLeft size={14} /></button>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>หน้า {page} / {data.totalPages}</span>
          <button className="btn btn-secondary btn-sm"
            disabled={page >= data.totalPages}
            onClick={() => setSearchParams(p => { p.set('page', String(page + 1)); return p; })}
          ><ChevronRight size={14} /></button>
        </div>
      )}
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import { ArrowLeft, Clock, Eye, Pencil, Tag } from 'lucide-react';

export default function ArticleViewPage() {
  const { slug } = useParams();
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const canEdit = user?.role?.name === 'admin' || user?.role?.name === 'editor';

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => api.get(`/articles/slug/${slug}`).then(r => r.data),
  });

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div className="spinner" style={{ margin: '0 auto' }} />
    </div>
  );

  if (isError || !article) return (
    <div className="empty-state">
      <div className="empty-state-icon">🔍</div>
      <h3>ไม่พบบทความ</h3>
      <p>บทความนี้อาจถูกลบหรือ URL ไม่ถูกต้อง</p>
      <Link to="/articles" className="btn btn-secondary" style={{ marginTop: 16, display: 'inline-flex' }}>กลับไปยังรายการ</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> กลับ
      </button>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {article.category && <span className="tag">{article.category.icon} {article.category.name}</span>}
            <span className={`badge badge-${article.status}`}>{article.status}</span>
          </div>
          {canEdit && (
            <Link to={`/articles/${article.id}/edit`} className="btn btn-secondary btn-sm">
              <Pencil size={13} /> แก้ไข
            </Link>
          )}
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 16 }}>
          {article.title}
        </h1>

        {article.excerpt && (
          <p style={{ fontSize: '1rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>{article.excerpt}</p>
        )}

        <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-3)', flexWrap: 'wrap' }}>
          {article.author && <span>โดย <strong style={{ color: 'var(--text-2)' }}>{article.author.fullName || article.author.username}</strong></span>}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {new Date(article.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {article.viewCount} ครั้ง</span>
        </div>

        {Array.isArray(article.tags) && article.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Tag size={12} style={{ color: 'var(--text-3)' }} />
            {article.tags.map((t: string) => <span key={t} className="tag">#{t}</span>)}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)', marginBottom: 32 }} />

      {/* Content */}
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <Link to="/articles" className="btn btn-secondary">
          <ArrowLeft size={14} /> กลับไปยังรายการบทความ
        </Link>
      </div>
    </div>
  );
}

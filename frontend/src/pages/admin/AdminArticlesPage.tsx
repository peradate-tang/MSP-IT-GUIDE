import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';

export default function AdminArticlesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-articles', page, search],
    queryFn: () => api.get('/articles', { params: { page, limit: 15, search } }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/articles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-articles'] }),
  });

  const confirmDelete = (id: number, title: string) => {
    if (confirm(t('admin.articles.confirm_delete', { title }))) deleteMutation.mutate(id);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 style={{ flex: 1, fontSize: '1.1rem', fontWeight: 700 }}>{t('admin.articles.title')}</h1>
        <input className="input" style={{ width: 200 }} placeholder={t('admin.articles.search_placeholder')} value={search} onChange={e => setSearch(e.target.value)} />
        <Link to="/articles/new" className="btn btn-primary"><Plus size={15} /> {t('admin.articles.new')}</Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>{t('admin.articles.col_title')}</th>
              <th>{t('admin.articles.col_category')}</th>
              <th>{t('admin.articles.col_status')}</th>
              <th>{t('articles.views')}</th>
              <th>{t('admin.articles.col_date')}</th>
              <th style={{ textAlign: 'right' }}>{t('admin.articles.col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>{t('common.noData')}</td></tr>
            ) : data?.data?.map((a: any) => (
              <tr key={a.id}>
                <td style={{ maxWidth: 280 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                  {a.tags?.length > 0 && <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>{a.tags.slice(0, 2).map((tag: string) => <span key={tag} className="tag">#{tag}</span>)}</div>}
                </td>
                <td><span style={{ fontSize: '0.8rem' }}>{a.category?.icon} {a.category?.name || '—'}</span></td>
                <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                <td style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{a.viewCount}</td>
                <td style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{new Date(a.createdAt).toLocaleDateString('th-TH')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <Link to={`/articles/${a.slug}`} className="btn btn-ghost btn-sm" title={t('common.edit')}><Eye size={13} /></Link>
                    <Link to={`/articles/${a.id}/edit`} className="btn btn-ghost btn-sm" title={t('common.edit')}><Pencil size={13} /></Link>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => confirmDelete(a.id, a.title)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          {Array.from({ length: data.totalPages }, (_, i) => (
            <button key={i} className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}

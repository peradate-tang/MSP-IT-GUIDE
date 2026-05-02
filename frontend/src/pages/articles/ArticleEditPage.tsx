import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { Save, Eye, EyeOff, ArrowLeft, ImagePlus, Loader2 } from 'lucide-react';

export default function ArticleEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = !id || id === 'new';
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    status: 'draft',
    categoryId: '',
    tags: '',
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  });

  const { data: existing } = useQuery({
    queryKey: ['article-edit', id],
    queryFn: () => api.get(`/articles/${id}`).then(r => r.data),
    enabled: !isNew,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || '',
        excerpt: existing.excerpt || '',
        content: existing.content || '',
        status: existing.status || 'draft',
        categoryId: existing.categoryId || '',
        tags: existing.tags?.join(', ') || '',
      });
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        tags: form.tags ? form.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      };
      if (isNew) return api.post('/articles', payload).then(r => r.data);
      return api.put(`/articles/${id}`, payload).then(r => r.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      navigate(`/articles/${data.slug}`);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || t('common.error'));
    },
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setForm(f => ({ ...f, content: f.content + '\n' + text }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = form.content.slice(0, start) + text + form.content.slice(end);
    setForm(f => ({ ...f, content: newContent }));
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const baseUrl = import.meta.env.VITE_API_URL || '';
      insertAtCursor(`\n![${file.name}](${baseUrl}${data.url})\n`);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('articles.upload_error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} />
        </button>
        <h1 style={{ flex: 1, fontSize: '1.1rem', fontWeight: 700 }}>
          {isNew ? t('articles.new') : t('articles.edit')}
        </h1>
        <button className="btn btn-ghost btn-sm" onClick={() => setPreview(!preview)}>
          {preview ? <EyeOff size={14} /> : <Eye size={14} />}
          {preview ? 'Editor' : t('articles.preview')}
        </button>
        <button className="btn btn-primary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save size={14} />
          {saveMutation.isPending ? t('common.saving') : t('common.save')}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">{t('articles.title_label')}</label>
            <input className="input" style={{ fontSize: '1.1rem', fontWeight: 600 }} placeholder={t('articles.title_placeholder')} value={form.title} onChange={set('title')} />
          </div>

          <div className="form-group">
            <label className="form-label">{t('articles.excerpt_label')}</label>
            <textarea className="input" rows={2} placeholder={t('articles.excerpt_placeholder')} value={form.excerpt} onChange={set('excerpt')} />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>{preview ? t('articles.preview') : t('articles.content_label')}</label>
              {!preview && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title={t('articles.insert_image')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}
                  >
                    {uploading
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> {t('articles.uploading')}</>
                      : <><ImagePlus size={14} /> {t('articles.insert_image')}</>
                    }
                  </button>
                </>
              )}
            </div>
            {preview ? (
              <div className="card markdown-body" style={{ minHeight: 400, padding: 24 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content || t('articles.no_content')}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                className="input"
                style={{ minHeight: 480, fontFamily: 'var(--font-mono)', fontSize: '0.875rem', resize: 'vertical' }}
                placeholder={t('articles.content_placeholder')}
                value={form.content}
                onChange={set('content')}
              />
            )}
          </div>
        </div>

        {/* Sidebar settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">{t('common.status')}</label>
              <select className="input" value={form.status} onChange={set('status')}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('articles.category')}</label>
              <select className="input" value={form.categoryId} onChange={set('categoryId')}>
                <option value="">{t('articles.no_category')}</option>
                {categories?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('articles.tags')}</label>
              <input className="input" placeholder={t('articles.tags_placeholder')} value={form.tags} onChange={set('tags')} />
            </div>
          </div>

          <div className="card" style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
            <p style={{ marginBottom: 8, fontWeight: 500, color: 'var(--text-2)' }}>Markdown tips</p>
            <div style={{ fontFamily: 'var(--font-mono)', lineHeight: 2, fontSize: '0.75rem' }}>
              <div><code style={{ color: 'var(--accent)' }}># Heading 1</code></div>
              <div><code style={{ color: 'var(--accent)' }}>## Heading 2</code></div>
              <div><code style={{ color: 'var(--accent)' }}>**bold**</code></div>
              <div><code style={{ color: 'var(--accent)' }}>`code`</code></div>
              <div><code style={{ color: 'var(--accent)' }}>```bash</code></div>
              <div><code style={{ color: 'var(--accent)' }}>- list item</code></div>
              <div><code style={{ color: 'var(--accent)' }}>![alt](url)</code></div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

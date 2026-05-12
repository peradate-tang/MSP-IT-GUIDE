import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api, { BASE_URL } from '../../lib/api';
import { Save, ArrowLeft } from 'lucide-react';
import RichEditor from '../../components/RichEditor';

export default function ArticleEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = !id || id === 'new';
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

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
      const url = data.url.startsWith('http') ? data.url : `${BASE_URL}${data.url}`;
      setForm(f => ({ ...f, content: f.content + `<img src="${url}" alt="${file.name}" />` }));
    } catch (err: any) {
      setError(err?.response?.data?.message || t('articles.upload_error'));
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/upload/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data.url.startsWith('http') ? data.url : `${BASE_URL}${data.url}`;
      setForm(f => ({ ...f, content: f.content + `<video controls style="width:100%"><source src="${url}" type="${file.type}" /></video>` }));
    } catch (err: any) {
      setError(err?.response?.data?.message || t('articles.upload_error'));
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/upload/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const sizeKB = Math.round(data.size / 1024);
      const sizeLabel = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      setForm(f => ({
        ...f,
        content: f.content + `<p><a href="${data.url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:var(--bg-3);border:1px solid var(--border);border-radius:6px;text-decoration:none;color:var(--text);font-size:0.875rem;">📎 ${data.name} <span style="color:var(--text-3);font-size:0.75rem;">(${sizeLabel})</span></a></p>`,
      }));
    } catch (err: any) {
      setError(err?.response?.data?.message || t('articles.upload_error'));
    } finally {
      setUploadingFile(false);
    }
  };

  const handleImageUrl = () => {
    const url = window.prompt(t('articles.image_url_prompt'));
    if (!url) return;
    const alt = window.prompt(t('articles.image_alt_prompt')) || 'image';
    setForm(f => ({ ...f, content: f.content + `<img src="${url}" alt="${alt}" />` }));
  };

  const handleVideoUrl = () => {
    const url = window.prompt(t('articles.video_url_prompt'));
    if (!url) return;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) {
      setForm(f => ({ ...f, content: f.content + `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen></iframe>` }));
    } else {
      setForm(f => ({ ...f, content: f.content + `<video controls style="width:100%"><source src="${url}" /></video>` }));
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
            <input
              className="input"
              style={{ fontSize: '1.1rem', fontWeight: 600 }}
              placeholder={t('articles.title_placeholder')}
              value={form.title}
              onChange={set('title')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('articles.excerpt_label')}</label>
            <textarea
              className="input"
              rows={2}
              placeholder={t('articles.excerpt_placeholder')}
              value={form.excerpt}
              onChange={set('excerpt')}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: 6 }}>{t('articles.content_label')}</label>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoUpload} />
            <input ref={attachInputRef} type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
            <RichEditor
              content={form.content}
              onChange={(html) => setForm(f => ({ ...f, content: html }))}
              placeholder={t('articles.content_placeholder')}
              uploading={uploading}
              uploadingVideo={uploadingVideo}
              uploadingFile={uploadingFile}
              onImageUpload={() => fileInputRef.current?.click()}
              onVideoUpload={() => videoInputRef.current?.click()}
              onFileUpload={() => attachInputRef.current?.click()}
              onImageUrl={handleImageUrl}
              onVideoUrl={handleVideoUrl}
            />
          </div>
        </div>

        {/* Sidebar */}
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
                {Array.isArray(categories) && categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('articles.tags')}</label>
              <input
                className="input"
                placeholder={t('articles.tags_placeholder')}
                value={form.tags}
                onChange={set('tags')}
              />
            </div>
          </div>

          <div className="card" style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
            <p style={{ fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>เคล็ดลับ</p>
            <ul style={{ paddingLeft: 16, lineHeight: 2 }}>
              <li>Enter = ขึ้นบรรทัดใหม่</li>
              <li>Shift+Enter = บรรทัดใหม่ชิด</li>
              <li>เลือกข้อความแล้วกด B = ตัวหนา</li>
              <li>เลือกข้อความแล้วกด I = ตัวเอียง</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useTranslation } from 'react-i18next';
import api, { BASE_URL } from '../../lib/api';
import { Save, Eye, EyeOff, ArrowLeft, ImagePlus, Loader2, Bold, Italic, Code, Link, List, Heading2, Image } from 'lucide-react';

export default function ArticleEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = !id || id === 'new';
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
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

  const insertImageUrl = () => {
    const url = window.prompt(t('articles.image_url_prompt'));
    if (!url) return;
    const alt = window.prompt(t('articles.image_alt_prompt')) || 'image';
    insertAtCursor(`\n![${alt}](${url})\n`);
  };

  const insertVideoUrl = () => {
    const url = window.prompt(t('articles.video_url_prompt'));
    if (!url) return;
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) {
      insertAtCursor(`\n<iframe width="100%" height="400" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen></iframe>\n`);
      return;
    }
    // Direct video file
    insertAtCursor(`\n<video controls width="100%"><source src="${url}" /></video>\n`);
  };

  const wrapSelection = (before: string, after: string, placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = form.content.slice(start, end) || placeholder;
    const newContent = form.content.slice(0, start) + before + selected + after + form.content.slice(end);
    setForm(f => ({ ...f, content: newContent }));
    setTimeout(() => {
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selected.length;
      textarea.focus();
    }, 0);
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
      const videoUrl = data.url.startsWith('http') ? data.url : `${BASE_URL}${data.url}`;
      insertAtCursor(`\n<video controls width="100%"><source src="${videoUrl}" type="${file.type}" /></video>\n`);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('articles.upload_error'));
    } finally {
      setUploadingVideo(false);
    }
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
      const imageUrl = data.url.startsWith('http') ? data.url : `${BASE_URL}${data.url}`;
      insertAtCursor(`\n![${file.name}](${imageUrl})\n`);
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
            </div>
            {!preview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, flexWrap: 'wrap', padding: '4px 8px', background: 'var(--bg-3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoUpload} />
                <ToolbarBtn onClick={() => wrapSelection('**', '**', 'bold')} title="Bold"><Bold size={13} /></ToolbarBtn>
                <ToolbarBtn onClick={() => wrapSelection('*', '*', 'italic')} title="Italic"><Italic size={13} /></ToolbarBtn>
                <ToolbarBtn onClick={() => wrapSelection('`', '`', 'code')} title="Inline code"><Code size={13} /></ToolbarBtn>
                <ToolbarSep />
                <ToolbarBtn onClick={() => insertAtCursor('\n## Heading\n')} title="Heading"><Heading2 size={13} /></ToolbarBtn>
                <ToolbarBtn onClick={() => insertAtCursor('\n- item\n')} title="List"><List size={13} /></ToolbarBtn>
                <ToolbarBtn onClick={() => wrapSelection('[', '](url)', 'link text')} title="Link"><Link size={13} /></ToolbarBtn>
                <ToolbarSep />
                <ToolbarBtn onClick={insertImageUrl} title={t('articles.image_url_prompt')}><Image size={13} /></ToolbarBtn>
                <ToolbarBtn
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title={t('articles.insert_image')}
                >
                  {uploading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <ImagePlus size={13} />}
                </ToolbarBtn>
                <ToolbarBtn onClick={insertVideoUrl} title={t('articles.insert_video')}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>VDO</span>
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                  title={t('articles.upload_video')}
                >
                  {uploadingVideo
                    ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    : <span style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>↑VDO</span>
                  }
                </ToolbarBtn>
              </div>
            )}
            <div>
              {preview ? (
                <div className="card markdown-body" style={{ minHeight: 400, padding: 24 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{form.content || t('articles.no_content')}</ReactMarkdown>
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

function ToolbarBtn({ onClick, title, disabled, children }: { onClick: () => void; title?: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '4px 6px', borderRadius: 4, color: 'var(--text-2)',
        display: 'flex', alignItems: 'center', opacity: disabled ? 0.5 : 1,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px' }} />;
}

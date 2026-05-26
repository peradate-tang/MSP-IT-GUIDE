import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const ALL_PERMS = ['articles:read', 'articles:write', 'articles:delete', 'categories:write', 'users:read'];

function RoleModal({ role, onClose }: { role: any; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isNew = !role?.id;
  const [form, setForm] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || [],
    allowedDepartments: role?.allowedDepartments || [],
  });
  const [error, setError] = useState('');

  const { data: departments = [] } = useQuery<string[]>({
    queryKey: ['user-departments'],
    queryFn: () => api.get('/users/departments').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: () => isNew ? api.post('/roles', form) : api.put(`/roles/${role.id}`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); onClose(); },
    onError: (e: any) => setError(e?.response?.data?.message || t('common.error')),
  });

  const togglePerm = (p: string) => setForm(f => ({
    ...f,
    permissions: f.permissions.includes(p) ? f.permissions.filter((x: string) => x !== p) : [...f.permissions, p],
  }));

  const toggleDept = (d: string) => setForm(f => ({
    ...f,
    allowedDepartments: f.allowedDepartments.includes(d)
      ? f.allowedDepartments.filter((x: string) => x !== d)
      : [...f.allowedDepartments, d],
  }));

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isNew ? t('admin.roles.new') : t('common.edit')}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">{t('admin.roles.name_label')}</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.name')}</label>
            <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('admin.roles.permissions_label')}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="checkbox"
                  checked={form.permissions.includes('*')}
                  onChange={() => togglePerm('*')}
                />
                <strong style={{ color: 'var(--accent)' }}>* — {t('admin.roles.all_permissions')}</strong>
              </label>
              {!form.permissions.includes('*') && ALL_PERMS.map(p => (
                <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.permissions.includes(p)} onChange={() => togglePerm(p)} />
                  <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{p}</code>
                </label>
              ))}
            </div>
          </div>
          <div className="form-group" style={{
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '12px 14px',
          }}>
            <label className="form-label" style={{ marginBottom: 4 }}>แผนกที่ดูแลได้</label>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginBottom: 10 }}>
              ถ้าไม่เลือก = ใช้แผนกของตัวเอง
            </p>
            {departments.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>ไม่พบข้อมูลแผนก</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {departments.map((d: string) => (
                  <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.allowedDepartments.includes(d)}
                      onChange={() => toggleDept(d)}
                    />
                    <span style={{ color: 'var(--text-1)' }}>{d}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRolesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState<any>(null);

  const { data: roles, isLoading } = useQuery({ queryKey: ['roles'], queryFn: () => api.get('/roles').then(r => r.data) });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/roles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });

  return (
    <div>
      {modal !== null && <RoleModal role={modal} onClose={() => setModal(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 style={{ flex: 1, fontSize: '1.1rem', fontWeight: 700 }}>{t('admin.roles.title')}</h1>
        <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={15} /> {t('admin.roles.new')}</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? <div className="spinner" style={{ margin: '0 auto' }} /> :
          roles?.map((r: any) => (
            <div key={r.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span className={`badge badge-${r.name}`} style={{ fontSize: '0.8rem' }}>{r.name}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>{r.description}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {r.permissions?.map((p: string) => (
                      <code key={p} style={{
                        fontSize: '0.75rem', padding: '2px 8px',
                        background: p === '*' ? 'var(--accent-dim)' : 'var(--bg-3)',
                        color: p === '*' ? 'var(--accent)' : 'var(--text-2)',
                        border: `1px solid ${p === '*' ? 'rgba(0,212,255,0.2)' : 'var(--border)'}`,
                        borderRadius: 4, fontFamily: 'var(--font-mono)',
                      }}>{p}</code>
                    ))}
                  </div>
                  {r.allowedDepartments && r.allowedDepartments.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {r.allowedDepartments.map((d: string) => (
                        <span key={d} style={{
                          fontSize: '0.72rem', padding: '2px 8px',
                          background: 'rgba(99,102,241,0.15)',
                          color: 'rgb(129,140,248)',
                          border: '1px solid rgba(99,102,241,0.3)',
                          borderRadius: 12,
                        }}>{d}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setModal(r)}><Pencil size={13} /></button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                    onClick={() => confirm(t('admin.roles.confirm_delete', { name: r.name })) && deleteMutation.mutate(r.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

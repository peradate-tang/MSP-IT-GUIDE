import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

const ALL_PERMS = [
  { value: 'admin:access', label: 'เข้าหน้า Admin Panel (จัดการผู้ใช้/role/หมวดหมู่/รายงาน)' },
  { value: 'articles:write', label: 'สร้าง/แก้ไขบทความ' },
  { value: 'articles:delete', label: 'ลบบทความ' },
  { value: 'categories:write', label: 'จัดการหมวดหมู่' },
  { value: 'users:read', label: 'ดูรายชื่อผู้ใช้งาน' },
];

function RoleModal({ role, onClose }: { role: any; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isNew = !role?.id;
  const [form, setForm] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || [],
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => isNew ? api.post('/roles', form) : api.put(`/roles/${role.id}`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); onClose(); },
    onError: (e: any) => setError(e?.response?.data?.message || t('common.error')),
  });

  const togglePerm = (p: string) => setForm(f => ({
    ...f,
    permissions: f.permissions.includes(p) ? f.permissions.filter((x: string) => x !== p) : [...f.permissions, p],
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
              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', margin: '-4px 0 4px 24px', lineHeight: 1.6 }}>
                ⚠️ ติ๊กนี้ = สิทธิ์เท่า admin ทุกอย่าง รวมถึงเข้าหน้า Admin Panel และแก้ไข/ลบบทความได้ทุกหมวดหมู่ (ข้ามข้อจำกัดแผนก)
                ถ้าต้องการแค่ให้เข้าหน้า Admin ได้แต่ยังจำกัดตามแผนกอยู่ ให้ติ๊กเฉพาะ "เข้าหน้า Admin Panel" ด้านล่างแทน
              </p>
              {!form.permissions.includes('*') && ALL_PERMS.map(p => (
                <label key={p.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.permissions.includes(p.value)} onChange={() => togglePerm(p.value)} />
                  <span>{p.label}</span>
                  <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-3)', fontSize: '0.72rem' }}>{p.value}</code>
                </label>
              ))}
            </div>
          </div>
          <div style={{
            background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '10px 14px', fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.6,
          }}>
            หมวดหมู่ที่แต่ละคนแก้ไขได้ ตอนนี้ผูกกับ "แผนก" ของ user แต่ละคนโดยตรง (ไปตั้งค่าได้ที่หน้า ผู้ใช้งาน)
            ไม่ได้กำหนดผ่าน role อีกต่อไป — role มีไว้กำหนดแค่ระดับสิทธิ์ (admin / editor) เท่านั้น
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
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [deleteError, setDeleteError] = useState('');

  const { data: roles, isLoading } = useQuery({ queryKey: ['roles'], queryFn: () => api.get('/roles').then(r => r.data) });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/roles/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); setConfirmDelete(null); },
    onError: (e: any) => { setDeleteError(e?.response?.data?.message || t('common.error')); setConfirmDelete(null); },
  });

  return (
    <div>
      {modal !== null && <RoleModal role={modal} onClose={() => setModal(null)} />}
      {confirmDelete && (
        <ConfirmDialog
          title={t('common.confirm_delete')}
          message={t('admin.roles.confirm_delete', { name: confirmDelete.name })}
          onConfirm={() => deleteMutation.mutate(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {deleteError && (
        <div className="alert alert-error" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{deleteError}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setDeleteError('')}><X size={14} /></button>
        </div>
      )}

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
                        border: `1px solid ${p === '*' ? 'rgba(21,156,147,0.3)' : 'var(--border)'}`,
                        borderRadius: 4, fontFamily: 'var(--font-mono)',
                      }}>{p}</code>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setModal(r)}><Pencil size={13} /></button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                    onClick={() => setConfirmDelete(r)}>
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

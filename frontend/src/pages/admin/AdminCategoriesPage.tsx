import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

function CatModal({ cat, onClose }: { cat: any; onClose: () => void }) {
  const qc = useQueryClient();
  const isNew = !cat?.id;
  const [form, setForm] = useState({ name: cat?.name || '', description: cat?.description || '', icon: cat?.icon || '📁', sortOrder: cat?.sortOrder || 0 });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => isNew ? api.post('/categories', form) : api.put(`/categories/${cat.id}`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); onClose(); },
    onError: (e: any) => setError(e?.response?.data?.message || 'เกิดข้อผิดพลาด'),
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }));

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isNew ? 'สร้างหมวดหมู่' : 'แก้ไขหมวดหมู่'}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">ไอคอน</label>
              <input className="input" style={{ fontSize: '1.5rem', textAlign: 'center' }} value={form.icon} onChange={set('icon')} maxLength={2} />
            </div>
            <div className="form-group">
              <label className="form-label">ชื่อหมวดหมู่</label>
              <input className="input" value={form.name} onChange={set('name')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">คำอธิบาย</label>
            <input className="input" value={form.description} onChange={set('description')} />
          </div>
          <div className="form-group">
            <label className="form-label">ลำดับการแสดง</label>
            <input className="input" type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<any>(null);

  const { data: categories, isLoading } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data) });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });

  return (
    <div>
      {modal !== null && <CatModal cat={modal} onClose={() => setModal(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 style={{ flex: 1, fontSize: '1.1rem', fontWeight: 700 }}>จัดการหมวดหมู่</h1>
        <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={15} /> เพิ่มหมวดหมู่</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>หมวดหมู่</th>
              <th>คำอธิบาย</th>
              <th>ลำดับ</th>
              <th style={{ textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : categories?.map((c: any) => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.4rem' }}>{c.icon}</span>
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>{c.description}</td>
                <td style={{ fontSize: '0.875rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{c.sortOrder}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setModal(c)}><Pencil size={13} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                      onClick={() => confirm(`ลบหมวดหมู่ "${c.name}" ?`) && deleteMutation.mutate(c.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

function UserModal({ user, roles, onClose }: { user: any; roles: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const isNew = !user?.id;
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    fullName: user?.fullName || '',
    password: '',
    roleId: user?.role?.id || '',
    isActive: user?.isActive ?? true,
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const payload: any = { ...form, roleId: Number(form.roleId) };
      if (!payload.password) delete payload.password;
      if (isNew) return api.post('/users', payload);
      return api.put(`/users/${user.id}`, payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); onClose(); },
    onError: (e: any) => setError(e?.response?.data?.message || 'เกิดข้อผิดพลาด'),
  });

  const set = (f: string) => (e: any) => setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isNew ? 'เพิ่มผู้ใช้ใหม่' : 'แก้ไขผู้ใช้'}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">ชื่อผู้ใช้</label>
            <input className="input" value={form.username} onChange={set('username')} disabled={!isNew} />
          </div>
          <div className="form-group">
            <label className="form-label">อีเมล</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} />
          </div>
          <div className="form-group">
            <label className="form-label">ชื่อ-นามสกุล</label>
            <input className="input" value={form.fullName} onChange={set('fullName')} />
          </div>
          <div className="form-group">
            <label className="form-label">{isNew ? 'รหัสผ่าน' : 'รหัสผ่านใหม่ (ว่างถ้าไม่เปลี่ยน)'}</label>
            <input className="input" type="password" value={form.password} onChange={set('password')} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="input" value={form.roleId} onChange={set('roleId')}>
              <option value="">— เลือก role —</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={set('isActive')} />
            <label htmlFor="isActive" style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>เปิดใช้งาน</label>
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

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<any>(null);

  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users').then(r => r.data) });
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: () => api.get('/roles').then(r => r.data) });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div>
      {modal !== null && <UserModal user={modal} roles={roles || []} onClose={() => setModal(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 style={{ flex: 1, fontSize: '1.1rem', fontWeight: 700 }}>จัดการผู้ใช้งาน</h1>
        <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={15} /> เพิ่มผู้ใช้</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>ผู้ใช้</th>
              <th>อีเมล</th>
              <th>Role</th>
              <th>สถานะ</th>
              <th>สร้างเมื่อ</th>
              <th style={{ textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : users?.map((u: any) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-dim)',
                      border: '1px solid var(--accent)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, flexShrink: 0,
                    }}>{u.username[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{u.fullName || u.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>{u.email}</td>
                <td><span className={`badge badge-${u.role?.name}`}>{u.role?.name || '—'}</span></td>
                <td>
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: u.isActive ? 'var(--success)' : 'var(--danger)', marginRight: 6,
                  }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{u.isActive ? 'ใช้งาน' : 'ระงับ'}</span>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{new Date(u.createdAt).toLocaleDateString('th-TH')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setModal(u)}><Pencil size={13} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                      onClick={() => confirm(`ลบผู้ใช้ "${u.username}" ?`) && deleteMutation.mutate(u.id)}>
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

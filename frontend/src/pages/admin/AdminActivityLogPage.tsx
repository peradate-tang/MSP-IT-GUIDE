import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { History, FilePlus, FilePen, Trash2 } from 'lucide-react';

const ENTITY_LABELS: Record<string, string> = {
  article: 'บทความ',
  category: 'หมวดหมู่',
  user: 'ผู้ใช้งาน',
  role: 'Role',
};

const ACTION_META: Record<string, { label: string; icon: any; color: string }> = {
  create: { label: 'สร้าง', icon: FilePlus, color: 'var(--success)' },
  update: { label: 'แก้ไข', icon: FilePen, color: 'var(--accent)' },
  delete: { label: 'ลบ', icon: Trash2, color: 'var(--danger)' },
};

export default function AdminActivityLogPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['activity-log', page, entityType, action],
    queryFn: () => api.get('/activity-log', { params: { page, limit: 30, entityType: entityType || undefined, action: action || undefined } }).then(r => r.data),
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <History size={20} style={{ color: 'var(--accent)' }} />
        <h1 style={{ flex: 1, fontSize: '1.1rem', fontWeight: 700 }}>{t('nav.admin_activity_log')}</h1>
        <select className="input" style={{ width: 160 }} value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1); }}>
          <option value="">ทุกประเภท</option>
          <option value="article">บทความ</option>
          <option value="category">หมวดหมู่</option>
          <option value="user">ผู้ใช้งาน</option>
          <option value="role">Role</option>
        </select>
        <select className="input" style={{ width: 140 }} value={action} onChange={e => { setAction(e.target.value); setPage(1); }}>
          <option value="">ทุกการกระทำ</option>
          <option value="create">สร้าง</option>
          <option value="update">แก้ไข</option>
          <option value="delete">ลบ</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>การกระทำ</th>
              <th>รายละเอียด</th>
              <th style={{ width: 140 }}>โดย</th>
              <th style={{ width: 160 }}>เวลา</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>{t('common.noData')}</td></tr>
            ) : data?.data?.map((log: any) => {
              const meta = ACTION_META[log.action] || ACTION_META.update;
              const Icon = meta.icon;
              return (
                <tr key={log.id}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: meta.color, fontWeight: 600, fontSize: '0.8rem' }}>
                      <Icon size={13} /> {meta.label}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-3)' }}>{ENTITY_LABELS[log.entityType] || log.entityType}</span>
                    {' '}<strong>{log.entityLabel || `#${log.entityId}`}</strong>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>@{log.username}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(log.createdAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data?.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← ก่อนหน้า</button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-3)', padding: '0 8px' }}>
            หน้า {page} / {data.totalPages}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>ถัดไป →</button>
        </div>
      )}
    </div>
  );
}

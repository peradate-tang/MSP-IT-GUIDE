import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ConciergeBell, Mail, ArrowLeft } from 'lucide-react';
import api from '../../lib/api';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.post('/auth/forgot-password', { identifier }),
    onSuccess: () => setDone(true),
    onError: (e: any) => setError(e?.response?.data?.message || t('common.error')),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate();
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(var(--bg) 1px, transparent 1px), linear-gradient(90deg, var(--bg) 1px, transparent 1px), var(--bg-3)`,
      backgroundSize: '24px 24px', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, background: 'var(--accent)', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: 'var(--shadow-md)',
          }}>
            <ConciergeBell size={24} color="#FFFBF2" />
          </div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>ลืมรหัสผ่าน</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>กรอก username หรืออีเมลที่ผูกกับบัญชีของคุณ</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {done ? (
            <div className="alert alert-success" style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Mail size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>ถ้ามีบัญชีนี้อยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลที่ผูกไว้แล้ว กรุณาตรวจสอบกล่องจดหมาย (รวมถึงถังขยะ/สแปม)</span>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Username หรือ อีเมล</label>
                <input
                  className="input"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="username หรือ you@hotel.com"
                  required
                  autoFocus
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <><div className="spinner" style={{ width: 16, height: 16 }} /> กำลังส่ง...</> : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> {t('login.submit')}
          </Link>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ConciergeBell, Lock, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.post('/auth/reset-password', { token, newPassword: password }),
    onSuccess: () => setDone(true),
    onError: (e: any) => setError(e?.response?.data?.message || 'เกิดข้อผิดพลาด'),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }
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
          <h1 style={{ fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>ตั้งรหัสผ่านใหม่</h1>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!token ? (
            <div className="alert alert-error">ลิงก์ไม่ถูกต้อง — ไม่พบ token กรุณาขอลิงก์รีเซ็ตรหัสผ่านใหม่อีกครั้ง</div>
          ) : done ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <CheckCircle2 size={40} style={{ color: 'var(--success)' }} />
              <p style={{ fontSize: '0.9rem' }}>ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว</p>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/login')}>เข้าสู่ระบบ</button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">รหัสผ่านใหม่</label>
                <input
                  className="input" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  required autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">ยืนยันรหัสผ่านใหม่</label>
                <input
                  className="input" type="password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                  required
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <><div className="spinner" style={{ width: 16, height: 16 }} /> กำลังบันทึก...</> : (
                  <><Lock size={15} /> ตั้งรหัสผ่านใหม่</>
                )}
              </button>
            </form>
          )}
        </div>

        {!done && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>กลับไปหน้าเข้าสู่ระบบ</Link>
          </div>
        )}
      </div>
    </div>
  );
}

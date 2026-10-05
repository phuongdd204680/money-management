import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  Lock, 
  Mail, 
  Key, 
  Check, 
  AlertCircle, 
  ExternalLink,
  Sparkles,
  Database,
  HelpCircle
} from 'lucide-react';
import { 
  signIn, 
  signUp, 
  resendConfirmationEmail,
  isSupabaseConfigured, 
  getSupabaseCredentials, 
  saveSupabaseCredentials 
} from '../services/supabase';

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess
}) {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup' | 'config'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Supabase Config state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setSupabaseUrl(creds.url || '');
      setSupabaseAnonKey(creds.anonKey || '');
      setMessage({ text: '', type: '' });

      if (!isSupabaseConfigured()) {
        setTab('config');
      } else {
        setTab('signin');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setMessage({ text: 'Vui lòng điền đủ Supabase Project URL và Anon Key', type: 'error' });
      return;
    }

    const ok = saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
    if (ok) {
      setMessage({ text: 'Lưu cấu hình Supabase thành công! Giờ bạn có thể Đăng ký / Đăng nhập.', type: 'success' });
      setTimeout(() => {
        setTab('signin');
        setMessage({ text: '', type: '' });
      }, 1200);
    } else {
      setMessage({ text: 'Không thể lưu cấu hình, vui lòng thử lại', type: 'error' });
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setLoading(true);

    try {
      if (tab === 'signup') {
        if (password.length < 6) {
          setMessage({ text: 'Mật khẩu phải có ít nhất 6 ký tự', type: 'error' });
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setMessage({ text: 'Mật khẩu xác nhận không khớp', type: 'error' });
          setLoading(false);
          return;
        }

        const { data, error } = await signUp(email, password);
        if (error) throw error;

        // Nếu Supabase đã tắt tính năng bắt buộc xác nhận email, user sẽ có session ngay
        if (data.session) {
          setMessage({ text: 'Đăng ký thành công! Đang tự động đăng nhập...', type: 'success' });
          setTimeout(() => {
            onAuthSuccess(data.user);
            onClose();
          }, 800);
          return;
        }

        setMessage({ 
          text: `Đăng ký thành công! Supabase đã gửi email kích hoạt đến "${email}". Vui lòng kiểm tra hộp thư (cả mục Spam). Hoặc bạn có thể vào Supabase Dashboard > Authentication > Users > chọn "Confirm user" để kích hoạt ngay.`, 
          type: 'success' 
        });
      } else if (tab === 'signin') {
        const { data, error } = await signIn(email, password);
        if (error) throw error;

        setMessage({ text: 'Đăng nhập thành công! Đang đồng bộ dữ liệu...', type: 'success' });
        setTimeout(() => {
          onAuthSuccess(data.user);
          onClose();
        }, 800);
      }
    } catch (err) {
      const errMsg = err.message || '';
      if (errMsg.toLowerCase().includes('email not confirmed')) {
        setMessage({ 
          text: `Tài khoản "${email}" chưa được kích hoạt email! \n\n👉 Cách 1 (Nhanh nhất): Mở Supabase Dashboard > Authentication > Users > bấm [...] cạnh tài khoản > chọn "Confirm user". \n👉 Cách 2: Kiểm tra hộp thư Gmail (kể cả mục Thư rác/Spam) để bấm link kích hoạt.`, 
          type: 'error',
          canResend: true
        });
      } else if (errMsg.toLowerCase().includes('invalid login credentials')) {
        setMessage({ text: 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.', type: 'error' });
      } else {
        setMessage({ text: errMsg || 'Đã có lỗi xảy ra', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await resendConfirmationEmail(email);
      alert(`Đã gửi lại link kích hoạt đến ${email}! Hãy kiểm tra hộp thư đến và mục Spam.`);
    } catch (err) {
      alert('Không thể gửi lại email: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const configured = isSupabaseConfigured();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content auth-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="tab-pill-group">
            <button
              id="tab-auth-signin"
              className={`tab-pill ${tab === 'signin' ? 'active-pill' : ''}`}
              onClick={() => { setTab('signin'); setMessage({ text: '', type: '' }); }}
              disabled={!configured}
            >
              <Lock size={15} />
              <span>Đăng Nhập</span>
            </button>

            <button
              id="tab-auth-signup"
              className={`tab-pill ${tab === 'signup' ? 'active-pill' : ''}`}
              onClick={() => { setTab('signup'); setMessage({ text: '', type: '' }); }}
              disabled={!configured}
            >
              <Sparkles size={15} />
              <span>Đăng Ký</span>
            </button>

            <button
              id="tab-auth-config"
              className={`tab-pill ${tab === 'config' ? 'active-pill' : ''}`}
              onClick={() => { setTab('config'); setMessage({ text: '', type: '' }); }}
            >
              <Database size={15} />
              <span>Kết Nối Supabase</span>
            </button>
          </div>

          <button className="btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Thông báo Alert */}
        {message.text && (
          <div className={`auth-alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'} mx-6 mt-4`}>
            {message.type === 'error' ? <AlertCircle size={20} className="flex-shrink-0" /> : <Check size={20} className="flex-shrink-0" />}
            <div className="flex-1">
              <div style={{ whiteSpace: 'pre-line' }}>{message.text}</div>
              {message.canResend && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm mt-2 text-xs"
                  onClick={handleResendEmail}
                  disabled={loading}
                >
                  📩 Gửi lại link kích hoạt vào email này
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 1 & 2: SIGN IN / SIGN UP FORM */}
        {(tab === 'signin' || tab === 'signup') && (
          <form onSubmit={handleAuth} className="modal-body">
            <div className="auth-header-desc mb-4 text-center">
              <div className="auth-cloud-badge">
                <Cloud size={24} className="text-primary-color" />
              </div>
              <h3 className="text-lg font-bold mt-2">
                {tab === 'signin' ? 'Đăng Nhập Tài Khoản Đám Mây' : 'Tạo Tài Khoản Mới'}
              </h3>
              <p className="text-muted text-xs mt-1">
                Dữ liệu tài chính sẽ được lưu vào PostgreSQL Cloud an toàn, đồng bộ tức thì trên mọi thiết bị.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Email *</label>
              <div className="input-with-icon">
                <Mail size={16} className="text-muted input-icon" />
                <input
                  id="input-auth-email"
                  type="email"
                  className="form-control pl-10"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Mật khẩu *</label>
              <div className="input-with-icon">
                <Lock size={16} className="text-muted input-icon" />
                <input
                  id="input-auth-password"
                  type="password"
                  className="form-control pl-10"
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {tab === 'signup' && (
              <div className="form-group">
                <label className="form-label text-xs">Xác nhận mật khẩu *</label>
                <div className="input-with-icon">
                  <Key size={16} className="text-muted input-icon" />
                  <input
                    id="input-auth-confirm-password"
                    type="password"
                    className="form-control pl-10"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="modal-footer pt-4">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Đóng
              </button>
              <button 
                id="btn-submit-auth"
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : tab === 'signin' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: CẤU HÌNH SUPABASE */}
        {tab === 'config' && (
          <form onSubmit={handleSaveConfig} className="modal-body">
            <div className="supabase-guide-box card mb-4">
              <div className="flex-center gap-2 mb-1">
                <Sparkles size={16} className="text-warning" />
                <h4 className="font-bold text-sm">Cách kết nối Supabase miễn phí:</h4>
              </div>
              <ol className="guide-steps text-xs text-muted">
                <li>1. Truy cập <b><a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-primary-color underline">supabase.com</a></b> và tạo 1 Project miễn phí (chọn Singapore để có tốc độ nhanh nhất).</li>
                <li>2. Vào <b>Project Settings &gt; API</b>, sao chép <b>Project URL</b> và <b>anon public key</b> dán vào bên dưới.</li>
                <li>3. Mở mục <b>SQL Editor</b> trên Supabase, dán đoạn mã trong file <code>supabase_schema.sql</code> và bấm <b>Run</b>.</li>
              </ol>
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Supabase Project URL *</label>
              <input
                id="input-supabase-url"
                type="url"
                className="form-control text-xs"
                placeholder="https://your-project-id.supabase.co"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Supabase Anon Public Key *</label>
              <textarea
                id="input-supabase-anon-key"
                rows="3"
                className="form-control text-xs font-mono"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={e => setSupabaseAnonKey(e.target.value)}
                required
              />
            </div>

            <div className="modal-footer pt-3">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Hủy bỏ
              </button>
              <button id="btn-save-supabase-config" type="submit" className="btn btn-primary">
                <Check size={16} />
                <span>Lưu & Kích Hoạt Database</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

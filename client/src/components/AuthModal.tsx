import { useState } from 'react';
import type { BirthInfo } from '../types';
import { authApi } from '../services/api';
import { X, Mail, Lock, User, Calendar } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 로그인 폼
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // 회원가입 폼
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    birthInfo: {
      year: 1990,
      month: 1,
      day: 1,
      hour: 12,
      isLunar: false,
      gender: 'male' as 'male' | 'female'
    }
  });

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authApi.login(loginData.email, loginData.password);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    try {
      await authApi.register({
        email: registerData.email,
        password: registerData.password,
        name: registerData.name,
        birthInfo: registerData.birthInfo
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 모드 전환 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'login' ? 'bg-primary-600' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'register' ? 'bg-primary-600' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            회원가입
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                이메일
              </label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4" />
                비밀번호
              </label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                이름
              </label>
              <input
                type="text"
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                이메일
              </label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4" />
                비밀번호
              </label>
              <input
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                className="input-field"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4" />
                비밀번호 확인
              </label>
              <input
                type="password"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                className="input-field"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                생년월일시 (만세력 계산용)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input
                  type="number"
                  value={registerData.birthInfo.year}
                  onChange={(e) => setRegisterData({
                    ...registerData,
                    birthInfo: { ...registerData.birthInfo, year: parseInt(e.target.value) }
                  })}
                  placeholder="년도"
                  className="input-field"
                  required
                />
                <input
                  type="number"
                  value={registerData.birthInfo.month}
                  onChange={(e) => setRegisterData({
                    ...registerData,
                    birthInfo: { ...registerData.birthInfo, month: parseInt(e.target.value) }
                  })}
                  placeholder="월"
                  min="1"
                  max="12"
                  className="input-field"
                  required
                />
                <input
                  type="number"
                  value={registerData.birthInfo.day}
                  onChange={(e) => setRegisterData({
                    ...registerData,
                    birthInfo: { ...registerData.birthInfo, day: parseInt(e.target.value) }
                  })}
                  placeholder="일"
                  min="1"
                  max="31"
                  className="input-field"
                  required
                />
              </div>
              <select
                value={registerData.birthInfo.hour}
                onChange={(e) => setRegisterData({
                  ...registerData,
                  birthInfo: { ...registerData.birthInfo, hour: parseInt(e.target.value) }
                })}
                className="input-field mb-2"
                required
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i}시</option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRegisterData({
                    ...registerData,
                    birthInfo: { ...registerData.birthInfo, isLunar: false }
                  })}
                  className={`flex-1 py-2 rounded-lg ${
                    !registerData.birthInfo.isLunar ? 'bg-primary-600' : 'bg-white/10'
                  }`}
                >
                  양력
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterData({
                    ...registerData,
                    birthInfo: { ...registerData.birthInfo, isLunar: true }
                  })}
                  className={`flex-1 py-2 rounded-lg ${
                    registerData.birthInfo.isLunar ? 'bg-primary-600' : 'bg-white/10'
                  }`}
                >
                  음력
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-2">성별</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRegisterData({
                    ...registerData,
                    birthInfo: { ...registerData.birthInfo, gender: 'male' }
                  })}
                  className={`flex-1 py-2 rounded-lg ${
                    registerData.birthInfo.gender === 'male' ? 'bg-primary-600' : 'bg-white/10'
                  }`}
                >
                  남성
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterData({
                    ...registerData,
                    birthInfo: { ...registerData.birthInfo, gender: 'female' }
                  })}
                  className={`flex-1 py-2 rounded-lg ${
                    registerData.birthInfo.gender === 'female' ? 'bg-primary-600' : 'bg-white/10'
                  }`}
                >
                  여성
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? '회원가입 중...' : '회원가입'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { authApi } from '../services/api';
import KakaoLoginButton from './KakaoLoginButton';
import GoogleLoginButton from './GoogleLoginButton';
import { X, Mail, Lock, User, Calendar } from 'lucide-react';
import { MBTI_TYPES, MBTI_DESCRIPTIONS } from '../types';
import type { MBTIType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  notice?: string; // 카카오 로그인에서 돌아온 안내(취소·실패 등)
}

export default function AuthModal({ isOpen, onClose, onSuccess, notice }: AuthModalProps) {
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
      hour: undefined as number | undefined,
      isLunar: false,
      isLeapMonth: false,
      gender: 'male' as 'male' | 'female'
    }
  });
  const [registerMbti, setRegisterMbti] = useState<MBTIType | ''>('');
  const [providers, setProviders] = useState({ kakao: false, google: false });

  // 서버에 키가 설정된 소셜 로그인 버튼만 보여 준다
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    authApi
      .getProviders()
      .then((result) => {
        if (active) setProviders(result);
      })
      .catch(() => {
        if (active) setProviders({ kakao: false, google: false });
      });
    return () => {
      active = false;
    };
  }, [isOpen]);
  const [agreed, setAgreed] = useState(false);

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

    if (!agreed) {
      setError('이용약관과 개인정보 수집·이용에 동의해 주세요.');
      setLoading(false);
      return;
    }

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
        birthInfo: registerData.birthInfo,
        mbti: registerMbti || undefined,
        agreeTerms: true
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

        {notice && !error && (
          <div className="bg-white/5 border border-white/20 rounded-lg p-3 mb-4" role="status">
            <p className="text-white/80 text-sm">{notice}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {(providers.kakao || providers.google) && (
          <div className="mb-5">
            <div className="space-y-2">
              {providers.kakao && <KakaoLoginButton />}
              {providers.google && <GoogleLoginButton />}
            </div>
            <p className="mt-2 text-center text-xs text-white/50 break-keep">
              {mode === 'login' ? '처음이면 소셜 계정으로 바로 가입할 수 있어요.' : '이메일·비밀번호 없이 소셜 계정으로 가입해요.'}
            </p>
            <div className="mt-5 flex items-center gap-3 text-xs text-white/40">
              <span className="h-px flex-1 bg-white/10" />
              또는 이메일로
              <span className="h-px flex-1 bg-white/10" />
            </div>
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
                value={registerData.birthInfo.hour ?? ''}
                onChange={(e) => {
                  const hourValue: number | undefined = e.target.value ? parseInt(e.target.value) : undefined;
                  setRegisterData({
                    ...registerData,
                    birthInfo: { ...registerData.birthInfo, hour: hourValue }
                  });
                }}
                className="input-field mb-2 text-white"
                style={{ color: 'white' }}
              >
                <option value="" className="text-gray-800">모름 (시주 제외)</option>
                <option value={0} className="text-gray-800">자시 (子時) - 밤 11:30 ~ 새벽 1:30</option>
                <option value={2} className="text-gray-800">축시 (丑時) - 새벽 1:30 ~ 3:30</option>
                <option value={4} className="text-gray-800">인시 (寅時) - 새벽 3:30 ~ 5:30</option>
                <option value={6} className="text-gray-800">묘시 (卯時) - 아침 5:30 ~ 7:30</option>
                <option value={8} className="text-gray-800">진시 (辰時) - 아침 7:30 ~ 9:30</option>
                <option value={10} className="text-gray-800">사시 (巳時) - 오전 9:30 ~ 11:30</option>
                <option value={12} className="text-gray-800">오시 (午時) - 낮 11:30 ~ 오후 1:30</option>
                <option value={14} className="text-gray-800">미시 (未時) - 오후 1:30 ~ 3:30</option>
                <option value={16} className="text-gray-800">신시 (申時) - 오후 3:30 ~ 5:30</option>
                <option value={18} className="text-gray-800">유시 (酉時) - 저녁 5:30 ~ 7:30</option>
                <option value={20} className="text-gray-800">술시 (戌時) - 저녁 7:30 ~ 9:30</option>
                <option value={22} className="text-gray-800">해시 (亥時) - 밤 9:30 ~ 11:30</option>
              </select>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRegisterData({
                    ...registerData,
                    birthInfo: { ...registerData.birthInfo, isLunar: false, isLeapMonth: false }
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
              
              {/* 윤달 체크박스 (음력일 때만 표시) */}
              {registerData.birthInfo.isLunar && (
                <div className="mt-2 p-2 bg-white/5 rounded-lg">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="registerIsLeapMonth"
                      checked={registerData.birthInfo.isLeapMonth || false}
                      onChange={(e) => setRegisterData({
                        ...registerData,
                        birthInfo: { ...registerData.birthInfo, isLeapMonth: e.target.checked }
                      })}
                      className="w-4 h-4 mt-0.5 rounded border-white/30 bg-white/10 text-primary-600"
                    />
                    <label htmlFor="registerIsLeapMonth" className="text-sm text-white/90 cursor-pointer flex-1">
                      <span className="font-semibold">윤달 (閏月)</span>
                      <span className="block text-xs text-white/60">확실히 아는 경우만 체크</span>
                      <span className="block text-xs text-green-400">💡 모르면 비워두세요 (자동 판단)</span>
                    </label>
                  </div>
                </div>
              )}
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

            <div>
              <label className="block mb-2 text-sm">
                MBTI <span className="text-white/50">(선택사항)</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {MBTI_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRegisterMbti(p => p === type ? '' : type)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      registerMbti === type
                        ? 'bg-primary-600 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/15'
                    }`}
                    title={MBTI_DESCRIPTIONS[type].name}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {registerMbti && (
                <p className="text-xs text-primary-400 mt-1.5">
                  선택됨: {registerMbti} ({MBTI_DESCRIPTIONS[registerMbti].name} {MBTI_DESCRIPTIONS[registerMbti].emoji})
                </p>
              )}
            </div>

            {/* 필수 동의 — 약관과 방침은 새 탭으로 열어 입력하던 내용이 사라지지 않게 한다 */}
            <div className="flex items-start gap-2 p-3 bg-white/5 rounded-lg">
              <input
                type="checkbox"
                id="registerAgree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-white/30 bg-white/10 text-primary-600"
              />
              <label htmlFor="registerAgree" className="text-sm text-white/90 cursor-pointer flex-1 break-keep">
                만 14세 이상이며,{' '}
                <a href="/?page=terms" target="_blank" rel="noopener" className="underline hover:text-white">
                  이용약관
                </a>
                과{' '}
                <a href="/?page=privacy" target="_blank" rel="noopener" className="underline hover:text-white">
                  개인정보 수집·이용
                </a>
                에 동의합니다. (필수)
                <span className="block text-xs text-white/60 mt-1">
                  리딩을 만들기 위해 이름·사주 분석 결과·질문이 해외의 인공지능 서비스로 전송됩니다.
                </span>
              </label>
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

import { useRef, useState } from 'react';
import axios from 'axios';
import { User } from 'lucide-react';
import BirthInfoForm from '../components/BirthInfoForm';
import { authApi, sajuApi, type KakaoSignupProfile } from '../services/api';
import { MBTI_TYPES, MBTI_DESCRIPTIONS } from '../types';
import type { BirthInfo, MBTIType, ZodiacInfo } from '../types';

interface KakaoSignupPageProps {
  ticket: string;
  bind: string; // 로그인을 시작한 브라우저 표시 (서버가 표와 맞춰 본다)
  profile: KakaoSignupProfile;
  onDone: () => void;
  onCancel: () => void;
}

const errorMessage = (error: unknown): string => {
  const serverMessage = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
  return typeof serverMessage === 'string' ? serverMessage : '가입을 마치지 못했어요. 잠시 후 다시 시도해 주세요.';
};

export default function KakaoSignupPage({ ticket, bind, profile, onDone, onCancel }: KakaoSignupPageProps) {
  const [step, setStep] = useState<'birth' | 'mbti'>('birth');
  const [name, setName] = useState(profile.nickname);
  // 2단계에서 이전으로 돌아오면 입력했던 값을 그대로 보여 준다
  const [birthInfo, setBirthInfo] = useState<BirthInfo | undefined>(undefined);
  const [zodiac, setZodiac] = useState<ZodiacInfo | null | 'loading'>('loading');
  const [mbti, setMbti] = useState<MBTIType | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const zodiacRequest = useRef(0); // 이전으로 돌아가 다시 고르면 늦게 온 예전 결과를 버린다

  const handleBirthSubmit = (info: BirthInfo) => {
    setBirthInfo(info);
    setError('');
    setStep('mbti');
    // 별자리는 생일로 정해진다. 음력이면 서버가 양력으로 바꿔 계산한다
    setZodiac('loading');
    const requestId = ++zodiacRequest.current;
    sajuApi
      .analyze(info)
      .then((analysis) => {
        if (requestId === zodiacRequest.current) setZodiac(analysis.zodiac ?? null);
      })
      .catch(() => {
        if (requestId === zodiacRequest.current) setZodiac(null);
      });
  };

  const handleComplete = async () => {
    if (!birthInfo) return;
    if (!agreed) {
      setError('이용약관과 개인정보 수집·이용에 동의해 주세요.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await authApi.kakaoComplete({ ticket, bind, name: name.trim(), birthInfo, mbti: mbti || undefined, agreeTerms: true });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabel = (
    <p className="mb-3 text-center text-sm text-white/50">
      가입 마무리 {step === 'birth' ? 1 : 2}/2
    </p>
  );

  if (step === 'birth') {
    return (
      <div>
        {stepLabel}
        <BirthInfoForm
          initialValue={birthInfo}
          title="생년월일 입력"
          intro={<p>카카오로 로그인했어요. 사주와 별자리를 볼 생년월일을 알려 주세요.</p>}
          submitLabel="다음"
          note="생년월일은 사주와 별자리 계산에 쓰이고, 가입하면 내 정보에 저장돼요."
          onSubmit={handleBirthSubmit}
        >
          <div>
            <label htmlFor="kakao-signup-name" className="flex items-center gap-2 mb-3 text-lg font-semibold">
              <User className="w-5 h-5" />
              이름
            </label>
            <input
              id="kakao-signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              className="input-field"
              required
            />
          </div>
        </BirthInfoForm>
        <div className="mt-4 text-center">
          <button type="button" onClick={onCancel} className="text-sm text-white/50 underline-offset-4 hover:text-white/80 hover:underline">
            가입 그만두기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      {stepLabel}
      <div className="card">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-2 break-keep">MBTI를 알려 주세요</h2>
        <p className="mb-5 text-center text-sm text-white/70 break-keep">리딩에 성향을 함께 반영해요. 모르면 비워 두고 가입해도 돼요.</p>

        {/* 별자리: 계산 중에도 같은 높이를 유지해 화면이 흔들리지 않게 한다 */}
        <div className="mb-6 flex min-h-[4.5rem] items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-4 py-3" aria-live="polite">
          {zodiac === 'loading' ? (
            <p className="text-sm text-white/60">생일로 별자리를 찾고 있어요…</p>
          ) : zodiac ? (
            <>
              <span className="text-3xl leading-none" aria-hidden="true">{zodiac.symbol}</span>
              <div>
                <p className="text-sm text-white/60">별자리는 생일로 정해졌어요</p>
                <p className="text-lg font-semibold">{zodiac.sign}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-white/60">별자리는 가입하면 생일로 정해져요.</p>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {MBTI_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={mbti === type}
              onClick={() => setMbti((current) => (current === type ? '' : type))}
              className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mbti === type ? 'bg-primary-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
              title={MBTI_DESCRIPTIONS[type].name}
            >
              {type}
            </button>
          ))}
        </div>
        <p className="mt-2 min-h-[1.25rem] text-sm text-primary-400">
          {mbti ? `선택됨: ${mbti} (${MBTI_DESCRIPTIONS[mbti].name})` : ''}
        </p>

        {/* 필수 동의 — 약관과 방침은 새 탭으로 열어 입력하던 내용이 사라지지 않게 한다 */}
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-white/5 p-3">
          <input
            type="checkbox"
            id="kakaoAgree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded"
          />
          <label htmlFor="kakaoAgree" className="flex-1 cursor-pointer text-sm text-white/90 break-keep">
            만 14세 이상이며,{' '}
            <a href="/?page=terms" target="_blank" rel="noopener" className="underline hover:text-white">
              이용약관
            </a>
            과{' '}
            <a href="/?page=privacy" target="_blank" rel="noopener" className="underline hover:text-white">
              개인정보 수집·이용
            </a>
            에 동의합니다. (필수)
            <span className="mt-1 block text-xs text-white/60">
              리딩을 만들기 위해 이름·사주 분석 결과·질문이 해외의 인공지능 서비스로 전송됩니다.
            </span>
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500 bg-red-500/20 p-3" role="alert">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setStep('birth')}
            disabled={submitting}
            className="rounded-lg bg-white/10 px-5 py-3 text-white/80 transition-colors hover:bg-white/15 disabled:opacity-50"
          >
            이전
          </button>
          <button type="button" onClick={handleComplete} disabled={submitting} className="flex-1 btn-primary py-3">
            {submitting ? '가입하는 중…' : mbti ? '가입하고 시작하기' : 'MBTI 없이 가입하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import type { CustomSpreadDesign, SpreadChatMessage } from '../types';
import { Loader2, MessagesSquare, Send, X } from 'lucide-react';
import { aiApi } from '../services/api';

interface CustomSpreadBuilderProps {
  question: string;
  onConfirm: (design: CustomSpreadDesign) => void;
  onCancel: () => void;
}

const MAX_USER_TURNS = 5;
const MAX_SENT_MESSAGES = 10; // 서버 제한과 같음
const QUICK_REQUESTS = ['카드 수를 줄여줘', '시기도 같이 보고 싶어', '조언해 줄 자리를 넣어줘'];
const ERROR_MESSAGE = '배치를 만들지 못했어요. 잠시 후 다시 시도해 주세요.';

// AI와 대화하며 질문에 맞는 카드 자리(2~7개)를 만드는 패널. 타로 입력 폼 안에 들어간다
export default function CustomSpreadBuilder({ question, onConfirm, onCancel }: CustomSpreadBuilderProps) {
  const [messages, setMessages] = useState<SpreadChatMessage[]>([]);
  const [design, setDesign] = useState<CustomSpreadDesign | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const startedRef = useRef(false);

  const userTurns = messages.filter(m => m.role === 'user').length;
  const canAsk = userTurns < MAX_USER_TURNS;

  // 첫 제안 (개발 모드 StrictMode의 이중 실행 방지)
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    aiApi.designSpread(question, [], null)
      .then(result => {
        setDesign(result);
        setMessages([{ role: 'assistant', content: result.message }]);
      })
      .catch((e: unknown) => setError(e instanceof Error && e.message ? e.message : ERROR_MESSAGE))
      .finally(() => setLoading(false));
  }, [question]);

  const requestChange = async (text: string) => {
    const content = text.trim();
    if (!content || loading || !canAsk) return;

    const nextMessages: SpreadChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError('');
    try {
      const result = await aiApi.designSpread(question, nextMessages.slice(-MAX_SENT_MESSAGES), design);
      setDesign(result);
      setMessages([...nextMessages, { role: 'assistant', content: result.message }]);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border-2 border-mystical-gold/40 bg-primary-900/30 p-4 md:p-5" aria-label="맞춤 배치 만들기">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold text-mystical-gold">
          <MessagesSquare className="h-5 w-5" aria-hidden="true" />
          맞춤 배치 만들기
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="맞춤 배치 닫기"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-1 truncate text-sm text-white/60" title={question}>질문: "{question}"</p>

      {/* 대화 */}
      <ol className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1" aria-live="polite">
        {messages.map((message, i) => (
          <li
            key={i}
            className={`max-w-[85%] break-keep rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'ml-auto rounded-br-sm bg-primary-600/50 text-white'
                : 'mr-auto rounded-bl-sm bg-white/10 text-white/90'
            }`}
          >
            {message.content}
          </li>
        ))}
        {loading && (
          <li className="mr-auto flex items-center gap-2 rounded-2xl rounded-bl-sm bg-white/10 px-3 py-2 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            배치를 짜고 있어요...
          </li>
        )}
      </ol>

      {/* 현재 배치 미리보기 */}
      {design && (
        <div className="mt-4 rounded-lg bg-black/20 p-3">
          <p className="font-serif text-lg font-semibold text-white">
            {design.name}
            <span className="ml-2 font-sans text-sm font-normal text-white/60">{design.positions.length}장</span>
          </p>
          <ol className="mt-2 space-y-1.5">
            {design.positions.map((position, i) => (
              <li key={position.label} className="flex gap-2 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mystical-gold text-[11px] font-bold text-mystical-dark">
                  {i + 1}
                </span>
                <span className="break-keep">
                  <span className="font-semibold text-mystical-gold">{position.label}</span>
                  {position.meaning && <span className="text-white/80"> · {position.meaning}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      {/* 수정 요청 */}
      {canAsk ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_REQUESTS.map(request => (
              <button
                key={request}
                type="button"
                disabled={loading || !design}
                onClick={() => requestChange(request)}
                className="min-h-[44px] rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                {request}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                // 바깥 타로 폼이 제출되지 않게 Enter를 여기서 처리
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  requestChange(input);
                }
              }}
              maxLength={200}
              disabled={loading || !design}
              placeholder="바꾸고 싶은 점을 말해 주세요"
              aria-label="배치 수정 요청"
              className="input-field py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => requestChange(input)}
              disabled={loading || !design || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 transition-colors hover:bg-primary-500 disabled:opacity-50"
              aria-label="수정 요청 보내기"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </>
      ) : (
        <p className="mt-3 text-xs text-white/60">수정은 {MAX_USER_TURNS}번까지 할 수 있어요. 지금 배치로 뽑거나, 닫고 다시 만들어 주세요.</p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => design && onConfirm(design)}
          disabled={!design || loading}
          className="btn-primary flex-1 whitespace-nowrap disabled:opacity-50"
        >
          이 배치로 카드 뽑기
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="whitespace-nowrap rounded-xl bg-white/10 px-5 py-3 text-white/80 transition-colors hover:bg-white/20"
        >
          취소
        </button>
      </div>
    </section>
  );
}

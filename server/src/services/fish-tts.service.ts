// Fish Audio 음성 합성 (리딩을 상담사 목소리로 들려주기)
// 문서: https://docs.fish.audio — POST /v1/tts, Bearer 키, model 헤더로 모델 선택
const TTS_URL = 'https://api.fish.audio/v1/tts';
// 무료 모델. model 헤더가 없거나 틀리면 유료 s2.1-pro로 청구되므로 값을 고정한다
const FISH_MODEL = 's2.1-pro-free';
// 상담사 목소리 (Fish 음성 라이브러리 id). FISH_VOICE_ID로 바꿀 수 있다
const DEFAULT_VOICE_ID = 'a1c0ed3c68454ad3a8a75a5364e6becf'; // 차분하고 따뜻한 여성 목소리
const REQUEST_TIMEOUT_MS = 90_000; // 무료 모델은 1분 분량에 40초 넘게 걸리기도 한다
const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // 1분 안팎(64kbps면 0.5MB)을 크게 넘으면 받지 않는다

export const isFishConfigured = (): boolean => Boolean(process.env.FISH_API_KEY);

export const synthesizeSpeech = async (text: string): Promise<Buffer> => {
  const key = process.env.FISH_API_KEY;
  if (!key) throw new Error('FISH_API_KEY가 설정되지 않았습니다.');

  const response = await fetch(TTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      model: FISH_MODEL,
    },
    body: JSON.stringify({
      text,
      reference_id: process.env.FISH_VOICE_ID || DEFAULT_VOICE_ID,
      format: 'mp3',
      mp3_bitrate: 64, // 말소리에는 충분하고 파일이 절반으로 준다
      normalize: true,
      latency: 'normal',
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  // 오류 본문에는 요청 내용이 들어 있을 수 있어 상태 코드만 남긴다
  if (!response.ok) throw new Error(`Fish 음성 합성 실패 (${response.status})`);

  const declared = Number(response.headers.get('content-length'));
  if (declared > MAX_AUDIO_BYTES) throw new Error('Fish 음성이 너무 큽니다.');
  const audio = Buffer.from(await response.arrayBuffer());
  if (audio.length === 0) throw new Error('Fish 음성 합성 결과가 비어 있습니다.');
  if (audio.length > MAX_AUDIO_BYTES) throw new Error('Fish 음성이 너무 큽니다.');
  return audio;
};

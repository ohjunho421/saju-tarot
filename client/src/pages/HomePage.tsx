import { Sparkles, Moon, Star } from 'lucide-react';

interface HomePageProps {
  onStart: () => void;
}

export default function HomePage({ onStart }: HomePageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Hero Section */}
      <div className="text-center mb-8 md:mb-12">
        <div className="flex justify-center gap-4 md:gap-6 mb-4 md:mb-6">
          <Star className="w-10 h-10 md:w-12 md:h-12 text-mystical-gold animate-pulse" />
          <Moon className="w-12 h-12 md:w-16 md:h-16 text-primary-400" />
          <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-mystical-bronze animate-pulse" />
        </div>
        
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 px-4">
          당신의 운명을 탐험하세요
        </h2>
        <p className="text-base md:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto px-4">
          사주 만세력 분석과 타로 카드의 신비로운 조화로
          당신의 과거, 현재, 미래를 들여다봅니다.
        </p>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
        <div className="card text-center">
          <div className="text-4xl mb-3">🔮</div>
          <h3 className="text-xl font-semibold mb-2">사주 만세력</h3>
          <p className="text-white/70">
            생년월일시를 기반으로 한 정통 사주 분석
          </p>
        </div>

        <div className="card text-center">
          <div className="text-4xl mb-3">🎴</div>
          <h3 className="text-xl font-semibold mb-2">타로 리딩</h3>
          <p className="text-white/70">
            다양한 스프레드로 진행되는 타로 카드 해석
          </p>
        </div>

        <div className="card text-center">
          <div className="text-4xl mb-3">✨</div>
          <h3 className="text-xl font-semibold mb-2">통합 해석</h3>
          <p className="text-white/70">
            동서양 점술의 융합으로 깊이 있는 인사이트
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center px-4">
        <button
          onClick={onStart}
          className="btn-primary text-base md:text-lg px-8 md:px-12 py-3 md:py-4 transform hover:scale-105 w-full md:w-auto"
        >
          운세 보러 가기
        </button>
        <p className="text-mystical-gold text-xs md:text-sm mt-3 font-semibold">
          🔐 로그인이 필요한 서비스입니다
        </p>
        <p className="text-white/50 text-xs md:text-sm mt-2">
          * 정확한 해석을 위해 생년월일시를 정확히 입력해주세요
        </p>
      </div>

      {/* How it works */}
      <div className="mt-12 md:mt-16 card">
        <h3 className="text-2xl font-semibold mb-6 text-center">이용 방법</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold mb-1">생년월일시 입력</h4>
              <p className="text-white/70">음력/양력, 성별, 태어난 시간을 정확히 입력합니다.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold mb-1">사주 분석</h4>
              <p className="text-white/70">만세력을 계산하여 당신의 오행 균형과 성격을 분석합니다.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold mb-1">타로 선택</h4>
              <p className="text-white/70">질문을 정하고 원하는 스프레드를 선택하여 카드를 뽑습니다.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h4 className="font-semibold mb-1">통합 해석</h4>
              <p className="text-white/70">사주와 타로를 종합한 맞춤형 해석과 조언을 받습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

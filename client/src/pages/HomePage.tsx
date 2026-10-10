import { motion } from 'framer-motion';
import { Sparkles, Moon, Star, ArrowRight, Wand2, Eye, CirclePause } from 'lucide-react';

interface HomePageProps {
  onStart: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' as const },
  }),
};

// 결과 화면 "쉽게 보기"를 줄여 보여주는 정적 예시
const SAMPLE_STEPS = [
  { label: '이 카드는', text: '조용히 정보를 모으면 답이 보인다는 카드예요.' },
  { label: '나에게는', text: '바로 결정하기보다 한 달 정도 살펴보면 더 좋은 선택지가 생겨요.' },
  { label: '오늘 해볼 것', text: '관심 있는 회사 두 곳의 채용 공고 저장해 두기' },
];

export default function HomePage({ onStart }: HomePageProps) {
  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        className="text-center pt-8 pb-12 md:pt-16 md:pb-20 relative"
      >
        {/* 배경 글로우 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-600/15 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[200px] h-[200px] bg-mystical-gold/10 rounded-full blur-[80px]" />
        </div>

        <motion.div
          variants={fadeUp}
          custom={0}
          className="flex justify-center gap-6 md:gap-8 mb-8 relative"
        >
          <Star className="w-8 h-8 md:w-10 md:h-10 text-mystical-gold/80 animate-pulse" />
          <Moon className="w-14 h-14 md:w-20 md:h-20 text-primary-300 drop-shadow-[0_0_20px_rgba(167,139,250,0.4)]" />
          <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-mystical-bronze/80 animate-pulse" />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          custom={1}
          className="text-3xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight"
        >
          <span className="bg-gradient-to-r from-mystical-gold via-yellow-300 to-mystical-bronze bg-clip-text text-transparent">
            별사탕
          </span>
          <br />
          <span className="bg-gradient-to-r from-white via-primary-200 to-white bg-clip-text text-transparent text-2xl md:text-4xl lg:text-5xl">
            별자리 &middot; 사주 &middot; 타로
          </span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          custom={2}
          className="text-base md:text-xl text-white/70 max-w-xl mx-auto leading-relaxed mb-10 break-keep"
        >
          궁금한 걸 적고 카드를 뽑으면,
          <br className="hidden md:block" />
          {' '}생년월일로 본 내 성향까지 함께 읽어서 쉬운 말로 풀어드려요.
        </motion.p>

        <motion.div variants={fadeUp} custom={3}>
          <button
            onClick={onStart}
            className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold text-lg px-10 py-4 rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_50px_rgba(124,58,237,0.5)] hover:scale-[1.03]"
          >
            운세 보러 가기
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
          <p className="text-white/60 text-xs mt-4">
            로그인하면 바로 시작할 수 있어요. 타로나 사주를 몰라도 괜찮아요.
          </p>
        </motion.div>
      </motion.div>

      {/* 결과 예시 */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="mb-16 md:mb-24"
        aria-labelledby="sample-title"
      >
        <motion.h3
          id="sample-title"
          variants={fadeUp}
          custom={0}
          className="text-2xl md:text-3xl font-bold mb-2 text-center text-white/90"
        >
          이렇게 풀어드려요
        </motion.h3>
        <motion.p variants={fadeUp} custom={0} className="text-sm text-white/60 text-center mb-8">
          실제 결과 화면의 일부를 줄여서 보여드린 예시예요.
        </motion.p>

        <motion.div
          variants={fadeUp}
          custom={1}
          className="max-w-2xl mx-auto rounded-2xl border-2 border-mystical-gold/40 bg-primary-900/20 p-5 md:p-7"
        >
          <p className="text-sm text-white/60">질문: 이직, 지금 해도 될까요?</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-sm font-semibold text-amber-200">
            <CirclePause className="h-4 w-4" aria-hidden="true" />
            잠깐 기다려요
          </span>
          <p className="mt-3 break-keep font-serif text-2xl font-semibold leading-snug text-white md:text-3xl">
            서두르지 말고 한 달만 지켜보세요
          </p>

          <div className="mt-6 flex items-start gap-4">
            <div className="flex w-20 shrink-0 aspect-[2/3] items-center justify-center rounded-lg border border-mystical-gold/50 bg-gradient-to-br from-purple-700 via-indigo-800 to-purple-900 p-1.5 md:w-24" aria-hidden="true">
              <div className="flex h-full w-full items-center justify-center rounded border-2 border-mystical-gold/30">
                <Sparkles className="h-5 w-5 text-mystical-gold/60" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/60">미래 자리</p>
              <p className="font-serif text-lg font-semibold text-mystical-gold">여사제</p>
              <ol className="mt-2 space-y-2 border-l border-mystical-gold/30 pl-4">
                {SAMPLE_STEPS.map((step, i) => (
                  <li key={step.label} className="relative">
                    <span
                      className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-mystical-gold text-[10px] font-bold text-mystical-dark"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <p className="text-xs font-semibold text-white/60">{step.label}</p>
                    <p className="break-keep text-[15px] leading-relaxed text-white/90">{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Features */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid md:grid-cols-3 gap-5 md:gap-6 mb-16 md:mb-24"
      >
        {[
          {
            icon: <Star className="w-7 h-7" />,
            title: '별자리',
            desc: '생일로 내 별자리를 찾아서, 타고난 성향을 리딩에 함께 반영해요.',
            color: 'from-sky-500/20 to-cyan-500/20',
            border: 'border-sky-500/20 hover:border-sky-400/40',
            iconBg: 'bg-sky-500/15 text-sky-400',
          },
          {
            icon: <Wand2 className="w-7 h-7" />,
            title: '사주',
            desc: '태어난 해·달·날·시간으로 나무·불·흙·쇠·물 다섯 기운 중 무엇이 많고 적은지 알려드려요.',
            color: 'from-violet-500/20 to-purple-500/20',
            border: 'border-violet-500/20 hover:border-violet-400/40',
            iconBg: 'bg-violet-500/15 text-violet-400',
          },
          {
            icon: <Eye className="w-7 h-7" />,
            title: '타로',
            desc: '질문에 맞는 카드 배치로 뽑고, 한 줄 결론과 카드별 쉬운 풀이를 받아요.',
            color: 'from-indigo-500/20 to-blue-500/20',
            border: 'border-indigo-500/20 hover:border-indigo-400/40',
            iconBg: 'bg-indigo-500/15 text-indigo-400',
          },
        ].map((feature, i) => (
          <motion.div
            key={feature.title}
            variants={fadeUp}
            custom={i}
            className={`bg-gradient-to-br ${feature.color} backdrop-blur-sm rounded-2xl p-6 border ${feature.border} transition-all duration-300 hover:translate-y-[-2px]`}
          >
            <div className={`inline-flex p-3 rounded-xl ${feature.iconBg} mb-4`}>
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
            <p className="text-sm text-white/70 leading-relaxed break-keep">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* How it works */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="mb-16"
      >
        <motion.h3
          variants={fadeUp}
          custom={0}
          className="text-2xl md:text-3xl font-bold mb-10 text-center"
        >
          <span className="text-white/90">이용 방법</span>
        </motion.h3>

        <div className="grid md:grid-cols-4 gap-4 md:gap-5">
          {[
            { num: '01', title: '생년월일 입력', desc: '태어난 날과 시간을 입력해요. 시간을 몰라도 괜찮아요.' },
            { num: '02', title: '타고난 성향 확인', desc: '나에게 많은 기운과 부족한 기운을 먼저 보여드려요.' },
            { num: '03', title: '질문 적고 카드 뽑기', desc: '궁금한 걸 적으면 맞는 카드 배치를 추천해 드려요.' },
            { num: '04', title: '쉬운 풀이 받기', desc: '한 줄 결론, 카드별 뜻, 오늘 해볼 일까지 정리해 드려요.' },
          ].map((item, i) => (
            <motion.div
              key={item.num}
              variants={fadeUp}
              custom={i}
              className="relative bg-white/[0.04] backdrop-blur-sm rounded-2xl p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
            >
              <span className="text-3xl font-bold text-primary-500/30 mb-3 block">
                {item.num}
              </span>
              <h4 className="font-semibold mb-1.5 text-white/90">{item.title}</h4>
              <p className="text-sm text-white/60 leading-relaxed break-keep">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

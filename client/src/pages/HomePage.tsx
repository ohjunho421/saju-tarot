import { motion } from 'framer-motion';
import { Sparkles, Moon, Star, ArrowRight, Wand2, Eye, Layers } from 'lucide-react';

interface HomePageProps {
  onStart: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' },
  }),
};

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
          <span className="bg-gradient-to-r from-white via-primary-200 to-white bg-clip-text text-transparent">
            당신의 운명을
          </span>
          <br />
          <span className="bg-gradient-to-r from-mystical-gold via-yellow-300 to-mystical-bronze bg-clip-text text-transparent">
            탐험하세요
          </span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          custom={2}
          className="text-base md:text-xl text-white/60 max-w-xl mx-auto leading-relaxed mb-10"
        >
          사주 만세력과 타로 카드의 신비로운 조화로
          <br className="hidden md:block" />
          과거, 현재, 미래를 들여다봅니다.
        </motion.p>

        <motion.div variants={fadeUp} custom={3}>
          <button
            onClick={onStart}
            className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold text-lg px-10 py-4 rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_50px_rgba(124,58,237,0.5)] hover:scale-[1.03]"
          >
            운세 보러 가기
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
          <p className="text-white/40 text-xs mt-4">
            로그인 후 AI 기반 맞춤 해석을 받아보세요
          </p>
        </motion.div>
      </motion.div>

      {/* Features */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid md:grid-cols-3 gap-5 md:gap-6 mb-16 md:mb-24"
      >
        {[
          {
            icon: <Wand2 className="w-7 h-7" />,
            title: '사주 만세력',
            desc: '생년월일시 기반 정통 사주 분석으로 오행의 균형을 파악합니다',
            color: 'from-violet-500/20 to-purple-500/20',
            border: 'border-violet-500/20 hover:border-violet-400/40',
            iconBg: 'bg-violet-500/15 text-violet-400',
          },
          {
            icon: <Eye className="w-7 h-7" />,
            title: '타로 리딩',
            desc: '다양한 스프레드로 깊이 있는 타로 카드 해석을 제공합니다',
            color: 'from-indigo-500/20 to-blue-500/20',
            border: 'border-indigo-500/20 hover:border-indigo-400/40',
            iconBg: 'bg-indigo-500/15 text-indigo-400',
          },
          {
            icon: <Layers className="w-7 h-7" />,
            title: '통합 해석',
            desc: '동서양 점술의 융합으로 개인 맞춤형 인사이트를 전달합니다',
            color: 'from-amber-500/20 to-orange-500/20',
            border: 'border-amber-500/20 hover:border-amber-400/40',
            iconBg: 'bg-amber-500/15 text-amber-400',
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
            <p className="text-sm text-white/55 leading-relaxed">{feature.desc}</p>
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
            { num: '01', title: '생년월일 입력', desc: '음력/양력, 성별, 시간을 입력합니다' },
            { num: '02', title: '사주 분석', desc: '만세력 기반 오행 균형과 성격을 분석합니다' },
            { num: '03', title: '타로 선택', desc: '질문을 정하고 스프레드를 선택합니다' },
            { num: '04', title: '통합 해석', desc: '사주+타로 융합 맞춤 해석을 받습니다' },
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
              <p className="text-sm text-white/45 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

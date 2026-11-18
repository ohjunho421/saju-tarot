import { useRef, type CSSProperties } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowRight, CirclePause, Star } from 'lucide-react';
import '@fontsource/gowun-batang/400.css';
import '@fontsource/gowun-batang/700.css';

interface HomePageProps {
  onStart: () => void;
}

// 제목은 카드 그림 속 고전 세리프 글자와 어울리는 한글 세리프로
const DISPLAY = "font-['Gowun_Batang',serif]";
const CARD_RATIO = 574 / 320;

type Plane = 'far' | 'mid' | 'near';

interface TableCard {
  file: string;
  plane: Plane;
  pos: CSSProperties;
  width: string;
  rotate: number;
  from: { x: number; y: number }; // 탁자 가운데에서 놓일 때 출발하는 방향
  show: string; // 화면 너비별로 보일지
  eager?: boolean;
}

const NEAR = 'clamp(96px, 11vw, 156px)';
const MID = 'clamp(84px, 8.5vw, 120px)';
const FAR = 'clamp(72px, 7vw, 100px)';
const NEAR_M = 'clamp(70px, 21vw, 92px)';
const MID_M = 'clamp(60px, 17vw, 78px)';

// 처음 보이는 탁자. 가운데는 글을 위해 비워 둔다
const TABLE: TableCard[] = [
  { file: '08-strength', plane: 'far', pos: { left: '25%', bottom: '0%' }, width: FAR, rotate: -6, from: { x: 100, y: -140 }, show: 'hidden md:block' },
  { file: '02-high-priestess', plane: 'far', pos: { right: '26%', bottom: '1%' }, width: FAR, rotate: 6, from: { x: -100, y: -140 }, show: 'hidden md:block' },
  { file: '00-fool', plane: 'mid', pos: { left: '20%', top: '1%' }, width: MID, rotate: 4, from: { x: 120, y: 140 }, show: 'hidden md:block' },
  { file: '03-empress', plane: 'mid', pos: { right: '20%', top: '0%' }, width: MID, rotate: -5, from: { x: -120, y: 140 }, show: 'hidden md:block' },
  { file: '17-star', plane: 'mid', pos: { left: '2.5%', top: '43%' }, width: MID, rotate: 13, from: { x: 260, y: 0 }, show: 'hidden lg:block' },
  { file: '01-magician', plane: 'mid', pos: { right: '2.5%', top: '42%' }, width: MID, rotate: -12, from: { x: -260, y: 0 }, show: 'hidden lg:block' },
  { file: '19-sun', plane: 'near', pos: { left: '3%', top: '9%' }, width: NEAR, rotate: -10, from: { x: 220, y: 120 }, show: 'hidden md:block' },
  { file: '18-moon', plane: 'near', pos: { right: '4%', top: '7%' }, width: NEAR, rotate: 9, from: { x: -220, y: 120 }, show: 'hidden md:block' },
  { file: '06-lovers', plane: 'near', pos: { left: '7%', bottom: '5%' }, width: NEAR, rotate: 7, from: { x: 200, y: -120 }, show: 'hidden md:block' },
  { file: '10-wheel', plane: 'near', pos: { right: '8%', bottom: '3%' }, width: NEAR, rotate: -8, from: { x: -200, y: -120 }, show: 'hidden md:block' },
  // 휴대폰: 위·아래 띠에만 놓는다
  { file: '19-sun', plane: 'near', pos: { left: '-5%', top: '1%' }, width: NEAR_M, rotate: -12, from: { x: 120, y: 160 }, show: 'md:hidden', eager: true },
  { file: '00-fool', plane: 'mid', pos: { left: '36%', top: '-3%' }, width: MID_M, rotate: 3, from: { x: 0, y: 180 }, show: 'md:hidden', eager: true },
  { file: '18-moon', plane: 'near', pos: { right: '-5%', top: '3%' }, width: NEAR_M, rotate: 10, from: { x: -120, y: 160 }, show: 'md:hidden', eager: true },
  { file: '06-lovers', plane: 'near', pos: { left: '-3%', bottom: '1%' }, width: NEAR_M, rotate: 8, from: { x: 120, y: -160 }, show: 'md:hidden', eager: true },
  { file: '17-star', plane: 'mid', pos: { left: '38%', bottom: '-4%' }, width: MID_M, rotate: -4, from: { x: 0, y: -180 }, show: 'md:hidden', eager: true },
  { file: '10-wheel', plane: 'near', pos: { right: '-4%', bottom: '2%' }, width: NEAR_M, rotate: -9, from: { x: -120, y: -160 }, show: 'md:hidden', eager: true },
];

// 카드는 화면 크기 묶음(휴대폰/그 외) 안에서 한 장씩 놓인다
const isMobileCard = (card: TableCard) => card.show === 'md:hidden';
const dealDelay = (card: TableCard) =>
  0.12 + TABLE.filter(c => isMobileCard(c) === isMobileCard(card)).indexOf(card) * 0.06;

// 가까운 층일수록 크고 선명하고, 스크롤에 빨리 움직인다
const PLANE_STYLE: Record<Plane, { className: string; travel: number }> = {
  far: { className: 'opacity-60 blur-[1px]', travel: -40 },
  mid: { className: 'opacity-85', travel: -90 },
  near: { className: '', travel: -160 },
};

// 결과 화면 "쉽게 보기"를 줄여 보여주는 정적 예시
const SAMPLE_STEPS = [
  { label: '이 카드는', text: '조용히 정보를 모으면 답이 보인다는 카드예요.' },
  { label: '나에게는', text: '바로 결정하기보다 한 달 정도 살펴보면 더 좋은 선택지가 생겨요.' },
  { label: '오늘 해볼 것', text: '관심 있는 회사 두 곳의 채용 공고 저장해 두기' },
];

const STEPS = [
  { title: '생년월일 입력', desc: '태어난 날과 시간을 입력해요. 시간을 몰라도 괜찮아요.' },
  { title: '타고난 성향 확인', desc: '나에게 많은 기운과 부족한 기운을 먼저 보여드려요.' },
  { title: '질문 적고 카드 뽑기', desc: '궁금한 걸 적으면 맞는 카드 배치를 추천해 드려요.' },
  { title: '쉬운 풀이 받기', desc: '한 줄 결론, 카드별 뜻, 오늘 해볼 일까지 정리해 드려요.' },
];

const cardSrc = (file: string) => `/landing/cards/${file}.webp`;

function StartButton({ onStart }: HomePageProps) {
  return (
    <button
      type="button"
      onClick={onStart}
      className="group inline-flex items-center gap-2.5 rounded-xl bg-mystical-gold px-8 py-4 text-lg font-semibold text-mystical-dark shadow-[0_10px_30px_-10px_rgba(212,175,55,0.55)] transition-colors duration-200 hover:bg-[#e2c25a] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mystical-gold focus-visible:ring-offset-4 focus-visible:ring-offset-mystical-dark"
    >
      운세 보러 가기
      <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
    </button>
  );
}

function PlaneLayer({ plane, progress, reduce }: { plane: Plane; progress: MotionValue<number>; reduce: boolean }) {
  const { className, travel } = PLANE_STYLE[plane];
  const y = useTransform(progress, [0, 1], [0, reduce ? 0 : travel]);
  const cards = TABLE.filter(card => card.plane === plane);

  return (
    <motion.div className={`absolute inset-0 ${className}`} style={{ y }}>
      {cards.map(card => (
        <motion.div
          key={`${card.file}-${card.show}`}
          className={`absolute ${card.show}`}
          style={{ ...card.pos, width: card.width }}
          initial={reduce ? false : { opacity: 0, x: card.from.x, y: card.from.y, rotate: 0, scale: 0.82 }}
          animate={{ opacity: 1, x: 0, y: 0, rotate: card.rotate, scale: 1 }}
          transition={{ type: 'spring', stiffness: 110, damping: 18, delay: dealDelay(card) }}
        >
          <img
            src={cardSrc(card.file)}
            width={320}
            height={Math.round(320 * CARD_RATIO)}
            alt=""
            loading={card.eager ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            className="block h-auto w-full rounded-md shadow-[0_22px_40px_-14px_rgba(6,6,18,0.9)]"
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

function HeroTable({ onStart }: HomePageProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  return (
    <section
      ref={ref}
      aria-labelledby="hero-title"
      className="relative -mx-4 flex min-h-[max(640px,calc(100dvh_-_5.5rem))] items-center justify-center overflow-hidden px-4 sm:mx-0 md:min-h-[max(620px,calc(100dvh_-_7rem))]"
    >
      {/* 탁자 위 등불 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_42%,rgba(212,175,55,0.10),transparent_70%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {(['far', 'mid', 'near'] as Plane[]).map(plane => (
          <PlaneLayer key={plane} plane={plane} progress={scrollYProgress} reduce={reduce} />
        ))}
      </div>
      {/* 글이 놓이는 가운데는 카드 위로 탁자 색을 한 겹 깔아 읽히게 한다 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_62%_26%_at_50%_50%,rgba(26,26,46,0.94),rgba(26,26,46,0.55)_60%,transparent_100%)] md:bg-[radial-gradient(ellipse_30%_34%_at_50%_50%,rgba(26,26,46,0.94),rgba(26,26,46,0.55)_60%,transparent_100%)]" />

      <div className="relative z-10 max-w-[34rem] text-center">
        <h2 id="hero-title" className={`${DISPLAY} break-keep text-balance text-[2.5rem] font-bold leading-[1.15] tracking-[-0.02em] text-white md:text-6xl`}>
          내 마음을 먼저
          <br />
          알아주는 타로
        </h2>
        <p className="mx-auto mt-5 max-w-[28rem] break-keep text-base leading-relaxed text-white/75 md:text-lg">
          궁금한 걸 적고 카드를 뽑으면, 생년월일로 읽은 별자리와 사주 성향까지 함께 보고 쉬운 말로 풀어드려요.
        </p>
        <div className="mt-8">
          <StartButton onStart={onStart} />
        </div>
      </div>
    </section>
  );
}

function SampleReading() {
  const reduce = useReducedMotion() ?? false;
  const rise = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 8, filter: 'blur(6px)' },
    whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
    viewport: { once: true, amount: 0.4 },
    transition: { duration: 0.6, delay: 0.35 + i * 0.14, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <section aria-labelledby="sample-title" className="mx-auto max-w-5xl py-20 md:py-28">
      <h3 id="sample-title" className={`${DISPLAY} text-center text-3xl font-bold text-white md:text-4xl`}>
        이렇게 풀어드려요
      </h3>
      <p className="mt-3 break-keep text-center text-sm text-white/60">실제 결과 화면의 일부를 줄여서 보여드린 예시예요.</p>

      <div className="mt-12 grid items-center gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-14">
        {/* 탁자에서 한 장이 뽑혀 똑바로 선다 */}
        <motion.img
          src={cardSrc('02-high-priestess-lg')}
          width={520}
          height={Math.round(520 * CARD_RATIO)}
          alt="여사제 카드 그림. 두 기둥 사이에 앉아 두루마리를 든 고양이"
          loading="lazy"
          decoding="async"
          className="mx-auto block h-auto w-44 rounded-lg shadow-[0_30px_60px_-20px_rgba(6,6,18,0.95)] md:w-full md:max-w-[19rem]"
          initial={reduce ? false : { opacity: 0, y: 40, rotate: 8, scale: 0.92 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ type: 'spring', stiffness: 90, damping: 16 }}
        />

        <div className="rounded-2xl border border-mystical-gold/25 bg-white/[0.04] p-6 md:p-8">
          <motion.p {...rise(0)} className="text-sm text-white/60">질문: 이직, 지금 해도 될까요?</motion.p>
          <motion.div {...rise(1)}>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-sm font-semibold text-amber-200">
              <CirclePause className="h-4 w-4" aria-hidden="true" />
              잠깐 기다려요
            </span>
            <p className={`${DISPLAY} mt-3 break-keep text-2xl font-bold leading-snug text-white md:text-3xl`}>
              서두르지 말고 한 달만 지켜보세요
            </p>
          </motion.div>
          <motion.p {...rise(2)} className="mt-6 text-xs text-white/60">
            미래 자리 <span className={`${DISPLAY} ml-1 text-base font-bold text-mystical-gold`}>여사제</span>
          </motion.p>
          <ol className="mt-3 space-y-3 border-l border-mystical-gold/30 pl-5">
            {SAMPLE_STEPS.map((step, i) => (
              <motion.li key={step.label} {...rise(3 + i)} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[29px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-mystical-gold text-[10px] font-bold text-mystical-dark"
                >
                  {i + 1}
                </span>
                <p className="text-xs font-semibold text-white/60">{step.label}</p>
                <p className="break-keep text-[15px] leading-relaxed text-white/90">{step.text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function ThreeReads() {
  return (
    <section aria-labelledby="three-title" className="mx-auto max-w-5xl py-16 md:py-24">
      <h3 id="three-title" className={`${DISPLAY} text-3xl font-bold text-white md:text-4xl`}>
        세 가지를 함께 읽어요
      </h3>

      <div className="mt-10 grid gap-4 md:grid-cols-12 md:grid-rows-2 md:gap-5">
        <article className="relative overflow-hidden rounded-2xl bg-[#232348] p-6 md:col-span-7 md:row-span-2 md:p-8">
          <h4 className={`${DISPLAY} text-2xl font-bold text-white`}>타로</h4>
          <p className="mt-2 max-w-[22rem] break-keep text-[15px] leading-relaxed text-white/75">
            질문에 맞는 카드 배치로 뽑고, 한 줄 결론과 카드별 쉬운 풀이를 받아요.
          </p>
          <div aria-hidden="true" className="relative mt-8 h-56 md:mt-10 md:h-72">
            {[
              { file: '01-magician', className: 'left-[8%] top-6 -rotate-[9deg]' },
              { file: '21-world', className: 'left-1/2 top-0 -translate-x-1/2 rotate-[1deg]' },
              { file: '17-star', className: 'right-[8%] top-6 rotate-[10deg]' },
            ].map(card => (
              <img
                key={card.file}
                src={cardSrc(card.file)}
                width={320}
                height={Math.round(320 * CARD_RATIO)}
                alt=""
                loading="lazy"
                decoding="async"
                className={`absolute w-28 rounded-md shadow-[0_18px_36px_-14px_rgba(6,6,18,0.9)] md:w-36 ${card.className}`}
              />
            ))}
          </div>
        </article>

        <article className="rounded-2xl bg-[#1c2340] p-6 md:col-span-5">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-mystical-gold" aria-hidden="true" />
            <h4 className={`${DISPLAY} text-2xl font-bold text-white`}>별자리</h4>
          </div>
          <p className="mt-2 break-keep text-[15px] leading-relaxed text-white/75">
            생일로 내 별자리를 찾아서, 타고난 성향을 리딩에 함께 반영해요.
          </p>
          <p className="mt-5 text-sm text-white/60">
            예) 7월 18일생이면 <span className="font-semibold text-white">게자리</span>
          </p>
        </article>

        <article className="rounded-2xl bg-[#2a2433] p-6 md:col-span-5">
          <h4 className={`${DISPLAY} text-2xl font-bold text-white`}>사주</h4>
          <p className="mt-2 break-keep text-[15px] leading-relaxed text-white/75">
            태어난 해·달·날·시간으로 나무·불·흙·쇠·물 다섯 기운 중 무엇이 많고 적은지 알려드려요.
          </p>
          <p className="mt-5 text-sm text-white/60">예) 불이 많고 쇠가 적은 사람</p>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {[
              { name: '나무' },
              { name: '불', note: '많음', className: 'bg-mystical-gold font-semibold text-mystical-dark' },
              { name: '흙' },
              { name: '쇠', note: '적음', className: 'border border-dashed border-white/40 text-white/70' },
              { name: '물' },
            ].map(element => (
              <li key={element.name} className={`rounded-full px-3 py-1 ${element.className ?? 'bg-white/[0.08] text-white/80'}`}>
                {element.name}
                {element.note && <span className="ml-1 text-xs">{element.note}</span>}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="mx-auto max-w-5xl py-16 md:py-24">
      <h3 id="how-title" className={`${DISPLAY} text-3xl font-bold text-white md:text-4xl`}>
        이용 방법
      </h3>
      <ol className="relative mt-10 grid gap-8 border-l border-white/10 pl-8 md:grid-cols-4 md:gap-6 md:border-l-0 md:border-t md:pl-0 md:pt-10">
        {STEPS.map((step, i) => (
          <li key={step.title} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[45px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-mystical-dark text-sm font-bold text-mystical-gold ring-1 ring-mystical-gold/50 md:-top-[54px] md:left-0"
            >
              {i + 1}
            </span>
            <h4 className="font-semibold text-white/90">{step.title}</h4>
            <p className="mt-1.5 break-keep text-sm leading-relaxed text-white/65">{step.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ClosingCall({ onStart }: HomePageProps) {
  return (
    <section aria-labelledby="close-title" className="mx-auto max-w-3xl py-20 text-center md:py-28">
      <h3 id="close-title" className={`${DISPLAY} break-keep text-balance text-3xl font-bold text-white md:text-5xl`}>
        카드 한 장으로 시작해 볼까요?
      </h3>
      <div className="mt-8">
        <StartButton onStart={onStart} />
      </div>
      <p className="mt-4 break-keep text-balance text-sm text-white/60">로그인하면 바로 시작할 수 있어요. 타로나 사주를 몰라도 괜찮아요.</p>
    </section>
  );
}

export default function HomePage({ onStart }: HomePageProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <HeroTable onStart={onStart} />
      <SampleReading />
      <ThreeReads />
      <HowItWorks />
      <ClosingCall onStart={onStart} />
    </div>
  );
}

// 丁일의 시간별 시주 (한국 전통 만세력 기준)
const dinDay = '丁';
const timeGanTable = {
  '丁': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛']
  //     子   丑   寅   卯   辰   巳   午   未   申   酉   戌   亥
};

const timeBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

console.log('丁일의 시주 계산:');
console.log('정답: 6시 = 壬辰\n');

// 壬辰이 나오려면: 천간=壬(寅時), 지지=辰(辰時)
// 寅時 index = 2, 辰時 index = 4

console.log('壬이 나오는 시진: 寅時 (index 2) → 3-5시');
console.log('辰 지지: 辰時 (index 4) → 7-9시\n');

console.log('문제: 6시에 壬辰이 나오려면?');
console.log('→ 6시가 辰時에 포함되어야 함 (5시부터 진시 시작?)');
console.log('→ 또는 6시에 寅時의 천간(壬)과 辰時의 지지(辰)가 적용되는 특수 규칙?\n');

// 다른 시간 범위 테스트
console.log('=== 시간 범위 조정 테스트 ===');

const timeRanges = [
  { name: '기본 (23-1, 1-3, 3-5, 5-7, 7-9...)', start: 23, step: 2 },
  { name: '한국1 (22-0, 0-2, 2-4, 4-6, 6-8...)', start: 22, step: 2 },
  { name: '한국2 (23:30-1:30 기준)', start: 23.5, step: 2 }
];

for (const range of timeRanges) {
  console.log(`\n${range.name}:`);
  
  for (let i = 0; i < 12; i++) {
    const timeStart = (range.start + i * range.step) % 24;
    const timeEnd = (timeStart + range.step) % 24;
    const gan = timeGanTable[dinDay][i];
    const zhi = timeBranches[i];
    const ganZhi = gan + zhi;
    
    const timeStr = timeStart < timeEnd 
      ? `${timeStart}-${timeEnd}시`
      : `${timeStart}시-${timeEnd}시(익일)`;
    
    if (ganZhi === '壬辰') {
      console.log(`  ✅ ${timeStr}: ${ganZhi} ← 6시 포함 여부?`);
    } else if (timeStart <= 6 && 6 < timeEnd) {
      console.log(`  → ${timeStr}: ${ganZhi} ← 6시 포함`);
    }
  }
}

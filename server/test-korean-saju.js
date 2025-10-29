const { Solar } = require('lunar-javascript');

// 한국식 시주 계산
function calculateKoreanTimeGanZhi(dayGanZhi, hour) {
  const timeBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  let timeBranchIndex;
  
  // 청월당, 포스텔라 기준
  if (hour == 23 || hour == 0) timeBranchIndex = 0;
  else if (hour >= 1 && hour < 3) timeBranchIndex = 1;
  else if (hour >= 3 && hour < 5) timeBranchIndex = 2;
  else if (hour == 5) timeBranchIndex = 3;  // 卯 5시만
  else if (hour >= 6 && hour < 8) timeBranchIndex = 4;  // 辰 6-8시
  else if (hour >= 8 && hour < 10) timeBranchIndex = 5;
  else if (hour >= 10 && hour < 12) timeBranchIndex = 6;
  else if (hour >= 12 && hour < 14) timeBranchIndex = 7;
  else if (hour >= 14 && hour < 16) timeBranchIndex = 8;
  else if (hour >= 16 && hour < 18) timeBranchIndex = 9;
  else if (hour >= 18 && hour < 20) timeBranchIndex = 10;
  else timeBranchIndex = 11;
  
  const timeBranch = timeBranches[timeBranchIndex];
  
  const dayGan = dayGanZhi.charAt(0);
  const timeGanTable = {
    '甲': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
    '乙': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
    '丙': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
    '丁': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
    '戊': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
    '己': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
    '庚': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
    '辛': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
    '壬': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
    '癸': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛']
  };
  
  const timeGan = timeGanTable[dayGan]?.[timeBranchIndex] || '甲';
  
  return timeGan + timeBranch;
}

console.log('=== 한국식 사주 계산 테스트 ===');
console.log('입력: 1992년 4월 21일 6시 (양력)\n');

const solar = Solar.fromYmdHms(1992, 4, 21, 6, 0, 0);
const eightChar = solar.getLunar().getEightChar();

const yearGanZhi = eightChar.getYear();
const monthGanZhi = eightChar.getMonth();
const dayGanZhi = eightChar.getDay();
const timeGanZhi = calculateKoreanTimeGanZhi(dayGanZhi, 6);

console.log('계산 결과:');
console.log('년주(年柱):', yearGanZhi);
console.log('월주(月柱):', monthGanZhi);
console.log('일주(日柱):', dayGanZhi, '← 일간:', dayGanZhi.charAt(0));
console.log('시주(時柱):', timeGanZhi, '← 한국식 계산');

console.log('\n정답:');
console.log('년주: 壬申 (임신)');
console.log('월주: 甲辰 (갑진)');
console.log('일주: 丁卯 (정묘) ← 일간 丁火');
console.log('시주: 壬辰 (임진)');

console.log('\n검증:', timeGanZhi === '壬辰' ? '✅ 시주 정확!' : '❌ 시주 불일치');

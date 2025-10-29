const { Solar } = require('lunar-javascript');

// 표준 시주 계산
function calculateStandardTime(dayGanZhi, hour) {
  const timeBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  let timeBranchIndex;
  
  // 표준 시진: 23:30-01:30, 01:30-03:30, 03:30-05:30...
  // 4시는 03:30-05:30 = 寅時
  if (hour == 23 || hour == 0) timeBranchIndex = 0;
  else if (hour >= 1 && hour < 3) timeBranchIndex = 1;
  else if (hour == 3) timeBranchIndex = 2;  // 03:00-03:30 = 寅時
  else if (hour >= 4 && hour < 6) timeBranchIndex = 2;  // 04:00-05:30 = 寅時
  else if (hour >= 6 && hour < 8) timeBranchIndex = 3;  // 06:00-07:30 = 卯時
  else if (hour >= 8 && hour < 10) timeBranchIndex = 4;
  else if (hour >= 10 && hour < 12) timeBranchIndex = 5;
  else if (hour >= 12 && hour < 14) timeBranchIndex = 6;
  else if (hour >= 14 && hour < 16) timeBranchIndex = 7;
  else if (hour >= 16 && hour < 18) timeBranchIndex = 8;
  else if (hour >= 18 && hour < 20) timeBranchIndex = 9;
  else if (hour >= 20 && hour < 22) timeBranchIndex = 10;
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

console.log('=== 1992년 4월 21일 테스트 ===\n');

const solar = Solar.fromYmdHms(1992, 4, 21, 4, 0, 0);
const eightChar = solar.getLunar().getEightChar();
const dayGanZhi = eightChar.getDay();

console.log('일주(日柱):', dayGanZhi, '← 일간:', dayGanZhi.charAt(0));

console.log('\n여러 시간대 테스트:');
for (let h = 3; h <= 9; h++) {
  const timeGanZhi = calculateStandardTime(dayGanZhi, h);
  const mark = timeGanZhi === '壬辰' ? ' ✅ 정답!' : '';
  console.log(`${h}시: ${timeGanZhi}${mark}`);
}

console.log('\n정답: 壬辰 (임진)');
console.log('\n분석:');
console.log('丁일의 시간표:');
console.log('寅時(3-5시): 壬寅');
console.log('卯時(5-7시): 癸卯');
console.log('辰時(7-9시): 甲辰');
console.log('\n壬辰은 丁일에서 나올 수 없음!');
console.log('→ 壬辰은 丙일 또는 辛일의 辰時(7-9시)에만 나옴');

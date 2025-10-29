const { Solar, Lunar } = require('lunar-javascript');

// 1992년 4월 21일 6시 양력 (묘시)
const birthInfo = {
  year: 1992,
  month: 4,
  day: 21,
  hour: 6,
  isLunar: false
};

console.log('=== 사주 계산 테스트 ===');
console.log(`입력: ${birthInfo.year}년 ${birthInfo.month}월 ${birthInfo.day}일 ${birthInfo.hour}시 (양력)`);

const solar = Solar.fromYmdHms(birthInfo.year, birthInfo.month, birthInfo.day, birthInfo.hour, 0, 0);
const lunar = solar.getLunar();
const eightChar = lunar.getEightChar();

console.log('\n계산 결과:');
console.log('년주(年柱):', eightChar.getYear());
console.log('월주(月柱):', eightChar.getMonth());
console.log('일주(日柱):', eightChar.getDay());
console.log('시주(時柱):', eightChar.getTime());

console.log('\n정답:');
console.log('년주: 壬申 (임신)');
console.log('월주: 甲辰 (갑진)');
console.log('일주: 丁卯 (정묘) ← 일간 丁火');
console.log('시주: 壬辰 (임진)');

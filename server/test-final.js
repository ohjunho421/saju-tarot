const { Solar } = require('lunar-javascript');

console.log('=== 포스텔라 결과와 비교 ===');
console.log('입력: 1992년 4월 21일 6시 (양력)\n');

const solar = Solar.fromYmdHms(1992, 4, 21, 6, 0, 0);
const lunar = solar.getLunar();
const eightChar = lunar.getEightChar();

console.log('lunar-javascript 계산 결과:');
console.log('년주(年柱):', eightChar.getYear());
console.log('월주(月柱):', eightChar.getMonth());
console.log('일주(日柱):', eightChar.getDay());
console.log('시주(時柱):', eightChar.getTime());

console.log('\n포스텔라 정답:');
console.log('년주: 壬申 (임신)');
console.log('월주: 甲辰 (갑진)');
console.log('일주: 丁卯 (정묘)');
console.log('시주: 癸卯 (계묘)');

console.log('\n검증:');
const matches = {
  년주: eightChar.getYear() === '壬申',
  월주: eightChar.getMonth() === '甲辰',
  일주: eightChar.getDay() === '丁卯',
  시주: eightChar.getTime() === '癸卯'
};

Object.entries(matches).forEach(([key, isMatch]) => {
  console.log(`${key}: ${isMatch ? '✅ 일치' : '❌ 불일치'}`);
});

const allMatch = Object.values(matches).every(v => v);
console.log(`\n최종 결과: ${allMatch ? '✅ 완벽히 일치!' : '❌ 일부 불일치'}`);

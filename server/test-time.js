const { Solar } = require('lunar-javascript');

console.log('=== 시간별 시주 테스트 ===\n');

// 1992년 4월 21일 (丁卯일)에 여러 시간대를 테스트
for (let hour = 0; hour <= 23; hour++) {
  const solar = Solar.fromYmdHms(1992, 4, 21, hour, 0, 0);
  const eightChar = solar.getLunar().getEightChar();
  const timeGanZhi = eightChar.getTime();
  
  console.log(`${hour}시: ${timeGanZhi}`);
}

console.log('\n정답: 6시 = 壬辰 (임진)');
console.log('실제로 6시에 壬辰이 나오는지 확인');

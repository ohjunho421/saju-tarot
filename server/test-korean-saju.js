// 만세력(사주) 계산 검증 테스트
// ⚠️ 운영 코드(src/services/saju.service.ts)는 lunar-javascript 의 getEightChar() 를
//    그대로 사용합니다. 이 테스트도 동일한 방식으로 검증하므로 운영 결과와 일치합니다.
//
// 참고: 시주(時柱)는 오둔법(五鼠遁)을 따릅니다.
//  - 丁/壬 일간 → 子시=庚子, 寅시=壬寅, 卯시=癸卯, 辰시=甲辰 ...
//  - 따라서 "丁일 06시(卯시)" 의 정답은 癸卯 입니다.
//    (과거 일부 메모에 적혀 있던 壬辰 은 丁일에는 존재할 수 없는 조합이라 오답입니다.)

const { Solar } = require('lunar-javascript');

let pass = 0;
let fail = 0;

function check(label, input, expected) {
  const { y, mo, d, h } = input;
  const ec = Solar.fromYmdHms(y, mo, d, h, 0, 0).getLunar().getEightChar();
  const actual = {
    year: ec.getYear(),
    month: ec.getMonth(),
    day: ec.getDay(),
    time: ec.getTime(),
  };
  console.log(`\n[${label}] ${y}-${mo}-${d} ${h}시 (양력)`);
  for (const key of Object.keys(expected)) {
    const ok = actual[key] === expected[key];
    console.log(`  ${key}: ${actual[key]}  (기대: ${expected[key]})  ${ok ? '✅' : '❌'}`);
    ok ? pass++ : fail++;
  }
}

console.log('=== 만세력 계산 검증 (lunar-javascript, 운영과 동일) ===');

// 1992-04-21 06:00 — 대표 검증 케이스
check('기본 케이스', { y: 1992, mo: 4, d: 21, h: 6 }, {
  year: '壬申',
  month: '甲辰',
  day: '丁卯',
  time: '癸卯', // 丁일 卯시(05~07시) = 癸卯 (오둔법)
});

// 입춘 경계: 년주가 절기 기준으로 바뀌는지 확인 (2024 입춘 = 2/4)
check('입춘 직전', { y: 2024, mo: 2, d: 3, h: 12 }, { year: '癸卯' });
check('입춘 직후', { y: 2024, mo: 2, d: 5, h: 12 }, { year: '甲辰' });

console.log(`\n=== 결과: ${pass} 통과 / ${fail} 실패 ===`);
process.exit(fail === 0 ? 0 : 1);

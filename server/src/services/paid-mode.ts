/**
 * 유료 전환 스위치.
 *
 * 결제사 심사는 약관·요금·결제 화면이 배포된 뒤에야 받을 수 있는데, 결제 키는 심사가 끝나야 나온다.
 * 그 사이에 배포해도 기존 회원이 리딩을 못 보게 되지 않도록, 유료 적용을 환경변수로 켠다.
 *
 * - PAID_MODE=on            : 모든 회원에게 요금을 적용한다.
 * - PAID_MODE 없음 또는 off : 모든 리딩이 무료다(유료 전환 전과 같다). 충전도 열리지 않는다.
 * - PAID_MODE_TEST_EMAILS   : 쉼표로 구분한 이메일. off 상태에서도 이 계정들만 유료 흐름(요금·충전)을 쓴다.
 *                             결제사 심사용 계정과 출시 전 점검에 쓴다.
 *
 * 자세한 내용: docs/features/payment.md
 */

export function isPaidModeOn(): boolean {
  return (process.env.PAID_MODE ?? '').trim().toLowerCase() === 'on';
}

function testEmails(): Set<string> {
  return new Set(
    (process.env.PAID_MODE_TEST_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** 이 회원에게 요금과 충전을 적용하는가 */
export function isPaidFor(email: string | undefined | null): boolean {
  if (isPaidModeOn()) return true;
  if (typeof email !== 'string') return false;
  return testEmails().has(email.trim().toLowerCase());
}

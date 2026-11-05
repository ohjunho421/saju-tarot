// 사용자별 호출 횟수 제한 (메모리 기반, 서버 한 대 기준. 재시작하면 초기화)
// 반환 함수는 이번 호출을 허용하면 true, 한도를 넘으면 false
export function createUserRateLimiter(max: number, windowMs: number): (userId: string) => boolean {
  const hits = new Map<string, number[]>();

  return (userId: string): boolean => {
    const now = Date.now();

    // 오래 쓰이지 않은 사용자 기록 정리 (메모리 누수 방지)
    if (hits.size > 5000) {
      for (const [id, times] of hits) {
        if (times.every(t => now - t >= windowMs)) hits.delete(id);
      }
    }

    const recent = (hits.get(userId) ?? []).filter(t => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(userId, recent);
      return false;
    }
    hits.set(userId, [...recent, now]);
    return true;
  };
}

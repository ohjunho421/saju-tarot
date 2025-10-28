// 타로 카드 이름과 이미지 파일명 매핑
export const TAROT_IMAGE_MAP: Record<string, string> = {
  // Major Arcana
  'The Fool': '0. 바보 카드.jpg',
  'The Magician': '1. 마법사 카드.jpg',
  'The High Priestess': '2. 여사제 카드.jpg',
  'The Empress': '3. 여황제 카드.jpg',
  'The Emperor': '4. 황제 카드.jpg',
  'The Hierophant': '5. 교황 카드.jpg',
  'The Lovers': '6. 연인 카드.jpg',
  'The Chariot': '7. 전차 카드.jpg',
  'Strength': '8. 힘 카드.jpg',
  'The Hermit': '9. 은둔자 카드.jpg',
  'Wheel of Fortune': '10. 운명의 수레바퀴.jpg',
  'Justice': '11. 정의 카드.jpg',
  'The Hanged Man': '12. 행맨 카드.jpg',
  'Death': '13. 죽음 카드.jpg',
  'Temperance': '14. 절제 카드.jpg',
  'The Devil': '15. 악마 카드.jpg',
  'The Tower': '16. 타워 카드.jpg',
  'The Star': '17. 별 카드.jpg',
  'The Moon': '18. 달 카드.jpg',
  'The Sun': '19. 태양 카드.jpg',
  'Judgement': '20. 심판 카드.jpg',
  'The World': '21. 세계 카드.jpg',

  // Wands (완드)
  'Ace of Wands': '완드 에이스.jpg',
  'Two of Wands': '완드2.jpg',
  'Three of Wands': '완드3.jpg',
  'Four of Wands': '완드4.jpg',
  'Five of Wands': '완드5.jpg',
  'Six of Wands': '완드6.jpg',
  'Seven of Wands': '완드7.jpg',
  'Eight of Wands': '완드8.jpg',
  'Nine of Wands': '완드9.jpg',
  'Ten of Wands': '완드10.jpg',
  'Page of Wands': '완드 페이지.jpg',
  'Knight of Wands': '완드 나이트.jpg',
  'Queen of Wands': '완드 퀸.jpg',
  'King of Wands': '완드 킹.jpg',

  // Cups (컵)
  'Ace of Cups': '컵 에이스.jpg',
  'Two of Cups': '컵2.jpg',
  'Three of Cups': '컵3.jpg',
  'Four of Cups': '컵4.jpg',
  'Five of Cups': '컵5.jpg',
  'Six of Cups': '컵6.jpg',
  'Seven of Cups': '컵7.jpg',
  'Eight of Cups': '컵8.jpg',
  'Nine of Cups': '컵9.jpg',
  'Ten of Cups': '컵10.jpg',
  'Page of Cups': '컵 페이지.jpg',
  'Knight of Cups': '컵 나이트.jpg',
  'Queen of Cups': '컵 퀸.jpg',
  'King of Cups': '컵 킹.jpg',

  // Swords (소드)
  'Ace of Swords': '소드 에이스.jpg',
  'Two of Swords': '소드2.jpg',
  'Three of Swords': '소드3.jpg',
  'Four of Swords': '소드4.jpg',
  'Five of Swords': '소드5.jpg',
  'Six of Swords': '소드6.jpg',
  'Seven of Swords': '소드7.jpg',
  'Eight of Swords': '소드8.jpg',
  'Nine of Swords': '소드9.jpg',
  'Ten of Swords': '소드10.jpg',
  'Page of Swords': '소드 페이지.jpg',
  'Knight of Swords': '소드 나이트.jpg',
  'Queen of Swords': '소드 퀸.jpg',
  'King of Swords': '소드 킹.jpg',

  // Pentacles (펜타클)
  'Ace of Pentacles': '펜타클 에이스.jpg',
  'Two of Pentacles': '펜타클2.jpg',
  'Three of Pentacles': '펜타클3.jpg',
  'Four of Pentacles': '펜타클4.jpg',
  'Five of Pentacles': '펜타클5.jpg',
  'Six of Pentacles': '펜타클6.jpg',
  'Seven of Pentacles': '펜타클7.jpg',
  'Eight of Pentacles': '펜타클8.jpg',
  'Nine of Pentacles': '펜타클9.jpg',
  'Ten of Pentacles': '펜타클10.jpg',
  'Page of Pentacles': '펜타클 페이지.jpg',
  'Knight of Pentacles': '펜타클 나이트.jpg',
  'Queen of Pentacles': '펜타클 퀸.jpg',
  'King of Pentacles': '펜타클 킹.jpg',
};

// 이미지 URL 생성
export function getTarotCardImageUrl(cardName: string): string {
  const filename = TAROT_IMAGE_MAP[cardName];
  if (!filename) {
    return ''; // 이미지 없음
  }
  
  // PUBLIC_URL 환경변수 사용 (Railway에 이미 설정되어 있음)
  const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3001';
  
  // PUBLIC_URL에 이미 trailing slash가 있을 수 있으므로 제거
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
  return `${cleanBaseUrl}/tarot-images/${encodeURIComponent(filename)}`;
}

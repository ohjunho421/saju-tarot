/**
 * 사업자 정보·문의처 — 결제사 심사와 전자상거래법 표시 의무 때문에 요금 안내 화면과 하단에 보여 준다.
 * 값이 비어 있는 항목은 화면에 나오지 않는다.
 * 별사탕은 블로그치트키와 같은 사업자가 운영한다 — 사업자등록증과 다르면 결제사 심사에서 반려된다.
 * 전화번호는 결제사 심사에서 휴대폰 번호를 인정하지 않아 유선(또는 070) 번호가 정해지면 넣는다.
 */
interface BusinessInfo {
  companyName: string;
  representative: string;
  registrationNumber: string;
  mailOrderNumber: string;
  address: string;
  phone: string;
  email: string;
}

export const BUSINESS: BusinessInfo = {
  companyName: '블로그치트키',
  representative: '오준호',
  registrationNumber: '456-05-03530', // 사업자등록번호
  mailOrderNumber: '2026-의정부흥선-0081', // 통신판매업 신고번호
  address: '경기도 의정부시 안말로85번길 27-1, 다동 701호(호원동, 로뎀하이츠빌)',
  phone: '',
  email: 'wnsghcoswp@gmail.com',
};

export const BUSINESS_LINES: string[] = [
  BUSINESS.companyName && `상호 ${BUSINESS.companyName}`,
  BUSINESS.representative && `대표 ${BUSINESS.representative}`,
  BUSINESS.registrationNumber && `사업자등록번호 ${BUSINESS.registrationNumber}`,
  BUSINESS.mailOrderNumber && `통신판매업 신고 ${BUSINESS.mailOrderNumber}`,
  BUSINESS.address && `주소 ${BUSINESS.address}`,
  BUSINESS.phone && `전화 ${BUSINESS.phone}`,
  BUSINESS.email && `이메일 ${BUSINESS.email}`,
].filter((line): line is string => Boolean(line));

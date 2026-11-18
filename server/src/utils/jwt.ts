import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7일

// 소셜 로그인 중간 단계용 짧은 표(state, 로그인·가입 표). 로그인 토큰과 비밀값을 갈라
// 서로를 대신 쓸 수 없게 한다
const TICKET_SECRET = `${JWT_SECRET}:social-ticket`;

export interface TokenPayload {
  userId: string;
  email: string | null; // 카카오로 가입한 사용자는 없음
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// typ으로 표의 용도를 적고, 확인할 때 같은 용도인지 함께 본다
export const signTicket = (typ: string, data: Record<string, unknown>, expiresInSeconds: number): string => {
  return jwt.sign({ ...data, typ }, TICKET_SECRET, { expiresIn: expiresInSeconds });
};

export const verifyTicket = (token: string, typ: string): Record<string, unknown> | null => {
  try {
    const payload = jwt.verify(token, TICKET_SECRET);
    if (typeof payload !== 'object' || payload === null || payload.typ !== typ) return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
};

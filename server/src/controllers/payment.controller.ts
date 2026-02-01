import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { pointService } from '../services/point.service';
import { POINT_PACKAGES, getRequiredPoints } from '../config/payment.config';

// 레몬스퀴지 설정
const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;
const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID;
const LEMON_SQUEEZY_WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
const LEMON_SQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1';

// 포인트 패키지 목록 조회
export const getPointPackages = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      packages: POINT_PACKAGES
    });
  } catch (error) {
    console.error('포인트 패키지 조회 오류:', error);
    res.status(500).json({ error: '포인트 패키지 조회 중 오류가 발생했습니다.' });
  }
};

// 사용자 포인트 잔액 조회
export const getMyPoints = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const points = await pointService.getUserPoints(userId);
    
    res.json({
      success: true,
      points
    });
  } catch (error) {
    console.error('포인트 조회 오류:', error);
    res.status(500).json({ error: '포인트 조회 중 오류가 발생했습니다.' });
  }
};

// 포인트 거래 내역 조회
export const getPointHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { limit = '20', offset = '0' } = req.query;
    const history = await pointService.getTransactionHistory(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      ...history
    });
  } catch (error) {
    console.error('포인트 내역 조회 오류:', error);
    res.status(500).json({ error: '포인트 내역 조회 중 오류가 발생했습니다.' });
  }
};

// 레몬스퀴지 체크아웃 세션 생성
export const createCheckout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { packageId, variantId } = req.body;

    // 패키지 확인
    const selectedPackage = POINT_PACKAGES.find(p => p.id === packageId);
    if (!selectedPackage) {
      return res.status(400).json({ error: '유효하지 않은 패키지입니다.' });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 레몬스퀴지 API 호출
    const response = await fetch(`${LEMON_SQUEEZY_API_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              name: user.name,
              custom: {
                user_id: userId,
                package_id: packageId,
                points: selectedPackage.points
              }
            },
            product_options: {
              redirect_url: `${process.env.CLIENT_URL}/payment/success`,
              receipt_thank_you_note: `${selectedPackage.points.toLocaleString()} 포인트가 충전되었습니다!`
            }
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: LEMON_SQUEEZY_STORE_ID
              }
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('레몬스퀴지 API 오류:', errorData);
      return res.status(500).json({ error: '결제 세션 생성에 실패했습니다.' });
    }

    const data = await response.json() as { data: { attributes: { url: string } } };
    const checkoutUrl = data.data.attributes.url;

    res.json({
      success: true,
      checkoutUrl
    });
  } catch (error) {
    console.error('체크아웃 생성 오류:', error);
    res.status(500).json({ error: '결제 세션 생성 중 오류가 발생했습니다.' });
  }
};

// 레몬스퀴지 웹훅 처리
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-signature'] as string;
    const rawBody = req.body;

    // 서명 검증
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('웹훅 서명 검증 실패');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = JSON.parse(rawBody.toString());
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data;

    console.log(`웹훅 이벤트 수신: ${eventName}`);

    // 주문 완료 이벤트 처리
    if (eventName === 'order_created') {
      const orderId = payload.data.id;
      const userId = customData?.user_id;
      const points = parseInt(customData?.points || '0');

      if (!userId || !points) {
        console.error('웹훅 데이터 누락:', { userId, points });
        return res.status(400).json({ error: 'Missing required data' });
      }

      // 포인트 충전
      const result = await pointService.chargePoints(
        userId,
        points,
        orderId,
        `포인트 충전 (${points.toLocaleString()}P)`
      );

      if (result.success) {
        console.log(`포인트 충전 완료: userId=${userId}, points=${points}, balance=${result.balance}`);
      } else {
        console.error('포인트 충전 실패:', result.error);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// 웹훅 서명 검증
function verifyWebhookSignature(payload: Buffer, signature: string): boolean {
  if (!LEMON_SQUEEZY_WEBHOOK_SECRET || !signature) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', LEMON_SQUEEZY_WEBHOOK_SECRET);
  const digest = hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// 스프레드별 필요 포인트 조회
export const getSpreadCost = async (req: Request, res: Response) => {
  try {
    const { spreadType } = req.params;
    const requiredPoints = getRequiredPoints(spreadType);

    let userId = req.user?.userId;
    let currentPoints = 0;
    let hasEnough = false;

    if (userId) {
      currentPoints = await pointService.getUserPoints(userId);
      hasEnough = currentPoints >= requiredPoints;
    }

    res.json({
      success: true,
      spreadType,
      requiredPoints,
      currentPoints,
      hasEnough
    });
  } catch (error) {
    console.error('스프레드 비용 조회 오류:', error);
    res.status(500).json({ error: '스프레드 비용 조회 중 오류가 발생했습니다.' });
  }
};

// 포인트 사용 (해석 열람)
export const usePointsForReading = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { spreadType, readingId } = req.body;

    if (!spreadType) {
      return res.status(400).json({ error: '스프레드 타입이 필요합니다.' });
    }

    const result = await pointService.usePoints(userId, spreadType, readingId);

    if (!result.success) {
      return res.status(400).json({ 
        error: result.error,
        requiredPoints: getRequiredPoints(spreadType),
        currentPoints: result.balance
      });
    }

    res.json({
      success: true,
      balance: result.balance,
      message: '포인트가 차감되었습니다.'
    });
  } catch (error) {
    console.error('포인트 사용 오류:', error);
    res.status(500).json({ error: '포인트 사용 중 오류가 발생했습니다.' });
  }
};

// 포인트 충분 여부 확인
export const checkPoints = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { spreadType } = req.query;
    
    if (!spreadType || typeof spreadType !== 'string') {
      return res.status(400).json({ error: '스프레드 타입이 필요합니다.' });
    }

    const hasEnough = await pointService.hasEnoughPoints(userId, spreadType);
    const currentPoints = await pointService.getUserPoints(userId);
    const requiredPoints = getRequiredPoints(spreadType);

    res.json({
      success: true,
      hasEnough,
      currentPoints,
      requiredPoints,
      shortage: hasEnough ? 0 : requiredPoints - currentPoints
    });
  } catch (error) {
    console.error('포인트 확인 오류:', error);
    res.status(500).json({ error: '포인트 확인 중 오류가 발생했습니다.' });
  }
};

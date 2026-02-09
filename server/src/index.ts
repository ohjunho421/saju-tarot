import dotenv from 'dotenv';
import path from 'path';

// 먼저 환경변수 로드 (다른 import보다 먼저!)
dotenv.config({ path: path.join(__dirname, '../.env') });


import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { raw } from 'express';
import sajuRoutes from './routes/saju.routes';
import tarotRoutes from './routes/tarot.routes';
import interpretationRoutes from './routes/interpretation.routes';
import authRoutes from './routes/auth.routes';
import aiInterpretationRoutes from './routes/ai-interpretation.routes';
import readingRoutes from './routes/reading.routes';
import paymentRoutes from './routes/payment.routes';
import { handleWebhook } from './controllers/payment.controller';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://saju-tarot.vercel.app',
        'https://client-7ymxtycg4-rorarions-projects.vercel.app',
        /\.vercel\.app$/
      ]
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization']
}));

// 웹훅은 raw body가 필요하므로 express.json() 전에 등록
app.post('/api/payment/webhook', raw({ type: 'application/json' }), handleWebhook);

app.use(express.json());

// 타로 카드 이미지 제공 (빌드 후 dist/public/tarot-images에 위치)
app.use('/tarot-images', express.static(path.join(__dirname, 'public/tarot-images')));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Saju-Tarot Service is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/saju', sajuRoutes);
app.use('/api/tarot', tarotRoutes);
app.use('/api/interpretation', interpretationRoutes);
app.use('/api/ai', aiInterpretationRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/payment', paymentRoutes);

// Error handling
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});

export default app;

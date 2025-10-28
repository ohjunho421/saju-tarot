import dotenv from 'dotenv';
import path from 'path';

// 먼저 환경변수 로드 (다른 import보다 먼저!)
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🔧 환경변수 로드 완료');
console.log('📍 .env 경로:', path.join(__dirname, '../.env'));
console.log('🔑 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ 로드됨' : '❌ 없음');
console.log('🔑 ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ 로드됨' : '❌ 없음');

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import sajuRoutes from './routes/saju.routes';
import tarotRoutes from './routes/tarot.routes';
import interpretationRoutes from './routes/interpretation.routes';
import authRoutes from './routes/auth.routes';
import aiInterpretationRoutes from './routes/ai-interpretation.routes';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://saju-tarot.vercel.app',
        'https://*.vercel.app',
        /\.vercel\.app$/
      ]
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 타로 카드 이미지 제공
app.use('/tarot-images', express.static(path.join(__dirname, '../타로카드')));

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

// Error handling
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});

export default app;

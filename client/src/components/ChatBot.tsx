import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import type { IntegratedReading } from '../types';

interface ChatBotProps {
  reading: IntegratedReading;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatBot({ reading }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '안녕하세요! 타로 리딩 결과에 대해 궁금한 점이 있으시면 편하게 물어보세요. 😊',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          question: userMessage.content,
          reading: reading,
          chatHistory: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) throw new Error('답변을 받을 수 없습니다');

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.data.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-gradient-to-br from-primary-600/10 to-purple-600/10">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-6 h-6 text-mystical-gold" />
        <h2 className="text-2xl font-bold">타로 상담사와 대화하기</h2>
      </div>

      {/* 채팅 메시지 영역 */}
      <div className="bg-black/20 rounded-lg p-4 mb-4 h-96 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-mystical-gold text-purple-900 rounded-br-none'
                    : 'bg-white/10 text-white rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-purple-700' : 'text-white/50'
                }`}>
                  {message.timestamp.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 text-white rounded-2xl rounded-bl-none px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="궁금한 점을 자유롭게 물어보세요..."
          className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-mystical-gold text-white placeholder-white/50"
          disabled={isLoading}
          maxLength={200}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-6 py-3 bg-mystical-gold hover:bg-mystical-gold/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-purple-900 transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>전송</span>
            </>
          )}
        </button>
      </form>

      {/* 제안 질문 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <p className="w-full text-sm text-white/60 mb-2">💡 이런 질문을 해보세요:</p>
        {[
          '이 카드들이 나온 이유가 뭘까요?',
          '구체적으로 어떻게 실천하면 좋을까요?',
          '이 상황이 언제쯤 변할까요?',
          '오행 조화를 맞추려면 어떻게 해야 하나요?'
        ].map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => setInput(suggestion)}
            className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full text-white/70 hover:text-white transition-colors"
            disabled={isLoading}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

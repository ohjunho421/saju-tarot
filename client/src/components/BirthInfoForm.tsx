import { useState } from 'react';
import type { BirthInfo } from '../types';
import { Calendar, Clock } from 'lucide-react';

interface BirthInfoFormProps {
  onSubmit: (birthInfo: BirthInfo) => void;
}

export default function BirthInfoForm({ onSubmit }: BirthInfoFormProps) {
  const [formData, setFormData] = useState<BirthInfo>({
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    isLunar: false,
    gender: 'male'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-center">생년월일시 입력</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 생년월일 */}
          <div>
            <label className="flex items-center gap-2 mb-3 text-lg font-semibold">
              <Calendar className="w-5 h-5" />
              생년월일
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  placeholder="년도"
                  min="1900"
                  max="2100"
                  className="input-field"
                  required
                />
                <p className="text-xs text-white/50 mt-1">년</p>
              </div>
              <div>
                <input
                  type="number"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                  placeholder="월"
                  min="1"
                  max="12"
                  className="input-field"
                  required
                />
                <p className="text-xs text-white/50 mt-1">월</p>
              </div>
              <div>
                <input
                  type="number"
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
                  placeholder="일"
                  min="1"
                  max="31"
                  className="input-field"
                  required
                />
                <p className="text-xs text-white/50 mt-1">일</p>
              </div>
            </div>
          </div>

          {/* 음력/양력 선택 */}
          <div>
            <label className="block mb-3 text-lg font-semibold">음력/양력</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isLunar: false })}
                className={`flex-1 py-3 px-6 rounded-lg border-2 transition-all ${
                  !formData.isLunar
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white/5 border-white/30 text-white/70 hover:border-white/50'
                }`}
              >
                양력
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isLunar: true })}
                className={`flex-1 py-3 px-6 rounded-lg border-2 transition-all ${
                  formData.isLunar
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white/5 border-white/30 text-white/70 hover:border-white/50'
                }`}
              >
                음력
              </button>
            </div>
          </div>

          {/* 생시 - 12지지 기반 */}
          <div>
            <label className="flex items-center gap-2 mb-3 text-lg font-semibold">
              <Clock className="w-5 h-5" />
              태어난 시간 (시진) <span className="text-sm text-white/60 ml-2">- 선택사항</span>
            </label>
            <select
              value={formData.hour}
              onChange={(e) => setFormData({ ...formData, hour: parseInt(e.target.value) || 12 })}
              className="input-field"
            >
              <option value="">모름 (기본값: 낮 12시)</option>
              <option value={0}>자시 (子時) - 밤 11:30 ~ 새벽 1:30</option>
              <option value={2}>축시 (丑時) - 새벽 1:30 ~ 3:30</option>
              <option value={4}>인시 (寅時) - 새벽 3:30 ~ 5:30</option>
              <option value={6}>묘시 (卯時) - 아침 5:30 ~ 7:30</option>
              <option value={8}>진시 (辰時) - 아침 7:30 ~ 9:30</option>
              <option value={10}>사시 (巳時) - 오전 9:30 ~ 11:30</option>
              <option value={12}>오시 (午時) - 낮 11:30 ~ 오후 1:30</option>
              <option value={14}>미시 (未時) - 오후 1:30 ~ 3:30</option>
              <option value={16}>신시 (申時) - 오후 3:30 ~ 5:30</option>
              <option value={18}>유시 (酉時) - 저녁 5:30 ~ 7:30</option>
              <option value={20}>술시 (戌時) - 저녁 7:30 ~ 9:30</option>
              <option value={22}>해시 (亥時) - 밤 9:30 ~ 11:30</option>
            </select>
            <p className="text-xs text-white/50 mt-2">
              💡 정확한 시간을 모르시면 공란으로 두시면 됩니다 (기본값: 낮 12시)
            </p>
          </div>

          {/* 성별 */}
          <div>
            <label className="block mb-3 text-lg font-semibold">성별</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'male' })}
                className={`flex-1 py-3 px-6 rounded-lg border-2 transition-all ${
                  formData.gender === 'male'
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white/5 border-white/30 text-white/70 hover:border-white/50'
                }`}
              >
                남성
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'female' })}
                className={`flex-1 py-3 px-6 rounded-lg border-2 transition-all ${
                  formData.gender === 'female'
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white/5 border-white/30 text-white/70 hover:border-white/50'
                }`}
              >
                여성
              </button>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="w-full btn-primary text-lg py-4"
          >
            사주 분석 시작
          </button>
        </form>
      </div>

      {/* 안내 메시지 */}
      <div className="mt-6 text-center text-white/60 text-sm">
        <p>입력하신 정보는 사주 분석에만 사용되며 저장되지 않습니다.</p>
      </div>
    </div>
  );
}

import { ArrowLeft } from 'lucide-react';
import type { LegalDocument } from '../data/legal';

interface LegalPageProps {
  document: LegalDocument;
  onBack: () => void;
}

// 이용약관·개인정보처리방침 공용 화면. 본문은 data/legal.ts
export default function LegalPage({ document, onBack }: LegalPageProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white text-sm">
        <ArrowLeft className="w-4 h-4" />
        돌아가기
      </button>

      <div className="card">
        <h1 className="text-2xl font-bold mb-2">{document.title}</h1>
        <p className="text-white/50 text-sm mb-4">시행일 {document.effectiveDate}</p>
        <p className="text-white/80 break-keep leading-relaxed">{document.intro}</p>
      </div>

      {document.sections.map((section) => (
        <section key={section.title} className="card">
          <h2 className="text-lg font-bold mb-3">{section.title}</h2>
          <div className="space-y-3 text-sm text-white/80 leading-relaxed break-keep">
            {section.body.map((block, index) =>
              Array.isArray(block) ? (
                <ul key={index} className="list-disc pl-5 space-y-1.5">
                  {block.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p key={index}>{block}</p>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

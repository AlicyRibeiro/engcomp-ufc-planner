import { Trash2, MoveRight, CheckCircle, Clock } from 'lucide-react';
import { Disciplina } from '../types';
import { EQUIVALENCIAS } from '../services/curriculumService';

interface SubjectCardProps {
  key?: string;
  disciplina: Disciplina;
  status: 'concluida' | 'cursando';
  onRemove: (codigo: string) => void;
  onSwitchStatus: (codigo: string, status: 'concluida' | 'cursando') => void;
}

const areaColors: Record<string, { bg: string; text: string; border: string }> = {
  "Hardware e Sistemas": { bg: "bg-indigo-500/10 dark:bg-indigo-500/5", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-500/20 dark:border-indigo-500/10" },
  "Programação e Software": { bg: "bg-emerald-500/10 dark:bg-emerald-500/5", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-500/20 dark:border-emerald-500/10" },
  "Humanas e Gestão": { bg: "bg-purple-500/10 dark:bg-purple-500/5", text: "text-purple-700 dark:text-purple-300", border: "border-purple-500/20 dark:border-purple-500/10" },
  "Matemática e Física": { bg: "bg-rose-500/10 dark:bg-rose-500/5", text: "text-rose-700 dark:text-rose-300", border: "border-rose-500/20 dark:border-rose-500/10" },
  "Redes e Telecom": { bg: "bg-cyan-500/10 dark:bg-cyan-500/5", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-500/20 dark:border-cyan-500/10" },
  "Sinais e Controle": { bg: "bg-amber-500/10 dark:bg-amber-500/5", text: "text-amber-700 dark:text-amber-300", border: "border-amber-500/20 dark:border-amber-500/10" },
  "Optativas": { bg: "bg-slate-500/10 dark:bg-slate-500/5", text: "text-slate-700 dark:text-slate-300", border: "border-slate-500/20 dark:border-slate-500/10" }
};

export function SubjectCard({ disciplina, status, onRemove, onSwitchStatus }: SubjectCardProps) {
  const isConcluida = status === 'concluida';
  const areaColorsConfig = areaColors[disciplina.area] || areaColors["Optativas"];

  return (
    <div className="group glass-card rounded-xl p-3.5 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className="font-mono text-[10px] font-semibold bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border border-white/20 dark:border-slate-800/10 px-1.5 py-0.5 rounded backdrop-blur-xs">
            {disciplina.codigo}
          </span>
          {(() => {
            const equivs = EQUIVALENCIAS[disciplina.codigo] || [];
            if (equivs.length === 0) return null;
            return (
              <span className="font-mono text-[9px] font-bold bg-slate-500/10 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/25 px-1.5 py-0.5 rounded backdrop-blur-xs cursor-help" title={`Equivalente a: ${equivs.join(', ')}`}>
                Equiv: {equivs.join(', ')}
              </span>
            );
          })()}
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${areaColorsConfig.bg} ${areaColorsConfig.text} ${areaColorsConfig.border}`}>
            {disciplina.area}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {disciplina.semestre ? `${disciplina.semestre}º semestre recomendado` : 'Optativa'}
          </span>
        </div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">
          {disciplina.nome}
        </h4>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-2">
          <span>{disciplina.cargaHoraria}h</span>
          <span>•</span>
          <span>{disciplina.creditos} créditos</span>
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Toggle between cursando and concluida */}
        <button
          onClick={() => onSwitchStatus(disciplina.codigo, isConcluida ? 'cursando' : 'concluida')}
          title={isConcluida ? "Mudar para 'Cursando'" : "Mudar para 'Concluída'"}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <MoveRight className="w-4 h-4" />
        </button>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(disciplina.codigo)}
          title="Remover"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

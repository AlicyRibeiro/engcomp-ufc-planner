import { BookOpen, Check, ArrowRight, Clock, Lock, Unlock, CheckCircle, Trash2 } from 'lucide-react';
import { Disciplina, StatusDisciplina } from '../types';
import { curriculumService, EQUIVALENCIAS } from '../services/curriculumService';

interface AvailableSubjectCardProps {
  key?: string;
  disciplina: Disciplina;
  status: StatusDisciplina;
  onMarkConcluida: (codigo: string) => void;
  onMarkCursando: (codigo: string) => void;
  onRemove?: (codigo: string) => void;
  concluidas?: string[];
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

export function AvailableSubjectCard({ disciplina, status, onMarkConcluida, onMarkCursando, onRemove, concluidas }: AvailableSubjectCardProps) {
  // Look up full names of prerequisites
  const getPrereqNames = (prereqs: string[]) => {
    return prereqs.map(code => {
      const dep = curriculumService.getByCodigo(code);
      return {
        codigo: code,
        nome: dep ? dep.nome : code
      };
    });
  };

  const prereqDetails = getPrereqNames(disciplina.prerequisitos);
  const areaColorsConfig = areaColors[disciplina.area] || areaColors["Optativas"];

  const statusBadges = {
    concluida: {
      bg: "bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      label: "Concluída",
      icon: <CheckCircle className="w-3 h-3 text-emerald-500" />
    },
    cursando: {
      bg: "bg-amber-500/10 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500/20",
      label: "Cursando",
      icon: <Clock className="w-3 h-3 text-amber-500" />
    },
    disponivel: {
      bg: "bg-blue-500/10 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-500/20",
      label: "Disponível",
      icon: <Unlock className="w-3 h-3 text-blue-500" />
    },
    bloqueada: {
      bg: "bg-slate-500/10 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-slate-500/25",
      label: "Bloqueada",
      icon: <Lock className="w-3 h-3 text-slate-400" />
    }
  };

  const badge = statusBadges[status];

  return (
    <div className={`glass-card rounded-xl p-4 flex flex-col justify-between h-full transition-all duration-350 border ${
      status === 'concluida' 
        ? 'border-emerald-500/20 bg-emerald-500/[0.02]' 
        : status === 'cursando'
        ? 'border-amber-500/20 bg-amber-500/[0.02]'
        : 'border-slate-200/10'
    }`}>
      <div>
        <div className="flex justify-between items-start gap-4">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-[10px] font-bold bg-blue-500/10 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded backdrop-blur-xs">
                {disciplina.codigo}
              </span>
              {(() => {
                const equivs = EQUIVALENCIAS[disciplina.codigo] || [];
                if (equivs.length === 0) return null;
                return (
                  <span className="font-mono text-[9px] font-bold bg-slate-500/10 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/25 px-1.5 py-0.5 rounded backdrop-blur-xs cursor-help" title={`Esta disciplina possui equivalência curricular com: ${equivs.join(', ')}`}>
                    Equiv: {equivs.join(', ')}
                  </span>
                );
              })()}
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {disciplina.semestre ? `${disciplina.semestre}º Semestre recomendado` : 'Optativa'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${areaColorsConfig.bg} ${areaColorsConfig.text} ${areaColorsConfig.border}`}>
                {disciplina.area}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${badge.bg}`}>
                {badge.icon}
                {badge.label}
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {disciplina.nome}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Carga horária:</span> {disciplina.cargaHoraria}h
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Créditos:</span> {disciplina.creditos}
              </span>
            </p>
          </div>
        </div>

        {prereqDetails.length > 0 ? (
          <div className="mt-3.5 pt-3.5 border-t border-slate-200/10 dark:border-slate-800/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-1.5">
              Pré-requisitos ({prereqDetails.length})
            </span>
            <div className="flex flex-col gap-1.5">
              {prereqDetails.map(pr => {
                const isPrereqConcluido = concluidas ? concluidas.includes(pr.codigo) : false;
                return (
                  <div key={pr.codigo} className={`flex items-center gap-1.5 text-xs transition-colors ${
                    isPrereqConcluido 
                      ? "text-slate-600 dark:text-slate-400" 
                      : "text-slate-400 dark:text-slate-500/80 font-medium"
                  }`}>
                    {isPrereqConcluido ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                    <span className={`font-mono text-[10px] px-1 py-0.2 rounded font-medium border ${
                      isPrereqConcluido
                        ? "text-slate-500 bg-slate-100/40 dark:bg-slate-800/40 border-slate-200/10 dark:border-slate-800/10"
                        : "text-red-400 dark:text-red-500/80 bg-red-500/5 border-red-500/10"
                    }`}>
                      {pr.codigo}
                    </span>
                    <span className="truncate">{pr.nome}</span>
                    {!isPrereqConcluido && (
                      <span className="text-[9px] font-bold text-red-400 dark:text-red-500/80 uppercase ml-auto bg-red-500/5 px-1 rounded shrink-0">Pendente</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-3.5 pt-3.5 border-t border-slate-200/10 dark:border-slate-800/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">
              Pré-requisitos
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 italic">Nenhum pré-requisito (Disciplina de entrada)</span>
          </div>
        )}
      </div>

      {/* Quick Action buttons */}
      <div className="mt-4 pt-3 border-t border-slate-200/10 dark:border-slate-800/50 flex flex-col sm:flex-row gap-2 justify-end opacity-90 hover:opacity-100 transition-opacity">
        {status === 'concluida' || status === 'cursando' ? (
          <>
            {status === 'cursando' && (
              <button
                onClick={() => onMarkConcluida(disciplina.codigo)}
                className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer w-full sm:w-auto"
              >
                Concluir Disciplina
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(disciplina.codigo)}
                className="text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 dark:text-red-400 dark:hover:text-white border border-red-200 dark:border-red-900/60 hover:border-red-600 px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer w-full sm:w-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remover Histórico
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => onMarkCursando(disciplina.codigo)}
              className="text-xs font-semibold text-slate-700 hover:text-white dark:text-slate-300 bg-slate-100 hover:bg-amber-500 dark:bg-slate-800 dark:hover:bg-amber-600 border border-slate-200/30 dark:border-slate-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer w-full sm:w-auto text-center"
            >
              Cursar agora
            </button>
            <button
              onClick={() => onMarkConcluida(disciplina.codigo)}
              className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer w-full sm:w-auto"
            >
              Marcar Concluída
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

import { X, CheckCircle, Clock, Play, Lock, HelpCircle, ArrowRight } from 'lucide-react';
import { Disciplina, StatusDisciplina } from '../types';
import { curriculumService } from '../services/curriculumService';

interface SidebarDetailProps {
  disciplina: Disciplina | null;
  status: StatusDisciplina;
  onClose: () => void;
  onStatusChange: (codigo: string, status: 'concluida' | 'cursando' | 'none') => void;
  todas: Disciplina[];
}

export function SidebarDetail({ disciplina, status, onClose, onStatusChange, todas }: SidebarDetailProps) {
  if (!disciplina) return null;

  // Find which subjects require THIS subject
  const unlocks = todas.filter(d => d.prerequisitos.includes(disciplina.codigo));

  // Get status metadata
  const statusConfig = {
    concluida: {
      label: 'Concluída',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />
    },
    cursando: {
      label: 'Cursando',
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      icon: <Clock className="w-5 h-5 text-amber-500" />
    },
    disponivel: {
      label: 'Disponível',
      bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      icon: <Play className="w-5 h-5 text-blue-500" />
    },
    bloqueada: {
      label: 'Bloqueada',
      bg: 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800',
      icon: <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
    }
  };

  const currentStatus = statusConfig[status];

  // Resolve prerequisites details
  const prereqsDetails = disciplina.prerequisitos.map(code => {
    const dep = todas.find(d => d.codigo === code);
    return {
      codigo: code,
      nome: dep ? dep.nome : code,
      resolvida: status === 'concluida' || status === 'cursando' || status === 'disponivel' || false // helper logic (all resolved if available)
    };
  });

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 glass-panel border-l border-white/20 dark:border-slate-800/40 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 backdrop-blur-2xl bg-white/75 dark:bg-slate-950/75">
      {/* Header */}
      <div className="p-5 border-b border-slate-200/10 dark:border-slate-800/60 flex items-center justify-between bg-white/30 dark:bg-slate-900/30">
        <div className="flex flex-col">
          <span className="font-mono text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ficha da Disciplina</span>
          <span className="font-mono font-bold text-sm text-slate-700 dark:text-slate-300 mt-0.5">{disciplina.codigo}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
            {disciplina.nome}
          </h3>
          <span className="inline-block mt-2 text-xs bg-white/30 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-medium border border-slate-200/10 dark:border-slate-800/10">
            Área: {disciplina.area}
          </span>
        </div>

        {/* Status Badge Card */}
        <div className={`p-4 border rounded-xl flex items-center gap-3.5 ${currentStatus.bg}`}>
          {currentStatus.icon}
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider block opacity-75">Status Atual</span>
            <span className="font-bold text-sm">{currentStatus.label}</span>
          </div>
        </div>

        {/* Technical Data */}
        <div className="grid grid-cols-2 gap-4 bg-white/20 dark:bg-slate-900/20 p-4 rounded-xl border border-white/10 dark:border-slate-800/20 backdrop-blur-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Carga Horária</span>
            <span className="block text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">{disciplina.cargaHoraria} horas</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Créditos UFC</span>
            <span className="block text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">{disciplina.creditos}</span>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Semestre Recomendado</span>
            <span className="block text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {disciplina.semestre ? `${disciplina.semestre}º Semestre` : 'Optativa'}
            </span>
          </div>
        </div>

        {/* Prerequisites */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
            Pré-requisitos ({disciplina.prerequisitos.length})
          </h4>
          {prereqsDetails.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">Esta é uma disciplina de entrada, não possui pré-requisitos.</p>
          ) : (
            <div className="space-y-1.5">
              {prereqsDetails.map(pr => (
                <div
                  key={pr.codigo}
                  className={`flex items-center gap-2 p-2 border rounded-lg text-xs transition-colors ${
                    status === 'concluida' || status === 'cursando' || status === 'disponivel'
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-slate-700 dark:text-slate-300'
                      : 'bg-slate-50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <CheckCircle className={`w-3.5 h-3.5 ${
                    status === 'concluida' || status === 'cursando' || status === 'disponivel'
                      ? 'text-emerald-500'
                      : 'text-slate-300 dark:text-slate-600'
                  }`} />
                  <span className="font-mono text-[10px] bg-slate-200/60 dark:bg-slate-800 px-1 py-0.2 rounded font-medium">{pr.codigo}</span>
                  <span className="truncate flex-1">{pr.nome}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* What this subject unlocks */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
            Desbloqueia ({unlocks.length})
          </h4>
          {unlocks.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">Esta disciplina não serve de pré-requisito para outras disciplinas.</p>
          ) : (
            <div className="space-y-1.5">
              {unlocks.map(un => (
                <div key={un.codigo} className="flex items-center gap-2 p-2 bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100/40 dark:border-blue-900/20 rounded-lg text-xs text-slate-700 dark:text-slate-300">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-mono text-[10px] bg-blue-100/50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-1 py-0.2 rounded font-medium">{un.codigo}</span>
                  <span className="truncate flex-1 font-medium">{un.nome}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="p-5 border-t border-slate-200/10 dark:border-slate-800/60 bg-white/30 dark:bg-slate-900/30 space-y-2">
        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
          Alterar Estado Acadêmico
        </span>
        <div className="grid grid-cols-2 gap-2">
          {status !== 'concluida' ? (
            <button
              onClick={() => onStatusChange(disciplina.codigo, 'concluida')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl shadow-xs transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Marcar Concluída
            </button>
          ) : (
            <button
              onClick={() => onStatusChange(disciplina.codigo, 'none')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-700 hover:text-white bg-slate-200 hover:bg-red-500 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-red-600 rounded-xl transition-colors"
            >
              Desmarcar Concluída
            </button>
          )}

          {status !== 'cursando' ? (
            <button
              onClick={() => onStatusChange(disciplina.codigo, 'cursando')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-700 hover:text-white bg-slate-100 hover:bg-amber-500 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-600 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Clock className="w-3.5 h-3.5" />
              Marcar Cursando
            </button>
          ) : (
            <button
              onClick={() => onStatusChange(disciplina.codigo, 'none')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-700 hover:text-white bg-slate-200 hover:bg-red-500 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-red-600 rounded-xl transition-colors"
            >
              Desmarcar Cursando
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-900 rounded-xl transition-all border border-slate-200/50 dark:border-slate-800/60 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Fechar Detalhes</span>
        </button>
      </div>
    </div>
  );
}

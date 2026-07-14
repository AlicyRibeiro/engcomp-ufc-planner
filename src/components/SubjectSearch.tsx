import { useState, useRef, useEffect } from 'react';
import { Search, PlusCircle, CheckCircle, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { Disciplina, UserAcademicState } from '../types';
import { curriculumService } from '../services/curriculumService';

interface SubjectSearchProps {
  disciplinas: Disciplina[];
  academicState: UserAcademicState;
  onAdd: (codigo: string, status: 'concluida' | 'cursando') => void;
}

export function SubjectSearch({ disciplinas, academicState, onAdd }: SubjectSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter subjects by query, ignoring accents and case
  const cleanString = (str: string) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filtered = query.trim() === '' 
    ? [] 
    : disciplinas.filter(d => {
        const cleanQuery = cleanString(query);
        const cleanNome = cleanString(d.nome);
        const cleanCodigo = cleanString(d.codigo);
        return cleanNome.includes(cleanQuery) || cleanCodigo.includes(cleanQuery);
      }).slice(0, 8); // Limit search results to 8 for UI cleanliness

  const isAlreadyAdded = (codigo: string) => {
    return academicState.concluidas.includes(codigo) || academicState.cursando.includes(codigo);
  };

  const getAddedStatus = (codigo: string): 'concluida' | 'cursando' | null => {
    if (academicState.concluidas.includes(codigo)) return 'concluida';
    if (academicState.cursando.includes(codigo)) return 'cursando';
    return null;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 font-sans">
        Adicionar Disciplina Cursada ou Em Curso
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Pesquisar disciplina... (ex: Estruturas de Dados, Circuitos)"
          className="block w-full pl-10 pr-4 py-3 glass-input rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all text-sm font-sans"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Limpar
          </button>
        )}
      </div>

      {isOpen && query.trim() !== '' && (
        <div className="absolute z-50 mt-2 w-full glass-panel border border-white/20 dark:border-slate-800/40 rounded-xl shadow-lg overflow-hidden max-h-96 backdrop-blur-lg">
          <div className="p-2 border-b border-slate-200/10 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/30 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Resultados para "{query}"</span>
            <span>Selecione para adicionar</span>
          </div>
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-1.5">
              <AlertCircle className="w-5 h-5 text-slate-400" />
              <p className="text-sm font-medium">Nenhuma disciplina encontrada</p>
              <p className="text-xs">Tente outro nome ou código da UFC.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(d => {
                const added = getAddedStatus(d.codigo);
                return (
                  <li key={d.codigo} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between gap-4 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                          {d.codigo}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {d.semestre ? `${d.semestre}º Semestre` : 'Optativa'}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {d.nome}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{d.cargaHoraria}h</span>
                        <span>•</span>
                        <span>{d.creditos} créditos</span>
                        <span>•</span>
                        <span className="truncate">{d.area}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {added ? (
                        <div className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                          {added === 'concluida' ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Concluída</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Cursando</span>
                            </>
                          )}
                          <button
                            onClick={() => {
                              onAdd(d.codigo, added === 'concluida' ? 'cursando' : 'concluida');
                            }}
                            className="ml-1 text-[10px] text-blue-500 hover:underline border-l border-slate-300 dark:border-slate-700 pl-1.5"
                          >
                            Mudar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onAdd(d.codigo, 'concluida');
                              setQuery('');
                              setIsOpen(false);
                            }}
                            className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-white dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 dark:hover:bg-emerald-600 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-1.5 rounded-lg transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Concluída</span>
                          </button>
                          <button
                            onClick={() => {
                              onAdd(d.codigo, 'cursando');
                              setQuery('');
                              setIsOpen(false);
                            }}
                            className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-white dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-600 dark:hover:bg-amber-600 border border-amber-200 dark:border-amber-800/80 px-2.5 py-1.5 rounded-lg transition-all"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Cursando</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

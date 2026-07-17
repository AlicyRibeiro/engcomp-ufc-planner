import { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  Trash2, 
  SlidersHorizontal,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Award,
  Calendar,
  Layers,
  Search,
  BookMarked,
  MapPin,
  Printer
} from 'lucide-react';
import { Disciplina, UserAcademicState, CursoStats } from '../types';
import { curriculumService } from '../services/curriculumService';
import { SubjectSearch } from '../components/SubjectSearch';
import { SubjectCard } from '../components/SubjectCard';
import { AvailableSubjectCard } from '../components/AvailableSubjectCard';
import { StatCard } from '../components/StatCard';
import { AcademicReportModal } from '../components/AcademicReportModal';

interface WorkspaceProps {
  disciplinas: Disciplina[];
  academicState: UserAcademicState;
  stats: CursoStats;
  onAdd: (codigo: string, status: 'concluida' | 'cursando') => void;
  onRemove: (codigo: string) => void;
  onSwitchStatus: (codigo: string, status: 'concluida' | 'cursando') => void;
  onClear: () => void;
}

export function Workspace({ 
  disciplinas, 
  academicState, 
  stats, 
  onAdd, 
  onRemove, 
  onSwitchStatus, 
  onClear 
}: WorkspaceProps) {
  
  // Workspace-specific filters for the available and completed disciplines
  const [semesterFilter, setSemesterFilter] = useState<number | 'all'>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'available' | 'all'>('available');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const areas = useMemo(() => curriculumService.getAreas(), []);
  const semestres = useMemo(() => curriculumService.getSemestres(), []);

  // Calculate available disciplines
  const availableDisciplinas = useMemo(() => {
    return disciplinas.filter(d => {
      // It is available if its status is calculated as 'disponivel'
      const status = curriculumService.getStatus(d, academicState);
      return status === 'disponivel';
    });
  }, [disciplinas, academicState]);

  // Filter available disciplines based on filters selected and sort by semester ascending
  const filteredAvailable = useMemo(() => {
    const sourceList = viewMode === 'available' ? availableDisciplinas : disciplinas;
    return sourceList
      .filter(d => {
        const matchesSemester = semesterFilter === 'all' || d.semestre === semesterFilter;
        const matchesArea = areaFilter === 'all' || d.area === areaFilter;
        return matchesSemester && matchesArea;
      })
      .sort((a, b) => {
        if (a.semestre !== b.semestre) {
          return a.semestre - b.semestre;
        }
        return a.nome.localeCompare(b.nome);
      });
  }, [availableDisciplinas, disciplinas, semesterFilter, areaFilter, viewMode]);

  // Resolve subjects objects for lists
  const concluidasSubjects = useMemo(() => {
    return academicState.concluidas
      .map(code => curriculumService.getByCodigo(code))
      .filter((d): d is Disciplina => d !== undefined)
      .sort((a, b) => {
        const semA = typeof a.semestre === 'number' && a.semestre !== null ? a.semestre : 11;
        const semB = typeof b.semestre === 'number' && b.semestre !== null ? b.semestre : 11;
        return semA - semB;
      });
  }, [academicState.concluidas]);

  const cursandoSubjects = useMemo(() => {
    return academicState.cursando
      .map(code => curriculumService.getByCodigo(code))
      .filter((d): d is Disciplina => d !== undefined)
      .sort((a, b) => {
        const semA = typeof a.semestre === 'number' && a.semestre !== null ? a.semestre : 11;
        const semB = typeof b.semestre === 'number' && b.semestre !== null ? b.semestre : 11;
        return semA - semB;
      });
  }, [academicState.cursando]);

  const handleQuickMarkConcluida = (codigo: string) => {
    onAdd(codigo, 'concluida');
  };

  const handleQuickMarkCursando = (codigo: string) => {
    onAdd(codigo, 'cursando');
  };

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-transparent">
      
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Progresso do Curso"
          value={`${stats.progressoPorcentagem}%`}
          subtitle="Sobre o total de 212 créditos"
          colorClass="text-emerald-500"
          icon={<Award className="w-5 h-5" />}
        />
        <StatCard
          title="Horas Concluídas"
          value={`${stats.cargaHorariaConcluida}h`}
          subtitle={`De 3.392 horas totais (${stats.creditosConcluidos} créditos feitos)`}
          colorClass="text-blue-500"
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatCard
          title="Créditos Cursando / Restantes"
          value={`${stats.creditosCursando} / ${stats.creditosRestantes}`}
          subtitle="Ideal: 20-24 por semestre"
          colorClass="text-amber-500"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          title="Semestres Restantes"
          value={`~ ${stats.estimativaSemestresRestantes}`}
          subtitle="Estimativa de tempo"
          colorClass="text-purple-500"
          icon={<Calendar className="w-5 h-5" />}
        />
      </div>
 
      {/* Main Workspace Layout (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section: Course Info Profile */}
          <div className="glass-panel rounded-2xl p-5 shadow-sm space-y-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/20 dark:border-slate-800/60">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                <GraduationCap className="w-4.5 h-4.5 text-blue-500" />
                Estrutura do Curso
              </h3>
              <span className="text-[10px] bg-blue-500/10 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                UFC Quixadá
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Curso</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Engenharia de Computação</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Universidade</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">UFC • Quixadá</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Carga Horária</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">3.392 horas</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Créditos Totais</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">212 créditos</span>
              </div>
              <div className="col-span-2 space-y-1 pt-2 border-t border-slate-200/10 dark:border-slate-800/40">
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Duração Estimada</span>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  <span>Mínimo: 10 semestres • Máximo: 15 semestres</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Academic History Control */}
          <div className="glass-panel rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/20 dark:border-slate-800/60 gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-blue-500" />
                Histórico Acadêmico
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 transition-all px-2.5 py-1.5 bg-blue-500/10 dark:bg-blue-500/10 hover:bg-blue-500/20 dark:hover:bg-blue-500/20 rounded-lg cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Relatório
                </button>
                {(academicState.concluidas.length > 0 || academicState.cursando.length > 0) && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold flex items-center gap-1 transition-colors px-2 py-1.5 hover:bg-red-500/10 dark:hover:bg-red-950/20 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Subject Autocomplete Search */}
            <SubjectSearch 
              disciplinas={disciplinas}
              academicState={academicState}
              onAdd={onAdd}
            />

            {/* Lists wrapper */}
            <div className="space-y-4 pt-1">
              {/* List 1: Cursando */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Disciplinas Cursando ({cursandoSubjects.length})
                  </span>
                </div>

                {cursandoSubjects.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200/50 dark:border-slate-800/60 text-center text-xs text-slate-400 dark:text-slate-500 bg-white/10 dark:bg-slate-950/20">
                    Nenhuma disciplina em curso. Use a busca acima para adicionar.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                    {cursandoSubjects.map(d => (
                      <SubjectCard
                        key={d.codigo}
                        disciplina={d}
                        status="cursando"
                        onRemove={onRemove}
                        onSwitchStatus={onSwitchStatus}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* List 2: Concluídas */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Disciplinas Concluídas ({concluidasSubjects.length})
                  </span>
                </div>

                {concluidasSubjects.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200/50 dark:border-slate-800/60 text-center text-xs text-slate-400 dark:text-slate-500 bg-white/10 dark:bg-slate-950/20">
                    Nenhuma disciplina concluída. Marque abaixo ou use a busca para preencher.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
                    {concluidasSubjects.map(d => (
                      <SubjectCard
                        key={d.codigo}
                        disciplina={d}
                        status="concluida"
                        onRemove={onRemove}
                        onSwitchStatus={onSwitchStatus}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Span 7) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Toolbar and filter for available subjects */}
          <div className="glass-panel rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200/20 dark:border-slate-800/60">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                    {viewMode === 'available' ? 'Próximas Disciplinas Disponíveis' : 'Todas as Disciplinas do Currículo'}
                  </h3>
                  <span className="text-xs bg-blue-500/10 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-bold">
                    {viewMode === 'available' ? `${availableDisciplinas.length} Elegíveis` : `${disciplinas.length} Totais`}
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {viewMode === 'available' 
                    ? 'Disciplinas que você atende a todos os pré-requisitos necessários' 
                    : 'Gerencie e visualize o histórico de todas as disciplinas da grade de Engenharia de Computação'}
                </p>
              </div>

              {/* View mode toggle & Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* View Mode Selector */}
                <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/20 dark:border-slate-850/40">
                  <button
                    onClick={() => setViewMode('available')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'available'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                  >
                    Apenas Elegíveis
                  </button>
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'all'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                  >
                    Ver Tudo
                  </button>
                </div>

                {/* Workspace filters */}
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  
                  {/* Semester Filter */}
                  <div className="relative">
                    <select
                      value={semesterFilter}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSemesterFilter(val === 'all' ? 'all' : Number(val));
                      }}
                      className="appearance-none text-xs font-semibold border border-slate-200/30 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 rounded-lg pl-2.5 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500/30 backdrop-blur-md cursor-pointer transition-all"
                    >
                      <option value="all" className="bg-slate-900 text-white">Filtrar Semestre</option>
                      {semestres.map(sem => (
                        <option key={sem} value={sem} className="bg-slate-900 text-white">{sem}º Semestre</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  </div>

                  {/* Area Filter */}
                  <div className="relative">
                    <select
                      value={areaFilter}
                      onChange={(e) => setAreaFilter(e.target.value)}
                      className="appearance-none text-xs font-semibold border border-slate-200/30 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 rounded-lg pl-2.5 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500/30 backdrop-blur-md cursor-pointer transition-all"
                    >
                      <option value="all" className="bg-slate-900 text-white">Filtrar Área</option>
                      {areas.map(area => (
                        <option key={area} value={area} className="bg-slate-900 text-white">{area}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* List of Available cards */}
            {filteredAvailable.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
                <div className="mx-auto w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-300">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma disciplina encontrada sob os filtros</h4>
                <p className="text-xs max-w-sm mx-auto leading-relaxed">
                  {viewMode === 'available' && availableDisciplinas.length === 0 
                    ? "Marque algumas disciplinas iniciais (Cálculo I, Introdução, Programação) como concluídas para liberar novas opções!" 
                    : "Tente limpar os filtros de semestre ou área ou mude o modo para 'Ver Tudo' para visualizar mais disciplinas."}
                </p>
                {(semesterFilter !== 'all' || areaFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSemesterFilter('all');
                      setAreaFilter('all');
                    }}
                    className="mt-2 text-xs font-semibold text-blue-500 hover:underline cursor-pointer"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[680px] overflow-y-auto pr-1">
                {filteredAvailable.map(d => (
                  <AvailableSubjectCard
                    key={d.codigo}
                    disciplina={d}
                    status={
                      academicState.concluidas.includes(d.codigo)
                        ? 'concluida'
                        : academicState.cursando.includes(d.codigo)
                        ? 'cursando'
                        : availableDisciplinas.some(av => av.codigo === d.codigo)
                        ? 'disponivel'
                        : 'bloqueada'
                    }
                    onMarkConcluida={handleQuickMarkConcluida}
                    onMarkCursando={handleQuickMarkCursando}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Glass Confirmation Modal for clearing history */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4 bg-white/80 dark:bg-slate-900/80">
            <div className="flex items-center gap-3 text-red-500 dark:text-red-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Limpar Todo o Progresso?</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Tem certeza de que deseja limpar todo o seu progresso? Isso removerá permanentemente todas as disciplinas marcadas como concluídas ou cursando do seu histórico acadêmico.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onClear();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors cursor-pointer"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Academic Report Export Modal */}
      <AcademicReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        academicState={academicState}
        stats={stats}
        disciplinas={disciplinas}
      />
    </div>
  );
}

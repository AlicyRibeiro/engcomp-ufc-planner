import React, { useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  NodeProps,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Disciplina, StatusDisciplina, UserAcademicState } from '../types';
import { curriculumService } from '../services/curriculumService';
import { SidebarDetail } from '../components/SidebarDetail';
import { SlidersHorizontal, BookOpen, Layers, Info, RotateCcw, ChevronDown, X } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface FluxogramaProps {
  disciplinas: Disciplina[];
  academicState: UserAcademicState;
  onStatusChange: (codigo: string, status: 'concluida' | 'cursando' | 'none') => void;
}

type DisciplinaNodeData = {
  disciplina: Disciplina;
  status: StatusDisciplina;
  dimmed: boolean;
  highlighted: boolean;
};

type CustomDisciplinaNode = Node<DisciplinaNodeData, 'disciplina'>;

export const areaColors: Record<string, { bg: string; text: string; border: string; dot: string; activeBg: string; activeText: string; activeBorder: string }> = {
  "Hardware e Sistemas": {
    bg: "bg-indigo-500/10 dark:bg-indigo-500/5",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-500/20 dark:border-indigo-500/10",
    dot: "bg-indigo-500",
    activeBg: "bg-indigo-600 dark:bg-indigo-500",
    activeText: "text-white dark:text-slate-950",
    activeBorder: "border-indigo-600 dark:border-indigo-400"
  },
  "Programação e Software": {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/5",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/20 dark:border-emerald-500/10",
    dot: "bg-emerald-500",
    activeBg: "bg-emerald-600 dark:bg-emerald-500",
    activeText: "text-white dark:text-slate-950",
    activeBorder: "border-emerald-600 dark:border-emerald-400"
  },
  "Humanas e Gestão": {
    bg: "bg-purple-500/10 dark:bg-purple-500/5",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-500/20 dark:border-purple-500/10",
    dot: "bg-purple-500",
    activeBg: "bg-purple-600 dark:bg-purple-500",
    activeText: "text-white dark:text-slate-950",
    activeBorder: "border-purple-600 dark:border-purple-400"
  },
  "Matemática e Física": {
    bg: "bg-rose-500/10 dark:bg-rose-500/5",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/20 dark:border-rose-500/10",
    dot: "bg-rose-500",
    activeBg: "bg-rose-600 dark:bg-rose-500",
    activeText: "text-white dark:text-slate-950",
    activeBorder: "border-rose-600 dark:border-rose-400"
  },
  "Redes e Telecom": {
    bg: "bg-cyan-500/10 dark:bg-cyan-500/5",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-500/20 dark:border-cyan-500/10",
    dot: "bg-cyan-500",
    activeBg: "bg-cyan-600 dark:bg-cyan-500",
    activeText: "text-white dark:text-slate-950",
    activeBorder: "border-cyan-600 dark:border-cyan-400"
  },
  "Sinais e Controle": {
    bg: "bg-amber-500/10 dark:bg-amber-500/5",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/20 dark:border-amber-500/10",
    dot: "bg-amber-500",
    activeBg: "bg-amber-600 dark:bg-amber-500",
    activeText: "text-white dark:text-slate-950",
    activeBorder: "border-amber-600 dark:border-amber-400"
  },
  "Optativas": {
    bg: "bg-slate-500/10 dark:bg-slate-500/5",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-500/20 dark:border-slate-500/10",
    dot: "bg-slate-500",
    activeBg: "bg-slate-600 dark:bg-slate-500",
    activeText: "text-white dark:text-slate-950",
    activeBorder: "border-slate-600 dark:border-slate-400"
  }
};

// Custom Node Component for React Flow
function DisciplinaNode({ data }: NodeProps<CustomDisciplinaNode>) {
  if (!data || !data.disciplina) return null;
  const { disciplina, status, dimmed, highlighted } = data;

  const statusStyles = {
    concluida: {
      bg: 'bg-emerald-50/95 dark:bg-emerald-950/35 backdrop-blur-md',
      border: 'border-emerald-500/60 dark:border-emerald-500/40 shadow-emerald-500/5',
      text: 'text-emerald-900 dark:text-emerald-200',
      badge: 'bg-emerald-500 text-white',
      desc: 'Concluída'
    },
    cursando: {
      bg: 'bg-amber-50/95 dark:bg-amber-950/35 backdrop-blur-md',
      border: 'border-amber-500/60 dark:border-amber-500/40 shadow-amber-500/5',
      text: 'text-amber-900 dark:text-amber-200',
      badge: 'bg-amber-500 text-white',
      desc: 'Cursando'
    },
    disponivel: {
      bg: 'bg-blue-50/95 dark:bg-blue-950/35 backdrop-blur-md',
      border: 'border-blue-500/60 dark:border-blue-500/40 shadow-blue-500/5',
      text: 'text-blue-900 dark:text-blue-200',
      badge: 'bg-blue-500 text-white',
      desc: 'Disponível'
    },
    bloqueada: {
      bg: 'bg-slate-100/90 dark:bg-slate-900/40 backdrop-blur-md',
      border: 'border-slate-300/85 dark:border-slate-800/50',
      text: 'text-slate-500 dark:text-slate-400',
      badge: 'bg-slate-400/80 dark:bg-slate-700/80 text-white',
      desc: 'Bloqueada'
    }
  };

  const style = (status && statusStyles[status]) ? statusStyles[status] : statusStyles.bloqueada;
  const areaColorsConfig = areaColors[disciplina.area] || areaColors["Optativas"];

  return (
    <div
      className={`px-3 py-2.5 rounded-xl border text-left w-[240px] font-sans transition-all duration-300 ${style.bg} ${style.border} ${style.text} ${
        dimmed ? 'opacity-25' : 'opacity-100'
      } ${highlighted ? 'ring-4 ring-offset-2 ring-blue-500 dark:ring-offset-slate-950' : ''} shadow-xs hover:shadow-md cursor-pointer`}
    >
      {/* Input Handle (left side for prereqs coming in) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 !bg-slate-400 dark:!bg-slate-600 border-none"
      />

      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="font-mono text-[9px] font-bold tracking-wider uppercase opacity-80">
          {disciplina.codigo}
        </span>
        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${style.badge}`}>
          {style.desc}
        </span>
      </div>

      <h4 className="text-xs font-bold leading-tight line-clamp-2 h-8 flex items-center">
        {disciplina.nome}
      </h4>

      <div className="flex items-center justify-between text-[9px] mt-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/60 opacity-80">
        <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-semibold border ${areaColorsConfig.bg} ${areaColorsConfig.text} ${areaColorsConfig.border}`}>
          {disciplina.area}
        </span>
        <span className="font-mono">{disciplina.cargaHoraria}h • {disciplina.creditos}Cr</span>
      </div>

      {/* Output Handle (right side for unlocking subjects) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 !bg-slate-400 dark:!bg-slate-600 border-none"
      />
    </div>
  );
}

const nodeTypes = {
  disciplina: DisciplinaNode
};

export function Fluxograma({ disciplinas, academicState, onStatusChange }: FluxogramaProps) {
  const [selectedDisciplina, setSelectedDisciplina] = useState<Disciplina | null>(null);
  const { isDark } = useTheme();
  
  // Filters State
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedSemestreFilter, setSelectedSemestreFilter] = useState<number | 'all'>('all');
  const [isLegendOpen, setIsLegendOpen] = useState(true);

  // Auto-collapse legend on small screens on mount
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsLegendOpen(false);
    }
  }, []);

  const areas = useMemo(() => curriculumService.getAreas(), []);
  const semestres = useMemo(() => curriculumService.getSemestres(), []);

  // Node & Edge Generation
  const initialNodes = useMemo<CustomDisciplinaNode[]>(() => {
    // Count index within each semester to calculate vertical Y position
    const semesterSubjectCount: Record<number, number> = {};

    return disciplinas
      .filter(d => {
        if (selectedArea === 'Optativas') {
          return d.area === 'Optativas';
        } else {
          return d.area !== 'Optativas';
        }
      })
      .map(d => {
        const sem = typeof d.semestre === 'number' && d.semestre !== null ? d.semestre : 11;
        if (semesterSubjectCount[sem] === undefined) {
          semesterSubjectCount[sem] = 0;
        }
        const indexInSemester = semesterSubjectCount[sem];
        semesterSubjectCount[sem] += 1;

        let x = 0;
        let y = 0;

        if (d.area === 'Optativas') {
          // Grid layout: 4 columns
          const col = indexInSemester % 4;
          const row = Math.floor(indexInSemester / 4);
          x = col * 320 + 40;
          y = row * 135 + 80;
        } else {
          // X position is driven by semester: Column layout
          x = (sem - 1) * 320 + 40;
          // Y position is driven by vertical index in semester.
          y = indexInSemester * 135 + 80;
        }

        const status = curriculumService.getStatus(d, academicState);

        // Verify filters
        const matchesArea = selectedArea === 'all' || d.area === selectedArea;
        const matchesSemestre = selectedSemestreFilter === 'all' || d.semestre === selectedSemestreFilter;
        const dimmed = !matchesArea || !matchesSemestre;

        return {
          id: d.codigo,
          type: 'disciplina',
          position: { x, y },
          data: {
            disciplina: d,
            status,
            dimmed,
            highlighted: selectedDisciplina?.codigo === d.codigo
          }
        };
      });
  }, [disciplinas, academicState, selectedArea, selectedSemestreFilter, selectedDisciplina]);

  const initialEdges = useMemo(() => {
    const edgesList: Edge[] = [];

    const filteredDisciplinas = disciplinas.filter(d => {
      if (selectedArea === 'Optativas') {
        return d.area === 'Optativas';
      } else {
        return d.area !== 'Optativas';
      }
    });

    const activeCodigos = new Set(filteredDisciplinas.map(d => d.codigo));

    filteredDisciplinas.forEach(d => {
      d.prerequisitos.forEach(pre => {
        // Only add edge if the prerequisite node is also active
        if (!activeCodigos.has(pre)) return;

        const sourceStatus = academicState.concluidas.includes(pre) ? 'concluida' : 'incompleta';
        const targetStatus = curriculumService.getStatus(d, academicState);
        
        let edgeColor = isDark ? '#475569' : '#94a3b8'; // default slate-600 in dark, slate-400 in light
        let edgeWidth = 1.5;
        let animated = false;

        if (sourceStatus === 'concluida' && (targetStatus === 'concluida' || targetStatus === 'cursando')) {
          edgeColor = isDark ? '#10b981' : '#059669'; // emerald-500 in dark, emerald-600 in light
          edgeWidth = 2.5;
        } else if (sourceStatus === 'concluida' && targetStatus === 'disponivel') {
          edgeColor = isDark ? '#3b82f6' : '#2563eb'; // blue-500 in dark, blue-600 in light
          edgeWidth = 2.5;
          animated = true;
        } else if (sourceStatus === 'incompleta') {
          edgeColor = isDark ? '#334155' : '#cbd5e1'; // dark slate in dark mode, light slate in light mode
          edgeWidth = 1.2;
        }

        edgesList.push({
          id: `edge-${pre}-${d.codigo}`,
          source: pre,
          target: d.codigo,
          type: 'smoothstep',
          animated,
          style: { stroke: edgeColor, strokeWidth: edgeWidth },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
            color: edgeColor
          }
        });
      });
    });

    return edgesList;
  }, [disciplinas, academicState, selectedArea, isDark]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  console.log('Fluxograma render - nodes:', nodes.length, 'edges:', edges.length);

  // Sync node changes when state/filters change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Click handler
  const onNodeClick = (event: React.MouseEvent, node: any) => {
    setSelectedDisciplina(node.data.disciplina);
  };

  const activeStatus = selectedDisciplina 
    ? curriculumService.getStatus(selectedDisciplina, academicState)
    : 'bloqueada';

  const resetFilters = () => {
    setSelectedArea('all');
    setSelectedSemestreFilter('all');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent w-full">
      {/* Filters Toolbar */}
      <div className="glass-panel px-6 py-4 flex flex-col gap-4 shrink-0 shadow-xs border-b border-white/20 dark:border-slate-800/30 w-full rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Fluxograma Interativo</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Navegue pelas disciplinas e visualize suas conexões de pré-requisitos</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Semester Filter */}
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Semestre:</span>
              <div className="relative">
                <select
                  value={selectedSemestreFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSemestreFilter(val === 'all' ? 'all' : Number(val));
                  }}
                  className="appearance-none text-xs font-semibold border border-slate-200/30 dark:border-slate-800/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none shadow-xs cursor-pointer backdrop-blur-md transition-all"
                >
                  <option value="all" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Todos os Semestres</option>
                  {semestres.map(sem => (
                    <option key={sem} value={sem} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">{sem}º Semestre</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
              </div>
            </div>

            {(selectedArea !== 'all' || selectedSemestreFilter !== 'all') && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-semibold px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/20 rounded-lg transition-colors cursor-pointer border border-rose-200/10"
              >
                <RotateCcw className="w-3 h-3" />
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Knowledge Area Pills Selector - Visual Category indicators */}
        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filtrar por Área de Conhecimento:</span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2.5 scrollbar-none sm:scrollbar-thin w-full">
            <button
              onClick={() => setSelectedArea('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                selectedArea === 'all'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                  : 'bg-white/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              Todas as Áreas
            </button>
            
            {areas.map(area => {
              const isSelected = selectedArea === area;
              const config = areaColors[area] || areaColors["Optativas"];
              return (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? `${config.activeBg} ${config.activeText} ${config.activeBorder} shadow-sm`
                      : `bg-white/50 dark:bg-slate-900/40 ${config.text} ${config.border} hover:bg-slate-100 dark:hover:bg-slate-850`
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                  {area}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Flow Canvas area */}
      <div className="w-full flex-1 relative h-[500px] md:h-[calc(100vh-240px)] md:min-h-[650px] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-100/40 dark:bg-slate-950/40 shadow-inner">
        {/* Info Banner (Collapsible) */}
        <div className="absolute top-4 left-4 z-10 pointer-events-auto">
          {!isLegendOpen ? (
            <button
              onClick={() => setIsLegendOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/90 dark:bg-slate-900/90 border border-slate-200/50 dark:border-slate-800/50 rounded-xl shadow-md text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-850 transition-all cursor-pointer"
            >
              <Info className="w-4 h-4 text-blue-500" />
              <span>Ver Legenda</span>
            </button>
          ) : (
            <div className="glass-panel border border-white/20 dark:border-slate-800/30 p-3.5 rounded-xl shadow-md max-w-sm relative">
              <button
                onClick={() => setIsLegendOpen(false)}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Fechar Legenda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1.5">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                Legenda de Cores
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Verde: Concluída</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Amarelo: Cursando</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Azul: Disponível</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-700"></span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Cinza: Bloqueada</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2.5 leading-tight italic pr-4">
                * Arraste o mapa para navegar, pinça/roda para zoom, clique em disciplinas para ver detalhes e atualizar!
              </p>
            </div>
          )}
        </div>

        <div className="absolute inset-0 z-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={1.5}
            nodesDraggable={false}
            attributionPosition="bottom-right"
          >
            <Background color="#94a3b8" gap={16} size={1} opacity={0.3} />
            <Controls className="!bg-white dark:!bg-slate-900 border !border-slate-200 dark:!border-slate-800 !rounded-xl !shadow-md" />
            <MiniMap 
              nodeColor={(node) => {
                const status = node.data?.status;
                if (status === 'concluida') return '#10b981';
                if (status === 'cursando') return '#f59e0b';
                if (status === 'disponivel') return '#3b82f6';
                return '#94a3b8';
              }}
              maskColor="rgba(0, 0, 0, 0.15)"
              className="!bg-white dark:!bg-slate-900 border !border-slate-200 dark:!border-slate-800 !rounded-xl !shadow-md hidden md:block"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Slide-out Sidebar details */}
      <SidebarDetail
        disciplina={selectedDisciplina}
        status={activeStatus}
        onClose={() => setSelectedDisciplina(null)}
        onStatusChange={onStatusChange}
        todas={disciplinas}
      />
    </div>
  );
}

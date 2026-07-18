import { Disciplina, UserAcademicState, CursoStats, StatusDisciplina } from '../types';
import rawDisciplinas from '../data/disciplinas.json';

// Ensure type casting from raw JSON
export const todasDisciplinas: Disciplina[] = rawDisciplinas as Disciplina[];

export const EXCLUDED_BY_PPC: Record<'2017' | '2023', string[]> = {
  '2023': [
    'QXD0118', // Introdução à Eng. de Computação 32h (2017)
    'QXD0103', // Ética, Direito e Legislação 32h (2017)
    'QXD0146', // Sistemas Digitais para Computadores (2017)
    'QXD0252', // Engenharia de Software (2017)
    'QXD0148', // Sistemas Operacionais II (2017)
  ],
  '2017': [
    'QXD203',  // Introdução à Eng. de Computação 64h (2023)
    'QXD0250', // Ética Direito e Legislação 32h (2023)
    'QXD0285', // Sistemas Digitais para Computadores (2023)
    'QXD0283', // Engenharia de Software (2023)
  ],
};

export const EQUIVALENCIAS: Record<string, string[]> = {
  'QXD203': ['QXD0118'],
  'QXD0118': ['QXD203'],
  'QXD0285': ['QXD0146'],
  'QXD0146': ['QXD0285'],
  'QXD0283': ['QXD0252'],
  'QXD0252': ['QXD0283'],
};

// Helper to check if a code is completed, considering equivalences
export const isCompletada = (codigo: string, concluidas: string[]): boolean => {
  const code = codigo.toUpperCase().replace(/\s+/g, '');
  if (concluidas.includes(code)) return true;
  const equivs = EQUIVALENCIAS[code] || [];
  return equivs.some(eq => concluidas.includes(eq));
};

// Helper to check if a code is currently being taken, considering equivalences
export const isCursando = (codigo: string, cursando: string[]): boolean => {
  const code = codigo.toUpperCase().replace(/\s+/g, '');
  if (cursando.includes(code)) return true;
  const equivs = EQUIVALENCIAS[code] || [];
  return equivs.some(eq => cursando.includes(eq));
};

export const curriculumService = {
  getTodas: (ppc?: '2017' | '2023'): Disciplina[] => {
    if (!ppc) return todasDisciplinas;
    const excluded = EXCLUDED_BY_PPC[ppc] || [];
    return todasDisciplinas.filter(d => !excluded.includes(d.codigo));
  },

  getByCodigo: (codigo: string): Disciplina | undefined => {
    return todasDisciplinas.find(d => d.codigo === codigo);
  },

  getAreas: (ppc?: '2017' | '2023'): string[] => {
    const list = ppc ? curriculumService.getTodas(ppc) : todasDisciplinas;
    const areas = list.map(d => d.area);
    return Array.from(new Set(areas)).sort();
  },

  getSemestres: (ppc?: '2017' | '2023'): number[] => {
    const list = ppc ? curriculumService.getTodas(ppc) : todasDisciplinas;
    const semestres = list
      .map(d => d.semestre)
      .filter((sem): sem is number => typeof sem === 'number' && sem !== null && !isNaN(sem));
    return Array.from(new Set(semestres)).sort((a, b) => a - b);
  },

  getStatus: (disciplina: Disciplina, state: UserAcademicState): StatusDisciplina => {
    if (isCompletada(disciplina.codigo, state.concluidas)) {
      return 'concluida';
    }
    if (isCursando(disciplina.codigo, state.cursando)) {
      return 'cursando';
    }

    // A disciplina está disponível se TODOS os seus pré-requisitos estiverem CONCLUÍDOS
    const prereqs = disciplina.prerequisitos;
    if (prereqs.length === 0) {
      return 'disponivel';
    }

    const todosConcluidos = prereqs.every(reqCodigo => isCompletada(reqCodigo, state.concluidas));
    return todosConcluidos ? 'disponivel' : 'bloqueada';
  },

  calculateStats: (state: UserAcademicState): CursoStats => {
    const ppc = state.ppc || '2023';
    const excluded = EXCLUDED_BY_PPC[ppc] || [];
    const ppcDisciplinas = todasDisciplinas.filter(d => !excluded.includes(d.codigo));

    const totalDisciplinas = ppcDisciplinas.length;
    const totalCreditos = ppc === '2023' ? 212 : 202; // Carga de créditos oficiais do curso
    const totalCargaHoraria = ppc === '2023' ? 3392 : 3200; // Carga horária total oficial do curso

    const concluidasObj = ppcDisciplinas.filter(d => state.concluidas.includes(d.codigo) || isCompletada(d.codigo, state.concluidas));
    const cursandoObj = ppcDisciplinas.filter(d => state.cursando.includes(d.codigo) || isCursando(d.codigo, state.cursando));

    const creditosConcluidos = concluidasObj.reduce((acc, d) => acc + d.creditos, 0);
    const creditosCursando = cursandoObj.reduce((acc, d) => acc + d.creditos, 0);
    const creditosRestantes = Math.max(0, totalCreditos - creditosConcluidos);
    
    const cargaHorariaConcluida = concluidasObj.reduce((acc, d) => acc + d.cargaHoraria, 0);

    // Progresso baseado em créditos concluídos sobre o total oficial do curso
    const progressoPorcentagem = totalCreditos > 0 ? Math.min(100, Math.round((creditosConcluidos / totalCreditos) * 100)) : 0;

    // Estimativa de semestres restantes baseado na média de 22 créditos por semestre
    const estimativaSemestresRestantes = creditosRestantes > 0 
      ? Math.max(1, Math.ceil(creditosRestantes / 22)) 
      : 0;

    // Helper for extension hours
    const getExtensaoHours = (codigo: string): number => {
      if (ppc !== '2023') return 0; // Extension is not mandatory in 2017
      const code = codigo.toUpperCase().replace(/\s+/g, '');
      if (code === 'QXD203' || code === 'QXD0118') return 32;
      if (code === 'QXD0250' || code === 'QXD0103') return 16;
      if (code === 'QXD0283' || code === 'QXD0252') return 16;
      if (code === 'QXD0284') return 48;
      if (code === 'QXD0287') return 48;
      if (code === 'QXD0303') return 48;
      if (code === 'EXT0063') return 132;
      return 0;
    };

    // Calculate Optativas
    const optativasObj = concluidasObj.filter(d => d.semestre === null && d.codigo !== 'EXT0063');
    const optativaIntegralizado = optativasObj.reduce((acc, d) => acc + d.cargaHoraria, 0);
    const optativaExigida = ppc === '2023' ? 576 : 288;
    const optativaComputavel = Math.min(optativaExigida, optativaIntegralizado);
    const optativaPendente = Math.max(0, optativaExigida - optativaComputavel);

    // Calculate Atividades Complementares
    const atividadesObj = concluidasObj.filter(d => d.codigo === 'ENCQ0002');
    const atividadesIntegralizado = atividadesObj.reduce((acc, d) => acc + d.cargaHoraria, 0);
    const atividadesComputavel = Math.min(60, atividadesIntegralizado);
    const atividadesPendente = Math.max(0, 60 - atividadesComputavel);

    // Calculate TCC
    const tccObj = concluidasObj.filter(d => d.codigo === 'QXD0219' || d.codigo === 'QXD0304' || d.codigo === 'QXD0220');
    const tccIntegralizado = tccObj.reduce((acc, d) => acc + d.cargaHoraria, 0);
    const tccComputavel = Math.min(96, tccIntegralizado);
    const tccPendente = Math.max(0, 96 - tccComputavel);

    // Calculate Extensão
    const extensaoIntegralizado = concluidasObj.reduce((acc, d) => acc + getExtensaoHours(d.codigo), 0);
    const extensaoExigida = ppc === '2023' ? 340 : 0;
    const extensaoComputavel = Math.min(extensaoExigida, extensaoIntegralizado);
    const extensaoPendente = Math.max(0, extensaoExigida - extensaoComputavel);

    // Calculate Totals
    const totalIntegralizado = cargaHorariaConcluida;
    const totalComputavel = Math.min(totalCargaHoraria, totalIntegralizado);
    const totalPendente = Math.max(0, totalCargaHoraria - totalComputavel);

    const cargaHorariaStats = [
      {
        nome: 'Carga Horária Total',
        exigido: totalCargaHoraria,
        integralizado: totalIntegralizado,
        computavel: totalComputavel,
        pendente: totalPendente
      },
      {
        nome: 'Carga Horária Optativa',
        exigido: optativaExigida,
        integralizado: optativaIntegralizado,
        computavel: optativaComputavel,
        pendente: optativaPendente
      },
      {
        nome: 'Carga Horária de Atividades Complementares',
        exigido: 60,
        integralizado: atividadesIntegralizado,
        computavel: atividadesComputavel,
        pendente: atividadesPendente
      },
      {
        nome: 'Carga Horária de Componentes Optativos Livres',
        exigido: 0,
        integralizado: 0,
        computavel: 0,
        pendente: 0
      },
      {
        nome: 'Carga Horária de TCC',
        exigido: 96,
        integralizado: tccIntegralizado,
        computavel: tccComputavel,
        pendente: tccPendente
      },
      {
        nome: 'Carga Horária de Estágio',
        exigido: 0,
        integralizado: 0,
        computavel: 0,
        pendente: 0
      },
      {
        nome: 'Carga Horária de Extensão',
        exigido: extensaoExigida,
        integralizado: extensaoIntegralizado,
        computavel: extensaoComputavel,
        pendente: extensaoPendente
      }
    ];

    return {
      progressoPorcentagem,
      creditosConcluidos,
      creditosCursando,
      creditosRestantes,
      cargaHorariaConcluida,
      estimativaSemestresRestantes,
      cargaHorariaStats
    };
  }
};

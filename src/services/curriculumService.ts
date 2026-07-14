import { Disciplina, UserAcademicState, CursoStats, StatusDisciplina } from '../types';
import rawDisciplinas from '../data/disciplinas.json';

// Ensure type casting from raw JSON
export const todasDisciplinas: Disciplina[] = rawDisciplinas as Disciplina[];

export const curriculumService = {
  getTodas: (): Disciplina[] => {
    return todasDisciplinas;
  },

  getByCodigo: (codigo: string): Disciplina | undefined => {
    return todasDisciplinas.find(d => d.codigo === codigo);
  },

  getAreas: (): string[] => {
    const areas = todasDisciplinas.map(d => d.area);
    return Array.from(new Set(areas)).sort();
  },

  getSemestres: (): number[] => {
    const semestres = todasDisciplinas
      .map(d => d.semestre)
      .filter((sem): sem is number => typeof sem === 'number' && sem !== null && !isNaN(sem));
    return Array.from(new Set(semestres)).sort((a, b) => a - b);
  },

  getStatus: (disciplina: Disciplina, state: UserAcademicState): StatusDisciplina => {
    if (state.concluidas.includes(disciplina.codigo)) {
      return 'concluida';
    }
    if (state.cursando.includes(disciplina.codigo)) {
      return 'cursando';
    }

    // A disciplina está disponível se TODOS os seus pré-requisitos estiverem CONCLUÍDOS
    const prereqs = disciplina.prerequisitos;
    if (prereqs.length === 0) {
      return 'disponivel';
    }

    const todosConcluidos = prereqs.every(reqCodigo => state.concluidas.includes(reqCodigo));
    return todosConcluidos ? 'disponivel' : 'bloqueada';
  },

  calculateStats: (state: UserAcademicState): CursoStats => {
    const totalDisciplinas = todasDisciplinas.length;
    const totalCreditos = 212; // Carga de créditos oficiais do curso
    const totalCargaHoraria = 3392; // Carga horária total oficial do curso

    const concluidasObj = todasDisciplinas.filter(d => state.concluidas.includes(d.codigo));
    const cursandoObj = todasDisciplinas.filter(d => state.cursando.includes(d.codigo));

    const creditosConcluidos = concluidasObj.reduce((acc, d) => acc + d.creditos, 0);
    const creditosCursando = cursandoObj.reduce((acc, d) => acc + d.creditos, 0);
    const creditosRestantes = Math.max(0, totalCreditos - creditosConcluidos);
    
    const cargaHorariaConcluida = concluidasObj.reduce((acc, d) => acc + d.cargaHoraria, 0);

    // Progresso baseado em créditos concluídos sobre o total oficial do curso (212)
    const progressoPorcentagem = totalCreditos > 0 ? Math.min(100, Math.round((creditosConcluidos / totalCreditos) * 100)) : 0;

    // Estimativa de semestres restantes baseado na média de 22 créditos por semestre
    const estimativaSemestresRestantes = creditosRestantes > 0 
      ? Math.max(1, Math.ceil(creditosRestantes / 22)) 
      : 0;

    return {
      progressoPorcentagem,
      creditosConcluidos,
      creditosCursando,
      creditosRestantes,
      cargaHorariaConcluida,
      estimativaSemestresRestantes
    };
  }
};

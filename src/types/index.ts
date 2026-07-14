export interface Disciplina {
  id: number;
  codigo: string;
  nome: string;
  semestre: number;
  creditos: number;
  cargaHoraria: number;
  prerequisitos: string[];
  area: string;
}

export type StatusDisciplina = 'concluida' | 'cursando' | 'disponivel' | 'bloqueada';

export interface UserAcademicState {
  concluidas: string[]; // codigos das disciplinas concluidas
  cursando: string[];   // codigos das disciplinas cursando
}

export interface CursoStats {
  progressoPorcentagem: number;
  creditosConcluidos: number;
  creditosCursando: number;
  creditosRestantes: number;
  cargaHorariaConcluida: number;
  estimativaSemestresRestantes: number;
}

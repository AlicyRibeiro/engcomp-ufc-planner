import { useState, useEffect } from 'react';
import { UserAcademicState, CursoStats } from '../types';
import { curriculumService } from '../services/curriculumService';

const LOCAL_STORAGE_KEY = 'fluxo_eng_ufc_academic_state';

const defaultState: UserAcademicState = {
  concluidas: [],
  cursando: [],
};

export function useAcademicState() {
  const [academicState, setAcademicState] = useState<UserAcademicState>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.concluidas) && Array.isArray(parsed.cursando)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
    return defaultState;
  });

  // Save automatically when changed
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(academicState));
  }, [academicState]);

  const toggleConcluida = (codigo: string) => {
    setAcademicState(prev => {
      const isConcluida = prev.concluidas.includes(codigo);
      let newConcluidas = [...prev.concluidas];
      let newCursando = [...prev.cursando];

      if (isConcluida) {
        // Remover de concluídas
        newConcluidas = newConcluidas.filter(c => c !== codigo);
      } else {
        // Adicionar a concluídas e remover de cursando se estiver lá
        newConcluidas.push(codigo);
        newCursando = newCursando.filter(c => c !== codigo);
      }

      return {
        concluidas: newConcluidas,
        cursando: newCursando,
      };
    });
  };

  const toggleCursando = (codigo: string) => {
    setAcademicState(prev => {
      const isCursando = prev.cursando.includes(codigo);
      let newConcluidas = [...prev.concluidas];
      let newCursando = [...prev.cursando];

      if (isCursando) {
        // Remover de cursando
        newCursando = newCursando.filter(c => c !== codigo);
      } else {
        // Adicionar a cursando e remover de concluídas se estiver lá
        newCursando.push(codigo);
        newConcluidas = newConcluidas.filter(c => c !== codigo);
      }

      return {
        concluidas: newConcluidas,
        cursando: newCursando,
      };
    });
  };

  const setDisciplinaStatus = (codigo: string, status: 'concluida' | 'cursando' | 'none') => {
    setAcademicState(prev => {
      let newConcluidas = prev.concluidas.filter(c => c !== codigo);
      let newCursando = prev.cursando.filter(c => c !== codigo);

      if (status === 'concluida') {
        newConcluidas.push(codigo);
      } else if (status === 'cursando') {
        newCursando.push(codigo);
      }

      return {
        concluidas: newConcluidas,
        cursando: newCursando,
      };
    });
  };

  const removerDisciplina = (codigo: string) => {
    setAcademicState(prev => ({
      concluidas: prev.concluidas.filter(c => c !== codigo),
      cursando: prev.cursando.filter(c => c !== codigo),
    }));
  };

  const limparHistorico = () => {
    setAcademicState(defaultState);
  };

  const stats = curriculumService.calculateStats(academicState);

  return {
    academicState,
    toggleConcluida,
    toggleCursando,
    setDisciplinaStatus,
    removerDisciplina,
    limparHistorico,
    stats,
  };
}

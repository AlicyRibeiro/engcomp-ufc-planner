import { useState, useMemo, useRef } from 'react';
import { 
  X, 
  Download, 
  Award, 
  CheckCircle, 
  Clock, 
  Calendar, 
  GraduationCap, 
  FileText, 
  User, 
  Hash, 
  Printer,
  Sparkles,
  Info
} from 'lucide-react';
import { Disciplina, CursoStats, UserAcademicState } from '../types';
import { curriculumService } from '../services/curriculumService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const oklchToRgb = (l: number, c: number, h: number, alpha?: number): string => {
  // Convert h from degrees to radians
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  return oklabToRgb(l, a, b, alpha);
};

const oklabToRgb = (L: number, a: number, b: number, alpha?: number): string => {
  // LMS linear
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  // LMS non-linear (cube)
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // XYZ to RGB
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bVal = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  // Gamma correction
  const correct = (val: number) => {
    return val <= 0.0031308 ? 12.92 * val : 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
  };

  const R = Math.round(Math.max(0, Math.min(1, correct(r))) * 255);
  const G = Math.round(Math.max(0, Math.min(1, correct(g))) * 255);
  const B = Math.round(Math.max(0, Math.min(1, correct(bVal))) * 255);

  if (alpha !== undefined) {
    return `rgba(${R}, ${G}, ${B}, ${alpha})`;
  }
  return `rgb(${R}, ${G}, ${B})`;
};

const convertOklchAndOklabToRgb = (str: string): string => {
  if (!str.includes('oklch') && !str.includes('oklab')) {
    return str;
  }

  let result = str;

  // Replace oklch(...)
  result = result.replace(/oklch\(([^)]+)\)/g, (match, content) => {
    try {
      const parts = content.trim().replace(/,/g, ' ').replace(/\s+/g, ' ').split(' ');
      const cleanParts = parts.filter((p: string) => p !== '/');
      if (cleanParts.length >= 3) {
        const lStr = cleanParts[0];
        let L = parseFloat(lStr);
        if (lStr.includes('%')) L = L / 100;

        const cStr = cleanParts[1];
        let C = parseFloat(cStr);
        if (cStr.includes('%')) C = C / 100;

        const hStr = cleanParts[2];
        let H = parseFloat(hStr);
        if (hStr.includes('%')) H = (H / 100) * 360;

        const aStr = cleanParts[3];
        let alpha: number | undefined = undefined;
        if (aStr) {
          alpha = parseFloat(aStr);
          if (aStr.includes('%')) alpha = alpha / 100;
        }

        return oklchToRgb(L, C, H, alpha);
      }
    } catch (e) {
      console.warn('Error converting oklch style:', e);
    }
    return 'rgb(71, 85, 105)'; // default fallback slate-600
  });

  // Replace oklab(...)
  result = result.replace(/oklab\(([^)]+)\)/g, (match, content) => {
    try {
      const parts = content.trim().replace(/,/g, ' ').replace(/\s+/g, ' ').split(' ');
      const cleanParts = parts.filter((p: string) => p !== '/');
      if (cleanParts.length >= 3) {
        const lStr = cleanParts[0];
        let L = parseFloat(lStr);
        if (lStr.includes('%')) L = L / 100;

        const aStr = cleanParts[1];
        let A = parseFloat(aStr);
        if (aStr.includes('%')) A = A / 100;

        const bStr = cleanParts[2];
        let B = parseFloat(bStr);
        if (bStr.includes('%')) B = B / 100;

        const alphaStr = cleanParts[3];
        let alpha: number | undefined = undefined;
        if (alphaStr) {
          alpha = parseFloat(alphaStr);
          if (alphaStr.includes('%')) alpha = alpha / 100;
        }

        return oklabToRgb(L, A, B, alpha);
      }
    } catch (e) {
      console.warn('Error converting oklab style:', e);
    }
    return 'rgb(100, 116, 139)'; // default fallback slate-500
  });

  return result;
};

const cleanCssColors = (cssText: string): string => {
  return convertOklchAndOklabToRgb(cssText);
};

const executeWithSanitizedStyles = async <T,>(action: () => Promise<T>): Promise<T> => {
  let combinedCss = '';
  const originalNodes: { node: any; originalDisabled: boolean }[] = [];

  // Extract CSS from all stylesheets
  for (const sheet of Array.from(document.styleSheets)) {
    const owner = sheet.ownerNode as any;
    if (owner && (owner instanceof HTMLStyleElement || owner instanceof HTMLLinkElement)) {
      originalNodes.push({
        node: owner,
        originalDisabled: owner.disabled,
      });

      try {
        const rules = sheet.cssRules || (sheet as any).rules;
        if (rules) {
          for (const rule of Array.from(rules)) {
            combinedCss += (rule as any).cssText + '\n';
          }
        }
      } catch (e) {
        // If it fails (e.g. cross-origin link), we can read innerHTML of style element if possible
        if (owner instanceof HTMLStyleElement) {
          combinedCss += owner.innerHTML + '\n';
        }
      }
    }
  }

  // Sanitize the CSS (convert oklch and oklab to standard colors)
  const sanitizedCss = cleanCssColors(combinedCss);

  // Inject a temporary style tag with sanitized styles so there's no layout/style shift
  const tempStyle = document.createElement('style');
  tempStyle.id = 'temp-html2canvas-sanitized-styles';
  tempStyle.innerHTML = sanitizedCss;
  document.head.appendChild(tempStyle);

  // Disable original styles so html2canvas doesn't parse them and crash
  for (const item of originalNodes) {
    item.node.disabled = true;
  }

  // Monkeypatch window.getComputedStyle to return standard RGB instead of oklch/oklab
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function (el, pseudoElt) {
    const view = el.ownerDocument?.defaultView || window;
    const style = originalGetComputedStyle.call(view, el, pseudoElt);
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return function(name: string) {
            const val = target.getPropertyValue(name);
            return typeof val === 'string' ? convertOklchAndOklabToRgb(val) : val;
          };
        }
        const val = target[prop as any];
        if (typeof val === 'string') {
          return convertOklchAndOklabToRgb(val);
        }
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      }
    }) as any;
  };

  try {
    // Run the action (e.g., html2canvas and file download)
    return await action();
  } finally {
    // Re-enable all original stylesheets
    for (const item of originalNodes) {
      item.node.disabled = item.originalDisabled;
    }

    // Restore original window.getComputedStyle
    window.getComputedStyle = originalGetComputedStyle;

    // Remove the temporary styles
    if (tempStyle.parentNode) {
      tempStyle.parentNode.removeChild(tempStyle);
    }
  }
};


interface AcademicReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicState: UserAcademicState;
  stats: CursoStats;
  disciplinas: Disciplina[];
}

export function AcademicReportModal({ 
  isOpen, 
  onClose, 
  academicState, 
  stats, 
  disciplinas 
}: AcademicReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Custom metadata states to customize the report
  const [studentName, setStudentName] = useState('');
  const [registration, setRegistration] = useState('');
  const [currentPeriod, setCurrentPeriod] = useState(() => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    return `${year}.${month < 6 ? 1 : 2}`;
  });

  const [showCargaHoraria, setShowCargaHoraria] = useState(true);
  const [showCursando, setShowCursando] = useState(true);
  const [showConcluidas, setShowConcluidas] = useState(true);

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingPNG, setIsExportingPNG] = useState(false);

  // Group completed subjects by semester
  const concluidasBySemester = useMemo(() => {
    const grouped: { [key: number]: Disciplina[] } = {};
    (academicState.concluidas || []).forEach(codigo => {
      const disc = curriculumService.getByCodigo(codigo);
      if (disc) {
        const sem = typeof disc.semestre === 'number' && disc.semestre !== null && !isNaN(disc.semestre) ? disc.semestre : 11;
        if (!grouped[sem]) {
          grouped[sem] = [];
        }
        grouped[sem].push(disc);
      }
    });
    
    // Sort keys and values
    return Object.keys(grouped)
      .map(Number)
      .filter(sem => !isNaN(sem))
      .sort((a, b) => a - b)
      .map(semestre => ({
        semestre,
        disciplinas: (grouped[semestre] || []).sort((a, b) => a.nome.localeCompare(b.nome))
      }));
  }, [academicState.concluidas]);

  // Resolve cursando subjects
  const cursandoSubjects = useMemo(() => {
    return (academicState.cursando || [])
      .map(codigo => curriculumService.getByCodigo(codigo))
      .filter((d): d is Disciplina => d !== undefined)
      .sort((a, b) => {
        const semA = typeof a.semestre === 'number' && a.semestre !== null && !isNaN(a.semestre) ? a.semestre : 11;
        const semB = typeof b.semestre === 'number' && b.semestre !== null && !isNaN(b.semestre) ? b.semestre : 11;
        return semA - semB || a.nome.localeCompare(b.nome);
      });
  }, [academicState.cursando]);

  const currentDateFormatted = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date().toLocaleDateString('pt-BR', options);
  }, []);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExportingPDF(true);
    
    try {
      // Small delay to ensure any layout calculations or styles are loaded
      await new Promise(resolve => setTimeout(resolve, 250));

      const element = reportRef.current;
      const canvas = await executeWithSanitizedStyles(() => 
        html2canvas(element, {
          scale: 2, // high quality
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 800, // force standard printable width
        })
      );

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimension maintaining aspect ratio
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const safeName = studentName.trim() ? studentName.trim().toLowerCase().replace(/\s+/g, '_') : 'aluno';
      pdf.save(`relatorio_academico_${safeName}.pdf`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportPNG = async () => {
    if (!reportRef.current) return;
    setIsExportingPNG(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 250));

      const element = reportRef.current;
      const canvas = await executeWithSanitizedStyles(() => 
        html2canvas(element, {
          scale: 2, // high quality
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 800,
        })
      );

      const link = document.createElement('a');
      const safeName = studentName.trim() ? studentName.trim().toLowerCase().replace(/\s+/g, '_') : 'aluno';
      link.download = `relatorio_academico_${safeName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Erro ao exportar Imagem:', error);
    } finally {
      setIsExportingPNG(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col lg:flex-row h-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        
        {/* Left Control Panel / Inputs (Span 4) */}
        <div className="w-full lg:w-96 bg-slate-50 dark:bg-slate-900/60 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-y-auto gap-6 shrink-0">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Exportar Relatório
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Personalize seu relatório acadêmico de desempenho para download em formato oficial.
                </p>
              </div>
              <button 
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Metadata Form */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Informações do Estudante
              </h4>
              
              <div className="space-y-3">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase">
                    <User className="w-3 h-3" />
                    Nome do Aluno
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Ex: Alicy Ribeiro"
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Registration */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase">
                    <Hash className="w-3 h-3" />
                    Matrícula
                  </label>
                  <input
                    type="text"
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value)}
                    placeholder="Ex: 512345"
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Current Period */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase">
                    <Calendar className="w-3 h-3" />
                    Período Letivo
                  </label>
                  <input
                    type="text"
                    value={currentPeriod}
                    onChange={(e) => setCurrentPeriod(e.target.value)}
                    placeholder="Ex: 2026.1"
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Customize Report Sections */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Seções do Relatório
              </h4>
              <div className="space-y-2.5 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200/60 dark:border-slate-850/60">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCargaHoraria}
                    onChange={(e) => setShowCargaHoraria(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-medium">Resumo de Carga Horária</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCursando}
                    onChange={(e) => setShowCursando(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-medium">Disciplinas em Curso</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showConcluidas}
                    onChange={(e) => setShowConcluidas(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-medium">Histórico de Concluídas</span>
                </label>
              </div>
            </div>

            {/* Export Hints */}
            <div className="p-3.5 bg-blue-500/5 dark:bg-blue-500/[0.02] border border-blue-500/15 rounded-xl text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <span className="font-bold flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Printer className="w-3.5 h-3.5" />
                Estilo para Impressão
              </span>
              <p className="leading-relaxed">
                O documento gerado usa um layout claro e limpo, ideal para economizar tinta ao imprimir fisicamente ou enviar por e-mail para coordenações e professores.
              </p>
            </div>
          </div>

          {/* Download Action Buttons */}
          <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-850">
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF || isExportingPNG}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 hover:shadow-md cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 shrink-0" />
              {isExportingPDF ? 'Gerando PDF...' : 'Baixar como PDF'}
            </button>
            <button
              onClick={handleExportPNG}
              disabled={isExportingPDF || isExportingPNG}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 hover:shadow-md cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4 shrink-0" />
              {isExportingPNG ? 'Gerando Imagem...' : 'Baixar como Imagem (PNG)'}
            </button>
            <button
              onClick={() => window.print()}
              disabled={isExportingPDF || isExportingPNG}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 hover:shadow-md cursor-pointer disabled:opacity-50 border border-slate-200 dark:border-slate-700"
            >
              <Printer className="w-4 h-4 shrink-0" />
              Imprimir / Salvar PDF do Navegador
            </button>
          </div>
        </div>

        {/* Right Preview Panel (A4 layout representation, light mode only) */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 overflow-auto flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Visualização Prévia do Documento
            </h4>
            <button 
              onClick={onClose}
              className="hidden lg:flex items-center gap-1 px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>

          {/* The Actual Document - FORCED TO WHITE/LIGHT BACKGROUND */}
          <div className="flex-1 flex justify-center pb-8">
            <div 
              id="academic-report-content"
              ref={reportRef}
              className="w-[790px] min-h-[1110px] bg-white text-slate-900 p-8 shadow-xl border border-slate-300 rounded-xs flex flex-col justify-between font-sans leading-normal text-left relative"
            >
              {/* Document Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Universidade Federal do Ceará • Campus Quixadá</span>
                    <h1 className="text-base font-black tracking-tight uppercase text-slate-900">Engenharia de Computação</h1>
                    <p className="text-xs font-bold text-slate-700 uppercase">Relatório de Desempenho & Planejamento Acadêmico</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-[9px] font-mono bg-slate-100 border border-slate-300 px-2 py-1 rounded-sm text-slate-600 uppercase font-bold tracking-wider">
                      UFC - QUIXADÁ
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">Gerado via UFC Planner</span>
                  </div>
                </div>

                {/* Metadata Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs">
                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estudante</span>
                    <span className="font-bold text-slate-800 break-words">{studentName.trim() || 'Não Informado'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Matrícula</span>
                    <span className="font-mono font-bold text-slate-800">{registration.trim() || 'Não Informado'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Período Referência</span>
                    <span className="font-bold text-slate-800">{currentPeriod.trim() || 'Nenhum'}</span>
                  </div>
                </div>

                {/* KPIs Dashboard */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-1">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Progresso</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-emerald-600">{stats.progressoPorcentagem}%</span>
                      <span className="text-[9px] text-slate-400 font-medium">concluído</span>
                    </div>
                  </div>
                  
                  <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-1">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Carga Horária</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-blue-600">{stats.cargaHorariaConcluida}h</span>
                      <span className="text-[9px] text-slate-400 font-medium">feitas</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-1">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Créditos Realizados</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-slate-800">{stats.creditosConcluidos}</span>
                      <span className="text-[9px] text-slate-400 font-medium">de 212</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-1">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Semestres Restantes</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-purple-600">~{stats.estimativaSemestresRestantes}</span>
                      <span className="text-[9px] text-slate-400 font-medium">estimado</span>
                    </div>
                  </div>
                </div>

                {/* Resumo de Carga Horária (PPC) */}
                {showCargaHoraria && (
                  <div className="space-y-2 pt-2 animate-in fade-in duration-150">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Resumo de Carga Horária (Estrutura do Curso / PPC)
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <table className="w-full text-[10px] text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                            <th className="px-3 py-1.5">Categoria</th>
                            <th className="px-3 py-1.5 text-center">Exigido</th>
                            <th className="px-3 py-1.5 text-center">Integralizado</th>
                            <th className="px-3 py-1.5 text-center">Computável</th>
                            <th className="px-3 py-1.5 text-right">Pendente</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.cargaHorariaStats
                            ?.filter(category => category.exigido > 0 || category.integralizado > 0)
                            ?.map((category, idx) => (
                              <tr key={idx} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/50 ${category.nome === 'Carga Horária Total' ? 'font-bold bg-blue-50/20' : ''}`}>
                                <td className="px-3 py-1.5 text-slate-800 font-medium">{category.nome}</td>
                                <td className="px-3 py-1.5 text-center text-slate-600 font-mono">{category.exigido}h</td>
                                <td className={`px-3 py-1.5 text-center font-mono ${category.integralizado > 0 ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>{category.integralizado}h</td>
                                <td className="px-3 py-1.5 text-center text-slate-600 font-mono">{category.computavel}h</td>
                                <td className={`px-3 py-1.5 text-right font-mono ${category.pendente > 0 ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold'}`}>
                                  {category.pendente > 0 ? `${category.pendente}h` : 'Concluído'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Main Content Layout */}
                <div className="space-y-5 pt-2">
                  
                  {/* Cursando Section */}
                  {showCursando && (
                    <div className="space-y-2 animate-in fade-in duration-150">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Disciplinas Atualmente em Curso ({cursandoSubjects.length})
                      </h3>
                      
                      {cursandoSubjects.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">Nenhuma disciplina em curso declarada.</p>
                      ) : (
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <table className="w-full text-[10px] text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                                <th className="px-3 py-1.5">Código</th>
                                <th className="px-3 py-1.5">Nome da Disciplina</th>
                                <th className="px-3 py-1.5 text-center">Semestre</th>
                                <th className="px-3 py-1.5 text-center">Créditos</th>
                                <th className="px-3 py-1.5 text-right">Horas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cursandoSubjects.map(d => (
                                <tr key={d.codigo} className="border-b border-slate-100 hover:bg-slate-50/50">
                                  <td className="px-3 py-1.5 font-mono text-[9px] font-bold text-slate-600">{d.codigo}</td>
                                  <td className="px-3 py-1.5 font-medium text-slate-800">{d.nome}</td>
                                  <td className="px-3 py-1.5 text-center text-slate-600">{d.semestre}º</td>
                                  <td className="px-3 py-1.5 text-center text-slate-600">{d.creditos}</td>
                                  <td className="px-3 py-1.5 text-right text-slate-600 font-mono">{d.cargaHoraria}h</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Concluidas Section */}
                  {showConcluidas && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Histórico de Disciplinas Concluídas ({academicState.concluidas.length})
                      </h3>

                      {concluidasBySemester.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">Nenhuma disciplina concluída registrada.</p>
                      ) : (
                        <div className="space-y-3">
                          {concluidasBySemester.map(group => {
                            const semCarga = group.disciplinas.reduce((acc, current) => acc + current.cargaHoraria, 0);
                            const semCred = group.disciplinas.reduce((acc, current) => acc + current.creditos, 0);
                            
                            return (
                              <div key={group.semestre} className="border border-slate-200 rounded-lg overflow-hidden space-y-0 bg-white">
                                {/* Group Header */}
                                <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-700">
                                  <span className="uppercase text-slate-800">{group.semestre}º Semestre</span>
                                  <div className="flex gap-3 text-slate-500 font-normal">
                                    <span>Créditos: <b className="font-bold text-slate-700">{semCred}</b></span>
                                    <span>Horas: <b className="font-bold text-slate-700">{semCarga}h</b></span>
                                  </div>
                                </div>
                                
                                <table className="w-full text-[10px] text-left border-collapse">
                                  <tbody>
                                    {group.disciplinas.map(d => (
                                      <tr key={d.codigo} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                                        <td className="px-3 py-1.5 font-mono text-[9px] font-bold text-slate-500 w-24">{d.codigo}</td>
                                        <td className="px-3 py-1.5 font-medium text-slate-700">{d.nome}</td>
                                        <td className="px-3 py-1.5 text-center text-slate-500 w-20 font-mono text-[9px]">{d.area}</td>
                                        <td className="px-3 py-1.5 text-center text-slate-600 w-16">{d.creditos} CR</td>
                                        <td className="px-3 py-1.5 text-right text-slate-600 font-mono w-16">{d.cargaHoraria}h</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* Document Footer Disclaimer */}
              <div className="mt-8 border-t border-slate-300 pt-4 flex flex-col md:flex-row justify-between items-center text-[9px] text-slate-400 leading-relaxed gap-2">
                <div className="text-center md:text-left space-y-0.5">
                  <p className="font-bold text-slate-500">Fluxo Engenharia UFC - Planejador de Matrícula & Currículo</p>
                  <p>Documento gerado pessoalmente pelo estudante em {currentDateFormatted}.</p>
                </div>
                <div className="text-center md:text-right max-w-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-500 flex items-center justify-center md:justify-end gap-1">
                    <Info className="w-3 h-3 text-blue-500 shrink-0" />
                    Aviso Importante
                  </span>
                  <p className="mt-0.5">Este relatório serve exclusivamente para fins de consulta e planejamento pessoal. Não substitui o histórico oficial expedido pela SIGAA/UFC.</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

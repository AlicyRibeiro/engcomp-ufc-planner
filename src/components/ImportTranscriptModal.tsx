import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Clipboard, 
  AlertCircle, 
  HelpCircle, 
  Plus, 
  Search,
  Check,
  History,
  Info,
  Loader2
} from 'lucide-react';
import { Disciplina, UserAcademicState } from '../types';

interface ImportTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  disciplinas: Disciplina[];
  academicState: UserAcademicState;
  onImport: (newState: UserAcademicState, strategy: 'merge' | 'replace') => void;
}

interface ParsedItem {
  disciplina: Disciplina;
  status: 'concluida' | 'cursando' | 'none';
  selected: boolean;
  detectedStatusName: string;
}

const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        reject(new Error("Não foi possível ler o arquivo."));
        return;
      }
      try {
        if (!(window as any).pdfjsLib) {
          reject(new Error("A biblioteca para ler PDF está sendo carregada ou não pôde ser encontrada. Por favor, tente novamente em alguns segundos ou cole o texto."));
          return;
        }

        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

        const pdfData = new Uint8Array(arrayBuffer);
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n";
        }
        resolve(fullText);
      } catch (err) {
        console.error("PDF extraction error:", err);
        reject(new Error("Erro ao extrair dados do PDF. Certifique-se de que o arquivo não está corrompido ou protegido por senha."));
      }
    };
    reader.onerror = () => {
      reject(new Error("Erro na leitura física do arquivo."));
    };
    reader.readAsArrayBuffer(file);
  });
};

export function ImportTranscriptModal({
  isOpen,
  onClose,
  disciplinas,
  academicState,
  onImport
}: ImportTranscriptModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [pastedText, setPastedText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [importStrategy, setImportStrategy] = useState<'merge' | 'replace'>('merge');
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  
  // Manual adding search state inside step 2
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddResults, setShowAddResults] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Parser logic using the intelligent window-based scanner
  const handleParse = (textToParse: string) => {
    if (!textToParse.trim()) {
      setErrorMsg('Por favor, cole o texto do seu histórico ou arraste um arquivo.');
      return;
    }

    let cleanText = textToParse.trim();
    
    // Ignore sections with pending or non-cursed components to avoid false positives
    const pendingSectionKeywords = [
      'COMPONENTES CURRICULARES OBRIGATÓRIOS PENDENTES',
      'COMPONENTES CURRICULARES OPTATIVOS PENDENTES',
      'COMPONENTES CURRICULARES PENDENTES',
      'DISCIPLINAS PENDENTES',
      'REQUISITOS PENDENTES',
      'CONCURSO PENDENTE'
    ];

    let earliestIndex = -1;
    const upperText = cleanText.toUpperCase();
    for (const keyword of pendingSectionKeywords) {
      const idx = upperText.indexOf(keyword);
      if (idx !== -1) {
        if (earliestIndex === -1 || idx < earliestIndex) {
          earliestIndex = idx;
        }
      }
    }

    if (earliestIndex !== -1) {
      cleanText = cleanText.substring(0, earliestIndex);
    }

    const foundItems: ParsedItem[] = [];

    // Loop through each of our catalog subjects
    disciplinas.forEach(d => {
      // Create a compatible regex to handle spacing and leading zeros (e.g. QXD203 matches QXD0203, QXD 0203, QXD203, QXD 203)
      const prefixMatch = d.codigo.match(/^([A-Za-z]+)/);
      const prefix = prefixMatch ? prefixMatch[1] : '';
      const digitsMatch = d.codigo.match(/\d+$/);
      const digitsStr = digitsMatch ? digitsMatch[0] : '';
      const numberVal = digitsStr ? parseInt(digitsStr, 10) : null;

      let codeRegex: RegExp;
      if (prefix && numberVal !== null) {
        // Matches prefix, followed by optional spaces, followed by optional leading zeros, followed by the number
        codeRegex = new RegExp(`(?<![A-Za-z0-9])${prefix}\\s*0*${numberVal}(?!\\d)`, 'gi');
      } else {
        codeRegex = new RegExp(`${d.codigo.substring(0, 3)}\\s*${d.codigo.substring(3)}|${d.codigo}`, 'gi');
      }
      
      let match;
      let matched = false;
      const occurrences: Array<{ status: 'concluida' | 'cursando' | 'none'; name: string }> = [];

      while ((match = codeRegex.exec(cleanText)) !== null) {
        matched = true;
        const matchIndex = match.index;
        // Scan a window of 180 characters after the match for grading/status details
        let windowText = cleanText.substring(matchIndex, Math.min(cleanText.length, matchIndex + 180));
        
        // Truncate the window text if another subject code appears in it (to prevent status leakage)
        const matchedCodeStr = match[0];
        const nextCodeRegex = /[A-Z]{3,4}\s*\d{3,4}/gi;
        nextCodeRegex.lastIndex = matchedCodeStr.length;
        const nextCodeMatch = nextCodeRegex.exec(windowText);
        if (nextCodeMatch) {
          windowText = windowText.substring(0, nextCodeMatch.index);
        }
        windowText = windowText.toUpperCase();
        
        const isCursando = 
          windowText.includes('CURSANDO') || 
          windowText.includes('MATRICULADO') || 
          windowText.includes('MATRICULADA') || 
          windowText.includes('EM CURSO') || 
          windowText.includes('EM MATRÍCULA') || 
          windowText.includes('EM MATRICULA') ||
          windowText.includes('MATRÍCULA') || 
          windowText.includes('MATRICULA');

        const isFailedOrCancelled =
          windowText.includes('REPROVADO') ||
          windowText.includes('REPROVADA') ||
          windowText.includes('TRANCADO') ||
          windowText.includes('CANCELADO') ||
          windowText.includes('DESISTÊNCIA') ||
          windowText.includes('DESISTENCIA') ||
          windowText.includes('EXCLUÍDO') ||
          windowText.includes('EXCLUIDO') ||
          windowText.includes('REPROVADO POR FALTAS') ||
          windowText.includes('REPROVADO POR NOTA') ||
          windowText.includes('REPR. FALTAS');

        const isApproved =
          windowText.includes('APROVADO') ||
          windowText.includes('APROVADA') ||
          windowText.includes('DISPENSADO') ||
          windowText.includes('DISPENSADA') ||
          windowText.includes('APROV') ||
          windowText.includes('CONCLUÍD') ||
          windowText.includes('CONCLUID') ||
          windowText.includes('CUMPRID') ||
          windowText.includes('DISPENS') ||
          windowText.includes('DISPENSA') ||
          windowText.includes('APROVEITADO');

        let currentStatus: 'concluida' | 'cursando' | 'none' = 'none';
        let currentStatusName = 'Não Cursada';

        if (windowText.includes('APROVADO MÉDIA') || windowText.includes('APROVADO POR MÉDIA') || windowText.includes('APROVADO MEDIA')) {
          currentStatus = 'concluida';
          currentStatusName = 'Aprovado por Média';
        } else if (windowText.includes('APROVADO POR NOTA')) {
          currentStatus = 'concluida';
          currentStatusName = 'Aprovado por Nota';
        } else if (windowText.includes('APROVADO') || windowText.includes('APROVADA')) {
          currentStatus = 'concluida';
          currentStatusName = 'Aprovado';
        } else if (windowText.includes('DISPENSADO') || windowText.includes('DISPENSADA')) {
          currentStatus = 'concluida';
          currentStatusName = 'Dispensado';
        } else if (windowText.includes('APROVEITADO') || windowText.includes('APROVEITADA')) {
          currentStatus = 'concluida';
          currentStatusName = 'Aproveitado';
        } else if (isCursando) {
          currentStatus = 'cursando';
          currentStatusName = 'Matriculado / Cursando';
        } else if (isFailedOrCancelled) {
          currentStatus = 'none';
          currentStatusName = 'Reprovado / Cancelado';
          if (windowText.includes('REPROVADO POR FALTAS') || windowText.includes('REPR. FALTAS')) {
            currentStatusName = 'Reprovado por Faltas';
          } else if (windowText.includes('REPROVADO')) {
            currentStatusName = 'Reprovado';
          } else if (windowText.includes('TRANCADO')) {
            currentStatusName = 'Trancado';
          } else if (windowText.includes('CANCELADO')) {
            currentStatusName = 'Cancelado';
          }
        } else if (isApproved) {
          currentStatus = 'concluida';
          currentStatusName = 'Aprovado / Dispensado';
        }

        occurrences.push({ status: currentStatus, name: currentStatusName });
      }

      if (matched) {
        let finalStatus: 'concluida' | 'cursando' | 'none' = 'none';
        let finalStatusName = 'Não Cursada';

        const approvedOccurrences = occurrences.filter(o => o.status === 'concluida');
        const cursandoOccurrences = occurrences.filter(o => o.status === 'cursando');
        const activeOccurrences = occurrences.filter(o => o.name !== 'Não Cursada');

        if (approvedOccurrences.length > 0) {
          finalStatus = 'concluida';
          // Prefer occurrences that have specific names like "Aprovado por Média", "Aprovado", "Aprovado por Nota" over generic fallback
          const specificApproved = approvedOccurrences.find(o => 
            o.name === 'Aprovado por Média' || 
            o.name === 'Aprovado' || 
            o.name === 'Aprovado por Nota' ||
            o.name === 'Dispensado' ||
            o.name === 'Aproveitado'
          );
          finalStatusName = specificApproved ? specificApproved.name : approvedOccurrences[0].name;
        } else if (cursandoOccurrences.length > 0) {
          finalStatus = 'cursando';
          finalStatusName = cursandoOccurrences[0].name;
        } else if (activeOccurrences.length > 0) {
          finalStatus = 'none';
          const specificFailed = activeOccurrences.find(o => 
            o.name === 'Reprovado' || 
            o.name === 'Reprovado por Faltas' || 
            o.name === 'Trancado' ||
            o.name === 'Cancelado'
          );
          finalStatusName = specificFailed ? specificFailed.name : activeOccurrences[0].name;
        }

        if (finalStatusName !== 'Não Cursada') {
          foundItems.push({
            disciplina: d,
            status: finalStatus,
            selected: finalStatus !== 'none', // select by default if not failed
            detectedStatusName: finalStatusName
          });
        }
      }
    });

    if (foundItems.length === 0) {
      setErrorMsg('Não foi possível identificar nenhuma disciplina no texto colado. Verifique se o texto contém códigos como "QXD0001", "QXD203", etc.');
      return;
    }

    // Sort by semester and name
    foundItems.sort((a, b) => {
      const semA = a.disciplina.semestre || 11;
      const semB = b.disciplina.semestre || 11;
      if (semA !== semB) return semA - semB;
      return a.disciplina.nome.localeCompare(b.disciplina.nome);
    });

    setParsedItems(foundItems);
    setErrorMsg('');
    setStep(2);
  };

  // Handle file upload (TXT or PDF)
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsParsing(true);
    setErrorMsg('');
    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const text = await extractTextFromPDF(file);
        setPastedText(text);
        handleParse(text);
        setIsParsing(false);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          if (text) {
            setPastedText(text);
            handleParse(text);
          }
          setIsParsing(false);
        };
        reader.onerror = () => {
          setErrorMsg('Erro ao ler o arquivo selecionado.');
          setIsParsing(false);
        };
        reader.readAsText(file);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao processar o arquivo PDF. Verifique se o PDF não está protegido por senha.');
      setIsParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Toggle selection
  const handleToggleSelectItem = (codigo: string) => {
    setParsedItems(prev => prev.map(item => {
      if (item.disciplina.codigo === codigo) {
        return { ...item, selected: !item.selected };
      }
      return item;
    }));
  };

  // Change individual status
  const handleChangeItemStatus = (codigo: string, newStatus: 'concluida' | 'cursando' | 'none') => {
    setParsedItems(prev => prev.map(item => {
      if (item.disciplina.codigo === codigo) {
        return { 
          ...item, 
          status: newStatus,
          // automatically select if changed to a valid state, or unselect if 'none'
          selected: newStatus !== 'none' 
        };
      }
      return item;
    }));
  };

  // Remove item from parsed list
  const handleRemoveParsedItem = (codigo: string) => {
    setParsedItems(prev => prev.filter(item => item.disciplina.codigo !== codigo));
  };

  // Manually add missing discipline during review
  const handleAddManualItem = (d: Disciplina) => {
    // Check if already in list
    if (parsedItems.some(item => item.disciplina.codigo === d.codigo)) {
      setParsedItems(prev => prev.map(item => {
        if (item.disciplina.codigo === d.codigo) {
          return { ...item, selected: true, status: 'concluida' };
        }
        return item;
      }));
    } else {
      setParsedItems(prev => [
        ...prev, 
        {
          disciplina: d,
          status: 'concluida',
          selected: true,
          detectedStatusName: 'Adicionado Manualmente'
        }
      ].sort((a, b) => {
        const semA = a.disciplina.semestre || 11;
        const semB = b.disciplina.semestre || 11;
        if (semA !== semB) return semA - semB;
        return a.disciplina.nome.localeCompare(b.disciplina.nome);
      }));
    }
    setSearchQuery('');
    setShowAddResults(false);
  };

  // Execute actual import
  const handleConfirmImport = () => {
    const selectedConcluidas: string[] = [];
    const selectedCursando: string[] = [];

    parsedItems.forEach(item => {
      if (item.selected) {
        if (item.status === 'concluida') {
          selectedConcluidas.push(item.disciplina.codigo);
        } else if (item.status === 'cursando') {
          selectedCursando.push(item.disciplina.codigo);
        }
      }
    });

    const newState: UserAcademicState = {
      concluidas: selectedConcluidas,
      cursando: selectedCursando
    };

    onImport(newState, importStrategy);
    resetState();
    onClose();
  };

  const resetState = () => {
    setStep(1);
    setPastedText('');
    setParsedItems([]);
    setErrorMsg('');
    setDragActive(false);
    setSearchQuery('');
    setShowAddResults(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Filter list of disciplines that are NOT in parsedItems for manual adding autocomplete
  const manualAddSuggestions = searchQuery.trim() === ''
    ? []
    : disciplinas.filter(d => {
        const matchesQuery = 
          d.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.nome.toLowerCase().includes(searchQuery.toLowerCase());
        const alreadyInList = parsedItems.some(item => item.disciplina.codigo === d.codigo && item.selected);
        return matchesQuery && !alreadyInList;
      }).slice(0, 5);

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div 
        id="import-transcript-modal"
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative"
      >
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Importar Histórico do SIGAA
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Preencha seu progresso automaticamente colando seu extrato acadêmico
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/40 dark:border-red-800/40 rounded-xl text-xs flex items-start gap-2 animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 ? (
            isParsing ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-950/20">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <div className="text-center">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Processando seu Histórico Escolar</p>
                  <p className="text-[11px] text-slate-400 mt-1">Lendo páginas do arquivo PDF e identificando os códigos das disciplinas...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Instructions Panel */}
                <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-850/60 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-500" />
                    Como obter seu Histórico Escolar no SIGAA:
                  </h4>
                  <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed pl-1">
                    <li>Acesse o <b>SIGAA UFC</b> (<a href="https://si3.ufc.br/sigaa/" target="_blank" rel="noreferrer" className="text-blue-500 underline hover:text-blue-600">si3.ufc.br/sigaa</a>).</li>
                    <li>No menu do estudante, posicione o mouse em <b>Documentos e Declarações</b> e selecione <b>Histórico Escolar</b>.</li>
                    <li>O sistema gerará um arquivo <b>PDF</b> oficial contendo todo o seu histórico acadêmico. Baixe-o no seu dispositivo.</li>
                    <li>Arraste e solte o arquivo <b>PDF</b> no campo abaixo, selecione-o no seu computador ou cole o texto do histórico diretamente!</li>
                  </ol>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                    * Fique tranquilo: o processamento do arquivo PDF e o mapeamento das matérias ocorrem 100% localmente em seu navegador. Nenhum dado é enviado para servidores externos.
                  </p>
                </div>

                {/* Input Area */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
                    <span>Conteúdo do Histórico / Notas</span>
                    <span className="text-[10px] font-normal text-slate-400">Suporta arquivos PDF, TXT ou colar texto direto</span>
                  </label>
                  
                  {/* Drag and Drop Container */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`relative group border-2 border-dashed rounded-xl transition-all p-1 flex flex-col ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-500/[0.03] dark:bg-blue-500/[0.01]' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'
                    }`}
                  >
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Cole o histórico do SIGAA aqui... Ex: QXD0001 - Fundamentos de Programação - Aprovado... ou use o botão abaixo para enviar o PDF diretamente!"
                      className="w-full h-52 p-3 text-xs bg-slate-50/50 dark:bg-slate-950/20 border-0 focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none rounded-lg"
                    />
                    
                    <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-950/20 text-slate-400 dark:text-slate-500 text-[10px]">
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-850 cursor-pointer shadow-2xs transition-all animate-pulse"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-500" />
                        Selecionar Histórico (PDF ou TXT)
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.pdf,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <span className="hidden sm:inline">Arraste um PDF ou Ctrl+V para colar texto</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            // Step 2: Interactive review
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Disciplinas Identificadas ({parsedItems.filter(p => p.selected).length})
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Revise os dados abaixo, altere o status se necessário ou marque/desmarque as matérias antes de importar.
                  </p>
                </div>

                {/* Import Strategy Selection */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                  <button
                    onClick={() => setImportStrategy('merge')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      importStrategy === 'merge'
                        ? 'bg-white dark:bg-slate-950/80 text-blue-600 dark:text-blue-400 shadow-2xs border border-white/20 dark:border-slate-800/20'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title="Adiciona as disciplinas importadas às que você já possui marcadas"
                  >
                    Mesclar Dados
                  </button>
                  <button
                    onClick={() => setImportStrategy('replace')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      importStrategy === 'replace'
                        ? 'bg-white dark:bg-slate-950/80 text-red-600 dark:text-red-400 shadow-2xs border border-white/20 dark:border-slate-800/20'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title="Substitui completamente o histórico atual pelas novas disciplinas importadas"
                  >
                    Substituir Tudo
                  </button>
                </div>
              </div>

              {/* Manual search and adding inside review step */}
              <div className="relative">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850/60 rounded-xl">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowAddResults(true);
                    }}
                    placeholder="Esqueceu alguma disciplina? Busque pelo nome ou código para adicionar à revisão..."
                    className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setShowAddResults(false);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Autocomplete list */}
                {showAddResults && manualAddSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-1">
                    {manualAddSuggestions.map(d => (
                      <button
                        key={d.codigo}
                        onClick={() => handleAddManualItem(d)}
                        className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs flex items-center justify-between rounded-lg cursor-pointer group transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/40 px-1 py-0.5 rounded font-mono">
                              {d.codigo}
                            </span>
                            <span>{d.nome}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {d.semestre}º Semestre • {d.cargaHoraria}h • {d.area}
                          </div>
                        </div>
                        <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          <Plus className="w-3.5 h-3.5" /> Adicionar
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Scrollable list of matched courses */}
              <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-xl overflow-hidden bg-transparent max-h-[40vh] overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200/60 dark:border-slate-800/80 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">Importar?</th>
                      <th className="py-2.5 px-3">Código / Disciplina</th>
                      <th className="py-2.5 px-3 text-center">Semestre</th>
                      <th className="py-2.5 px-3">Situação Acadêmica</th>
                      <th className="py-2.5 px-3 text-center w-10">Excluir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-transparent">
                    {parsedItems.map((item) => {
                      const { disciplina, status, selected, detectedStatusName } = item;
                      return (
                        <tr 
                          key={disciplina.codigo}
                          className={`hover:bg-slate-50/[0.1] transition-colors ${
                            !selected ? 'opacity-50 line-through bg-slate-50/10 dark:bg-slate-900/10' : ''
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => handleToggleSelectItem(disciplina.codigo)}
                              className="w-4 h-4 rounded text-blue-600 bg-slate-100 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>

                          {/* Code and Name */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                              <span className="font-mono text-[10px] tracking-wide text-slate-400 bg-slate-100/50 dark:bg-slate-800/60 px-1 py-0.5 rounded border border-slate-200/10">
                                {disciplina.codigo}
                              </span>
                              <span>{disciplina.nome}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                              {detectedStatusName && (
                                <span className="font-sans italic">
                                  Original: {detectedStatusName}
                                </span>
                              )}
                              <span> • {disciplina.cargaHoraria}h</span>
                            </div>
                          </td>

                          {/* Semester */}
                          <td className="py-2.5 px-3 text-center font-bold text-slate-500 font-mono">
                            {disciplina.semestre ? `${disciplina.semestre}º` : 'Optativa'}
                          </td>

                          {/* Action Status Dropdown */}
                          <td className="py-2.5 px-3">
                            <select
                              value={status}
                              onChange={(e) => handleChangeItemStatus(disciplina.codigo, e.target.value as any)}
                              className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border outline-none cursor-pointer focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-900 ${
                                status === 'concluida'
                                  ? 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                                  : status === 'cursando'
                                  ? 'border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-500/5'
                                  : 'border-slate-300 text-slate-400'
                              }`}
                            >
                              <option value="concluida" className="text-emerald-600">✓ Concluída</option>
                              <option value="cursando" className="text-blue-600">⌚ Cursando</option>
                              <option value="none" className="text-slate-400">✗ Ignorar</option>
                            </select>
                          </td>

                          {/* Remove Row */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleRemoveParsedItem(disciplina.codigo)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Remover da lista de revisão"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Helper explanation */}
              <div className="flex items-center gap-2 p-3 bg-blue-500/[0.04] dark:bg-blue-500/[0.02] border border-blue-500/10 dark:border-blue-500/5 rounded-xl text-[11px] text-slate-500 dark:text-slate-400">
                <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
                <p>
                  As matérias marcadas com <b>✓ Concluída</b> serão consideradas cumpridas no seu currículo acadêmico e as marcadas com <b>⌚ Cursando</b> serão exibidas como em andamento.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
            >
              Voltar e Alterar Texto
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleClose}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>

            {step === 1 ? (
              <button
                onClick={() => handleParse(pastedText)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer shadow-md shadow-blue-500/10"
              >
                Mapear Disciplinas
              </button>
            ) : (
              <button
                onClick={handleConfirmImport}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors cursor-pointer shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirmar e Aplicar Importação
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

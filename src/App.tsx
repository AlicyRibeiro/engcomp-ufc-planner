import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  GitFork, 
  BookOpen, 
  Sun, 
  Moon, 
  Sparkles,
  RefreshCw,
  HelpCircle,
  X,
  MessageSquare,
  Star
} from 'lucide-react';

import { Home } from './pages/Home';
import { Workspace } from './pages/Workspace';
import { Fluxograma } from './pages/Fluxograma';
import { useAcademicState } from './hooks/useAcademicState';
import { useTheme } from './hooks/useTheme';
import { todasDisciplinas } from './services/curriculumService';

export default function App() {
  const [showHelp, setShowHelp] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'sugestao' | 'bug' | 'avaliacao'>('sugestao');
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    // Save submission to local history of feedbacks
    try {
      const stored = localStorage.getItem('fluxo_eng_ufc_feedbacks') || '[]';
      const list = JSON.parse(stored);
      list.push({
        id: Date.now(),
        type: feedbackType,
        rating: feedbackRating,
        text: feedbackText,
        email: feedbackEmail || 'Anônimo',
        date: new Date().toISOString()
      });
      localStorage.setItem('fluxo_eng_ufc_feedbacks', JSON.stringify(list));
    } catch (err) {
      console.error('Error saving feedback', err);
    }

    setFeedbackSubmitted(true);
  };

  const handleResetFeedback = () => {
    setFeedbackType('sugestao');
    setFeedbackRating(5);
    setFeedbackText('');
    setFeedbackEmail('');
    setFeedbackSubmitted(false);
    setShowFeedback(false);
  };
  const [view, setView] = useState<'home' | 'workspace' | 'fluxograma'>(() => {
    // If the user already has data in localStorage, skip home and open workspace!
    try {
      const stored = localStorage.getItem('fluxo_eng_ufc_academic_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        if ((parsed.concluidas && parsed.concluidas.length > 0) || (parsed.cursando && parsed.cursando.length > 0)) {
          return 'workspace';
        }
      }
    } catch (e) {
      console.error(e);
    }
    return 'home';
  });

  const {
    academicState,
    toggleConcluida,
    toggleCursando,
    setDisciplinaStatus,
    removerDisciplina,
    limparHistorico,
    stats
  } = useAcademicState();

  const { theme, toggleTheme, isDark } = useTheme();

  const handleStart = () => {
    setView('workspace');
  };

  const handleConfirmClear = () => {
    limparHistorico();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950/95 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative overflow-hidden">
      
      {/* Frosted Glass Ambient background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-500/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-400/10 dark:bg-indigo-500/5 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-[15%] w-[30%] h-[30%] rounded-full bg-purple-400/5 dark:bg-purple-500/3 blur-[100px] pointer-events-none -z-10" />
      
      {/* Top Navigation Bar - Elegant Glass Panel */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/20 dark:border-slate-800/40 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => setView('home')} 
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="p-2 bg-blue-600 dark:bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/10 dark:shadow-none group-hover:scale-105 transition-all">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black font-display tracking-tight text-slate-900 dark:text-white leading-tight">
              Fluxo Engenharia UFC
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Engenharia de Computação
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Only visible when not on home page) */}
        {view !== 'home' && (
          <nav className="hidden sm:flex items-center bg-white/40 dark:bg-slate-800/30 p-1 rounded-xl border border-white/40 dark:border-slate-800/20 backdrop-blur-md">
            <button
              onClick={() => setView('workspace')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === 'workspace'
                  ? 'bg-white/90 dark:bg-slate-950/80 text-blue-600 dark:text-blue-400 shadow-xs border border-white/30 dark:border-slate-800/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Grade & Próximas
            </button>
            <button
              onClick={() => setView('fluxograma')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === 'fluxograma'
                  ? 'bg-white/90 dark:bg-slate-950/80 text-blue-600 dark:text-blue-400 shadow-xs border border-white/30 dark:border-slate-800/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              Fluxograma Interativo
            </button>
          </nav>
        )}

        {/* Global Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Stats shortcut in Header */}
          {view !== 'home' && (
            <div className="hidden md:flex items-center gap-3.5 pr-4 mr-2 border-r border-slate-200 dark:border-slate-800/50 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Progresso: <b className="text-slate-900 dark:text-white">{stats.progressoPorcentagem}%</b></span>
              <span>Horas: <b className="text-slate-900 dark:text-white">{stats.cargaHorariaConcluida}h</b></span>
            </div>
          )}

          {/* Help / Como Funciona */}
          <button
            onClick={() => setShowHelp(true)}
            title="Como Funciona o Fluxo"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-500/20 dark:border-blue-500/15 bg-blue-500/[0.04] dark:bg-blue-500/[0.02] text-slate-700 dark:text-slate-300 hover:bg-blue-500/10 dark:hover:bg-blue-500/10 hover:border-blue-500/35 hover:scale-105 active:scale-95 backdrop-blur-md transition-all cursor-pointer shadow-xs"
          >
            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 animate-pulse" />
            <span className="hidden sm:inline text-xs font-bold text-slate-700 dark:text-slate-300">
              Guia
            </span>
          </button>

          {/* Feedback / Avaliações / Sugestões */}
          <button
            onClick={() => setShowFeedback(true)}
            title="Enviar Feedback / Sugestões"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/20 dark:border-emerald-500/15 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] text-slate-700 dark:text-slate-300 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10 hover:border-emerald-500/35 hover:scale-105 active:scale-95 backdrop-blur-md transition-all cursor-pointer shadow-xs"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden sm:inline text-xs font-bold text-slate-700 dark:text-slate-300">
              Feedback
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            className="p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-white/90 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:scale-105 active:scale-95 backdrop-blur-md transition-all cursor-pointer shadow-xs"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Mobile view switch buttons */}
          {view !== 'home' && (
            <div className="sm:hidden flex items-center gap-1 bg-white/40 dark:bg-slate-800/30 p-1 rounded-xl border border-white/40 dark:border-slate-800/20 backdrop-blur-md">
              <button
                onClick={() => setView('workspace')}
                className={`p-1.5 rounded-lg ${view === 'workspace' ? 'bg-white/80 dark:bg-slate-950/80 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'}`}
                title="Grade e Próximas"
              >
                <BookOpen className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('fluxograma')}
                className={`p-1.5 rounded-lg ${view === 'fluxograma' ? 'bg-white/80 dark:bg-slate-950/80 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'}`}
                title="Fluxograma"
              >
                <GitFork className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 flex flex-col h-full relative z-10">
        {view === 'home' && (
          <Home onStart={handleStart} />
        )}

        {view === 'workspace' && (
          <Workspace
            disciplinas={todasDisciplinas}
            academicState={academicState}
            stats={stats}
            onAdd={setDisciplinaStatus}
            onRemove={removerDisciplina}
            onSwitchStatus={setDisciplinaStatus}
            onClear={handleConfirmClear}
          />
        )}

        {view === 'fluxograma' && (
          <Fluxograma
            disciplinas={todasDisciplinas}
            academicState={academicState}
            onStatusChange={setDisciplinaStatus}
          />
        )}
      </main>

      {/* Global Minimal Footer */}
      <footer className="border-t border-white/20 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 shrink-0 flex items-center justify-center relative z-10">
        <p>
          © 2026 Fluxo Engenharia UFC • Matriz Curricular Engenharia de Computação UFC
        </p>
      </footer>

      {/* Como Funciona Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col p-6 relative">
            
            {/* Close button */}
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Como Funciona o Fluxo Engenharia UFC?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Guia rápido de uso para organizar seu histórico acadêmico
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6 text-slate-600 dark:text-slate-300 text-sm overflow-y-auto pr-1">
              {/* Introduction */}
              <p className="leading-relaxed">
                Este site foi desenvolvido para ajudar estudantes de <b>Engenharia de Computação da UFC</b> a mapear, visualizar e planejar sua jornada pelo curso de forma interativa e sem burocracia.
              </p>

              {/* Step 1 */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold">1</span>
                  Acompanhe seu Progresso Geral
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-7">
                  No topo de qualquer tela, ou no painel de estatísticas, você verá seu progresso geral atualizado em tempo real: porcentagem do curso concluída, carga horária cumprida, créditos acumulados e coeficiente estimado.
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold">2</span>
                  Grade & Próximas Disciplinas (Aba Workspace)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-7">
                  Esta aba é o seu centro de controle rápido:
                  <br />
                  • <b>Próximas Disciplinas Disponíveis:</b> Uma lista inteligente que mostra apenas as disciplinas cujos pré-requisitos você <i>já cumpriu</i> e estão prontas para você cursar! Elas aparecem ordenadas por semestre.
                  <br />
                  • <b>Pesquisa Geral:</b> Digite qualquer nome ou código para encontrar uma disciplina rapidamente.
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold">3</span>
                  Fluxograma Interativo
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-7">
                  O mapa visual de todo o curso. Cada semestre é mapeado verticalmente com suas respectivas conexões (setas de pré-requisitos). As cores ajudam a identificar instantaneamente sua situação:
                  <br />
                  🟢 <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Verde (Concluída):</span> Matéria finalizada com sucesso.
                  <br />
                  🔵 <span className="text-blue-600 dark:text-blue-400 font-semibold">Azul (Cursando):</span> Matéria que você está fazendo no semestre atual.
                  <br />
                  ⚪ <span className="font-semibold text-slate-700 dark:text-slate-300">Branco/Cinza (Disponível):</span> Matéria liberada para você cursar.
                  <br />
                  🔴 <span className="text-rose-600 dark:text-rose-400 font-semibold">Vermelho (Bloqueada):</span> Você ainda não cumpriu todos os pré-requisitos obrigatórios dela.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-7 italic mt-1.5 bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  💡 <b>Dica de Ouro:</b> Clique em qualquer caixa de disciplina dentro do Fluxograma para abrir a Ficha Detalhada à direita, onde você pode ler a ementa, conferir horas e alterar seu status acadêmico com um clique!
                </p>
              </div>

              {/* Step 4 */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold">4</span>
                  Sem Login e 100% Salvo Localmente
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-7">
                  Você não precisa criar nenhuma conta. Todos os dados que você atualizar são salvos de forma segura e imediata na memória do seu próprio navegador (LocalStorage). Você pode voltar quando quiser e suas alterações continuarão aqui!
                </p>
              </div>
            </div>

            {/* Footer button to close */}
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Entendi, vamos lá!
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Enviar Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col p-6 relative">
            
            {/* Close button */}
            <button
              onClick={handleResetFeedback}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!feedbackSubmitted ? (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                      Feedback & Sugestões
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ajude a melhorar o site com sua opinião
                    </p>
                  </div>
                </div>

                {/* Feedback Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tipo de Feedback
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['sugestao', 'bug', 'avaliacao'] as const).map((type) => {
                      const labels = {
                        sugestao: 'Sugestão',
                        bug: 'Erro / Bug',
                        avaliacao: 'Avaliação'
                      };
                      const active = feedbackType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFeedbackType(type)}
                          className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            active
                              ? 'bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                              : 'bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          {labels[type]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="space-y-1.5 py-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Sua nota para a plataforma
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= feedbackRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 dark:text-slate-700 fill-transparent'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-2 font-mono">
                      {feedbackRating}/5
                    </span>
                  </div>
                </div>

                {/* Text Area */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Sua mensagem <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={
                      feedbackType === 'bug'
                        ? "Descreva o erro ou comportamento inesperado..."
                        : feedbackType === 'avaliacao'
                        ? "O que você mais gostou na plataforma ou o que podemos melhorar?"
                        : "Compartilhe suas ideias de recursos ou melhorias para o site..."
                    }
                    className="w-full h-28 p-3 text-xs bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-850/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all resize-none"
                  />
                </div>

                {/* Contact Email Optional */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Seu e-mail ou contato <span className="text-slate-400 dark:text-slate-500 text-[10px] font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    placeholder="exemplo@ufc.br ou telegram/whatsapp"
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-850/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full mt-4 flex items-center justify-center py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors cursor-pointer shadow-md hover:shadow-lg"
                >
                  Enviar Avaliação
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="inline-flex p-3.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-1 scale-110">
                  <Sparkles className="w-8 h-8 animate-pulse text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    Feedback Enviado!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed px-2">
                    Muito obrigado por enviar sua {feedbackType === 'bug' ? 'notificação de erro' : feedbackType === 'sugestao' ? 'sugestão' : 'avaliação'}! Ela foi registrada e nos ajudará a continuar aprimorando a plataforma para todos.
                  </p>
                </div>
                <button
                  onClick={handleResetFeedback}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Fechar Painel
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}


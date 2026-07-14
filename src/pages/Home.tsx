import { GraduationCap, ArrowRight, ShieldCheck, Cpu, GitFork } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  onStart: () => void;
}

export function Home({ onStart }: HomeProps) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center min-h-[85vh] px-4 bg-transparent relative overflow-hidden">
      {/* Abstract Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 dark:opacity-20 pointer-events-none" />

      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl text-center space-y-8 z-10 relative">
        {/* Floating badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 dark:bg-blue-950/40 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full shadow-xs backdrop-blur-md">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Engenharia de Computação • UFC</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] font-sans">
          Fluxo Engenharia <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 dark:from-blue-400 dark:to-emerald-400">UFC</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-sans leading-relaxed">
          Visualize seu progresso, consulte pré-requisitos e descubra as próximas disciplinas disponíveis.
        </p>

        {/* Actions Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStart}
            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-600/20 transition-all duration-300 cursor-pointer"
          >
            Começar Agora
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 border-t border-slate-200/50 dark:border-slate-800/40 text-left">
          <div className="glass-card p-5 rounded-2xl space-y-2">
            <div className="p-2 w-fit bg-blue-500/10 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Carga Oficial UFC</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Contém toda a matriz curricular atualizada com códigos, créditos e cargas horárias.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-2">
            <div className="p-2 w-fit bg-emerald-500/10 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Algoritmo Inteligente</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Determina as disciplinas elegíveis avaliando e validando de forma recursiva os pré-requisitos.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-2">
            <div className="p-2 w-fit bg-amber-500/10 dark:bg-amber-950/40 rounded-lg text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <GitFork className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Fluxograma Interativo</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Visualização gráfica das disciplinas do curso, caminhos de pré-requisitos e desbloqueios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

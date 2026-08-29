import React from 'react';
import { Play, Flame, ShieldAlert, Sparkles, BookOpen, Compass } from 'lucide-react';

interface StartMenuProps {
  onStart: () => void;
  onOpenTutorial: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onStart, onOpenTutorial }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border-2 border-stone-800 bg-stone-950/95 p-6 sm:p-8 text-center shadow-2xl shadow-black">
        {/* Glowing Ember Flame Icon */}
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-600/30 to-red-950/50 border border-amber-500/40 shadow-lg shadow-amber-950/60 animate-torch-flicker">
          <Flame className="w-10 h-10 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
        </div>

        {/* Title */}
        <h1 className="font-cinzel text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-amber-500 tracking-wider">
          A FOGUEIRA
        </h1>
        <p className="font-cinzel text-xs sm:text-sm text-stone-400 tracking-widest mt-1 mb-5 uppercase">
          Sobrevivência na Escuridão
        </p>

        {/* Quick Lore & Core Goal */}
        <div className="mb-6 rounded-2xl bg-stone-900/80 border border-stone-800/80 p-4 text-left space-y-2 text-xs text-stone-300">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Objetivo Principal:</span>
          </div>
          <p className="text-stone-300 pl-6 leading-relaxed">
            Mantenha a <strong>Fogueira</strong> acesa coletando madeira na floresta escura. Se o fogo se apagar, as sombras consumirão o mundo.
          </p>
          <div className="flex items-center gap-2 text-amber-400/90 font-bold pt-1">
            <Compass className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>A Tocha é a sua Vida:</span>
          </div>
          <p className="text-stone-300 pl-6 leading-relaxed">
            Longe do fogo, sua tocha se apaga aos poucos. Sem ela, você fica cego e sofre <strong>dano contínuo da escuridão</strong>. Volte à fogueira para <strong>reacendê-la!</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 py-3.5 px-6 font-cinzel font-bold text-stone-950 text-base shadow-xl shadow-amber-950/60 border border-amber-400/50 transition duration-150 transform hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-stone-950" />
            <span>Iniciar Sobrevivência</span>
          </button>

          <button
            onClick={onOpenTutorial}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 py-2.5 px-4 font-cinzel text-xs font-semibold text-stone-300 border border-stone-800 transition active:scale-95 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Manual & Controles (Tutorial)</span>
          </button>
        </div>

        {/* Footer controls hint */}
        <div className="mt-5 text-[11px] font-mono text-stone-500">
          WASD / Setas para Mover • Espaço / Clique para Atacar • E para Cortar
        </div>
      </div>
    </div>
  );
};

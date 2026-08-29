import React from 'react';
import { Eye, EyeOff, X, Bug, Sliders } from 'lucide-react';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDarknessDisabled: boolean;
  onToggleDarkness: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  isOpen,
  onClose,
  isDarknessDisabled,
  onToggleDarkness,
}) => {
  if (!isOpen) return null;

  return (
    <aside
      aria-label="Painel de depuração"
      className="fixed right-4 top-24 z-40 w-72 rounded-2xl border border-amber-500/40 bg-stone-950/90 p-4 text-stone-200 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-right-4 duration-150 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <Bug className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-cinzel text-xs font-bold tracking-wider text-amber-300">
              PAINEL DE DEBUG
            </h3>
            <span className="text-[10px] font-mono text-stone-400">Atalho: [ ç ]</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition active:scale-95 cursor-pointer"
          title="Fechar painel de debug (ç)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Light Testing Control */}
      <div className="space-y-3">
        <div className="rounded-xl border border-stone-800/80 bg-stone-900/60 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-200 font-cinzel">
              <Sliders className="h-3.5 w-3.5 text-amber-400" />
              <span>Teste de Luz</span>
            </div>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                isDarknessDisabled
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-stone-800 text-stone-400'
              }`}
            >
              {isDarknessDisabled ? 'REVELADO' : 'NORMAL'}
            </span>
          </div>

          <p className="text-[11px] text-stone-400 leading-snug mb-3">
            Permite desativar a máscara de escuridão total para inspecionar todo o mapa, iluminação e entidades em tempo real.
          </p>

          <button
            onClick={onToggleDarkness}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition active:scale-95 cursor-pointer border ${
              isDarknessDisabled
                ? 'bg-amber-600/30 text-amber-200 border-amber-500/60 hover:bg-amber-600/40'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750 hover:text-white'
            }`}
          >
            {isDarknessDisabled ? (
              <>
                <Eye className="h-4 w-4 text-amber-400" />
                <span>Restaurar Escuridão</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 text-stone-400" />
                <span>Desativar Escuridão</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center text-[10px] font-mono text-stone-500">
          Pressione <kbd className="bg-stone-900 border border-stone-700 px-1 py-0.5 rounded text-amber-400 font-bold">ç</kbd> no teclado para alternar este painel
        </div>
      </div>
    </aside>
  );
};

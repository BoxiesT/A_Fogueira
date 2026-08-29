import React from 'react';
import { Flame, FlameKindling, Weight, Swords, X, Sparkles, Navigation } from 'lucide-react';

interface TutorialModalProps {
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-stone-950 border-2 border-stone-800 p-5 sm:p-7 shadow-2xl text-stone-200 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <span className="font-cinzel text-xs font-bold uppercase tracking-widest text-amber-400">
            Manual de Sobrevivência
          </span>
          <h2 className="font-cinzel text-2xl font-black text-stone-100 mt-1">
            Como Sobreviver na Escuridão
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Mantenha a chama viva e não deixe as sombras consumirem sua alma.
          </p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          {/* 1. Campfire */}
          <div className="flex gap-3.5 p-3.5 rounded-2xl bg-stone-900/90 border border-amber-900/40">
            <div className="p-2 rounded-xl bg-amber-950 text-amber-400 shrink-0 h-fit">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-amber-300 text-sm">
                A Fogueira
              </h3>
              <p className="text-stone-300 mt-1 leading-relaxed">
                A fogueira é o que mantém você vivo, porém suas chamas não durarão para sempre. <strong>Explore a região</strong> em busca de madeira e volte até a fogueira antes que o fogo se apague.
              </p>
            </div>
          </div>

          {/* 2. Torch */}
          <div className="flex gap-3.5 p-3.5 rounded-2xl bg-stone-900/90 border border-amber-900/40">
            <div className="p-2 rounded-xl bg-amber-950 text-amber-400 shrink-0 h-fit">
              <FlameKindling className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-amber-300 text-sm">
                A Tocha 
              </h3>
              <p className="text-stone-300 mt-1 leading-relaxed">
                Ao se afastar da fogueira, sua <strong>tocha se apaga aos poucos</strong>. Quando o fogo acabar, sua visão será reduzida e a escuridão causará <strong>dano constante</strong>. Volte à fogueira para reacendê-la!
              </p>
            </div>
          </div>

          {/* 3. Wood Weight */}
          <div className="flex gap-3.5 p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800">
            <div className="p-2 rounded-xl bg-stone-800 text-stone-300 shrink-0 h-fit">
              <Weight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-stone-200 text-sm">
                Peso da Madeira 
              </h3>
              <p className="text-stone-300 mt-1 leading-relaxed">
                Cada tronco carregado deixa seus passos mais pesados e lentos (até -40% de velocidade). Avalie o risco de carregar muita carga longe da luz!
              </p>
            </div>
          </div>

          {/* 4. Creatures & Combat */}
          <div className="flex gap-3.5 p-3.5 rounded-2xl bg-stone-900/90 border border-purple-950/50">
            <div className="p-2 rounded-xl bg-purple-950 text-purple-400 shrink-0 h-fit">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-purple-300 text-sm">
                Criaturas & Brasas de Alma
              </h3>
              <p className="text-stone-300 mt-1 leading-relaxed">
                Monstros emergem das trevas. Derrotar inimigos dá chance de dropar <strong>Brasas de Alma</strong> para comprar melhorias.
              </p>
            </div>
          </div>

          {/* 5. Ancient Trees */}
          <div className="flex gap-3.5 p-3.5 rounded-2xl bg-stone-900/90 border border-amber-800/50">
            <div className="p-2 rounded-xl bg-amber-950 text-amber-300 shrink-0 h-fit">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-amber-300 text-sm">
                Árvores Ancestrais (Madeira Rara)
              </h3>
              <p className="text-stone-300 mt-1 leading-relaxed">
                Nas áreas mais distantes e perigosas da floresta crescem <strong>Árvores Ancestrais</strong>. Elas são mais resistentes, mas fornecem <strong>Madeira Ancestral</strong>, que recupera <strong>+25 de Fogo</strong> na fogueira (2.5x mais que a comum!).
              </p>
            </div>
          </div>

          {/* Controls Box */}
          <div className="p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800 text-xs">
            <h4 className="font-cinzel font-bold text-stone-200 uppercase tracking-wider mb-2">
              Controles:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-stone-300 font-mono text-[11px]">
              <div><strong className="text-amber-300">WASD / Setas:</strong> Movimentar</div>
              <div><strong className="text-amber-300">Clique Esq / Espaço:</strong> Atacar</div>
              <div><strong className="text-amber-300">E / F:</strong> Cortar Árvore / Coletar</div>
              <div><strong className="text-amber-300">Aproximar da Fogueira:</strong> Alimentar</div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 font-cinzel font-bold text-stone-100 tracking-wider transition cursor-pointer"
        >
          Entendido, Voltar ao Jogo
        </button>
      </div>
    </div>
  );
};

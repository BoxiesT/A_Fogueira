import React from 'react';
import { Flame, FlameKindling, Shield, Sparkles, Swords, Weight, X } from 'lucide-react';
import { Upgrades } from '../types';

interface UpgradesModalProps {
  embersCollected: number;
  upgrades: Upgrades;
  onApplyUpgrade: (type: keyof Upgrades) => void;
  onClose: () => void;
}

export const UpgradesModal: React.FC<UpgradesModalProps> = ({
  embersCollected,
  upgrades,
  onApplyUpgrade,
  onClose,
}) => {
  const upgradeList: {
    key: keyof Upgrades;
    title: string;
    description: string;
    icon: React.ReactNode;
    currentLevel: number;
    maxLevel: number;
    cost: number;
    statSummary: string;
  }[] = [
    {
      key: 'torchOil',
      title: 'Óleo da Tocha Sagrada',
      description: 'Aumenta a capacidade e duração máxima da sua tocha longe da fogueira.',
      icon: <FlameKindling className="w-5 h-5 text-amber-400" />,
      currentLevel: upgrades.torchOil,
      maxLevel: 5,
      cost: (upgrades.torchOil + 1) * 3,
      statSummary: `+${25 * (upgrades.torchOil + 1)}% Tempo de Tocha`,
    },
    {
      key: 'backpackStrength',
      title: 'Vigor do Carregador',
      description: 'Permite carregar mais madeira e reduz drasticamente a penalidade de lentidão.',
      icon: <Weight className="w-5 h-5 text-emerald-400" />,
      currentLevel: upgrades.backpackStrength,
      maxLevel: 4,
      cost: (upgrades.backpackStrength + 1) * 3,
      statSummary: `Capacidade ${5 + upgrades.backpackStrength + 1} Madeiras (-${Math.round((upgrades.backpackStrength + 1) * 2.5)}% Lentidão)`,
    },
    {
      key: 'axeSharpness',
      title: 'Lâmina Rúnica do Machado',
      description: 'Corta árvores mais rapidamente e aumenta o dano de ataque contra as sombras.',
      icon: <Swords className="w-5 h-5 text-red-400" />,
      currentLevel: upgrades.axeSharpness,
      maxLevel: 5,
      cost: (upgrades.axeSharpness + 1) * 3,
      statSummary: `+${(upgrades.axeSharpness + 1) * 12} Dano / +${Math.round((upgrades.axeSharpness + 1) * 35)}% Velocidade de Corte`,
    },
    {
      key: 'fireSanctuary',
      title: 'Santuário da Fogueira',
      description: 'A fogueira queima mais devagar e seu raio de luz protetor se expande ainda mais.',
      icon: <Flame className="w-5 h-5 text-orange-400" />,
      currentLevel: upgrades.fireSanctuary,
      maxLevel: 4,
      cost: (upgrades.fireSanctuary + 1) * 4,
      statSummary: `+${(upgrades.fireSanctuary + 1) * 25}px Raio de Luz / -${Math.round((upgrades.fireSanctuary + 1) * 12)}% Consumo`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-stone-950 border-2 border-amber-900/50 p-5 sm:p-7 shadow-2xl text-stone-200 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/80 border border-blue-700/60 px-2.5 py-0.5 text-[11px] font-bold text-blue-300">
              <span>⏸️ Jogo Pausado</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 border border-amber-700/60 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{embersCollected} Brasas de Alma</span>
            </div>
          </div>
          <h2 className="font-cinzel text-2xl font-black text-stone-100">
            Oferendas da Chama
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Canalize as brasas coletadas dos monstros para aprimorar suas chances de sobrevivência.
          </p>
        </div>

        <div className="space-y-3">
          {upgradeList.map((item) => {
            const isMaxed = item.currentLevel >= item.maxLevel;
            const canAfford = embersCollected >= item.cost && !isMaxed;

            return (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 hover:border-amber-900/40 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-stone-950 border border-stone-800 shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-cinzel font-bold text-stone-100 text-sm">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-mono text-amber-400/80 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">
                        Nível {item.currentLevel}/{item.maxLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5 max-w-xs">
                      {item.description}
                    </p>
                    <p className="text-[10px] font-mono text-amber-300 font-semibold mt-1">
                      {item.statSummary}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isMaxed ? (
                    <span className="text-[11px] font-cinzel font-bold text-stone-500 bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800">
                      Nível Máx.
                    </span>
                  ) : (
                    <button
                      onClick={() => onApplyUpgrade(item.key)}
                      disabled={!canAfford}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold font-cinzel transition active:scale-95 cursor-pointer ${
                        canAfford
                          ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-lg'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{item.cost} Brasas</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 font-cinzel font-bold text-stone-100 tracking-wider transition cursor-pointer"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

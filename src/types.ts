export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  woodCarried: number;
  simpleWoodCarried: number;
  ancientWoodCarried: number;
  maxWood: number;
  torchFuel: number; // 0 to 100
  maxTorchFuel: number;
  torchDepletionRate: number; // per second
  facingAngle: number;
  isMoving: boolean;
  walkFrame: number;
  isAttacking: boolean;
  attackCooldown: number;
  attackProgress: number; // 0 to 1
  attackAngle: number;
  isChopping: boolean;
  chopProgress: number;
  chopTargetId: string | null;
  embersCollected: number;
  damageFlash: number;
}

export interface Campfire {
  x: number;
  y: number;
  fuel: number; // 0 to 100+
  maxFuel: number;
  burnRate: number; // per second
  baseRadius: number;
  currentRadius: number;
  isExtinguished: boolean;
  flameAnimFrame: number;
  embersSpawnTimer: number;
}

export type EnemyType = 'stalker' | 'devourer' | 'wraith';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  targetType: 'player' | 'campfire';
  targetPos: Position;
  state: 'stalking' | 'charging' | 'attacking' | 'fleeing' | 'devouring';
  stateTimer: number;
  knockback: Velocity;
  animFrame: number;
  damageFlash: number;
  attackCooldown: number;
}

export type TreeType = 'normal' | 'ancient';

export interface TreeObject {
  id: string;
  type: TreeType;
  x: number;
  y: number;
  radius: number;
  woodAmount: number;
  health: number;
  maxHealth: number;
  isChopped: boolean;
  respawnTimer: number;
  variant: number;
  shakeTime: number;
}

export interface WoodDrop {
  id: string;
  x: number;
  y: number;
  amount: number;
  isSpecial: boolean; // Golden Ancient Wood
  bobbingOffset: number;
  lifetime: number;
}

export interface SoulEmber {
  id: string;
  x: number;
  y: number;
  value: number;
  lifetime: number;
  bobbingOffset: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  type: 'flame' | 'smoke' | 'spark' | 'shadow_blood' | 'snow' | 'wood_chip' | 'heal';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  vy: number;
}

export interface GameStats {
  timeSurvived: number; // seconds
  nightsSurvived: number;
  woodGathered: number;
  woodFedToFire: number;
  enemiesBanished: number;
  embersFound: number;
}

export interface Upgrades {
  torchOil: number; // Increases torch max capacity
  backpackStrength: number; // Reduces weight slow penalty & increases max wood
  axeSharpness: number; // Faster chopping & +damage
  fireSanctuary: number; // Reduces fire burn rate & boosts radius
}

export type DeathReason = 'campfire_extinguished' | 'slain_by_shadows' | 'consumed_by_darkness';

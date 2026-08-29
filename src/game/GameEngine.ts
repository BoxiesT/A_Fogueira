import {
  Campfire,
  DeathReason,
  Enemy,
  FloatingText,
  GameStats,
  Particle,
  Player,
  SoulEmber,
  TreeObject,
  Upgrades,
  WoodDrop,
} from '../types';
import { sound } from '../utils/audio';
import {
  drawPixelRect,
  renderAttackSlash,
  renderCampfire,
  renderEnemy,
  renderGround,
  renderLightingMask,
  renderPlayer,
  renderSoulEmber,
  renderTree,
  renderWoodDrop,
} from '../utils/pixelArt';

export class GameEngine {
  public worldSize = 2200;
  public player: Player;
  public campfire: Campfire;
  public trees: TreeObject[] = [];
  public woodDrops: WoodDrop[] = [];
  public soulEmbers: SoulEmber[] = [];
  public enemies: Enemy[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  public stats: GameStats = {
    timeSurvived: 0,
    nightsSurvived: 0,
    woodGathered: 0,
    woodFedToFire: 0,
    enemiesBanished: 0,
    embersFound: 0,
  };

  public upgrades: Upgrades = {
    torchOil: 0,
    backpackStrength: 0,
    axeSharpness: 0,
    fireSanctuary: 0,
  };

  public isGameOver = false;
  public deathReason: DeathReason | null = null;
  public isPaused = false;

  // Screen shake
  public screenShake = 0;

  // Input states
  public keys: { [key: string]: boolean } = {};
  public mousePos = { x: 0, y: 0 };
  public virtualJoystick = { x: 0, y: 0, active: false };

  // Spawners & Timers
  private enemySpawnTimer = 0;
  private woodSpawnTimer = 0;
  private darknessDamageTimer = 0;
  private nightCycleTimer = 0;
  private torchHalfWarned = false;
  private torchWarningTimer = 0;

  // Callbacks
  public onStateChange?: () => void;
  public onGameOver?: (stats: GameStats, reason: DeathReason) => void;

  // Debug / Test mode: disable the black darkness mask overlay
  public disableDarknessMask = false;

  constructor() {
    const center = this.worldSize / 2;

    this.player = {
      x: center,
      y: center + 60,
      radius: 14,
      hp: 100,
      maxHp: 100,
      speed: 190,
      baseSpeed: 190,
      woodCarried: 0,
      simpleWoodCarried: 0,
      ancientWoodCarried: 0,
      maxWood: 5,
      torchFuel: 50,
      maxTorchFuel: 50,
      torchDepletionRate: 2.2, // Balanced depletion for 50 max fuel
      facingAngle: 0,
      isMoving: false,
      walkFrame: 0,
      isAttacking: false,
      attackCooldown: 0,
      attackProgress: 0,
      attackAngle: 0,
      isChopping: false,
      chopProgress: 0,
      chopTargetId: null,
      embersCollected: 0,
      damageFlash: 0,
    };

    this.campfire = {
      x: center,
      y: center,
      fuel: 100,
      maxFuel: 100,
      burnRate: 1.5,
      baseRadius: 100,
      currentRadius: 280,
      isExtinguished: false,
      flameAnimFrame: 0,
      embersSpawnTimer: 0,
    };

    this.initWorld();
  }

  public initWorld() {
    this.trees = [];
    this.woodDrops = [];
    this.soulEmbers = [];
    this.enemies = [];
    this.particles = [];
    this.floatingTexts = [];

    const center = this.worldSize / 2;
    const minDistanceBetweenTrees = 56;

    const findValidTreePosition = (
      minRadius: number,
      maxRadius: number,
      minTreeSpacing: number
    ): { x: number; y: number } | null => {
      const rMinSq = minRadius * minRadius;
      const rMaxSq = maxRadius * maxRadius;

      for (let attempt = 0; attempt < 120; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        // Uniform area distribution in the annulus for natural, organic scatter
        const dist = Math.sqrt(rMinSq + Math.random() * (rMaxSq - rMinSq));
        const tx = Math.max(90, Math.min(this.worldSize - 90, center + Math.cos(angle) * dist));
        const ty = Math.max(90, Math.min(this.worldSize - 90, center + Math.sin(angle) * dist));

        // Keep campfire clearing clear (strictly 300m safe zone)
        if (Math.hypot(tx - center, ty - center) < 300) {
          continue;
        }

        // Check overlap against existing trees
        let overlaps = false;
        for (const existingTree of this.trees) {
          const distToTree = Math.hypot(tx - existingTree.x, ty - existingTree.y);
          if (distToTree < minTreeSpacing) {
            overlaps = true;
            break;
          }
        }

        if (!overlaps) {
          return { x: tx, y: ty };
        }
      }
      return null;
    };

    // 1. Generate 42 Normal Trees in the Mid-forest area (300px - 580px)
    const innerCommonCount = 42;
    for (let i = 0; i < innerCommonCount; i++) {
      const pos = findValidTreePosition(300, 580, minDistanceBetweenTrees);
      if (pos) {
        this.trees.push({
          id: `tree-norm-${i}`,
          type: 'normal',
          x: pos.x,
          y: pos.y,
          radius: 20,
          woodAmount: 2 + Math.floor(Math.random() * 2),
          health: 3,
          maxHealth: 3,
          isChopped: false,
          respawnTimer: 0,
          variant: Math.floor(Math.random() * 3),
          shakeTime: 0,
        });
      }
    }

    // 2. Generate 18 Ancient Trees in the Deep Wilderness (600px - 940px)
    const deepAncientCount = 18;
    for (let i = 0; i < deepAncientCount; i++) {
      const pos = findValidTreePosition(600, 940, minDistanceBetweenTrees + 8);
      if (pos) {
        this.trees.push({
          id: `tree-ancient-${i}`,
          type: 'ancient',
          x: pos.x,
          y: pos.y,
          radius: 24,
          woodAmount: 3 + Math.floor(Math.random() * 2), // 3 to 4 logs
          health: 7,
          maxHealth: 7,
          isChopped: false,
          respawnTimer: 0,
          variant: Math.floor(Math.random() * 3),
          shakeTime: 0,
        });
      }
    }

    // 3. Generate 25 Normal Trees in that same Deep Region (600px - 940px) mixed with Ancient Trees
    const deepCommonCount = 25;
    for (let i = 0; i < deepCommonCount; i++) {
      const pos = findValidTreePosition(600, 940, minDistanceBetweenTrees);
      if (pos) {
        this.trees.push({
          id: `tree-deep-norm-${i}`,
          type: 'normal',
          x: pos.x,
          y: pos.y,
          radius: 20,
          woodAmount: 2 + Math.floor(Math.random() * 2),
          health: 3,
          maxHealth: 3,
          isChopped: false,
          respawnTimer: 0,
          variant: Math.floor(Math.random() * 3),
          shakeTime: 0,
        });
      }
    }

    // Notice: Brasas dropam EXCLUSIVAMENTE de inimigos derrotados
    // e Madeiras/Madeiras Ancestrais dropam EXCLUSIVAMENTE de árvores cortadas.
    // Nenhum item solto é spawnado aleatoriamente no chão sem corte/combate.
  }

  public reset() {
    const center = this.worldSize / 2;

    // Reset Upgrades & Stats completely on new game
    this.upgrades = {
      torchOil: 0,
      backpackStrength: 0,
      axeSharpness: 0,
      fireSanctuary: 0,
    };

    this.player.x = center;
    this.player.y = center + 60;
    this.player.maxHp = 100;
    this.player.hp = 100;
    this.player.maxWood = 5;
    this.player.woodCarried = 0;
    this.player.simpleWoodCarried = 0;
    this.player.ancientWoodCarried = 0;
    this.player.maxTorchFuel = 50;
    this.player.torchFuel = 50;
    this.player.baseSpeed = 190;
    this.player.speed = 190;
    this.player.embersCollected = 0;
    this.player.isAttacking = false;
    this.player.isChopping = false;
    this.player.damageFlash = 0;

    this.campfire.fuel = 100;
    this.campfire.maxFuel = 100;
    this.campfire.burnRate = 1.5;
    this.campfire.isExtinguished = false;

    this.stats = {
      timeSurvived: 0,
      nightsSurvived: 0,
      woodGathered: 0,
      woodFedToFire: 0,
      enemiesBanished: 0,
      embersFound: 0,
    };

    this.isGameOver = false;
    this.deathReason = null;
    this.isPaused = false;
    this.screenShake = 0;
    this.torchHalfWarned = false;

    this.initWorld();
    if (this.onStateChange) this.onStateChange();
  }

  public applyUpgrade(type: keyof Upgrades): boolean {
    const currentLevel = this.upgrades[type];
    const cost = (currentLevel + 1) * 3;

    if (this.player.embersCollected < cost) return false;

    this.player.embersCollected -= cost;
    this.upgrades[type]++;

    // Apply upgrade effects
    if (type === 'torchOil') {
      this.player.maxTorchFuel = 50 + this.upgrades.torchOil * 15;
      this.player.torchFuel = this.player.maxTorchFuel;
      this.torchHalfWarned = false;
    } else if (type === 'backpackStrength') {
      this.player.maxWood = 5 + this.upgrades.backpackStrength;
    } else if (type === 'fireSanctuary') {
      this.campfire.burnRate = Math.max(0.8, 1.5 - this.upgrades.fireSanctuary * 0.18);
    }

    sound.playEmberPickup();
    this.spawnFloatingText(
      this.player.x,
      this.player.y - 40,
      `Melhoria Adquirida!`,
      '#f59e0b'
    );

    if (this.onStateChange) this.onStateChange();
    return true;
  }

  public update(dt: number) {
    if (this.isGameOver || this.isPaused) return;

    const now = performance.now();

    // 1. Survival time & Night cycle
    this.stats.timeSurvived += dt;
    this.nightCycleTimer += dt;
    if (this.nightCycleTimer >= 60) {
      this.nightCycleTimer = 0;
      this.stats.nightsSurvived++;
      this.spawnFloatingText(
        this.player.x,
        this.player.y - 50,
        `Noite ${this.stats.nightsSurvived} Sobrevivida!`,
        '#60a5fa'
      );
    }

    // 2. Update Campfire
    this.updateCampfire(dt);

    // 3. Update Player (Movement, Weight Slow, Torch, Darkness Damage)
    this.updatePlayer(dt, now);

    // 4. Update Combat & Attacks
    this.updateCombat(dt);

    // 5. Update Trees & Chopping
    this.updateTrees(dt);

    // 6. Update Items (Wood drops & Soul embers)
    this.updateDrops(dt);

    // 7. Update Shadow Enemies & AI
    this.updateEnemies(dt);

    // 8. Spawners (Enemies & Forest Resources)
    this.updateSpawners(dt);

    // 9. Update Particles & Floating Text
    this.updateParticles(dt);

    // 10. Audio & Sound Engine Updates
    const distToFire = Math.hypot(this.player.x - this.campfire.x, this.player.y - this.campfire.y);
    sound.updateCampfireProximity(distToFire, this.campfire.currentRadius);

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 15);
    }
  }

  private updateCampfire(dt: number) {
    if (this.campfire.fuel > 0) {
      // Base burn
      this.campfire.fuel -= this.campfire.burnRate * dt;

      if (this.campfire.fuel <= 0) {
        this.campfire.fuel = 0;
        this.campfire.isExtinguished = true;
        this.triggerGameOver('campfire_extinguished');
        return;
      }
    }

    // Dynamic light radius calculation
    const fuelRatio = Math.max(0, this.campfire.fuel / 100);
    const sanctuaryBonus = this.upgrades.fireSanctuary * 25;
    this.campfire.currentRadius = this.campfire.baseRadius + fuelRatio * 200 + sanctuaryBonus;

    // Ambient sparks from campfire
    if (Math.random() < 0.35 && this.campfire.fuel > 0) {
      this.particles.push({
        x: this.campfire.x + (Math.random() * 20 - 10),
        y: this.campfire.y - 10,
        vx: (Math.random() - 0.5) * 20,
        vy: -30 - Math.random() * 40,
        size: 2 + Math.random() * 2,
        color: Math.random() < 0.5 ? '#f59e0b' : '#facc15',
        alpha: 1,
        maxAlpha: 1,
        life: 0.8 + Math.random() * 0.5,
        maxLife: 1.3,
        type: 'spark',
      });
    }
  }

  private updatePlayer(dt: number, now: number) {
    if (this.player.damageFlash > 0) {
      this.player.damageFlash = Math.max(0, this.player.damageFlash - dt * 4);
    }

    // Proximity to Campfire
    const distToFire = Math.hypot(this.player.x - this.campfire.x, this.player.y - this.campfire.y);
    const inCampfireLight = distToFire <= this.campfire.currentRadius && this.campfire.fuel > 0;
    const atCampfireHearth = distToFire <= 65 && this.campfire.fuel > 0;

    // TORCH MECHANIC:
    // A tocha é recarregada APENAS quando o jogador pisa fisicamente na região da fogueira (atCampfireHearth),
    // e é recuperada gradualmente (aos poucos), e não quando as luzes simplesmente se encontram.
    if (atCampfireHearth) {
      if (this.player.torchFuel < this.player.maxTorchFuel) {
        // Recuperação gradual aos poucos (~14 combustível/segundo)
        this.player.torchFuel = Math.min(
          this.player.maxTorchFuel,
          this.player.torchFuel + dt * 14
        );
        if (this.player.torchFuel > this.player.maxTorchFuel * 0.5) {
          this.torchHalfWarned = false;
        }
        this.torchWarningTimer = 0;
        if (Math.random() < 0.12) {
          sound.playTorchRecharge();
        }

        // Faíscas sutis subindo para a tocha indicando a recarga gradual
        if (Math.random() < 0.35) {
          this.particles.push({
            x: this.player.x + (Math.random() * 12 - 6),
            y: this.player.y - 12 + (Math.random() * 8 - 4),
            vx: (Math.random() - 0.5) * 15,
            vy: -25 - Math.random() * 20,
            size: 2 + Math.random() * 2,
            color: Math.random() < 0.5 ? '#f59e0b' : '#fde047',
            alpha: 1,
            maxAlpha: 1,
            life: 0.35,
            maxLife: 0.35,
            type: 'spark',
          });
        }
      }
    } else {
      // Fora da fogueira física -> A tocha consome seu óleo normalmente
      if (this.player.torchFuel > 0) {
        const prevFuel = this.player.torchFuel;
        this.player.torchFuel = Math.max(
          0,
          this.player.torchFuel - this.player.torchDepletionRate * dt
        );

        const fuelPct = this.player.torchFuel / this.player.maxTorchFuel;
        const halfThreshold = this.player.maxTorchFuel * 0.5;

        // 1. Primeiro aviso instantâneo exatamente ao cruzar os 50%
        if (!this.torchHalfWarned && prevFuel > halfThreshold && this.player.torchFuel <= halfThreshold) {
          this.torchHalfWarned = true;
          this.torchWarningTimer = 0;
          sound.playTorchHalfWarning(fuelPct);

          // Sutil tremor/fagulhas na tocha para reforço orgânico discreto
          for (let i = 0; i < 6; i++) {
            this.particles.push({
              x: this.player.x + (Math.random() * 10 - 5),
              y: this.player.y - 12 + (Math.random() * 6 - 3),
              vx: (Math.random() - 0.5) * 20,
              vy: -20 - Math.random() * 15,
              size: 2.5 + Math.random() * 2,
              color: '#f97316',
              alpha: 1,
              maxAlpha: 1,
              life: 0.4,
              maxLife: 0.4,
              type: 'spark',
            });
          }
        } else if (fuelPct <= 0.5 && this.player.torchFuel > 0) {
          // 2. Repetição progressiva e mais rápida à medida que o fogo se esvai
          // Intervalo diminui: ~5s em 40%, ~3s em 25%, ~1.5s em 10%, ~0.8s abaixo de 5%
          const repeatInterval = Math.max(0.75, fuelPct * 8.0);
          this.torchWarningTimer += dt;

          if (this.torchWarningTimer >= repeatInterval) {
            this.torchWarningTimer = 0;
            sound.playTorchHalfWarning(fuelPct);

            // Faíscas adicionais quando a tocha está prestes a apagar
            const sparkCount = fuelPct <= 0.2 ? 5 : 2;
            for (let i = 0; i < sparkCount; i++) {
              this.particles.push({
                x: this.player.x + (Math.random() * 8 - 4),
                y: this.player.y - 12 + (Math.random() * 6 - 3),
                vx: (Math.random() - 0.5) * 15,
                vy: -15 - Math.random() * 10,
                size: 2 + Math.random() * 1.5,
                color: fuelPct <= 0.2 ? '#ef4444' : '#f97316',
                alpha: 0.9,
                maxAlpha: 0.9,
                life: 0.3,
                maxLife: 0.3,
                type: 'spark',
              });
            }
          }
        }
      }
    }

    // DARKNESS DAMAGE:
    // If torch is 0% AND outside campfire light -> The Darkness consumes you!
    if (this.player.torchFuel <= 0 && !inCampfireLight) {
      sound.playHeartbeat();
      this.darknessDamageTimer += dt;
      if (this.darknessDamageTimer >= 1.0) {
        this.darknessDamageTimer = 0;
        this.damagePlayer(8, 'consumed_by_darkness');
        this.spawnFloatingText(this.player.x, this.player.y - 25, '-8 Escuridão', '#ef4444');
      }

      // Dark mist particles around player
      if (Math.random() < 0.4) {
        this.particles.push({
          x: this.player.x + (Math.random() * 30 - 15),
          y: this.player.y + (Math.random() * 30 - 15),
          vx: (Math.random() - 0.5) * 15,
          vy: -10 - Math.random() * 15,
          size: 4 + Math.random() * 4,
          color: '#1e1b4b',
          alpha: 0.8,
          maxAlpha: 0.8,
          life: 0.8,
          maxLife: 0.8,
          type: 'smoke',
        });
      }
    } else {
      this.darknessDamageTimer = 0;
    }

    // WOOD WEIGHT SLOW PENALTY (Peso da Madeira)
    // Each log carried reduces movement speed
    // Backpack strength upgrade mitigates weight penalty
    const weightMitigation = this.upgrades.backpackStrength * 0.025;
    const slowPerLog = Math.max(0.06, 0.12 - weightMitigation);
    const weightPenaltyMultiplier = Math.max(0.35, 1 - this.player.woodCarried * slowPerLog);
    const effectiveSpeed = this.player.baseSpeed * weightPenaltyMultiplier;

    // Movement Input Calculation
    let moveX = 0;
    let moveY = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    // Virtual Joystick support
    if (this.virtualJoystick.active) {
      moveX += this.virtualJoystick.x;
      moveY += this.virtualJoystick.y;
    }

    const moveMagnitude = Math.hypot(moveX, moveY);
    if (moveMagnitude > 0.1 && !this.player.isChopping) {
      const normX = moveX / moveMagnitude;
      const normY = moveY / moveMagnitude;

      this.player.x += normX * effectiveSpeed * dt;
      this.player.y += normY * effectiveSpeed * dt;

      // Keep within world bounds
      const margin = 40;
      this.player.x = Math.max(margin, Math.min(this.worldSize - margin, this.player.x));
      this.player.y = Math.max(margin, Math.min(this.worldSize - margin, this.player.y));

      this.player.isMoving = true;
      this.player.walkFrame += dt * (effectiveSpeed / 40);
      sound.playFootstep();

      // Update facing angle
      this.player.facingAngle = Math.atan2(normY, normX);
    } else {
      this.player.isMoving = false;
    }

    // Auto-Deposit Wood into Campfire when close
    if (distToFire < 70 && this.player.woodCarried > 0) {
      this.depositWoodAtCampfire();
    }
  }

  public depositWoodAtCampfire() {
    if (this.player.woodCarried <= 0) return;

    const simpleCount = this.player.simpleWoodCarried || 0;
    const ancientCount = this.player.ancientWoodCarried || 0;
    const totalWood = this.player.woodCarried;

    // Madeira Simples recupera 10, Madeira Ancestral recupera 25
    const fuelGain = (simpleCount * 10) + (ancientCount * 25);

    this.campfire.fuel = Math.min(this.campfire.maxFuel, this.campfire.fuel + fuelGain);
    this.player.woodCarried = 0;
    this.player.simpleWoodCarried = 0;
    this.player.ancientWoodCarried = 0;
    this.stats.woodFedToFire += totalWood;

    // Small player heal from the sacred warmth
    if (this.player.hp < this.player.maxHp) {
      const healAmount = (simpleCount * 4) + (ancientCount * 12);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
      this.spawnFloatingText(this.player.x, this.player.y - 30, `+${healAmount} HP`, '#22c55e');
    }

    sound.playFeedFire();

    // Burst of fire sparks
    const sparkCount = 18 + (ancientCount * 8);
    for (let i = 0; i < sparkCount; i++) {
      const isGolden = ancientCount > 0 && Math.random() < 0.6;
      this.particles.push({
        x: this.campfire.x + (Math.random() * 24 - 12),
        y: this.campfire.y - 15,
        vx: (Math.random() - 0.5) * (isGolden ? 90 : 70),
        vy: -50 - Math.random() * (isGolden ? 110 : 80),
        size: 3 + Math.random() * 3,
        color: isGolden ? '#fde047' : (Math.random() < 0.5 ? '#fbbf24' : '#ef4444'),
        alpha: 1,
        maxAlpha: 1,
        life: 0.9 + Math.random() * 0.6,
        maxLife: 1.5,
        type: 'flame',
      });
    }

    if (this.onStateChange) this.onStateChange();
  }

  public triggerAttack(targetAngle?: number) {
    if (this.player.isAttacking || this.player.attackCooldown > 0 || this.isGameOver) return;

    this.player.isAttacking = true;
    this.player.attackProgress = 0;
    this.player.attackCooldown = 0.32;
    this.player.attackAngle = targetAngle !== undefined ? targetAngle : this.player.facingAngle;
    this.player.facingAngle = this.player.attackAngle;

    sound.playAttackSwing();

    // Directional swing fire / ember sparks towards mouse
    for (let s = 0; s < 6; s++) {
      const sparkAngle = this.player.attackAngle + (Math.random() - 0.5) * 1.2;
      const sparkSpeed = 60 + Math.random() * 90;
      this.particles.push({
        x: this.player.x + Math.cos(sparkAngle) * 22,
        y: this.player.y + Math.sin(sparkAngle) * 22,
        vx: Math.cos(sparkAngle) * sparkSpeed,
        vy: Math.sin(sparkAngle) * sparkSpeed,
        size: 2 + Math.random() * 2,
        color: this.player.torchFuel > 0 ? (Math.random() < 0.5 ? '#f59e0b' : '#fef08a') : '#e2e8f0',
        alpha: 1,
        maxAlpha: 1,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        type: 'spark',
      });
    }

    // Damage & Knockback to nearby enemies in frontal cone
    const attackRange = 58;
    const baseDamage = 35 + this.upgrades.axeSharpness * 12;

    this.enemies.forEach((enemy) => {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const dist = Math.hypot(dx, dy);

      if (dist < attackRange + enemy.radius) {
        const enemyAngle = Math.atan2(dy, dx);
        let angleDiff = Math.abs(enemyAngle - this.player.attackAngle);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

        if (angleDiff < 1.3) {
          // Hit enemy!
          enemy.hp -= baseDamage;
          enemy.damageFlash = 0.25;
          sound.playEnemyHit();
          this.screenShake = 4;

          // Knockback
          const knockForce = 180;
          enemy.knockback.x = Math.cos(enemyAngle) * knockForce;
          enemy.knockback.y = Math.sin(enemyAngle) * knockForce;

          this.spawnFloatingText(enemy.x, enemy.y - 20, `-${baseDamage}`, '#f87171');

          // Shadow blood particles
          for (let p = 0; p < 8; p++) {
            this.particles.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(enemyAngle + (Math.random() - 0.5)) * (40 + Math.random() * 50),
              vy: Math.sin(enemyAngle + (Math.random() - 0.5)) * (40 + Math.random() * 50),
              size: 3 + Math.random() * 3,
              color: '#38134a',
              alpha: 1,
              maxAlpha: 1,
              life: 0.5,
              maxLife: 0.5,
              type: 'shadow_blood',
            });
          }

          if (enemy.hp <= 0) {
            this.banishEnemy(enemy);
          }
        }
      }
    });
  }

  private banishEnemy(enemy: Enemy) {
    this.stats.enemiesBanished++;
    sound.playMonsterScreech();

    // Brasas dropam com CHANCE a partir de inimigos derrotados:
    // - Inimigos mais fracos (stalkers): 25% de chance de dropar 1 brasa
    // - Inimigos mais fortes (devoradores): 50% de chance de dropar brasa (sendo 50% de chance de 1 e 50% de chance de 2 brasas)
    if (enemy.type === 'devourer') {
      if (Math.random() < 0.50) {
        const emberCount = Math.random() < 0.50 ? 1 : 2;
        for (let i = 0; i < emberCount; i++) {
          this.soulEmbers.push({
            id: `ember-drop-${Date.now()}-${Math.random()}-${i}`,
            x: enemy.x + (Math.random() * 16 - 8),
            y: enemy.y + (Math.random() * 16 - 8),
            value: 1,
            lifetime: 45,
            bobbingOffset: Math.random() * 10,
          });
        }
      }
    } else {
      // Inimigos mais fracos
      if (Math.random() < 0.25) {
        this.soulEmbers.push({
          id: `ember-drop-${Date.now()}-${Math.random()}`,
          x: enemy.x + (Math.random() * 14 - 7),
          y: enemy.y + (Math.random() * 14 - 7),
          value: 1,
          lifetime: 45,
          bobbingOffset: Math.random() * 10,
        });
      }
    }

    // Death explosion of dark mist
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 60;
      this.particles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 6,
        color: enemy.type === 'devourer' ? '#581c87' : '#1e1b4b',
        alpha: 1,
        maxAlpha: 1,
        life: 0.7 + Math.random() * 0.4,
        maxLife: 1.1,
        type: 'smoke',
      });
    }

    this.spawnFloatingText(enemy.x, enemy.y - 25, 'Banido!', '#a855f7');
  }

  private updateCombat(dt: number) {
    if (this.player.attackCooldown > 0) {
      this.player.attackCooldown = Math.max(0, this.player.attackCooldown - dt);
    }

    if (this.player.isAttacking) {
      this.player.attackProgress += dt * 4.5;
      if (this.player.attackProgress >= 1) {
        this.player.isAttacking = false;
        this.player.attackProgress = 0;
      }
    }
  }

  public triggerChopTree() {
    if (this.player.isChopping || this.isGameOver) return;

    // Find nearest standing tree within reach
    let closestTree: TreeObject | null = null;
    let minDist = 65;

    for (const tree of this.trees) {
      if (tree.isChopped) continue;
      const dist = Math.hypot(tree.x - this.player.x, tree.y - this.player.y);
      if (dist < minDist) {
        minDist = dist;
        closestTree = tree;
      }
    }

    if (!closestTree) return;

    this.player.isChopping = true;
    this.player.chopProgress = 0;
    this.player.chopTargetId = closestTree.id;
  }

  private updateTrees(dt: number) {
    // Respawn chopped trees over time
    this.trees.forEach((tree) => {
      if (tree.shakeTime > 0) {
        tree.shakeTime = Math.max(0, tree.shakeTime - dt * 5);
      }

      if (tree.isChopped) {
        tree.respawnTimer += dt;
        // Intervalo de renascimento: 1 dia (60s) para árvores normais e 2 dias (120s) para árvores ancestrais
        const requiredRespawnTime = tree.type === 'ancient' ? 120 : 60;
        if (tree.respawnTimer >= requiredRespawnTime) {
          tree.isChopped = false;
          tree.health = tree.maxHealth;
          tree.respawnTimer = 0;
        }
      }
    });

    // Active tree chopping progress
    if (this.player.isChopping && this.player.chopTargetId) {
      const tree = this.trees.find((t) => t.id === this.player.chopTargetId);
      if (!tree || tree.isChopped) {
        this.player.isChopping = false;
        this.player.chopTargetId = null;
        return;
      }

      const chopSpeed = 1.4 + this.upgrades.axeSharpness * 0.5;
      this.player.chopProgress += dt * chopSpeed;

      if (this.player.chopProgress >= 1) {
        this.player.chopProgress = 0;
        tree.health--;
        tree.shakeTime = 0.3;
        sound.playChopWood();

        // Wood chip particles based on tree type
        const isAncient = tree.type === 'ancient';
        const chipColors = isAncient
          ? ['#f59e0b', '#fbbf24', '#d97706', '#78350f']
          : ['#78350f', '#5e3e29', '#362214'];

        for (let i = 0; i < (isAncient ? 10 : 6); i++) {
          this.particles.push({
            x: tree.x,
            y: tree.y - 15,
            vx: (Math.random() - 0.5) * (isAncient ? 90 : 60),
            vy: -30 - Math.random() * (isAncient ? 55 : 40),
            size: 3 + Math.random() * (isAncient ? 3 : 2),
            color: chipColors[Math.floor(Math.random() * chipColors.length)],
            alpha: 1,
            maxAlpha: 1,
            life: 0.5,
            maxLife: 0.5,
            type: 'wood_chip',
          });
        }

        if (tree.health <= 0) {
          tree.isChopped = true;
          this.player.isChopping = false;
          this.player.chopTargetId = null;

          if (isAncient) {
            // Árvores Ancestrais têm chance de dropar Madeira Ancestral dourada
            let ancientLogsCount = 0;
            for (let w = 0; w < tree.woodAmount; w++) {
              const isSpecialWood = Math.random() < 0.70; // 70% de chance por tora de ser Madeira Ancestral
              if (isSpecialWood) ancientLogsCount++;

              this.woodDrops.push({
                id: `wood-anc-${Date.now()}-${w}`,
                x: tree.x + (Math.random() * 36 - 18),
                y: tree.y + (Math.random() * 36 - 18),
                amount: 1,
                isSpecial: isSpecialWood,
                bobbingOffset: Math.random() * 10,
                lifetime: 9999,
              });
            }

            // Burst of ancient golden sparks
            for (let i = 0; i < 18; i++) {
              this.particles.push({
                x: tree.x,
                y: tree.y - 10,
                vx: (Math.random() - 0.5) * 80,
                vy: -40 - Math.random() * 50,
                size: 2 + Math.random() * 3,
                color: Math.random() < 0.5 ? '#f59e0b' : '#fde047',
                alpha: 1,
                maxAlpha: 1,
                life: 0.7,
                maxLife: 0.7,
                type: 'spark',
              });
            }

            this.spawnFloatingText(
              tree.x,
              tree.y - 30,
              ancientLogsCount > 0 ? `+${tree.woodAmount} Madeira Ancestral!` : `+${tree.woodAmount} Madeira!`,
              '#f59e0b'
            );
          } else {
            // Árvores normais dropam apenas madeira comum
            for (let w = 0; w < tree.woodAmount; w++) {
              this.woodDrops.push({
                id: `wood-${Date.now()}-${w}`,
                x: tree.x + (Math.random() * 30 - 15),
                y: tree.y + (Math.random() * 30 - 15),
                amount: 1,
                isSpecial: false,
                bobbingOffset: Math.random() * 10,
                lifetime: 9999,
              });
            }

            this.spawnFloatingText(tree.x, tree.y - 30, `+${tree.woodAmount} Madeira!`, '#fbbf24');
          }
        }
      }
    }
  }

  private updateDrops(dt: number) {
    const pickupDist = 36;

    // Pick up wood drops
    this.woodDrops = this.woodDrops.filter((drop) => {
      const dist = Math.hypot(drop.x - this.player.x, drop.y - this.player.y);
      if (dist < pickupDist) {
        if (this.player.woodCarried < this.player.maxWood) {
          if (drop.isSpecial) {
            this.player.ancientWoodCarried = (this.player.ancientWoodCarried || 0) + 1;
          } else {
            this.player.simpleWoodCarried = (this.player.simpleWoodCarried || 0) + 1;
          }
          this.player.woodCarried++;
          this.stats.woodGathered++;
          sound.playChopWood();
          this.spawnFloatingText(
            this.player.x,
            this.player.y - 25,
            drop.isSpecial ? '+1 Madeira Ancestral' : '+1 Madeira',
            drop.isSpecial ? '#f59e0b' : '#fbbf24'
          );
          return false;
        } else {
          // Backpack is full warning
          if (Math.random() < 0.05) {
            this.spawnFloatingText(this.player.x, this.player.y - 35, 'Mochila Cheia!', '#f87171');
          }
        }
      }
      return true;
    });

    // Pick up Soul Embers
    this.soulEmbers = this.soulEmbers.filter((ember) => {
      const dist = Math.hypot(ember.x - this.player.x, ember.y - this.player.y);
      if (dist < pickupDist + 10) {
        this.player.embersCollected += ember.value;
        this.stats.embersFound += ember.value;
        sound.playEmberPickup();
        this.spawnFloatingText(this.player.x, this.player.y - 30, `+${ember.value} Brasa`, '#f59e0b');
        return false;
      }
      return true;
    });
  }

  private updateEnemies(dt: number) {
    const now = performance.now();

    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.hp <= 0) return false;

      // Handle damage flash & knockback
      if (enemy.damageFlash > 0) {
        enemy.damageFlash = Math.max(0, enemy.damageFlash - dt * 4);
      }

      enemy.x += enemy.knockback.x * dt;
      enemy.y += enemy.knockback.y * dt;
      enemy.knockback.x *= 0.88;
      enemy.knockback.y *= 0.88;

      if (enemy.attackCooldown > 0) {
        enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      }

      // AI Decision
      if (enemy.type === 'devourer') {
        // DEVOURER MARCHES TO CAMPFIRE
        enemy.targetType = 'campfire';
        enemy.targetPos = { x: this.campfire.x, y: this.campfire.y };
      } else {
        // STALKER / WRAITH TARGETS PLAYER (OR CAMPFIRE IF PLAYER IS TOO FAR)
        const distToPlayer = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
        if (distToPlayer < 450) {
          enemy.targetType = 'player';
          enemy.targetPos = { x: this.player.x, y: this.player.y };
        } else {
          enemy.targetType = 'campfire';
          enemy.targetPos = { x: this.campfire.x, y: this.campfire.y };
        }
      }

      // Movement towards target
      const tdx = enemy.targetPos.x - enemy.x;
      const tdy = enemy.targetPos.y - enemy.y;
      const tdist = Math.hypot(tdx, tdy);

      if (tdist > 15) {
        const vx = (tdx / tdist) * enemy.speed;
        const vy = (tdy / tdist) * enemy.speed;
        enemy.x += vx * dt;
        enemy.y += vy * dt;
      }

      // Attack Campfire (Extinguish / Siphon fuel)
      const distToCampfire = Math.hypot(this.campfire.x - enemy.x, this.campfire.y - enemy.y);
      if (distToCampfire < 45 && enemy.attackCooldown <= 0) {
        enemy.attackCooldown = 1.2;
        const drainAmount = enemy.type === 'devourer' ? 10 : 3;
        this.campfire.fuel = Math.max(0, this.campfire.fuel - drainAmount);
        sound.playPlayerDamage();
        this.spawnFloatingText(
          this.campfire.x,
          this.campfire.y - 20,
          `-${drainAmount} Fogo Extinto!`,
          '#ef4444'
        );

        if (this.campfire.fuel <= 0) {
          this.campfire.fuel = 0;
          this.campfire.isExtinguished = true;
          this.triggerGameOver('campfire_extinguished');
        }
      }

      // Attack Player
      const distToPlayer = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
      if (distToPlayer < enemy.radius + this.player.radius && enemy.attackCooldown <= 0) {
        enemy.attackCooldown = 1.0;
        this.damagePlayer(enemy.damage, 'slain_by_shadows');
      }

      return true;
    });
  }

  private updateSpawners(dt: number) {
    // Enemy Spawning - scales with survival time
    this.enemySpawnTimer += dt;
    const spawnInterval = Math.max(3.5, 9.0 - this.stats.nightsSurvived * 1.2);

    if (this.enemySpawnTimer >= spawnInterval && this.enemies.length < 15) {
      this.enemySpawnTimer = 0;
      this.spawnShadowEnemy();
    }
  }

  private spawnShadowEnemy() {
    const center = this.worldSize / 2;
    const angle = Math.random() * Math.PI * 2;
    // Spawn just beyond the campfire light radius in the deep shadows
    const spawnDist = Math.max(this.campfire.currentRadius + 80, 380 + Math.random() * 350);

    const sx = center + Math.cos(angle) * spawnDist;
    const sy = center + Math.sin(angle) * spawnDist;

    // Pick enemy type
    const roll = Math.random();
    let type: Enemy['type'] = 'stalker';
    let hp = 65; // Inimigo intermediário: não morre com 1 ataque do machado no nível 2 (59 dano)
    let speed = 95;
    let damage = 14;
    let radius = 16;

    if (roll > 0.7) {
      type = 'devourer';
      hp = 140; // Monstro mais forte: morre exatamente com 4 ataques base (4 x 35 = 140)
      speed = 50;
      damage = 22;
      radius = 24;
    } else if (roll > 0.45) {
      type = 'wraith';
      hp = 35;
      speed = 140; // Inimigo leve: mais rápido e ágil
      damage = 10;
      radius = 14;
    }

    this.enemies.push({
      id: `enemy-${Date.now()}-${Math.random()}`,
      type,
      x: sx,
      y: sy,
      radius,
      hp,
      maxHp: hp,
      speed,
      damage,
      targetType: type === 'devourer' ? 'campfire' : 'player',
      targetPos: { x: center, y: center },
      state: 'stalking',
      stateTimer: 0,
      knockback: { x: 0, y: 0 },
      animFrame: Math.random() * 10,
      damageFlash: 0,
      attackCooldown: 0,
    });
  }

  public damagePlayer(amount: number, reason: DeathReason) {
    if (this.isGameOver) return;

    this.player.hp -= amount;
    this.player.damageFlash = 0.35;
    this.screenShake = 6;
    sound.playPlayerDamage();

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.triggerGameOver(reason);
    }
  }

  public triggerGameOver(reason: DeathReason) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.deathReason = reason;
    sound.playGameOver();
    if (this.onGameOver) {
      this.onGameOver(this.stats, reason);
    }
  }

  private updateParticles(dt: number) {
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife) * p.maxAlpha;
      return p.life > 0;
    });

    this.floatingTexts = this.floatingTexts.filter((t) => {
      t.life -= dt;
      t.y += t.vy * dt;
      t.alpha = Math.max(0, t.life / t.maxLife);
      return t.life > 0;
    });
  }

  public spawnFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      id: `text-${Date.now()}-${Math.random()}`,
      x,
      y,
      text,
      color,
      alpha: 1,
      life: 1.2,
      maxLife: 1.2,
      vy: -22,
    });
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const now = performance.now();

    // Camera follow player smoothly with screen shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShake > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShake * 2;
      shakeY = (Math.random() - 0.5) * this.screenShake * 2;
    }

    const camX = this.player.x - width / 2 + shakeX;
    const camY = this.player.y - height / 2 + shakeY;

    // 1. Draw World Ground
    renderGround(ctx, camX, camY, width, height, this.worldSize);

    // 2. Draw Trees & Stumps (Background layer)
    this.trees.forEach((tree) => {
      renderTree(ctx, tree, camX, camY, now);
    });

    // 3. Draw Collectibles (Wood Logs & Soul Embers)
    this.woodDrops.forEach((wood) => {
      renderWoodDrop(ctx, wood, camX, camY, now);
    });

    this.soulEmbers.forEach((ember) => {
      renderSoulEmber(ctx, ember, camX, camY, now);
    });

    // 4. Draw Campfire
    renderCampfire(ctx, this.campfire, camX, camY, now);

    // 5. Draw Shadow Enemies
    this.enemies.forEach((enemy) => {
      renderEnemy(ctx, enemy, camX, camY, now);
    });

    // 6. Draw Player & Slash Attack FX
    renderPlayer(ctx, this.player, camX, camY, now);
    renderAttackSlash(ctx, this.player, camX, camY, now);

    // 7. Draw Particles (Behind light mask)
    this.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      drawPixelRect(ctx, p.x - camX, p.y - camY, p.size, p.size, p.color);
    });
    ctx.globalAlpha = 1;

    // 8. DYNAMIC LIGHTING & DARKNESS FOG OF WAR
    renderLightingMask(ctx, width, height, this.player, this.campfire, camX, camY, now, this.disableDarknessMask);

    // 9. Floating Combat / Notification Text (Rendered above darkness for crisp readability)
    this.floatingTexts.forEach((t) => {
      ctx.save();
      ctx.font = 'bold 15px "Cinzel", "VT323", monospace';
      ctx.fillStyle = t.color;
      ctx.globalAlpha = t.alpha;
      ctx.textAlign = 'center';
      // Outline for legibility
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, t.x - camX, t.y - camY);
      ctx.fillText(t.text, t.x - camX, t.y - camY);
      ctx.restore();
    });
  }
}

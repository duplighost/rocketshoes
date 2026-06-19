// All tuning lives here. Feel constants come from Boon Moots v50; content stats
// come from No Moon. Anchors refer to docs/ inventories.

export const TAU = Math.PI * 2;
export const SAVE_KEY = 'oneRoomNoMoon.v1';
export const VERSION = '1.7.0-isometric-rocket-shoes';

export const ROOM = {
  W: 2050, H: 1460, H_PORTRAIT: 1820,   // base dims (the roller rolls actual sizes; these document the target)
  WALL: 56,                 // playfield inset
  SPAWN_CLEAR: 360,         // radius around player spawn kept obstacle-free (scales with the bigger arena)
};

export const PLAYER = {
  R: 20, MAX_HP: 6,
  // Moots is drawn at this fraction of his original art size; collision stays separate.
  // Body, gun, body-hugging FX, and bullet emitter all key off this one knob.
  DRAW_SCALE: 0.70,
  // Best-feel fork: keep the rocket tempo from the fast Claude build, then nudge it
  // just enough that the giant rooms feel athletic instead of empty.
  SPEED: 462, ACCEL: 40.5, STOP: 44.5, TURN: 47.5, LATERAL: 21.4,
  MAX_SPEED_MULT: 1.42, DASH_SPEED_MULT: 7.06,
  FIRE_DELAY: 0.14, DAMAGE: 0.90, SHOT_MULT: 0.74, SHOT_SPEED: 930,
  // Bigger bolts: easier to read AND easier to land in isometric, where depth makes
  // pinpoint aim harder. drawBullets renders these as proper laser bolts, not specks.
  SHOT_R: 5.4, SHOT_LIFE: 1.14, TWIN_OFFSET: 6,
  // Baseline shot homing — every player bolt curves gently toward an enemy roughly ahead
  // of it (within the cone). Makes iso aiming forgiving without feeling auto-aimed; the
  // hunterMycelia relic stacks on top with full-circle tracking.
  SHOT_HOMING_TURN: 3.2, SHOT_HOMING_RANGE: 580, SHOT_HOMING_CONE: 0.22,
  // Art-space gun offsets. firePlayer multiplies these by DRAW_SCALE so bullets leave the shrunken muzzle.
  EMITTER_Y: -16, EMITTER_LEN: 32,
  CRIT: 0.03, CRIT_MULT: 1.8,
  // the dash is the centerpiece: long, far, invincible throughout, hits hard+wide.
  // Reach + glide carried over from the faster "good speed / big rooms" fork.
  DASH_IMPULSE: 2385, DASH_DUR: 0.48, DASH_CD: 0.24, DASH_IFRAMES: 0.55,
  DASH_GLIDE: 1.62, DASH_HIT_RANGE: 198, DASH_SWEEP_RANGE: 162, DASH_HIT_MULT: 1.48, DASH_KNOCK: 690,
  DASH_KILL_REFUND: 0.12,   // every kill feeds the dash loop a little
  // Stronger dash magnetism for iso: wider cone + more bend so a dash aimed near a foe
  // reliably connects (depth ambiguity made the old, subtler assist miss too often).
  DASH_HOMING_RANGE: 760, DASH_HOMING_CONE: 0.42, DASH_HOMING_PERP: 340, DASH_HOMING_BLEND: 0.52,
  DASH_PRIME_MULT: 1.5, DASH_PRIME_PIERCE: 1, // "dash primes next shot" relic payload
  HURT_IFRAMES: 0.92, HURT_KNOCK: 370,
  PICKUP_RANGE: 138,
};

export const COMBO = { PER_KILL: 0.20, PER_BOSS: 1.1, CAP: 16, WINDOW: 3.15 };

export const SCORE = {
  CLEAR_BASE: 300, CLEAR_PER_ROUND: 82, NO_HIT: 400,
  SPEED_MAX: 900, SPEED_DRAIN: 20, SPEED_FROM_ROUND: 3,
  SPARK: 18, OVERDRIVE_MULT: 1.35,
};

export const CAPS = {
  // City-scale arenas: lift the ceilings so the sprawl stays full of action + flash.
  // Director budget scales with room area (see buildWaves); these are the hard caps.
  // TOP PLAYTEST DIAL: drop back if combat reads as soup or perf dips.
  // XL arenas: a LOT of enemies on screen. Bigger than both forks; viewport culling +
  // adaptive lowFx keep it affordable.
  ENEMIES: { mobile: 56, desktop: 100 },
  ENEMY_BULLETS: { mobile: 136, desktop: 232 },
  PLAYER_BULLETS: { mobile: 110, desktop: 210 },
  PARTICLES: { mobile: 190, desktop: 370 },
};

export const DIRECTOR = {
  // spawn count: clamp(BASE + round*PER_ROUND + rand(0,2) , MIN, cap)
  // Tempo lifted toward the faster fork: more bodies sooner, shorter telegraph,
  // quicker reinforcements — the gigantic rooms stay hot instead of feeling empty.
  BASE: 8, PER_ROUND: 1.55, MIN: 7,
  TELEGRAPH: 0.24,            // warning glyph time before a spawn lands
  REINFORCE_AT: 0.82,         // fraction of count held for the second wave
  REINFORCE_DELAY: [0.55, 1.05],  // seconds (or when 2 enemies remain) — kept snappy for tempo
  // danger stage = min(5, floor(round / 4)) during the route
  STAGE_DIV: 4, STAGE_CAP: 5,
  // non-boss scaling per No Moon: hp ×(1 + stageIdx*0.13 + stage*0.08)
  HP_IDX: 0.13, HP_STAGE: 0.08, SPD_IDX: 0.045, SPD_STAGE: 0.045,
};

// On city-scale maps a distant enemy that just ambles toward you makes the room
// read as slow and empty. HUNT puts anything past FAR into active pursuit — it
// steers harder and gets a speed bonus that ramps to FULL — so the action always
// finds the player. This is the single biggest "feels faster" lever. (Ported from
// the faster fork; absent on the website build, which is why it dragged.)
export const HUNT = {
  FAR: 740, FULL: 2450, STEER: 2.95, SPEED_BONUS: 1.68,
};

export const FX = {
  SHAKE_DECAY: 2.25, FLASH_DECAY: 1.7, SLOWMO_SCALE: 0.55,
  // camera shake is quadratic in trauma (Grave Signal model): offset = trauma²·GAIN.
  // small hits stop buzzing; big hits still punch. GAIN tuned so peak ≈ the old linear feel.
  SHAKE_GAIN: 30,
  HIT_PAUSE: { shot: 4, chain: 7, dash: 8, pulse: 14, kill: 10, dashKill: 16, boss: 28, hurt: 36 }, // ms
};

export const BLOOM = { ALPHA: 0.20, FILTER: 'blur(11px) saturate(1.16)' };

export const ANNEX = { CHANCE: 0.48, AMBUSH: 0.45 };

export const STREAK_NAMES = ['', '', '×2', '×3', '', '×5', '', '', '×8'];

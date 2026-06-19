// Viewport + damped isometric camera with aim-lead, kick and shake.
import { clamp, damp } from '../rng.js';
import { state } from '../state.js';
import { coarse } from '../systems/juice.js';
import { FX } from '../config.js';

// Physics stays in clean top-down room coordinates. Rendering projects that plane into
// a fast 2:1-ish isometric city: x/y become diagonals, z is a true screen-up lift.
export const ISO = {
  X: 0.78,
  Y: 0.43,
  TIER_Z: 130,  // WAY taller platforms — dramatic sky towers you can read at a glance
                // (was 72). Drives camera + render lift (draw.js TIER_LIFT = ISO.TIER_Z).
  // Bigger floor padding lets the camera pull back enough to actually SHOW the surrounding
  // city in the void (it was getting clamped off-screen, especially on phones).
  FLOOR_PAD_X: 660,
  FLOOR_PAD_Y: 680,
};

export const view = {
  W: 1, H: 1, DPR: 1, scale: 1, baseScale: 1, zoom: 1,
  mobile: false, portrait: false,
  shakeX: 0, shakeY: 0,
};
// flip = +1 (default SE view) or -1 (the 180° "other angle"). A level button toggles it;
// reflecting the projection reverses the depth order, so things tucked behind towers from
// one angle come into view from the other.
export const cam = { x: 0, y: 0, kickX: 0, kickY: 0, flip: 1 };

export function toggleViewFlip() {
  cam.flip = -cam.flip;
  snapCamera();   // re-frame the player instantly at the new angle (no in-between non-iso frames)
  return cam.flip;
}

export function resize(canvas, bloomCanvas) {
  const iw = (typeof innerWidth !== 'undefined') ? innerWidth : 1280;
  const ih = (typeof innerHeight !== 'undefined') ? innerHeight : 720;
  view.mobile = coarse() || iw < 760 || ih < 560;
  view.portrait = ih >= iw;
  view.DPR = Math.min(view.mobile ? 1.35 : 2, Math.max(1, (typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1)));
  const small = Math.min(iw, ih);
  // Isometric compression shows more city, so the base camera can sit a touch closer
  // without losing threat readability. Dashing still opens the view dynamically.
  // Phones zoom out a lot more now: combined with the smaller mobile arenas (roomRoller),
  // you can actually SEE the whole stage — the surrounding city, the platforms, the flip
  // pad — instead of a samey patch of floor. Sprites stay legible at this distance.
  view.baseScale = view.mobile ? clamp(small / 760, 0.5, 0.72) : 0.78;
  view.scale = view.baseScale * view.zoom;
  view.W = Math.max(320, Math.floor(iw));
  view.H = Math.max(320, Math.floor(ih));
  if (canvas) {
    canvas.width = Math.floor(view.W * view.DPR);
    canvas.height = Math.floor(view.H * view.DPR);
    canvas.style.width = view.W + 'px';
    canvas.style.height = view.H + 'px';
  }
  if (bloomCanvas) {
    bloomCanvas.width = Math.max(1, Math.floor(view.W * view.DPR * 0.5));
    bloomCanvas.height = Math.max(1, Math.floor(view.H * view.DPR * 0.5));
  }
  if (typeof document !== 'undefined') {
    const hint = document.getElementById('rotateHint');
    if (hint) {
      const inPortrait = view.mobile && view.portrait;
      if (inPortrait && !view._rotateHintArmed) {
        view._rotateHintArmed = true;
        hint.classList.add('show');
        clearTimeout(view._rotateHintTimer);
        view._rotateHintTimer = setTimeout(() => hint.classList.remove('show'), 6000);
      } else if (!inPortrait) {
        view._rotateHintArmed = false;
        clearTimeout(view._rotateHintTimer);
        hint.classList.remove('show');
      }
    }
  }
}

export function project(x, y, z = 0) {
  const f = cam.flip;
  return { x: (x - y) * ISO.X * f, y: (x + y) * ISO.Y * f - z };
}

export function unproject(ix, iy, z = 0) {
  const f = cam.flip;
  const py = iy + z;
  return {
    x: (py / ISO.Y + ix / ISO.X) * 0.5 * f,
    y: (py / ISO.Y - ix / ISO.X) * 0.5 * f,
  };
}

export function projectDir(dx, dy) {
  const f = cam.flip;
  return { x: (dx - dy) * ISO.X * f, y: (dx + dy) * ISO.Y * f };
}

export function screenDirToWorld(dx, dy) {
  const m = Math.hypot(dx, dy);
  if (m <= 1e-6) return { x: 0, y: 0, m: 0 };
  const sx = dx / m, sy = dy / m;
  const w = unproject(sx, sy, 0);
  const wm = Math.hypot(w.x, w.y) || 1;
  return { x: w.x / wm, y: w.y / wm, m };
}

export function screenDirFromWorld(dx, dy) {
  const s = projectDir(dx, dy);
  const m = Math.hypot(s.x, s.y) || 1;
  return { x: s.x / m, y: s.y / m, m };
}

function isoRoomBounds(room) {
  const pts = [project(0, 0), project(room.w, 0), project(0, room.h), project(room.w, room.h)];
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  return {
    l: Math.min(...xs) - ISO.FLOOR_PAD_X,
    r: Math.max(...xs) + ISO.FLOOR_PAD_X,
    t: Math.min(...ys) - ISO.FLOOR_PAD_Y - ISO.TIER_Z * 3,
    b: Math.max(...ys) + ISO.FLOOR_PAD_Y,
  };
}

function clampCamToRoom(tx, ty, room, vw, vh) {
  const b = isoRoomBounds(room);
  const bw = b.r - b.l, bh = b.b - b.t;
  return {
    x: vw >= bw ? b.l - (vw - bw) * 0.5 : clamp(tx, b.l, b.r - vw),
    y: vh >= bh ? b.t - (vh - bh) * 0.5 : clamp(ty, b.t, b.b - vh),
  };
}

export function snapCamera() {
  const p = state.run?.player, room = state.room;
  if (!p || !room) return;
  view.zoom = 1; view.scale = view.baseScale;
  const vw = view.W / view.scale, vh = view.H / view.scale;
  const pp = project(p.x, p.y, (p.level || 0) * ISO.TIER_Z + (p.airZ || 0));
  const c = clampCamToRoom(pp.x - vw / 2, pp.y - vh / 2, room, vw, vh);
  cam.x = c.x; cam.y = c.y;
}

export function kick(x, y) { cam.kickX += x; cam.kickY += y; }

export function updateCamera(dt) {
  const p = state.run?.player, room = state.room;
  if (!p || !room) return;
  const spd = Math.hypot(p.vx, p.vy);
  const zt = clamp(1 - Math.max(0, spd - 540) / 3900, 0.92, 1);
  view.zoom = damp(view.zoom, zt, 7.4, dt);
  view.scale = view.baseScale * view.zoom;
  const vw = view.W / view.scale, vh = view.H / view.scale;
  const leadX = p.aimX * 92 + p.vx * 0.13;
  const leadY = p.aimY * 92 + p.vy * 0.13;
  const pp = project(p.x + leadX, p.y + leadY, (p.level || 0) * ISO.TIER_Z + (p.airZ || 0));
  const c = clampCamToRoom(pp.x - vw / 2, pp.y - vh / 2, room, vw, vh);
  cam.x = damp(cam.x, c.x, 9.4, dt);
  cam.y = damp(cam.y, c.y, 9.4, dt);
  cam.kickX = damp(cam.kickX, 0, 17, dt);
  cam.kickY = damp(cam.kickY, 0, 17, dt);
}

export function beginCameraFrame() {
  const s = state.fx.shake;
  const mag = s * s * FX.SHAKE_GAIN;
  view.shakeX = (Math.random() * 2 - 1) * mag;
  view.shakeY = (Math.random() * 2 - 1) * mag;
}

// World-plane transform for floor geometry. Circles become true iso floor ellipses;
// z-height is applied separately with applyIsoZ so elevated things move straight up.
export function applyWorldTransform(ctx) {
  const S = view.scale, D = view.DPR, f = cam.flip;
  // The 2x2 basis is the linear part of project() — so it carries the same flip sign.
  // Translation already uses cam.x/cam.y, which come from the flip-aware project().
  ctx.setTransform(
    D * S * ISO.X * f, D * S * ISO.Y * f,
    D * S * -ISO.X * f, D * S * ISO.Y * f,
    (-cam.x - cam.kickX) * D * S + view.shakeX * D,
    (-cam.y - cam.kickY) * D * S + view.shakeY * D,
  );
}

export function applyIsoZ(ctx, z = 0) {
  if (!z) return;
  const m = ctx.getTransform();
  ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f - z * view.scale * view.DPR);
}

export function uiTransform(ctx) {
  ctx.setTransform(view.DPR, 0, 0, view.DPR, 0, 0);
}

export function worldToScreen(x, y, z = 0) {
  const p = project(x, y, z);
  return {
    x: (p.x - cam.x - cam.kickX) * view.scale + view.shakeX,
    y: (p.y - cam.y - cam.kickY) * view.scale + view.shakeY,
  };
}

export function billboardTransform(ctx, x, y, z = 0, scale = 1) {
  const p = worldToScreen(x, y, z);
  const S = view.scale * scale, D = view.DPR;
  ctx.setTransform(D * S, 0, 0, D * S, p.x * D, p.y * D);
}

export function screenToWorld(sx, sy) {
  const ix = cam.x + cam.kickX + (sx - view.shakeX) / view.scale;
  const iy = cam.y + cam.kickY + (sy - view.shakeY) / view.scale;
  return unproject(ix, iy, 0);
}

export function visibleWorldRect(margin = 0) {
  const pts = [
    screenToWorld(-margin, -margin),
    screenToWorld(view.W + margin, -margin),
    screenToWorld(view.W + margin, view.H + margin),
    screenToWorld(-margin, view.H + margin),
  ];
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  return { l: Math.min(...xs), r: Math.max(...xs), t: Math.min(...ys), b: Math.max(...ys) };
}

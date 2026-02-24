export const VW = 400;
export const PAD_X = 16;
export const PAD_TOP = 8;
export const COURT_W = VW - PAD_X * 2;
export const PPM = COURT_W / 15;

export const BX = VW / 2;
export const BY = PAD_TOP + 1.575 * PPM;

export const R1 = 1.5 * PPM;
export const R2 = 4.2 * PPM;
export const R3 = 7.0 * PPM;

export const VH = BY + R3 + 1.8 * PPM;

export const PAINT_HW = (4.9 / 2) * PPM;
export const PAINT_L = BX - PAINT_HW;
export const PAINT_R = BX + PAINT_HW;
export const PAINT_B = PAD_TOP + 5.8 * PPM;
export const FT_R = 1.8 * PPM;
export const THREE_PT_R = 6.75 * PPM;
export const RESTRICTED_R = 1.25 * PPM;
export const THREE_CORNER_X_L = PAD_X + 0.9 * PPM;
export const THREE_CORNER_X_R = VW - PAD_X - 0.9 * PPM;

function px(deg: number, r: number) {
  return BX + r * Math.cos((deg * Math.PI) / 180);
}
function py(deg: number, r: number) {
  return BY + r * Math.sin((deg * Math.PI) / 180);
}

function sectorPath(a1: number, a2: number, rInner: number, rOuter: number): string {
  const p1i = { x: px(a1, rInner), y: py(a1, rInner) };
  const p2i = { x: px(a2, rInner), y: py(a2, rInner) };
  const p1o = { x: px(a1, rOuter), y: py(a1, rOuter) };
  const p2o = { x: px(a2, rOuter), y: py(a2, rOuter) };
  const large = a2 - a1 > 180 ? 1 : 0;
  return [
    `M${p1i.x},${p1i.y}`,
    `A${rInner},${rInner} 0 ${large},1 ${p2i.x},${p2i.y}`,
    `L${p2o.x},${p2o.y}`,
    `A${rOuter},${rOuter} 0 ${large},0 ${p1o.x},${p1o.y}`,
    "Z",
  ].join(" ");
}

const zone1Path = `M${BX - R1},${BY} A${R1},${R1} 0 1,1 ${BX + R1},${BY} A${R1},${R1} 0 1,1 ${BX - R1},${BY} Z`;

const R2_ANGLES = [
  { id: 4, a1: -10, a2: 53 },
  { id: 3, a1: 53, a2: 127 },
  { id: 2, a1: 127, a2: 190 },
];

const R3_ANGLES = [
  { id: 9, a1: -10, a2: 30 },
  { id: 8, a1: 30, a2: 70 },
  { id: 7, a1: 70, a2: 110 },
  { id: 6, a1: 110, a2: 150 },
  { id: 5, a1: 150, a2: 190 },
];

export interface ZoneDef {
  id: number;
  path: string;
  lx: number;
  ly: number;
}

function buildZones(): ZoneDef[] {
  const zones: ZoneDef[] = [];
  zones.push({ id: 1, path: zone1Path, lx: BX, ly: BY + 8 });
  for (const s of R2_ANGLES) {
    const mid = (s.a1 + s.a2) / 2;
    const mr = (R1 + R2) / 2;
    zones.push({ id: s.id, path: sectorPath(s.a1, s.a2, R1, R2), lx: px(mid, mr), ly: py(mid, mr) });
  }
  for (const s of R3_ANGLES) {
    const mid = (s.a1 + s.a2) / 2;
    const mr = (R2 + R3) / 2;
    zones.push({ id: s.id, path: sectorPath(s.a1, s.a2, R2, R3), lx: px(mid, mr), ly: py(mid, mr) });
  }
  return zones;
}

export const ZONES = buildZones();

export function threePointPath(): string {
  const arcStartY = (x: number) => {
    const dx = x - BX;
    if (Math.abs(dx) > THREE_PT_R) return BY;
    return BY + Math.sqrt(THREE_PT_R * THREE_PT_R - dx * dx);
  };
  return [
    `M${THREE_CORNER_X_L},${PAD_TOP}`,
    `L${THREE_CORNER_X_L},${arcStartY(THREE_CORNER_X_L)}`,
    `A${THREE_PT_R},${THREE_PT_R} 0 0,0 ${THREE_CORNER_X_R},${arcStartY(THREE_CORNER_X_R)}`,
    `L${THREE_CORNER_X_R},${PAD_TOP}`,
  ].join(" ");
}

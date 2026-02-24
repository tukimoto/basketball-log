export const VW = 400;
export const PAD_X = 16;
export const PAD_TOP = 8;
export const COURT_W = VW - PAD_X * 2;
export const PPM = COURT_W / 15;

export const BX = VW / 2;
export const BY = PAD_TOP + 1.575 * PPM;

export const R1 = 1.5 * PPM;
export const R2 = 4.2 * PPM;
const R3 = 7.0 * PPM;

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

// Y where 3PT arc meets the corner straight lines
function arcStartY(x: number): number {
  const dx = x - BX;
  if (Math.abs(dx) > THREE_PT_R) return BY;
  return BY + Math.sqrt(THREE_PT_R * THREE_PT_R - dx * dx);
}

const ARC_Y_R = arcStartY(THREE_CORNER_X_R);
const ARC_Y_L = arcStartY(THREE_CORNER_X_L);

const zone1Path = `M${BX - R1},${BY} A${R1},${R1} 0 1,1 ${BX + R1},${BY} A${R1},${R1} 0 1,1 ${BX - R1},${BY} Z`;

export interface ZoneDef {
  id: number;
  path: string;
  lx: number;
  ly: number;
}

/*
 * Zone layout:
 *   1 = ゴール下 (circle, R1)
 *   Ring 2 (R1→R2): 2=左, 3=中央, 4=右
 *   Ring 3 (R2→3PT): 5=左コーナー, 6=左ウイング, 7=トップ, 8=右ウイング, 9=右コーナー
 *
 * Zones 2,4,5,9: endline-side edge is flat against the baseline (y=PAD_TOP)
 * Zones 5-9: outer edge follows the 3PT line (arc + corner straight lines)
 */
function buildZones(): ZoneDef[] {
  const zones: ZoneDef[] = [];
  const mr12 = (R1 + R2) / 2;
  const mr23 = (R2 + THREE_PT_R) / 2;

  // --- Zone 1: circle around basket (unchanged) ---
  zones.push({ id: 1, path: zone1Path, lx: BX, ly: BY + 8 });

  // --- Zone 3: center Ring 2 (53°–127°, R1→R2) — normal sector ---
  zones.push({
    id: 3,
    path: sectorPath(53, 127, R1, R2),
    lx: px(90, mr12),
    ly: py(90, mr12),
  });

  // --- Zone 4: right Ring 2 (0°–53°, R1→R2, endline-capped) ---
  {
    const path = [
      `M${px(53, R1)},${py(53, R1)}`,
      `A${R1},${R1} 0 0,0 ${px(0, R1)},${py(0, R1)}`,
      `L${px(0, R1)},${PAD_TOP}`,
      `L${px(0, R2)},${PAD_TOP}`,
      `L${px(0, R2)},${py(0, R2)}`,
      `A${R2},${R2} 0 0,1 ${px(53, R2)},${py(53, R2)}`,
      "Z",
    ].join(" ");
    zones.push({ id: 4, path, lx: px(25, mr12), ly: py(25, mr12) });
  }

  // --- Zone 2: left Ring 2 (127°–180°, R1→R2, endline-capped) ---
  {
    const path = [
      `M${px(127, R1)},${py(127, R1)}`,
      `A${R1},${R1} 0 0,1 ${px(180, R1)},${py(180, R1)}`,
      `L${px(180, R1)},${PAD_TOP}`,
      `L${px(180, R2)},${PAD_TOP}`,
      `L${px(180, R2)},${py(180, R2)}`,
      `A${R2},${R2} 0 0,0 ${px(127, R2)},${py(127, R2)}`,
      "Z",
    ].join(" ");
    zones.push({ id: 2, path, lx: px(155, mr12), ly: py(155, mr12) });
  }

  // --- Zone 7: top Ring 3 (70°–110°, R2→3PT arc) ---
  zones.push({
    id: 7,
    path: sectorPath(70, 110, R2, THREE_PT_R),
    lx: px(90, mr23),
    ly: py(90, mr23),
  });

  // --- Zone 8: right wing Ring 3 (30°–70°, R2→3PT arc) ---
  zones.push({
    id: 8,
    path: sectorPath(30, 70, R2, THREE_PT_R),
    lx: px(50, mr23),
    ly: py(50, mr23),
  });

  // --- Zone 6: left wing Ring 3 (110°–150°, R2→3PT arc) ---
  zones.push({
    id: 6,
    path: sectorPath(110, 150, R2, THREE_PT_R),
    lx: px(130, mr23),
    ly: py(130, mr23),
  });

  // --- Zone 9: right corner Ring 3 (0°–30°, R2→3PT, endline-capped) ---
  // Inner: R2 arc 30°→0°, up to endline, along endline to 3PT corner line,
  // down corner line, 3PT arc back to 30°
  {
    const path = [
      `M${px(30, R2)},${py(30, R2)}`,
      `A${R2},${R2} 0 0,0 ${px(0, R2)},${py(0, R2)}`,
      `L${px(0, R2)},${PAD_TOP}`,
      `L${THREE_CORNER_X_R},${PAD_TOP}`,
      `L${THREE_CORNER_X_R},${ARC_Y_R}`,
      `A${THREE_PT_R},${THREE_PT_R} 0 0,1 ${px(30, THREE_PT_R)},${py(30, THREE_PT_R)}`,
      "Z",
    ].join(" ");
    zones.push({ id: 9, path, lx: px(12, mr23), ly: py(12, mr23) });
  }

  // --- Zone 5: left corner Ring 3 (150°–180°, R2→3PT, endline-capped) ---
  {
    const path = [
      `M${px(150, R2)},${py(150, R2)}`,
      `A${R2},${R2} 0 0,1 ${px(180, R2)},${py(180, R2)}`,
      `L${px(180, R2)},${PAD_TOP}`,
      `L${THREE_CORNER_X_L},${PAD_TOP}`,
      `L${THREE_CORNER_X_L},${ARC_Y_L}`,
      `A${THREE_PT_R},${THREE_PT_R} 0 0,0 ${px(150, THREE_PT_R)},${py(150, THREE_PT_R)}`,
      "Z",
    ].join(" ");
    zones.push({ id: 5, path, lx: px(168, mr23), ly: py(168, mr23) });
  }

  return zones;
}

export const ZONES = buildZones();

export function threePointPath(): string {
  return [
    `M${THREE_CORNER_X_L},${PAD_TOP}`,
    `L${THREE_CORNER_X_L},${ARC_Y_L}`,
    `A${THREE_PT_R},${THREE_PT_R} 0 0,0 ${THREE_CORNER_X_R},${ARC_Y_R}`,
    `L${THREE_CORNER_X_R},${PAD_TOP}`,
  ].join(" ");
}

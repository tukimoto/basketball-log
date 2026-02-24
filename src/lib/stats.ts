import type { Log, Player, PlayerStats, Quarter, ZoneStat, ZoneRebStat } from "@/types";

export function calcPlayerStats(
  logs: Log[],
  players: Player[],
  quarter?: Quarter,
): PlayerStats[] {
  const filtered = quarter ? logs.filter((l) => l.quarter === quarter) : logs;

  return players.map((p) => {
    const pLogs = filtered.filter((l) => l.playerId === p.id);
    const shotMade = pLogs.filter(
      (l) => l.action === "SHOT" && l.result === "MAKE",
    ).length;
    const shotMiss = pLogs.filter(
      (l) => l.action === "SHOT" && l.result === "MISS",
    ).length;
    const ftMade = pLogs.filter(
      (l) => l.action === "FT" && l.result === "MAKE",
    ).length;
    const ftMiss = pLogs.filter(
      (l) => l.action === "FT" && l.result === "MISS",
    ).length;
    const offReb = pLogs.filter(
      (l) => l.action === "REB" && l.result === "OFF",
    ).length;
    const defReb = pLogs.filter(
      (l) => l.action === "REB" && l.result === "DEF",
    ).length;
    const fouls = pLogs.filter((l) => l.action === "FOUL").length;
    const assists = filtered.filter(
      (l) => l.action === "AST" && l.passerPlayerId === p.id,
    ).length;

    const shotTotal = shotMade + shotMiss;
    const ftTotal = ftMade + ftMiss;
    const points = shotMade * 2 + ftMade;

    return {
      playerId: p.id,
      playerName: p.name,
      playerNumber: p.number,
      shotMade,
      shotMiss,
      ftMade,
      ftMiss,
      offReb,
      defReb,
      fouls,
      assists,
      points,
      fgPercent: shotTotal > 0 ? (shotMade / shotTotal) * 100 : 0,
      ftPercent: ftTotal > 0 ? (ftMade / ftTotal) * 100 : 0,
    };
  });
}

export function calcTeamScore(logs: Log[]): number {
  let score = 0;
  for (const l of logs) {
    if (l.action === "SHOT" && l.result === "MAKE") score += 2;
    if (l.action === "FT" && l.result === "MAKE") score += 1;
  }
  return score;
}

export function calcZoneStats(logs: Log[]): ZoneStat[] {
  const map = new Map<number, { made: number; miss: number }>();
  for (let z = 1; z <= 9; z++) {
    map.set(z, { made: 0, miss: 0 });
  }

  for (const l of logs) {
    if (l.action !== "SHOT") continue;
    if (l.zoneId == null) continue;
    if (l.zoneId < 1 || l.zoneId > 9) continue;
    const cur = map.get(l.zoneId)!;
    if (l.result === "MAKE") cur.made += 1;
    if (l.result === "MISS") cur.miss += 1;
  }

  return Array.from({ length: 9 }, (_, i) => {
    const zoneId = i + 1;
    const cur = map.get(zoneId)!;
    const attempts = cur.made + cur.miss;
    return {
      zoneId,
      made: cur.made,
      miss: cur.miss,
      attempts,
      fgPercent: attempts > 0 ? (cur.made / attempts) * 100 : 0,
    };
  });
}

export function calcZoneStatsByPlayer(logs: Log[], playerId: string): ZoneStat[] {
  return calcZoneStats(logs.filter((l) => l.playerId === playerId));
}

export function calcZoneRebStats(logs: Log[]): ZoneRebStat[] {
  const map = new Map<number, { off: number; def: number }>();
  for (let z = 1; z <= 9; z++) {
    map.set(z, { off: 0, def: 0 });
  }

  for (const l of logs) {
    if (l.action !== "REB") continue;
    if (l.zoneId == null || l.zoneId < 1 || l.zoneId > 9) continue;
    const cur = map.get(l.zoneId)!;
    if (l.result === "OFF") cur.off += 1;
    if (l.result === "DEF") cur.def += 1;
  }

  return Array.from({ length: 9 }, (_, i) => {
    const zoneId = i + 1;
    const cur = map.get(zoneId)!;
    return { zoneId, off: cur.off, def: cur.def, total: cur.off + cur.def };
  });
}

export function calcZoneRebStatsByPlayer(logs: Log[], playerId: string): ZoneRebStat[] {
  return calcZoneRebStats(logs.filter((l) => l.playerId === playerId));
}

export function exportCSV(stats: PlayerStats[], gameName: string): void {
  const header =
    "背番号,名前,得点,FG成功,FG失敗,FG%,FT成功,FT失敗,FT%,ORB,DRB,REB合計,AST,ファウル";
  const rows = stats.map((s) =>
    [
      s.playerNumber,
      s.playerName,
      s.points,
      s.shotMade,
      s.shotMiss,
      s.fgPercent.toFixed(1),
      s.ftMade,
      s.ftMiss,
      s.ftPercent.toFixed(1),
      s.offReb,
      s.defReb,
      s.offReb + s.defReb,
      s.assists,
      s.fouls,
    ].join(","),
  );

  const bom = "\uFEFF";
  const csv = bom + [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${gameName}_stats.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

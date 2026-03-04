import { Player } from "../types";

/**
 * 日本の年度（4月1日開始）を取得する
 * 例: 2024年3月31日 -> 2023年度
 * 例: 2024年4月1日 -> 2024年度
 */
export function getCurrentAcademicYear(date: Date = new Date()): number {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    // 1月〜3月は前年度扱い
    return month < 4 ? year - 1 : year;
}

/**
 * 卒業年度から現在の学年（1〜6、または0(未就学児)、7以上(OB/OG)）を計算する
 * 卒業年度: 6年生の3月に迎える年（例: 2027年3月卒業なら2026年度扱いが6年生）
 * = 卒業年度の年度は graduationYear - 1
 */
export function calculateGrade(
    graduationYear: number,
    currentDate: Date = new Date()
): number {
    const currentAcademicYear = getCurrentAcademicYear(currentDate);
    // graduationYearが2027の場合、2026年度が6年生、2025年度が5年生...
    // 6 - ( (graduationYear - 1) - currentAcademicYear )
    const grade = 6 - (graduationYear - 1 - currentAcademicYear);
    return grade;
}

/**
 * 現在の学年文字列（"X年生", "未就学児", "OB/OG"）を取得する
 */
export function getGradeLabel(grade: number): string {
    if (grade <= 0) return "未就学児";
    if (grade >= 7) return "OB/OG";
    return `${grade}年生`;
}

/**
 * 学年（1〜6など）から、その学年になる選手が卒業する年度を逆算する
 */
export function calculateGraduationYearFromGrade(
    grade: number,
    currentDate: Date = new Date()
): number {
    const currentAcademicYear = getCurrentAcademicYear(currentDate);
    // 6 - ( (graduationYear - 1) - currentAcademicYear ) = grade
    // 6 - graduationYear + 1 + currentAcademicYear = grade
    // graduationYear = 7 + currentAcademicYear - grade
    return 7 + currentAcademicYear - grade;
}

/**
 * 全選手のうち、特定の学年以下の選手のみをフィルタリングする（OB/OGは除外）
 * @param players 選手リスト
 * @param maxGrade 許容する最大の学年（例: 5年生以下の大会なら5）
 */
export function filterPlayersByMaxGrade(
    players: Player[],
    maxGrade: number,
    currentDate: Date = new Date()
): Player[] {
    return players.filter((p) => {
        const grade = calculateGrade(p.graduationYear, currentDate);
        // 現役（未就学児〜6年生）かつ maxGrade以下
        return grade >= 0 && grade <= maxGrade;
    });
}

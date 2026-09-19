/**
 * 计分与判定 —— 与《中医体质辨识计算表.xlsx》公式一一对应：
 *
 * 八种偏颇体质（Sheet1 I3:I10 与 J3:J10）：
 *   score = SUM(条目原始分)
 *   =IF(score<=8,"否",IF(OR(score=9,score=10),"倾向是","是"))
 *
 * 平和质（Sheet1 I11 与数组公式 J11）：
 *   score = G(1) + (6−G(2)) + (6−G(4)) + (6−G(5)) + (6−G(13))
 *   =IF(AND(score>=17, 其余8种均<8), "是",
 *      IF(AND(score>=17, 其余8种均<10), "基本是", "否"))
 */

import { CONSTITUTIONS, maxScoreOf, type Constitution } from '../data/constitutions'

/** 题目编号 -> 原始得分（1~5），未作答为 null */
export type AnswerMap = Record<number, number | null>

export type Verdict = '是' | '倾向是' | '基本是' | '否'

export interface ConstitutionResult {
  constitution: Constitution
  /** 实际得分（反向计分已换算） */
  score: number
  /** 满分（条目数 × 5） */
  maxScore: number
  verdict: Verdict
}

export interface AssessmentResult {
  results: ConstitutionResult[]
  /** 判定为「是 / 基本是 / 倾向是」的体质，按分数降序 */
  dominant: ConstitutionResult[]
  /** 主要结论的展示文案 */
  headline: string
}

export function scoreOf(c: Constitution, answers: AnswerMap): number {
  return c.items.reduce((sum, item) => {
    const raw = answers[item.q]
    if (raw == null) return sum
    return sum + (item.reversed ? 6 - raw : raw)
  }, 0)
}

function biasedVerdict(score: number): Verdict {
  if (score >= 11) return '是'
  if (score >= 9) return '倾向是'
  return '否'
}

export function evaluate(answers: AnswerMap): AssessmentResult {
  const scores = CONSTITUTIONS.map((c) => ({ c, score: scoreOf(c, answers) }))
  const others = scores.filter((s) => !s.c.isPinghe)

  const results: ConstitutionResult[] = scores.map(({ c, score }) => {
    let verdict: Verdict
    if (c.isPinghe) {
      const maxOther = Math.max(...others.map((o) => o.score))
      if (score >= 17 && maxOther < 8) verdict = '是'
      else if (score >= 17 && maxOther < 10) verdict = '基本是'
      else verdict = '否'
    } else {
      verdict = biasedVerdict(score)
    }
    return { constitution: c, score, maxScore: maxScoreOf(c), verdict }
  })

  const dominant = results
    .filter((r) => r.verdict !== '否')
    .sort((a, b) => b.score - a.score)

  const pingheResult = results.find((r) => r.constitution.isPinghe)!
  let headline: string
  if (pingheResult.verdict === '是') {
    headline = '您的体质为平和质'
  } else if (pingheResult.verdict === '基本是') {
    headline = '您的体质基本是平和质'
  } else if (dominant.length > 0) {
    const names = dominant.map((r) =>
      r.verdict === '倾向是' ? `${r.constitution.name}（倾向）` : r.constitution.name,
    )
    headline = `您的体质倾向为${names.join('、')}`
  } else {
    headline = '您的体质未表现出明显的偏颇倾向'
  }

  return { results, dominant, headline }
}

/** 完整性检查：返回未作答的题目编号列表 */
export function unansweredOf(answers: AnswerMap, total: number): number[] {
  const missing: number[] = []
  for (let q = 1; q <= total; q++) {
    if (answers[q] == null) missing.push(q)
  }
  return missing
}

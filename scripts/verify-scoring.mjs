/**
 * 校验脚本：随机生成 2000 组答卷 + 边界用例，
 * 用独立重写的 Excel 公式逻辑（JS 版）与 src/utils/scoring.ts 的输出逐项比对。
 * 运行：node scripts/verify-scoring.mjs
 */
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const outfile = path.join(root, 'node_modules/.cache/scoring.bundle.mjs')

await build({
  entryPoints: [path.join(root, 'src/utils/scoring.ts')],
  bundle: true,
  format: 'esm',
  outfile,
  logLevel: 'silent',
})

const { evaluate, unansweredOf } = await import(outfile)

// ---- 独立复刻 Excel 公式（作为参照实现）----
const REF_ITEMS = {
  qixu: [2, 3, 4, 14],
  yangxu: [11, 12, 13, 29],
  yinxu: [10, 21, 26, 31],
  tanshi: [9, 16, 28, 32],
  shire: [23, 25, 27, 30],
  xueyu: [19, 22, 24, 33],
  qiyu: [5, 6, 7, 8],
  tebing: [15, 17, 18, 20],
}

function refEvaluate(ans) {
  const s = {}
  for (const [k, items] of Object.entries(REF_ITEMS)) {
    s[k] = items.reduce((a, q) => a + ans[q], 0)
  }
  // 平和质：(1) 正向，(2)(4)(5)(13) 反向
  s.pinghe = ans[1] + (6 - ans[2]) + (6 - ans[4]) + (6 - ans[5]) + (6 - ans[13])
  const otherScores = Object.values(REF_ITEMS).map((items) =>
    items.reduce((a, q) => a + ans[q], 0),
  )
  const ref = {}
  for (const [k, score] of Object.entries(s)) {
    if (k === 'pinghe') {
      ref.pinghe =
        score >= 17 && otherScores.every((v) => v < 8)
          ? '是'
          : score >= 17 && otherScores.every((v) => v < 10)
            ? '基本是'
            : '否'
    } else {
      ref[k] = score <= 8 ? '否' : score === 9 || score === 10 ? '倾向是' : '是'
    }
  }
  return { scores: s, verdicts: ref }
}

function makeAnswers(fill) {
  const ans = {}
  for (let q = 1; q <= 33; q++) ans[q] = fill(q)
  return ans
}

let failures = 0
let checked = 0

function compare(ans, label) {
  checked++
  const ref = refEvaluate(ans)
  const got = evaluate(ans)
  for (const r of got.results) {
    const id = r.constitution.id
    if (r.score !== ref.scores[id] || r.verdict !== ref.verdicts[id]) {
      failures++
      console.error(
        `FAIL [${label}] ${id}: got score=${r.score} verdict=${r.verdict}, ` +
          `ref score=${ref.scores[id]} verdict=${ref.verdicts[id]}`,
        )
    }
  }
}

// 边界用例：全 1、全 5、全 3、倾向边界（构造 9/10/11 分）、平和边界（17 分 + 其他 7/8/9/10 分）
compare(makeAnswers(() => 1), 'all-1')
compare(makeAnswers(() => 5), 'all-5')
compare(makeAnswers(() => 3), 'all-3')

// 气虚恰好 9 分：2+3+4 题给 3，14 题给 0 不行（最小1）→ 2,2,2,3 = 9
{
  const ans = makeAnswers(() => 1)
  ans[2] = 2; ans[3] = 2; ans[4] = 2; ans[14] = 3 // 气虚 = 9 → 倾向是
  compare(ans, 'qixu-9')
}
{
  const ans = makeAnswers(() => 1)
  ans[2] = 3; ans[3] = 3; ans[4] = 3; ans[14] = 2 // 气虚 = 11 → 是
  compare(ans, 'qixu-11')
}
{
  // 平和恰好 17 分，其余全部 < 8 → 是
  const ans = makeAnswers(() => 1)
  ans[1] = 5; ans[2] = 1; ans[4] = 1; ans[5] = 1; ans[13] = 1 // 平和 = 5+5+5+5+5=25
  // 压到 17：让反向题得 3（反向=3），共 4 题 → 5+3*4 = 17
  ans[2] = 3; ans[4] = 3; ans[5] = 3; ans[13] = 3
  compare(ans, 'pinghe-17-low-others')
}
{
  // 平和 17，但气虚 = 8 → 基本是
  const ans = makeAnswers(() => 1)
  ans[1] = 5; ans[2] = 3; ans[4] = 3; ans[5] = 3; ans[13] = 3
  ans[3] = 3; ans[14] = 3 // 气虚 = 3(ans2) + 3 + 3(ans4) + 3 = 12? 注意共享条目
  // 重新算：气虚条目 2,3,4,14 = 3+3+3+3 = 12 → 不是 8。此用例仅验证共享条目下的整体一致性。
  compare(ans, 'pinghe-shared-items')
}

// 随机用例
let seed = 42
const rand = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}
for (let i = 0; i < 2000; i++) {
  compare(makeAnswers(() => 1 + Math.floor(rand() * 5)), `rand-${i}`)
}

// 未作答检查
const partial = makeAnswers(() => null)
partial[1] = 5; partial[33] = 2
const missing = unansweredOf(partial, 33)
if (missing.length !== 31 || missing.includes(1) || missing.includes(33)) {
  failures++
  console.error('FAIL unansweredOf:', missing)
}

console.log(`\n${checked} 组答卷 × 9 种体质校验完成，失败 ${failures} 项`)
process.exit(failures ? 1 : 0)

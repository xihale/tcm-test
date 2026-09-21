# 中医体质辨识测评

依据《中医体质分类与判定》（中华中医药学会标准）实现的 33 题体质辨识单页应用，计分公式与仓库中的 `中医体质辨识计算表.xlsx` 逐项对齐。纯浏览器端运行，没有后端，作答数据只写在本机 localStorage。

在线地址：<https://tcm.xihale.top>

## 计分与判定

- 常规题为五级选项「没有 / 很少 / 有时 / 经常 / 总是」，按 1–5 计分；第 9（BMI）、14（感冒频次）、17（过敏频次）、28（腹围）题采用原表专属选项文案。
- 八种偏颇体质：原始分相加，≥11 判「是」，9～10 判「倾向是」，≤8 判「否」。
- 平和质：第 2、4、5、13 条反向计分（6 − x），总分 ≥17 且其余八种均 <8 判「是」，均 <10 判「基本是」，否则「否」。

`scripts/verify-scoring.mjs` 用 2000+ 组随机答卷比对独立参照实现，保证代码计分与 Excel 公式一致，改计分逻辑后跑一下即可。

## 功能

- 一题一卡翻页作答：方向感知过渡、选中自动前进、键盘 1–5 作答 / ←→ 翻题，第 9 题内置 BMI 计算器。
- 作答与进度实时写入 localStorage，刷新或关闭后从上次作答处继续。
- 体质图鉴：九种体质的总体特征、常见表现与调养建议（情志 / 饮食 / 食疗方 / 起居 / 运动 / 穴位），依据南山区中医药治未病宣传系列《九种体质辨识的健教处方》整理。
- 结果报告：判定结论、九维雷达图（ECharts）、主要体质的常见表现与调养建议、其余体质折叠解读，支持复制摘要 / 打印报告 / 重新测评。

## 本地开发

```bash
npm install
npm run dev                      # 开发
npm run build                    # 类型检查 + 构建到 dist/
npm run preview                  # 预览构建产物
node scripts/verify-scoring.mjs  # 校验计分逻辑与 Excel 公式一致
```

技术栈：Vue 3 + TypeScript + Vite，状态与持久化用 Pinia，弹窗 / 数字输入 / 消息提示用 Naive UI，雷达图为按需加载的 ECharts core。

## 目录结构

```
src/
  data/questions.ts        # 33 道题目与选项（含 4 题专属文案）
  data/constitutions.ts    # 九种体质：条目映射、反向计分、特征与调养文案
  utils/scoring.ts         # 计分与判定（与 Excel 公式一一对应）
  stores/assessment.ts     # Pinia store + localStorage 自动保存 / 恢复
  components/
    IntroScreen.vue        # 首页
    QuizScreen.vue         # 答题页
    ResultScreen.vue       # 结果页
    ConstitutionGuide.vue  # 体质图鉴
    ConstitutionDetail.vue # 体质详情（结果页 / 图鉴共用）
    ScoreRadar.vue         # 九维雷达图
    SealMark.vue           # 朱砂印章
```

## 部署

前端托管在 Cloudflare Pages（Git 集成，push 到 main 自动构建发布）；`tcm.xihale.top` 经 Cloudflare Worker 反代与边缘缓存加速，细节见 [部署与优化说明.md](部署与优化说明.md)。

## 免责声明

测评结果仅供养生参考，不能替代医师诊断。

## 许可证

[MIT](LICENSE)

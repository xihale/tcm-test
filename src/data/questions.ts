/**
 * 题目数据 —— 严格取自《中医体质辨识计算表.xlsx》Sheet1 的 33 个条目。
 * 每题 5 级计分（1~5）。默认选项语义为「没有 / 很少 / 有时 / 经常 / 总是」，
 * 第 9、14、17、28 题在原始表格中使用专属选项文案，在此以 options 覆盖。
 */

export interface QuestionOption {
  value: 1 | 2 | 3 | 4 | 5
  label: string
  sub?: string
}

export interface Question {
  id: number
  text: string
  hint?: string
  /** 缺省使用 DEFAULT_OPTIONS */
  options?: QuestionOption[]
}

export const DEFAULT_OPTIONS: QuestionOption[] = [
  { value: 1, label: '没有', sub: '根本没有' },
  { value: 2, label: '很少', sub: '轻微，偶尔出现' },
  { value: 3, label: '有时', sub: '有一些，时有出现' },
  { value: 4, label: '经常', sub: '比较明显，频繁出现' },
  { value: 5, label: '总是', sub: '非常严重，几乎一直如此' },
]

export const QUESTIONS: Question[] = [
  { id: 1, text: '您精力充沛吗？', hint: '指精神头足，乐于做事' },
  { id: 2, text: '您容易疲乏吗？', hint: '指体力如何，是否稍微活动一下或做一点家务劳动就感到累' },
  { id: 3, text: '您容易气短，呼吸短促，接不上气吗？' },
  { id: 4, text: '您说话声音低弱无力吗？', hint: '指说话没有力气' },
  { id: 5, text: '您感到闷闷不乐、情绪低沉吗？', hint: '指心情不愉快，情绪低落' },
  { id: 6, text: '您容易精神紧张、焦虑不安吗？', hint: '指遇事是否心情紧张' },
  { id: 7, text: '您因为生活状态改变而感到孤独、失落吗？' },
  { id: 8, text: '您容易感到害怕或受到惊吓吗？' },
  {
    id: 9,
    text: '您感到身体超重不轻松吗？',
    hint: '感觉身体沉重。BMI 指数 = 体重（kg）÷ 身高²（m²）',
    options: [
      { value: 1, label: '没有', sub: 'BMI < 24' },
      { value: 2, label: '很少', sub: '24 ≤ BMI < 25' },
      { value: 3, label: '有时', sub: '25 ≤ BMI < 26' },
      { value: 4, label: '经常', sub: '26 ≤ BMI < 28' },
      { value: 5, label: '总是', sub: 'BMI ≥ 28' },
    ],
  },
  { id: 10, text: '您眼睛干涩吗？' },
  { id: 11, text: '您手脚发凉吗？', hint: '不包含因周围温度低或穿的少导致的手脚发冷' },
  { id: 12, text: '您胃脘部、背部或腰膝部怕冷吗？', hint: '指上腹部、背部、腰部或膝关节等，有一处或多处怕冷' },
  { id: 13, text: '您比一般人耐受不了寒冷吗？', hint: '指比别人容易害怕冬天或是夏天的冷空调、电扇等' },
  {
    id: 14,
    text: '您容易患感冒吗？',
    hint: '指每年感冒的次数',
    options: [
      { value: 1, label: '没有', sub: '一年 < 2 次' },
      { value: 2, label: '很少', sub: '一年感冒 2-4 次' },
      { value: 3, label: '有时', sub: '一年感冒 5-6 次' },
      { value: 4, label: '经常', sub: '一年 8 次以上' },
      { value: 5, label: '总是', sub: '几乎每月都感冒' },
    ],
  },
  { id: 15, text: '您没有感冒时也会鼻塞、流鼻涕吗？' },
  { id: 16, text: '您有口粘口腻，或睡眠打鼾吗？' },
  {
    id: 17,
    text: '您容易过敏吗？',
    hint: '对药物、食物、气味、花粉或在季节交替、气候变化时',
    options: [
      { value: 1, label: '没有', sub: '从来没有' },
      { value: 2, label: '很少', sub: '一年 1、2 次' },
      { value: 3, label: '有时', sub: '一年 3、4 次' },
      { value: 4, label: '经常', sub: '一年 5、6 次' },
      { value: 5, label: '总是', sub: '每次遇到上述原因都过敏' },
    ],
  },
  { id: 18, text: '您的皮肤容易起荨麻疹吗？', hint: '包括风团、风疹块、风疙瘩' },
  { id: 19, text: '您的皮肤在不知不觉中会出现青紫瘀斑、皮下出血吗？', hint: '指皮肤在没有外伤的情况下出现青一块紫一块的情况' },
  { id: 20, text: '您的皮肤一抓就红，并出现抓痕吗？', hint: '指被指甲或钝物划过后皮肤的反应' },
  { id: 21, text: '您皮肤或口唇干吗？' },
  { id: 22, text: '您有肢体麻木或固定部位疼痛的感觉吗？' },
  { id: 23, text: '您面部或鼻部有油腻感或者油亮发光吗？', hint: '指脸上或鼻子' },
  { id: 24, text: '您面色或目眶晦黯，或出现褐色斑块 / 斑点吗？' },
  { id: 25, text: '您有皮肤湿疹、疮疖吗？' },
  { id: 26, text: '您感到口干咽燥、总想喝水吗？' },
  { id: 27, text: '您感到口苦或嘴里有异味吗？', hint: '指口苦或口臭' },
  {
    id: 28,
    text: '您腹部肥大吗？',
    hint: '指腹部脂肪肥厚，按腹围判断',
    options: [
      { value: 1, label: '没有', sub: '腹围 < 80cm（2.4 尺以下）' },
      { value: 2, label: '很少', sub: '腹围 80-85cm（2.4-2.55 尺）' },
      { value: 3, label: '有时', sub: '腹围 86-90cm（2.56-2.7 尺）' },
      { value: 4, label: '经常', sub: '腹围 91-105cm（2.71-3.15 尺）' },
      { value: 5, label: '总是', sub: '腹围 > 105cm（3.15 尺以上）' },
    ],
  },
  { id: 29, text: '您吃（喝）凉的东西会感到不舒服或者怕吃（喝）凉的东西吗？', hint: '指不喜欢吃凉的食物，或吃了凉的食物后会不舒服' },
  { id: 30, text: '您有大便黏滞不爽、解不尽的感觉吗？', hint: '大便容易粘在马桶或便坑壁上' },
  { id: 31, text: '您容易大便干燥吗？' },
  { id: 32, text: '您舌苔厚腻或有舌苔厚厚的感觉吗？', hint: '如果自我感觉不清楚，可由他人观察后填写' },
  { id: 33, text: '您舌下静脉瘀紫或增粗吗？', hint: '可由他人辅助观察后填写' },
]

export const TOTAL_QUESTIONS = QUESTIONS.length

export function optionsOf(q: Question): QuestionOption[] {
  return q.options ?? DEFAULT_OPTIONS
}

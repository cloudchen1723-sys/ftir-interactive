/** Production reconstruction, batch 01–05 only. Original 10-act timing is preserved in legacyFilmTimeline.ts. */
export interface ActDefinition { id: string; actNumber: number; titleEn: string; titleZh: string; startFrame: number; endFrame: number; durationFrames: number; descriptionZh: string; descriptionEn: string; }
export interface SubtitleCue { startFrame: number; endFrame: number; zh: string; en: string; emphasis?: boolean; }
export const FILM_CONFIG = {fps:30,width:1920,height:1080,totalFrames:5130} as const;
export const ACTS: ActDefinition[] = [
  {
    "id": "section01",
    "actNumber": 1,
    "titleEn": "Reading molecular motion",
    "titleZh": "Section 01 · 从分子振动到测量问题",
    "startFrame": 0,
    "endFrame": 900,
    "durationFrames": 900,
    "descriptionZh": "分子运动 → 红外耦合 → 线索 → FTIR → 混合总信号",
    "descriptionEn": "Reading molecular motion"
  },
  {
    "id": "section02",
    "actNumber": 2,
    "titleEn": "One reading, two compositions",
    "titleZh": "Section 02 · 固定读数的歧义",
    "startFrame": 900,
    "endFrame": 1650,
    "durationFrames": 750,
    "descriptionZh": "同一状态、同一尺度，组成变化但总读数相同",
    "descriptionEn": "One reading, two compositions"
  },
  {
    "id": "section03",
    "actNumber": 3,
    "titleEn": "A controlled sequence of readings",
    "titleZh": "Section 03 · 从一个值到连续测量",
    "startFrame": 1650,
    "endFrame": 2010,
    "durationFrames": 360,
    "descriptionZh": "保留探测点，展开尚未写入的记录空间",
    "descriptionEn": "A controlled sequence of readings"
  },
  {
    "id": "section04",
    "actNumber": 4,
    "titleEn": "Michelson makes the variation",
    "titleZh": "Section 04 · 让变化发生",
    "startFrame": 2010,
    "endFrame": 3630,
    "durationFrames": 1620,
    "descriptionZh": "分路返回 → 镜位移 → 往返两段路程 → 对齐 → 强度",
    "descriptionEn": "Michelson makes the variation"
  },
  {
    "id": "section05",
    "actNumber": 5,
    "titleEn": "Different rhythms, different records",
    "titleZh": "Section 05 · 不同节奏成为测量信息",
    "startFrame": 3630,
    "endFrame": 5130,
    "durationFrames": 1500,
    "descriptionZh": "同一扫描的一轮/三轮 → 同起点的总记录分开",
    "descriptionEn": "Different rhythms, different records"
  }
];
export const SUBTITLE_CUES: SubtitleCue[] = [
  {
    "startFrame": 24,
    "endFrame": 120,
    "zh": "我们怎样读懂一个分子？",
    "en": ""
  },
  {
    "startFrame": 135,
    "endFrame": 255,
    "zh": "分子并不是静止的。",
    "en": ""
  },
  {
    "startFrame": 285,
    "endFrame": 435,
    "zh": "某些振动，会和红外光发生耦合。",
    "en": ""
  },
  {
    "startFrame": 465,
    "endFrame": 594,
    "zh": "这意味着，分子会在红外光里留下自己的线索。",
    "en": ""
  },
  {
    "startFrame": 840,
    "endFrame": 900,
    "zh": "怎样读出这些线索？",
    "en": ""
  },
  {
    "startFrame": 900,
    "endFrame": 1005,
    "zh": "不同振动，会吸收不同频率的红外光。",
    "en": "Different vibrations absorb infrared light at different frequencies."
  },
  {
    "startFrame": 1005,
    "endFrame": 1110,
    "zh": "剩余光的强弱，留下了样品的线索。",
    "en": "The remaining component strengths carry clues about the sample."
  },
  {
    "startFrame": 1110,
    "endFrame": 1185,
    "zh": "探测器却只给出一个总响应。",
    "en": "Yet the detector gives just one total response."
  },
  {
    "startFrame": 1320,
    "endFrame": 1410,
    "zh": "换个样品，吸收分布变了。",
    "en": "Change the sample, and the absorption pattern changes."
  },
  {
    "startFrame": 1410,
    "endFrame": 1545,
    "zh": "剩余光的总量，却可以相同。",
    "en": "The total amount of remaining light can still be the same."
  },
  {
    "startFrame": 1545,
    "endFrame": 1650,
    "zh": "只读总量，我们仍不知道哪些成分被吸收。",
    "en": "The total alone cannot tell us which components were absorbed."
  },
  {
    "startFrame": 1650,
    "endFrame": 1740,
    "zh": "如果不只读一个值呢？",
    "en": ""
  },
  {
    "startFrame": 1740,
    "endFrame": 1830,
    "zh": "我们主动改变测量条件，",
    "en": ""
  },
  {
    "startFrame": 1830,
    "endFrame": 1935,
    "zh": "看看这个总响应会怎样变化。",
    "en": ""
  },
  {
    "startFrame": 2010,
    "endFrame": 2160,
    "zh": "让光分成两路，分别反射回来，再次相遇。",
    "en": ""
  },
  {
    "startFrame": 2220,
    "endFrame": 2325,
    "zh": "两路都带着原来的宽带成分。",
    "en": ""
  },
  {
    "startFrame": 2325,
    "endFrame": 2430,
    "zh": "这套装置叫迈克尔逊干涉仪。",
    "en": ""
  },
  {
    "startFrame": 2430,
    "endFrame": 2520,
    "zh": "现在，让其中一面镜子移动。",
    "en": ""
  },
  {
    "startFrame": 2640,
    "endFrame": 2760,
    "zh": "镜子移动一段，光要多走一个来回。",
    "en": ""
  },
  {
    "startFrame": 2760,
    "endFrame": 2880,
    "zh": "多出来的路程，是镜子位移的两倍。",
    "en": ""
  },
  {
    "startFrame": 2880,
    "endFrame": 3000,
    "zh": "两路光的路程差，叫作光程差。",
    "en": ""
  },
  {
    "startFrame": 3000,
    "endFrame": 3120,
    "zh": "再相遇时，光波的对齐关系也变了。",
    "en": ""
  },
  {
    "startFrame": 3240,
    "endFrame": 3375,
    "zh": "对齐时相互增强，错开时可以相互抵消。",
    "en": ""
  },
  {
    "startFrame": 3375,
    "endFrame": 3480,
    "zh": "这种相对错开，叫作相位差。",
    "en": ""
  },
  {
    "startFrame": 3480,
    "endFrame": 3570,
    "zh": "镜子不停地移动，输出光强也跟着变化。",
    "en": ""
  },
  {
    "startFrame": 3630,
    "endFrame": 3750,
    "zh": "不同波数的成分，变化也一样吗？",
    "en": ""
  },
  {
    "startFrame": 3750,
    "endFrame": 3840,
    "zh": "让镜子以同样的方式继续移动。",
    "en": ""
  },
  {
    "startFrame": 4020,
    "endFrame": 4110,
    "zh": "一个已经亮暗了三轮，另一个才一轮。",
    "en": ""
  },
  {
    "startFrame": 4110,
    "endFrame": 4200,
    "zh": "同一次扫描，不同波数留下了不同的节奏。",
    "en": ""
  },
  {
    "startFrame": 4200,
    "endFrame": 4320,
    "zh": "镜子改变的是光程差，成分的波数始终没变。",
    "en": ""
  },
  {
    "startFrame": 4320,
    "endFrame": 4440,
    "zh": "用同样的扫描，再比较刚才的两个样品。",
    "en": "Use the same scan to compare the two samples again."
  },
  {
    "startFrame": 4800,
    "endFrame": 4920,
    "zh": "刚才读数相同，现在的扫描记录却不同。",
    "en": "The samples gave the same single reading, but their scan records differ."
  },
  {
    "startFrame": 5010,
    "endFrame": 5130,
    "zh": "多种节奏叠在一起，仍然影响着总信号的形状。",
    "en": ""
  }
];

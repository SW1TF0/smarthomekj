// Floor plans for the live demo, drawn on a 1000 × 640 canvas.

export type RoomId = "living" | "kitchen" | "bedroom" | "kids" | "bath" | "hall" | "office" | "garage" | "yard";
export type Pt = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };
export type SensorKind = "leak" | "motion" | "window" | "smoke";
export type Shape = ({ t: "rect"; r?: number } & Box) | { t: "circle"; x: number; y: number; r: number } | { t: "ellipse"; x: number; y: number; rx: number; ry: number };

export type RoomDef = {
  id: RoomId;
  box: Box;
  outdoor?: boolean;
  /** Light power at 100%, for the power meter. */
  watts: number;
  heat?: boolean;
  blinds?: boolean;
  speaker?: Pt;
  /** Camera position and the direction it looks, in degrees (0 = right, 90 = down). */
  cams?: { at: Pt; angle: number }[];
  sensors?: { kind: SensorKind; at: Pt }[];
  furniture: Shape[];
};

export type Window = { room: RoomId; x1: number; y1: number; x2: number; y2: number };

export type Plan = {
  id: "apartment" | "house";
  /** Outer walls. */
  shells: Box[];
  rooms: RoomDef[];
  windows: Window[];
  /** Openings cut into the inner walls. */
  doors: Box[];
  entrance: Box;
  lock: Pt;
  doorbell: Pt;
  /** Garden drawn behind the house. */
  garden?: { trees: { x: number; y: number; r: number }[]; path: Box };
  /** Rooms counted by the calculator (living, bedrooms, kitchen, study). */
  calcRooms: number;
};

export const W = 1000;
export const H = 640;

export const apartment: Plan = {
  id: "apartment",
  shells: [{ x: 40, y: 40, w: 920, h: 560 }],
  rooms: [
    {
      id: "living",
      box: { x: 40, y: 40, w: 360, h: 320 },
      watts: 40,
      heat: true,
      blinds: true,
      speaker: { x: 72, y: 72 },
      sensors: [{ kind: "motion", at: { x: 372, y: 68 } }],
      furniture: [
        { t: "rect", x: 74, y: 270, w: 250, h: 62, r: 18 },
        { t: "rect", x: 140, y: 182, w: 116, h: 52, r: 14 },
        { t: "rect", x: 300, y: 120, w: 60, h: 60, r: 16 },
      ],
    },
    {
      id: "kitchen",
      box: { x: 400, y: 40, w: 180, h: 220 },
      watts: 25,
      heat: true,
      blinds: true,
      sensors: [
        { kind: "smoke", at: { x: 430, y: 150 } },
        { kind: "leak", at: { x: 560, y: 238 } },
      ],
      furniture: [
        { t: "rect", x: 412, y: 52, w: 156, h: 34, r: 6 },
        { t: "rect", x: 534, y: 52, w: 34, h: 120, r: 6 },
        { t: "circle", x: 480, y: 190, r: 26 },
      ],
    },
    {
      id: "hall",
      box: { x: 400, y: 260, w: 180, h: 340 },
      watts: 15,
      cams: [{ at: { x: 562, y: 280 }, angle: 105 }],
      sensors: [{ kind: "motion", at: { x: 420, y: 282 } }],
      furniture: [{ t: "rect", x: 414, y: 524, w: 28, h: 62, r: 4 }],
    },
    {
      id: "bedroom",
      box: { x: 580, y: 40, w: 380, h: 360 },
      watts: 25,
      heat: true,
      blinds: true,
      sensors: [{ kind: "window", at: { x: 940, y: 220 } }],
      furniture: [
        { t: "rect", x: 700, y: 112, w: 180, h: 214, r: 18 },
        { t: "rect", x: 714, y: 124, w: 72, h: 32, r: 10 },
        { t: "rect", x: 794, y: 124, w: 72, h: 32, r: 10 },
        { t: "rect", x: 666, y: 120, w: 26, h: 26, r: 7 },
        { t: "rect", x: 888, y: 120, w: 26, h: 26, r: 7 },
        { t: "rect", x: 594, y: 60, w: 34, h: 170, r: 4 },
      ],
    },
    {
      id: "kids",
      box: { x: 40, y: 360, w: 360, h: 240 },
      watts: 20,
      heat: true,
      blinds: true,
      furniture: [
        { t: "rect", x: 66, y: 476, w: 184, h: 100, r: 14 },
        { t: "rect", x: 76, y: 486, w: 36, h: 80, r: 9 },
        { t: "rect", x: 286, y: 376, w: 98, h: 44, r: 6 },
        { t: "circle", x: 334, y: 446, r: 15 },
      ],
    },
    {
      id: "bath",
      box: { x: 580, y: 400, w: 380, h: 200 },
      watts: 15,
      heat: true,
      sensors: [{ kind: "leak", at: { x: 935, y: 578 } }],
      furniture: [
        { t: "rect", x: 600, y: 508, w: 184, h: 76, r: 34 },
        { t: "rect", x: 832, y: 414, w: 76, h: 42, r: 13 },
        { t: "ellipse", x: 926, y: 500, rx: 17, ry: 23 },
      ],
    },
  ],
  windows: [
    { room: "living", x1: 100, y1: 40, x2: 340, y2: 40 },
    { room: "living", x1: 40, y1: 110, x2: 40, y2: 290 },
    { room: "kitchen", x1: 440, y1: 40, x2: 520, y2: 40 },
    { room: "bedroom", x1: 640, y1: 40, x2: 900, y2: 40 },
    { room: "bedroom", x1: 960, y1: 120, x2: 960, y2: 320 },
    { room: "kids", x1: 40, y1: 410, x2: 40, y2: 550 },
    { room: "kids", x1: 120, y1: 600, x2: 320, y2: 600 },
    { room: "bath", x1: 960, y1: 450, x2: 960, y2: 540 },
  ],
  doors: [
    { x: 395, y: 100, w: 10, h: 110 },
    { x: 395, y: 292, w: 10, h: 58 },
    { x: 395, y: 440, w: 10, h: 58 },
    { x: 575, y: 300, w: 10, h: 58 },
    { x: 575, y: 470, w: 10, h: 58 },
  ],
  entrance: { x: 455, y: 592, w: 70, h: 16 },
  lock: { x: 490, y: 600 },
  doorbell: { x: 548, y: 622 },
  calcRooms: 4,
};

export const house: Plan = {
  id: "house",
  shells: [
    { x: 60, y: 60, w: 700, h: 440 },
    { x: 760, y: 60, w: 180, h: 240 },
  ],
  rooms: [
    {
      id: "living",
      box: { x: 60, y: 60, w: 300, h: 240 },
      watts: 40,
      heat: true,
      blinds: true,
      speaker: { x: 90, y: 90 },
      sensors: [{ kind: "motion", at: { x: 336, y: 86 } }],
      furniture: [
        { t: "rect", x: 92, y: 220, w: 210, h: 56, r: 16 },
        { t: "rect", x: 142, y: 146, w: 100, h: 46, r: 12 },
        { t: "rect", x: 286, y: 118, w: 50, h: 50, r: 14 },
      ],
    },
    {
      id: "kitchen",
      box: { x: 360, y: 60, w: 180, h: 240 },
      watts: 25,
      heat: true,
      blinds: true,
      sensors: [
        { kind: "smoke", at: { x: 380, y: 230 } },
        { kind: "leak", at: { x: 520, y: 280 } },
      ],
      furniture: [
        { t: "rect", x: 372, y: 72, w: 156, h: 32, r: 6 },
        { t: "rect", x: 400, y: 160, w: 100, h: 46, r: 10 },
      ],
    },
    {
      id: "bedroom",
      box: { x: 540, y: 60, w: 220, h: 240 },
      watts: 25,
      heat: true,
      blinds: true,
      sensors: [{ kind: "window", at: { x: 650, y: 82 } }],
      furniture: [
        { t: "rect", x: 590, y: 104, w: 140, h: 164, r: 16 },
        { t: "rect", x: 600, y: 114, w: 56, h: 26, r: 8 },
        { t: "rect", x: 664, y: 114, w: 56, h: 26, r: 8 },
        { t: "rect", x: 558, y: 110, w: 22, h: 22, r: 6 },
      ],
    },
    {
      id: "office",
      box: { x: 60, y: 300, w: 180, h: 200 },
      watts: 20,
      heat: true,
      blinds: true,
      furniture: [
        { t: "rect", x: 86, y: 318, w: 124, h: 40, r: 6 },
        { t: "circle", x: 148, y: 386, r: 16 },
      ],
    },
    {
      id: "kids",
      box: { x: 240, y: 300, w: 180, h: 200 },
      watts: 20,
      heat: true,
      blinds: true,
      furniture: [
        { t: "rect", x: 258, y: 360, w: 82, h: 124, r: 12 },
        { t: "rect", x: 266, y: 368, w: 66, h: 22, r: 8 },
        { t: "rect", x: 354, y: 316, w: 52, h: 36, r: 6 },
      ],
    },
    {
      id: "hall",
      box: { x: 420, y: 300, w: 180, h: 200 },
      watts: 15,
      sensors: [{ kind: "motion", at: { x: 440, y: 322 } }],
      cams: [{ at: { x: 582, y: 322 }, angle: 125 }],
      furniture: [{ t: "rect", x: 566, y: 448, w: 24, h: 44, r: 4 }],
    },
    {
      id: "bath",
      box: { x: 600, y: 300, w: 160, h: 200 },
      watts: 15,
      heat: true,
      sensors: [{ kind: "leak", at: { x: 740, y: 480 } }],
      furniture: [
        { t: "rect", x: 618, y: 318, w: 124, h: 56, r: 26 },
        { t: "rect", x: 620, y: 442, w: 52, h: 36, r: 10 },
        { t: "ellipse", x: 722, y: 448, rx: 15, ry: 20 },
      ],
    },
    {
      id: "garage",
      box: { x: 760, y: 60, w: 180, h: 240 },
      watts: 30,
      cams: [{ at: { x: 928, y: 292 }, angle: 100 }],
      furniture: [
        { t: "rect", x: 806, y: 86, w: 90, h: 176, r: 28 },
        { t: "rect", x: 818, y: 124, w: 66, h: 30, r: 8 },
      ],
    },
    {
      id: "yard",
      box: { x: 20, y: 512, w: 960, h: 112 },
      outdoor: true,
      watts: 60,
      cams: [
        { at: { x: 70, y: 496 }, angle: 60 },
        { at: { x: 750, y: 496 }, angle: 105 },
      ],
      furniture: [],
    },
  ],
  windows: [
    { room: "living", x1: 100, y1: 60, x2: 320, y2: 60 },
    { room: "living", x1: 60, y1: 110, x2: 60, y2: 260 },
    { room: "kitchen", x1: 400, y1: 60, x2: 500, y2: 60 },
    { room: "bedroom", x1: 580, y1: 60, x2: 720, y2: 60 },
    { room: "office", x1: 60, y1: 340, x2: 60, y2: 460 },
    { room: "office", x1: 90, y1: 500, x2: 210, y2: 500 },
    { room: "kids", x1: 270, y1: 500, x2: 390, y2: 500 },
    { room: "bath", x1: 640, y1: 500, x2: 720, y2: 500 },
  ],
  doors: [
    { x: 355, y: 120, w: 10, h: 100 },
    { x: 110, y: 295, w: 60, h: 10 },
    { x: 440, y: 295, w: 80, h: 10 },
    { x: 548, y: 295, w: 46, h: 10 },
    { x: 415, y: 380, w: 10, h: 58 },
    { x: 595, y: 380, w: 10, h: 58 },
    { x: 785, y: 294, w: 130, h: 12 },
  ],
  entrance: { x: 476, y: 492, w: 68, h: 16 },
  lock: { x: 510, y: 500 },
  doorbell: { x: 566, y: 524 },
  garden: {
    trees: [
      { x: 880, y: 400, r: 34 },
      { x: 950, y: 470, r: 22 },
      { x: 120, y: 580, r: 26 },
      { x: 860, y: 588, r: 24 },
    ],
    path: { x: 482, y: 500, w: 56, h: 140 },
  },
  calcRooms: 5,
};

export const plans = { apartment, house };

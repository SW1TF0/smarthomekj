"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { BellIcon, CheckIcon, DropIcon, MotionIcon, PauseIcon, PlayIcon, SpeakerIcon, UnlockIcon, WindowIcon } from "../icons";

// The demo is the Canva design itself (public/demo/*.webp). The words and everything that changes are drawn
// on top of it as real text, positioned in the pixels of the 2x Canva export, so they line up 1:1 and stay sharp.

type Labels = Dictionary["demo"];
type RoomId = "living" | "kitchen" | "bedroom" | "kids" | "bath" | "hall";
type RoomState = { light: boolean; level: number; blinds: number; heat: boolean; target: number; music: boolean; playing: boolean; volume: number };
type Alarm = "off" | "home" | "away";
type HomeState = {
  rooms: Record<RoomId, RoomState>;
  locked: boolean;
  alarm: Alarm;
  alerts: { leak: boolean; window: boolean; motion: boolean };
  ringing: boolean;
};
type SceneId = keyof Labels["scenes"];
type EventId = keyof Labels["events"];
type Toast = {
  id: number;
  title: string;
  text: string;
  icon: React.ReactNode;
  alert?: boolean;
  actions: { label: string; primary?: boolean; run: () => void }[];
};

type Size = { w: number; h: number };
type Rect = [x0: number, y0: number, x1: number, y1: number];

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const STAGE: Size = { w: 3111, h: 1206 };
const SCENES: Size = { w: 1591, h: 324 };
const EVENTS: Size = { w: 1477, h: 324 };
const STEP_MS = 380;
/** Room temperature when its heating is off. */
const AMBIENT = 19;
const BLUE = "#2886fc";

/** Position helpers in the pixels of one image. */
function units(s: Size) {
  const x = (n: number) => `${(n / s.w) * 100}%`;
  const y = (n: number) => `${(n / s.h) * 100}%`;
  const u = (n: number) => `${((n / s.w) * 100).toFixed(4)}cqw`;
  const box = ([x0, y0, x1, y1]: Rect): React.CSSProperties => ({ left: x(x0), top: y(y0), width: x(x1 - x0), height: y(y1 - y0) });
  return { x, y, u, box };
}
const S = units(STAGE);

const ROOMS: { id: RoomId; main: Rect; extra?: Rect[]; pill: { x: number; y: number; w: number }; speaker: { x: number; y: number } }[] = [
  { id: "living", main: [204, 184, 951, 687], pill: { x: 508, y: 435, w: 126 }, speaker: { x: 880, y: 255 } },
  { id: "kitchen", main: [980, 184, 1507, 587], pill: { x: 1219, y: 436, w: 172 }, speaker: { x: 1050, y: 520 } },
  { id: "bedroom", main: [1540, 184, 2164, 687], pill: { x: 1879, y: 441, w: 200 }, speaker: { x: 1650, y: 600 } },
  { id: "kids", main: [204, 707, 807, 1080], pill: { x: 539, y: 897, w: 190 }, speaker: { x: 735, y: 1010 } },
  { id: "bath", main: [980, 753, 1400, 1080], pill: { x: 1178, y: 896, w: 144 }, speaker: { x: 1330, y: 1010 } },
  {
    id: "hall",
    main: [1400, 687, 2164, 1080],
    extra: [
      [953, 593, 1540, 753],
      [807, 687, 980, 1080],
    ],
    pill: { x: 1641, y: 897, w: 218 },
    speaker: { x: 2095, y: 1010 },
  },
];

/** Which part of the stage each layout shows. */
const CROP: Record<"full" | "plan" | "phone", Rect> = { full: [0, 0, 3111, 1206], plan: [150, 130, 2215, 1135], phone: [2310, 20, 3090, 1190] };

const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));

function initialState(): HomeState {
  const rooms = {} as HomeState["rooms"];
  for (const r of ROOMS) {
    rooms[r.id] = { light: true, level: 70, blinds: 100, heat: true, target: r.id === "bath" ? 23 : 21.5, music: r.id === "living", playing: false, volume: 75 };
  }
  return { rooms, locked: true, alarm: "off", alerts: { leak: false, window: false, motion: false }, ringing: false };
}

function patchRooms(s: HomeState, pick: (id: RoomId) => boolean, patch: Partial<RoomState>): HomeState {
  const rooms = { ...s.rooms };
  for (const r of ROOMS) if (pick(r.id)) rooms[r.id] = { ...rooms[r.id], ...patch };
  return { ...s, rooms };
}

export function SmartHomeDemo({ locale, t }: { locale: Locale; t: Labels }) {
  const [state, setState] = useState<HomeState>(initialState);
  const [selected, setSelected] = useState<RoomId>("living");
  const [scene, setScene] = useState<{ id: SceneId; run: number; done: number; steps: string[] } | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [track, setTrack] = useState(0);
  const [moving, setMoving] = useState<{ id: RoomId; dir: 1 | -1 } | null>(null);
  const timers = useRef<number[]>([]);
  const planScroller = useRef<HTMLDivElement>(null);
  const blindsTimer = useRef<number | null>(null);

  const stopBlinds = () => {
    if (blindsTimer.current !== null) window.clearInterval(blindsTimer.current);
    blindsTimer.current = null;
    setMoving(null);
  };
  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    stopBlinds();
  };
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => clearTimers, []);

  // Blinds move a step at a time, like the real motor, and stop at the end.
  function moveBlinds(id: RoomId, dir: 1 | -1) {
    stopBlinds();
    setMoving({ id, dir });
    blindsTimer.current = window.setInterval(() => {
      setState((s) => ({ ...s, rooms: { ...s.rooms, [id]: { ...s.rooms[id], blinds: Math.min(100, Math.max(0, s.rooms[id].blinds + dir * 5)) } } }));
    }, 90);
  }
  useEffect(() => {
    if (!moving) return;
    const b = state.rooms[moving.id].blinds;
    if (moving.dir > 0 ? b >= 100 : b <= 0) stopBlinds();
  }, [state, moving]);

  // On phones the plan is wider than the screen: keep the chosen room in view.
  useEffect(() => {
    const el = planScroller.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const r = ROOMS.find((x) => x.id === selected)!;
    const [x0, , x1] = CROP.plan;
    const centre = ((r.main[0] + r.main[2]) / 2 - x0) / (x1 - x0);
    el.scrollTo({ left: centre * el.scrollWidth - el.clientWidth / 2, behavior: "smooth" });
  }, [selected]);

  const temp = useMemo(() => new Intl.NumberFormat({ bg: "bg-BG", en: "en-IE", tr: "tr-TR" }[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 }), [locale]);
  const deg = useCallback((n: number) => `${temp.format(n)}°`, [temp]);
  const roomName = (id: RoomId) => t.rooms[id];

  const rs = state.rooms[selected];
  const setRoom = (id: RoomId, patch: Partial<RoomState>) => setState((s) => ({ ...s, rooms: { ...s.rooms, [id]: { ...s.rooms[id], ...patch } } }));

  // ---------- Scenes ----------

  function sceneSteps(id: SceneId): { text: string; run: (s: HomeState) => HomeState }[] {
    const st = t.steps;
    const light = (r: RoomId, n: number) => ({ text: fill(st.light, { room: roomName(r), n }), run: (s: HomeState) => patchRooms(s, (x) => x === r, { light: true, level: n }) });
    const heatAll = (n: number) => ({ text: fill(st.heatAll, { t: deg(n) }), run: (s: HomeState) => patchRooms(s, () => true, { heat: true, target: n }) });
    const allOff = { text: st.lightsOff, run: (s: HomeState) => patchRooms(s, () => true, { light: false }) };
    const musicOff = { text: st.musicOff, run: (s: HomeState) => patchRooms(s, () => true, { playing: false }) };
    const lock = { text: st.lock, run: (s: HomeState) => ({ ...s, locked: true }) };
    const blinds = (n: number) => (s: HomeState) => patchRooms(s, (x) => x !== "bath" && x !== "hall", { blinds: n });

    switch (id) {
      case "morning":
        return [
          { text: st.blindsOpen, run: blinds(100) },
          { text: fill(st.heatRoom, { room: roomName("bath"), t: deg(24) }), run: (s) => patchRooms(s, (x) => x === "bath", { heat: true, target: 24 }) },
          light("kitchen", 90),
          { text: st.alarmOff, run: (s) => ({ ...s, alarm: "off" }) },
        ];
      case "away":
        return [allOff, musicOff, heatAll(18), lock, { text: st.alarmAway, run: (s) => ({ ...s, alarm: "away" }) }];
      case "evening":
        return [
          { text: st.blindsClose, run: blinds(0) },
          light("living", 70),
          light("kitchen", 50),
          light("hall", 20),
          heatAll(21.5),
          { text: st.alarmOff, run: (s) => ({ ...s, alarm: "off" }) },
        ];
      case "movie":
        return [
          { text: fill(st.blindsRoom, { room: roomName("living") }), run: (s) => patchRooms(s, (x) => x === "living", { blinds: 0 }) },
          { text: st.othersOff, run: (s) => patchRooms(s, (x) => x !== "living", { light: false }) },
          light("living", 10),
          { text: fill(st.musicOn, { room: roomName("living") }), run: (s) => patchRooms(s, (x) => x === "living", { music: true, playing: true, volume: 60 }) },
        ];
      case "night":
        return [allOff, light("hall", 5), { text: st.blindsClose, run: blinds(0) }, musicOff, heatAll(19), lock, { text: st.alarmHome, run: (s) => ({ ...s, alarm: "home" }) }];
    }
  }

  function runScene(id: SceneId) {
    clearTimers();
    setToast(null);
    setState((s) => ({ ...s, alerts: { leak: false, window: false, motion: false }, ringing: false }));
    const steps = sceneSteps(id);
    const run = Date.now();
    setScene({ id, run, done: 0, steps: steps.map((s) => s.text) });
    steps.forEach((step, i) =>
      later(i * STEP_MS, () => {
        setState(step.run);
        setScene((sc) => (sc && sc.run === run ? { ...sc, done: i + 1 } : sc));
      }),
    );
    later(steps.length * STEP_MS + 2600, () => setScene((sc) => (sc && sc.run === run ? null : sc)));
  }

  // ---------- Events ----------

  function show(toastData: Omit<Toast, "id">, autoCloseMs?: number) {
    const id = Date.now();
    setScene(null);
    setToast({ ...toastData, id });
    if (autoCloseMs) later(autoCloseMs, () => setToast((cur) => (cur && cur.id === id ? null : cur)));
  }

  function trigger(id: EventId) {
    clearTimers();
    const n = t.notify;
    const close = () => setToast(null);
    if (id === "doorbell") {
      setSelected("hall");
      setState((s) => ({ ...s, ringing: true }));
      later(6000, () => setState((s) => ({ ...s, ringing: false })));
      show({
        title: n.doorbellTitle,
        text: n.doorbellText,
        icon: <BellIcon size={18} />,
        actions: [
          {
            label: n.unlock,
            primary: true,
            run: () => {
              setState((s) => ({ ...s, locked: false, ringing: false }));
              show({ title: n.unlockedTitle, text: n.unlockedText, icon: <UnlockIcon size={18} />, actions: [] }, 3200);
            },
          },
          { label: n.close, run: close },
        ],
      });
    } else if (id === "leak") {
      setSelected("bath");
      setState((s) => ({ ...s, alerts: { ...s.alerts, leak: true } }));
      show({
        title: n.leakTitle,
        text: n.leakText,
        icon: <DropIcon size={18} />,
        alert: true,
        actions: [
          {
            label: n.ok,
            primary: true,
            run: () => {
              setState((s) => ({ ...s, alerts: { ...s.alerts, leak: false } }));
              close();
            },
          },
        ],
      });
    } else if (id === "window") {
      setSelected("bedroom");
      setState((s) => ({ ...patchRooms(s, (x) => x === "bedroom", { heat: false }), alerts: { ...s.alerts, window: true } }));
      show({
        title: fill(n.windowTitle, { room: roomName("bedroom") }),
        text: n.windowText,
        icon: <WindowIcon size={18} />,
        actions: [
          {
            label: n.windowClose,
            primary: true,
            run: () => {
              setState((s) => ({ ...patchRooms(s, (x) => x === "bedroom", { heat: true }), alerts: { ...s.alerts, window: false } }));
              close();
            },
          },
        ],
      });
    } else {
      setSelected("hall");
      const armed = state.alarm === "away";
      setState((s) =>
        armed ? { ...s, alerts: { ...s.alerts, motion: true } } : { ...patchRooms(s, (x) => x === "hall", { light: true, level: 30 }), alerts: { ...s.alerts, motion: true } },
      );
      later(5000, () => setState((s) => ({ ...s, alerts: { ...s.alerts, motion: false } })));
      show({
        title: armed ? n.alarmTitle : n.motionTitle,
        text: armed ? n.alarmText : n.motionText,
        icon: <MotionIcon size={18} />,
        alert: armed,
        actions: [{ label: n.ok, primary: true, run: close }],
      });
    }
  }

  // ---------- Floor plan layer ----------

  function planLayer() {
    return (
      <>
        {ROOMS.map((r) => {
          const s = state.rooms[r.id];
          const shade = s.light ? (Math.max(0, 70 - s.level) / 70) * 0.55 : 0.68;
          const glow = s.light ? (Math.max(0, s.level - 70) / 30) * 0.4 : 0;
          const closed = (100 - s.blinds) / 100;
          return [r.main, ...(r.extra ?? [])].map((rect, i) => (
            <div key={`${r.id}-${i}`} className="pointer-events-none absolute" style={S.box(rect)} aria-hidden="true">
              <div className="absolute inset-0 bg-[#ffd27a] mix-blend-soft-light transition-opacity duration-500" style={{ opacity: glow }} />
              <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                  opacity: closed * 0.55,
                  background: `repeating-linear-gradient(180deg, rgba(10,11,14,0.55) 0 ${S.u(16)}, rgba(10,11,14,0.85) ${S.u(16)} ${S.u(20)})`,
                }}
              />
              <div className="absolute inset-0 bg-[#06070b] transition-opacity duration-500" style={{ opacity: shade }} />
              {r.id === "bath" && state.alerts.leak && <div className="demo-flash absolute inset-0 bg-[#0a84ff]" />}
            </div>
          ));
        })}

        {ROOMS.map((r) => {
          const on = r.id === selected;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r.id)}
              aria-pressed={on}
              aria-label={roomName(r.id)}
              className="absolute transition-shadow duration-300 hover:bg-white/[0.04]"
              style={{ ...S.box(r.main), borderRadius: S.u(10), boxShadow: on ? `inset 0 0 0 ${S.u(6)} ${BLUE}` : undefined }}
            />
          );
        })}

        {ROOMS.map((r) => {
          const s = state.rooms[r.id];
          return (
            <span
              key={r.id}
              aria-hidden="true"
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: S.x(r.speaker.x), top: S.y(r.speaker.y), width: `max(20px, ${S.u(68)})`, height: `max(20px, ${S.u(68)})` }}
            >
              {s.music && s.playing && <span className="pulse-ring absolute inset-0 rounded-full bg-[#bf5af2]" />}
              <span
                className={`absolute inset-0 flex items-center justify-center rounded-full ring-1 transition-colors duration-300 ${
                  s.music ? "bg-[#bf5af2] text-white ring-white/40" : "bg-black/65 text-white/55 ring-white/15"
                }`}
              >
                <SpeakerIcon style={{ width: "55%", height: "55%" }} />
              </span>
            </span>
          );
        })}

        {ROOMS.map((r) => {
          const s = state.rooms[r.id];
          return (
            <span
              key={r.id}
              aria-hidden="true"
              className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center whitespace-nowrap font-medium leading-none text-white transition-colors duration-300"
              style={{
                left: S.x(r.pill.x),
                top: S.y(r.pill.y),
                minWidth: S.u(r.pill.w + 6),
                minHeight: S.u(74),
                padding: `${S.u(10)} ${S.u(26)}`,
                gap: S.u(12),
                borderRadius: S.u(18),
                fontSize: `max(11px, ${S.u(40)})`,
                background: r.id === selected ? BLUE : "#1b1a19",
              }}
            >
              {roomName(r.id)}
              <span className={`flex items-center font-normal ${r.id === selected ? "text-white/85" : "text-white/65"}`} style={{ gap: S.u(8) }}>
                {s.heat && <span className="rounded-full bg-[#ff9f0a]" style={{ width: S.u(12), height: S.u(12), minWidth: 5, minHeight: 5 }} />}
                {deg(s.heat ? s.target : AMBIENT)}
              </span>
              {s.music && s.playing && (
                <span className="demo-eq flex items-end" style={{ height: S.u(26), gap: S.u(4) }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="block h-full rounded-full bg-current" style={{ width: S.u(5), animationDelay: `${i * 0.18}s` }} />
                  ))}
                </span>
              )}
            </span>
          );
        })}

        {state.alerts.window && <div className="demo-flash pointer-events-none absolute bg-[#ff9500]" style={S.box([2138, 250, 2172, 500])} />}
        {state.alerts.window && <Ping x={2155} y={375} color="#ff9500" />}
        {state.alerts.leak && <Ping x={1178} y={985} color="#0a84ff" />}
        {state.alerts.motion && <Ping x={2047} y={773} color={state.alarm === "away" ? "#ff3b30" : "#34c759"} />}
        {state.ringing && <Ping x={1607} y={1085} color="#ffffff" />}
      </>
    );
  }

  // ---------- Phone layer ----------

  function phoneLayer() {
    const id = selected;
    const size = (n: number): React.CSSProperties => ({ fontSize: S.u(n) });
    const label = (key: keyof Labels["devices"], y: number) =>
      (
        <span className="pointer-events-none absolute -translate-y-1/2 whitespace-nowrap leading-none text-white" style={{ left: S.x(2485), top: S.y(y), ...size(44) }}>
          {t.devices[key]}
        </span>
      );
    const hot = (rect: Rect, aria: string, run: () => void, on = false) => (
      <button
        type="button"
        aria-label={aria}
        aria-pressed={on || undefined}
        onClick={run}
        className={`absolute rounded-full transition-colors ${on ? "bg-[#0a84ff]/40" : "hover:bg-white/[0.07] active:bg-white/15"}`}
        style={S.box(rect)}
      />
    );
    return (
      <>
        <h2 className="absolute -translate-y-1/2 truncate font-bold leading-none tracking-tight text-white" style={{ left: S.x(2485), top: S.y(181), maxWidth: S.x(430), ...size(62) }}>
          {roomName(id)}
        </h2>

        {label("light", 293)}
        <Toggle on={rs.light} label={t.devices.light} x={2955} y={295} onChange={(v) => setRoom(id, { light: v })} />
        <Slider
          label={t.state.brightness}
          value={rs.level}
          min={1}
          x0={2400}
          x1={2850}
          y={381}
          bar={14}
          knob={38}
          fill={rs.light ? "#1f80e9" : "#6b6b70"}
          knobColor="#fcf9fa"
          onChange={(level) => setRoom(id, { light: true, level })}
        />
        <span className="price pointer-events-none absolute -translate-x-full -translate-y-1/2 whitespace-nowrap leading-none text-white" style={{ left: S.x(2998), top: S.y(379), ...size(46) }}>
          {rs.light ? `${rs.level}%` : t.state.off}
        </span>

        {label("blinds", 476)}
        <span className="price pointer-events-none absolute -translate-x-full -translate-y-1/2 whitespace-nowrap leading-none text-white/60" style={{ left: S.x(2998), top: S.y(476), ...size(40) }}>
          {rs.blinds === 0 ? t.state.closed : `${rs.blinds}%`}
        </span>
        {hot([2395, 528, 2597, 608], t.controls.up, () => moveBlinds(id, 1), moving?.id === id && moving.dir > 0)}
        {hot([2605, 528, 2797, 608], t.controls.stop, stopBlinds)}
        {hot([2807, 528, 3008, 608], t.controls.down, () => moveBlinds(id, -1), moving?.id === id && moving.dir < 0)}

        {label("heating", 686)}
        <Toggle on={rs.heat} label={t.devices.heating} x={2955} y={685} onChange={(v) => setRoom(id, { heat: v })} />
        <span
          className={`price pointer-events-none absolute -translate-y-1/2 whitespace-nowrap font-bold leading-none tracking-tight text-white transition-opacity ${rs.heat ? "" : "opacity-40"}`}
          style={{ left: S.x(2398), top: S.y(781), ...size(84) }}
        >
          {deg(rs.target)}
        </span>
        {hot([2740, 745, 2860, 825], t.state.cooler, () => setRoom(id, { heat: true, target: Math.max(16, rs.target - 0.5) }))}
        {hot([2885, 745, 3008, 825], t.state.warmer, () => setRoom(id, { heat: true, target: Math.min(28, rs.target + 0.5) }))}

        {label("music", 906)}
        <span
          className="pointer-events-none absolute -translate-y-1/2 truncate whitespace-nowrap leading-none text-white/50"
          style={{ left: S.x(2700), top: S.y(908), maxWidth: S.x(190), ...size(30) }}
        >
          {t.state.tracks[track]}
        </span>
        <Toggle on={rs.music} label={t.devices.music} x={2955} y={905} onChange={(v) => setRoom(id, { music: v, playing: v && rs.playing })} />
        {hot([2395, 965, 2625, 1045], t.controls.prev, () => setTrack((n) => (n + t.state.tracks.length - 1) % t.state.tracks.length))}
        <button
          type="button"
          aria-label={rs.playing ? t.controls.pause : t.controls.play}
          onClick={() => setRoom(id, { music: true, playing: !rs.playing })}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white transition-transform active:scale-95"
          style={{ left: S.x(2700), top: S.y(1005), width: S.u(100), height: S.u(100), background: "#288af4" }}
        >
          {rs.playing ? <PauseIcon style={{ width: S.u(40), height: S.u(40) }} /> : <PlayIcon style={{ width: S.u(44), height: S.u(44), marginLeft: S.u(6) }} />}
        </button>
        {hot([2785, 965, 3008, 1045], t.controls.next, () => setTrack((n) => (n + 1) % t.state.tracks.length))}
        <Slider label={t.state.volume} value={rs.volume} min={0} x0={2400} x1={2890} y={1097} bar={10} knob={30} fill="#0777ec" knobColor="#0a7cf0" onChange={(volume) => setRoom(id, { volume })} />
      </>
    );
  }

  // ---------- Scene and event cards ----------

  type CardItem<T> = { id: T; x: number; area: [number, number] };
  const sceneItems: CardItem<SceneId>[] = [
    { id: "morning", x: 250, area: [20, 402] },
    { id: "away", x: 554, area: [402, 700] },
    { id: "evening", x: 846, area: [700, 991] },
    { id: "movie", x: 1136, area: [991, 1282] },
    { id: "night", x: 1428, area: [1282, 1571] },
  ];
  const eventItems: CardItem<EventId>[] = [
    { id: "doorbell", x: 190, area: [20, 346] },
    { id: "leak", x: 503, area: [346, 673] },
    { id: "window", x: 843, area: [673, 1036] },
    { id: "motion", x: 1230, area: [1036, 1457] },
  ];

  function cardLayer<T extends string>(size: Size, items: CardItem<T>[], names: Record<T, string>, labelY: number, labelSize: number, run: (id: T) => void, active?: T | null) {
    const C = units(size);
    const top = 10;
    const bottom = 314;
    return items.map((b) => {
      const cx = `${((b.x - b.area[0]) / (b.area[1] - b.area[0])) * 100}%`;
      const at = (y: number) => `${((y - top) / (bottom - top)) * 100}%`;
      const on = active === b.id;
      return (
        <button key={b.id} type="button" onClick={() => run(b.id)} aria-pressed={active === undefined ? undefined : on} className="group absolute" style={C.box([b.area[0], top, b.area[1], bottom])}>
          <span className="sr-only">{names[b.id]}</span>
          <span
            aria-hidden="true"
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-shadow duration-300"
            style={{ left: cx, top: at(125), width: C.u(184), height: C.u(184), boxShadow: on ? `0 0 0 ${C.u(6)} #1d1d1f` : undefined }}
          />
          <span aria-hidden="true" className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap leading-none text-[#1d1d1f]" style={{ left: cx, top: at(labelY), fontSize: `max(13px, ${C.u(labelSize)})` }}>
            {names[b.id]}
          </span>
        </button>
      );
    });
  }

  const card = "bg-white shadow-[0_18px_40px_-28px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.04] transition-transform md:min-w-0";
  const scroller = "no-scrollbar -mx-[22px] overflow-x-auto px-[22px] py-2 md:mx-0 md:overflow-visible md:p-0";

  return (
    <div className="container-wide">
      <div className="relative">
        <Crop size={STAGE} crop={CROP.full} src={`${BASE}/demo/stage`} sizes="(min-width: 1440px) 1400px, 100vw" radius={60} className="hidden lg:block">
          {planLayer()}
          {phoneLayer()}
        </Crop>
        <div className="space-y-3 lg:hidden">
          <div ref={planScroller} className="no-scrollbar -mx-[22px] overflow-x-auto px-[22px] md:mx-0 md:px-0">
            <Crop size={STAGE} crop={CROP.plan} src={`${BASE}/demo/stage`} sizes="2000px" radius={44} className="min-w-[720px]">
              {planLayer()}
            </Crop>
          </div>
          <Crop size={STAGE} crop={CROP.phone} src={`${BASE}/demo/stage`} sizes="1600px" radius={44} className="mx-auto max-w-[420px]">
            {phoneLayer()}
          </Crop>
        </div>

        {(toast || scene) && (
          <div
            className="pointer-events-none fixed inset-x-3 bottom-3 z-40 flex justify-center lg:absolute lg:inset-x-auto lg:bottom-auto lg:left-[38%] lg:top-[4%] lg:w-[min(540px,44%)] lg:-translate-x-1/2"
            aria-live="polite"
          >
            {toast ? (
              <div
                key={toast.id}
                role="status"
                className="demo-toast pointer-events-auto w-full max-w-[560px] rounded-[22px] bg-[#1c1c1e]/92 p-3 text-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10 backdrop-blur-xl sm:p-3.5"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                  <div className="flex min-w-0 flex-[1_1_240px] items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toast.alert ? "bg-[#ff3b30]" : "bg-white/10"}`}>{toast.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[14px] font-semibold leading-snug ${toast.alert ? "text-[#ff6961]" : ""}`}>{toast.title}</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-white/65">{toast.text}</p>
                    </div>
                  </div>
                  {toast.actions.length > 0 && (
                    <div className="flex flex-[1_1_100%] gap-2 sm:flex-none">
                      {toast.actions.map((a) => (
                        <button
                          key={a.label}
                          type="button"
                          onClick={a.run}
                          className={`flex-1 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors sm:flex-none ${a.primary ? "bg-[#0a84ff] text-white hover:bg-[#2491ff]" : "bg-white/10 text-white hover:bg-white/15"}`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              scene && (
                <div
                  key={scene.run}
                  role="status"
                  className="demo-toast pointer-events-auto w-full max-w-[420px] rounded-[22px] bg-[#1c1c1e]/92 px-4 py-3.5 text-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10 backdrop-blur-xl"
                >
                  <p className="text-[15px] font-semibold">{t.scenes[scene.id]}</p>
                  <ol className="mt-2 space-y-1.5">
                    {scene.steps.slice(0, scene.done).map((text, i) => (
                      <li key={i} className="demo-step flex items-center gap-2 text-[13px] text-white/80">
                        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#34c759] text-white">
                          <CheckIcon size={12} strokeWidth={2.6} />
                        </span>
                        {text}
                      </li>
                    ))}
                  </ol>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-1 md:gap-3 lg:mt-[1.29%] lg:grid-cols-[1591fr_1477fr] lg:gap-[1.35%]">
        <section aria-label={t.scenesTitle} className={scroller}>
          <Crop size={SCENES} crop={[0, 0, SCENES.w, SCENES.h]} src={`${BASE}/demo/scenes`} radius={45} className={`min-w-[600px] ${card}`}>
            {cardLayer(SCENES, sceneItems, t.scenes, 255, 44, runScene, scene?.id ?? null)}
          </Crop>
        </section>
        <section aria-label={t.eventsTitle} className={scroller}>
          <Crop size={EVENTS} crop={[0, 0, EVENTS.w, EVENTS.h]} src={`${BASE}/demo/events`} radius={45} className={`min-w-[560px] ${card}`}>
            {cardLayer(EVENTS, eventItems, t.events, 240, 40, trigger)}
          </Crop>
        </section>
      </div>
    </div>
  );
}

// ---------- Pieces ----------

/** Shows one part (`crop`) of a Canva image. Children are placed in the pixels of the whole image. */
function Crop({
  size,
  crop,
  src,
  sizes,
  radius,
  className = "",
  children,
}: {
  size: Size;
  crop: Rect;
  /** Path without ".webp"; when `sizes` is given a "-1600.webp" copy exists too. */
  src: string;
  sizes?: string;
  radius: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [x0, y0, x1, y1] = crop;
  const w = x1 - x0;
  const h = y1 - y0;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: `${w} / ${h}`, borderRadius: `${(radius / w) * 100}% / ${(radius / h) * 100}%` }}>
      <div className="absolute [container-type:inline-size]" style={{ width: `${(size.w / w) * 100}%`, height: `${(size.h / h) * 100}%`, left: `${(-x0 / w) * 100}%`, top: `${(-y0 / h) * 100}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${src}.webp`}
          srcSet={sizes ? `${src}-1600.webp 1600w, ${src}.webp ${size.w}w` : undefined}
          sizes={sizes}
          alt=""
          width={size.w}
          height={size.h}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full select-none"
        />
        {children}
      </div>
    </div>
  );
}

function Toggle({ on, label, x, y, onChange }: { on: boolean; label: string; x: number; y: number; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-[background-color,box-shadow] duration-200"
      style={{ left: S.x(x), top: S.y(y), width: S.u(104), height: S.u(60), background: on ? BLUE : "#4a4a4d", boxShadow: on ? `0 0 ${S.u(16)} rgba(40,134,252,0.45)` : "none" }}
    >
      <span className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-[left] duration-200" style={{ width: S.u(50), height: S.u(50), left: on ? S.u(49) : S.u(5) }} />
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  x0,
  x1,
  y,
  bar,
  knob,
  fill,
  knobColor,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  x0: number;
  x1: number;
  y: number;
  bar: number;
  knob: number;
  fill: string;
  knobColor: string;
  onChange: (v: number) => void;
}) {
  const pct = `${value}%`;
  return (
    <div className="absolute" style={S.box([x0, y - 34, x1, y + 34])}>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full bg-[#2e2e2f]" style={{ height: S.u(bar) }} />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full transition-colors" style={{ width: pct, height: S.u(bar), background: fill }} />
      <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm" style={{ left: pct, width: S.u(knob), height: S.u(knob), background: knobColor }} />
      <input
        type="range"
        aria-label={label}
        min={min}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

function Ping({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: S.x(x), top: S.y(y), width: S.u(70), height: S.u(70) }} aria-hidden="true">
      <span className="pulse-ring absolute inset-0 rounded-full" style={{ background: color }} />
      <span className="absolute inset-[30%] rounded-full" style={{ background: color }} />
    </span>
  );
}

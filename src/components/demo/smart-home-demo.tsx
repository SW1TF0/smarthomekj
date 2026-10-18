"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import {
  BellIcon,
  BlindsIcon,
  BuildingIcon,
  CameraIcon,
  CategoryIcon,
  CheckIcon,
  ChevronRight,
  DropIcon,
  FilmIcon,
  HouseIcon,
  LeaveIcon,
  LockIcon,
  LogoMark,
  MinusIcon,
  MoonIcon,
  MotionIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  PrevIcon,
  SmokeIcon,
  SpeakerIcon,
  SunIcon,
  SunriseIcon,
  SunsetIcon,
  ThermoIcon,
  UnlockIcon,
  WindowIcon,
} from "../icons";
import { H, plans, W, type Plan, type RoomDef, type RoomId, type SensorKind, type Shape } from "./plans";

type Labels = Dictionary["demo"];
type RoomState = { light: boolean; level: number; blinds: number; heat: boolean; target: number; music: boolean; volume: number; cam: boolean };
type Alarm = "off" | "home" | "away";
type HomeState = {
  night: boolean;
  rooms: Partial<Record<RoomId, RoomState>>;
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
  camera?: boolean;
  actions: { label: string; primary?: boolean; run: () => void }[];
};

const AMBIENT = 19;
const STEP_MS = 380;
const BLUE = "#0a84ff";
const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));

function initialState(plan: Plan): HomeState {
  const rooms: HomeState["rooms"] = {};
  for (const r of plan.rooms) {
    rooms[r.id] = {
      light: r.id === "living",
      level: 70,
      blinds: 100,
      heat: !!r.heat && ["living", "bedroom", "kids"].includes(r.id),
      target: r.id === "bath" ? 23 : 21.5,
      music: false,
      volume: 40,
      cam: !!r.cams,
    };
  }
  return { night: false, rooms, locked: true, alarm: "off", alerts: { leak: false, window: false, motion: false }, ringing: false };
}

function patchRooms(s: HomeState, plan: Plan, pick: (r: RoomDef) => boolean, patch: Partial<RoomState>): HomeState {
  const rooms = { ...s.rooms };
  for (const r of plan.rooms) if (pick(r) && rooms[r.id]) rooms[r.id] = { ...rooms[r.id]!, ...patch };
  return { ...s, rooms };
}

export function SmartHomeDemo({ locale, t }: { locale: Locale; t: Labels }) {
  const [planId, setPlanId] = useState<Plan["id"]>("apartment");
  const plan = plans[planId];
  const [state, setState] = useState<HomeState>(() => initialState(plans.apartment));
  const [selected, setSelected] = useState<RoomId>("living");
  const [scene, setScene] = useState<{ id: SceneId; run: number; done: number; steps: string[] } | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [track, setTrack] = useState(0);
  const [moving, setMoving] = useState<{ id: RoomId; dir: 1 | -1 } | null>(null);
  const timers = useRef<number[]>([]);
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
      setState((s) => ({ ...s, rooms: { ...s.rooms, [id]: { ...s.rooms[id]!, blinds: Math.min(100, Math.max(0, s.rooms[id]!.blinds + dir * 5)) } } }));
    }, 90);
  }
  useEffect(() => {
    if (!moving) return;
    const b = state.rooms[moving.id]?.blinds;
    if (b === undefined || (moving.dir > 0 ? b >= 100 : b <= 0)) stopBlinds();
  }, [state, moving]);

  const temp = useMemo(() => new Intl.NumberFormat({ bg: "bg-BG", en: "en-IE", tr: "tr-TR" }[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 }), [locale]);
  const deg = useCallback((n: number) => `${temp.format(n)}°`, [temp]);
  const roomName = (id: RoomId) => t.rooms[id];

  const room = plan.rooms.find((r) => r.id === selected) ?? plan.rooms[0];
  const rs = state.rooms[room.id]!;
  const setRoom = (id: RoomId, patch: Partial<RoomState>) => setState((s) => ({ ...s, rooms: { ...s.rooms, [id]: { ...s.rooms[id]!, ...patch } } }));

  function choosePlan(id: Plan["id"]) {
    if (id === planId) return;
    clearTimers();
    setPlanId(id);
    setState(initialState(plans[id]));
    setSelected("living");
    setScene(null);
    setToast(null);
  }

  // ---------- Scenes ----------

  function sceneSteps(id: SceneId): { text: string; run: (s: HomeState) => HomeState }[] {
    const st = t.steps;
    const has = (r: RoomId) => plan.rooms.some((x) => x.id === r);
    const light = (r: RoomId, n: number) => ({
      text: fill(st.light, { room: roomName(r), n }),
      run: (s: HomeState) => patchRooms(s, plan, (x) => x.id === r, { light: true, level: n }),
    });
    const heatAll = (n: number) => ({ text: fill(st.heatAll, { t: deg(n) }), run: (s: HomeState) => patchRooms(s, plan, (x) => !!x.heat, { heat: true, target: n }) });
    const allOff = { text: st.lightsOff, run: (s: HomeState) => patchRooms(s, plan, () => true, { light: false }) };
    const musicOff = { text: st.musicOff, run: (s: HomeState) => patchRooms(s, plan, () => true, { music: false }) };
    const lock = { text: st.lock, run: (s: HomeState) => ({ ...s, locked: true }) };

    switch (id) {
      case "morning":
        return [
          { text: st.blindsOpen, run: (s) => ({ ...patchRooms(s, plan, (x) => !!x.blinds, { blinds: 100 }), night: false }) },
          { text: fill(st.heatRoom, { room: roomName("bath"), t: deg(24) }), run: (s) => patchRooms(s, plan, (x) => x.id === "bath", { heat: true, target: 24 }) },
          light("kitchen", 80),
          { text: st.alarmOff, run: (s) => ({ ...s, alarm: "off" }) },
        ];
      case "away":
        return [
          allOff,
          musicOff,
          heatAll(18),
          lock,
          { text: st.alarmAway, run: (s) => ({ ...patchRooms(s, plan, (x) => !!x.cams, { cam: true }), alarm: "away" }) },
        ];
      case "evening":
        return [
          { text: st.blindsClose, run: (s) => ({ ...patchRooms(s, plan, (x) => !!x.blinds, { blinds: 0 }), night: true }) },
          light("living", 70),
          light("kitchen", 50),
          light("hall", 20),
          ...(has("yard") ? [{ text: st.garden, run: (s: HomeState) => patchRooms(s, plan, (x) => x.id === "yard", { light: true, level: 40 }) }] : []),
          heatAll(21.5),
          { text: st.alarmOff, run: (s) => ({ ...s, alarm: "off" }) },
        ];
      case "movie":
        return [
          { text: fill(st.blindsRoom, { room: roomName("living") }), run: (s) => ({ ...patchRooms(s, plan, (x) => x.id === "living", { blinds: 0 }), night: true }) },
          { text: st.othersOff, run: (s) => patchRooms(s, plan, (x) => x.id !== "living", { light: false }) },
          light("living", 10),
          { text: fill(st.musicOn, { room: roomName("living") }), run: (s) => patchRooms(s, plan, (x) => x.id === "living", { music: true, volume: 60 }) },
        ];
      case "night":
        return [
          { text: st.lightsOff, run: (s) => ({ ...allOff.run(s), night: true }) },
          light("hall", 5),
          { text: st.blindsClose, run: (s) => patchRooms(s, plan, (x) => !!x.blinds, { blinds: 0 }) },
          musicOff,
          heatAll(19),
          lock,
          { text: st.alarmHome, run: (s) => ({ ...s, alarm: "home" }) },
        ];
    }
  }

  function runScene(id: SceneId) {
    clearTimers();
    setToast(null);
    const steps = sceneSteps(id);
    const run = Date.now();
    setScene({ id, run, done: 0, steps: steps.map((s) => s.text) });
    steps.forEach((step, i) =>
      later(i * STEP_MS, () => {
        setState(step.run);
        setScene((sc) => (sc && sc.run === run ? { ...sc, done: i + 1 } : sc));
      }),
    );
  }

  // ---------- Events ----------

  function show(toastData: Omit<Toast, "id">, autoCloseMs?: number) {
    const id = Date.now();
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
        camera: true,
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
      setState((s) => ({ ...patchRooms(s, plan, (x) => x.id === "bedroom", { heat: false }), alerts: { ...s.alerts, window: true } }));
      show({
        title: fill(n.windowTitle, { room: roomName("bedroom") }),
        text: n.windowText,
        icon: <WindowIcon size={18} />,
        actions: [
          {
            label: n.windowClose,
            primary: true,
            run: () => {
              setState((s) => ({ ...patchRooms(s, plan, (x) => x.id === "bedroom", { heat: true }), alerts: { ...s.alerts, window: false } }));
              close();
            },
          },
        ],
      });
    } else {
      setSelected("hall");
      const armed = state.alarm === "away";
      setState((s) =>
        armed
          ? { ...patchRooms(s, plan, (x) => !!x.cams, { cam: true }), alerts: { ...s.alerts, motion: true } }
          : { ...patchRooms(s, plan, (x) => x.id === "hall", { light: true, level: 30 }), night: true, alerts: { ...s.alerts, motion: true } },
      );
      later(5000, () => setState((s) => ({ ...s, alerts: { ...s.alerts, motion: false } })));
      show({
        title: armed ? n.alarmTitle : n.motionTitle,
        text: armed ? n.alarmText : n.motionText,
        icon: <MotionIcon size={18} />,
        alert: armed,
        camera: armed,
        actions: [{ label: n.ok, primary: true, run: close }],
      });
    }
  }

  // ---------- Live numbers ----------

  const indoor = plan.rooms.filter((r) => !r.outdoor);
  const roomsOf = (pick: (r: RoomDef, s: RoomState) => boolean) => plan.rooms.filter((r) => pick(r, state.rooms[r.id]!)).length;
  const camCount = plan.rooms.reduce((n, r) => n + (r.cams && state.rooms[r.id]!.cam ? r.cams.length : 0), 0);
  const sensorCount = plan.rooms.reduce(
    (n, r) => n + (r.sensors ?? []).filter((x) => x.kind === "leak" || x.kind === "smoke" || state.alarm !== "off").length,
    0,
  );
  const watts =
    140 +
    plan.rooms.reduce((n, r) => {
      const s = state.rooms[r.id]!;
      return (
        n +
        (s.light ? (r.watts * s.level) / 100 : 0) +
        (r.heat && s.heat ? Math.max(0, s.target - 16) * 45 : 0) +
        (s.music ? 12 : 0) +
        (r.cams && s.cam ? r.cams.length * 4 : 0)
      );
    }, 0);
  const power = watts < 1000 ? `${Math.round(watts)} W` : `${temp.format(watts / 1000)} kW`;

  const calcHref = `/${locale}/calculator/?type=${plan.id}&rooms=${plan.calcRooms}&sys=lighting.access.cameras.heating.blinds.sensors.sound`;

  const sceneButtons: { id: SceneId; icon: React.ReactNode; tint: string }[] = [
    { id: "morning", icon: <SunriseIcon size={24} />, tint: "bg-[#ffb800]" },
    { id: "away", icon: <LeaveIcon size={24} />, tint: "bg-[#34c759]" },
    { id: "evening", icon: <SunsetIcon size={24} />, tint: "bg-[#7d7aff]" },
    { id: "movie", icon: <FilmIcon size={24} />, tint: "bg-[#ff6482]" },
    { id: "night", icon: <MoonIcon size={24} />, tint: "bg-[#5e8bff]" },
  ];
  const eventButtons: { id: EventId; icon: React.ReactNode; tint: string }[] = [
    { id: "doorbell", icon: <BellIcon size={22} />, tint: "bg-[#ff3b30]/10 text-[#e0301e]" },
    { id: "leak", icon: <DropIcon size={22} />, tint: "bg-[#0a84ff]/10 text-[#0a6fd6]" },
    { id: "window", icon: <WindowIcon size={22} />, tint: "bg-[#ff9500]/12 text-[#c96f00]" },
    { id: "motion", icon: <MotionIcon size={22} />, tint: "bg-[#34c759]/12 text-[#1d8a3a]" },
  ];
  const blindsPct = fill(t.state.open, { n: rs.blinds });

  return (
    <div className="container-wide space-y-4">
      {/* Stage: the house and the phone */}
      <div className="relative overflow-hidden rounded-[32px] bg-[#0b0b0d] bg-[radial-gradient(90%_70%_at_35%_40%,#1d1d22_0%,#0b0b0d_70%)] p-3 text-white sm:p-5 lg:p-7">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2" role="radiogroup" aria-label={t.eyebrow}>
                {(["apartment", "house"] as const).map((id) => {
                  const on = id === planId;
                  const Icon = id === "apartment" ? BuildingIcon : HouseIcon;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => choosePlan(id)}
                      className={`flex items-center gap-2.5 rounded-[16px] px-3.5 py-2 text-left transition-colors sm:px-4 sm:py-2.5 ${
                        on ? "bg-white text-ink" : "bg-white/[0.08] text-white/80 hover:bg-white/[0.14]"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="leading-tight">
                        <span className="block text-[14px] font-semibold sm:text-[15px]">{t.homes[id].title}</span>
                        <span className={`hidden text-[12px] sm:block ${on ? "text-mute" : "text-white/55"}`}>{t.homes[id].text}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex rounded-full bg-white/[0.08] p-1" role="radiogroup" aria-label={`${t.day} / ${t.night}`}>
                {([false, true] as const).map((night) => (
                  <button
                    key={String(night)}
                    type="button"
                    role="radio"
                    aria-checked={state.night === night}
                    onClick={() => setState((s) => ({ ...s, night }))}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${state.night === night ? "bg-white text-ink" : "text-white/70 hover:text-white"}`}
                  >
                    {night ? <MoonIcon size={15} /> : <SunIcon size={15} />}
                    {night ? t.night : t.day}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mt-5 flex flex-1 flex-col justify-center sm:mt-6">
              <div className="@container relative [perspective:2200px]" style={{ aspectRatio: `${W} / ${H}` }}>
                <div className="absolute inset-0 origin-[50%_70%] md:[transform:rotateX(14deg)]">
                  <div className="absolute inset-x-[6%] -bottom-[3%] h-[10%] rounded-[50%] bg-black/70 blur-2xl" aria-hidden="true" />
                  <FloorPlan plan={plan} state={state} selected={room.id} onSelect={setSelected} onToggleLock={() => setState((s) => ({ ...s, locked: !s.locked }))} />
                  {plan.rooms.map((r) => {
                    const s = state.rooms[r.id]!;
                    const on = r.id === room.id;
                    const x = r.box.x + r.box.w / 2;
                    const y = r.outdoor ? r.box.y + r.box.h - 22 : r.box.y + r.box.h / 2;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelected(r.id)}
                        aria-pressed={on}
                        className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 overflow-hidden rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-[1.15] backdrop-blur-md transition-colors @[300px]:text-[9.5px] @[400px]:px-2 @[400px]:text-[10.5px] @[560px]:px-3 @[560px]:py-1 @[560px]:text-[12.5px] ${
                          on ? "bg-[#0a84ff] text-white shadow-[0_6px_20px_-4px_rgba(10,132,255,0.7)]" : "bg-black/60 text-white ring-1 ring-white/15 hover:bg-black/75"
                        }`}
                        style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, maxWidth: `${(r.box.w / W) * 100 - 0.5}%` }}
                      >
                        <span className="min-w-0 text-center">{t.rooms[r.id]}</span>
                        {r.heat && (
                          <span className="hidden shrink-0 items-center gap-0.5 font-medium text-white/75 @[640px]:inline-flex">
                            {s.heat && <span className="h-1.5 w-1.5 rounded-full bg-[#ff9500]" />}
                            {deg(s.heat ? s.target : AMBIENT)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {toast && (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-1 sm:-top-2" aria-live="polite">
                  <div
                    key={toast.id}
                    role="status"
                    className="demo-toast pointer-events-auto w-full max-w-[560px] rounded-[22px] bg-[#1c1c1e]/90 p-3 text-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10 backdrop-blur-xl sm:p-3.5"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                      <div className="flex min-w-0 flex-[1_1_240px] items-center gap-3">
                        <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toast.alert ? "bg-[#ff3b30]" : "bg-white/10"}`}>
                          {toast.icon}
                          {!toast.alert && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#0a84ff] ring-2 ring-[#1c1c1e]" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[14px] font-semibold leading-snug ${toast.alert ? "text-[#ff6961]" : ""}`}>{toast.title}</p>
                          <p className="mt-0.5 text-[13px] leading-snug text-white/65">{toast.text}</p>
                        </div>
                        {toast.camera && <CameraFeed small label={t.state.live} />}
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
                </div>
              )}
            </div>
            <p className="mt-4 text-[13px] text-white/45">{t.hint}</p>
          </div>

          {/* Phone */}
          <section className="mx-auto w-full max-w-[380px] self-center rounded-[44px] bg-[#2a2a2d] p-[5px] sm:rounded-[48px] sm:p-[7px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/15" aria-labelledby="demo-room">
            <div className="no-scrollbar flex flex-col overflow-y-auto rounded-[39px] bg-black px-3 pb-5 sm:rounded-[41px] sm:px-4 lg:h-[640px]">
              <div className="sticky top-0 z-10 -mx-3 bg-black/85 px-3 pb-3 backdrop-blur-xl sm:-mx-4 sm:px-4">
                <div className="flex items-center justify-between px-3 pt-3 text-[13px] font-semibold" aria-hidden="true">
                  <span>9:41</span>
                  <span className="h-[22px] w-[84px] rounded-full bg-[#1c1c1e]" />
                  <span className="flex items-center gap-1">
                    <span className="flex items-end gap-[2px]">
                      {[4, 6, 8, 10].map((h) => (
                        <span key={h} className="w-[3px] rounded-[1px] bg-white" style={{ height: h }} />
                      ))}
                    </span>
                    <span className="ml-1 h-[11px] w-[22px] rounded-[3px] border border-white/50 p-[1.5px]">
                      <span className="block h-full w-3/4 rounded-[1px] bg-white" />
                    </span>
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-white/55">
                    <LogoMark size={16} />
                    <span className="text-[13px] font-medium">{t.selected}</span>
                  </div>
                  {room.heat && <span className="price text-[15px] font-semibold text-[#ff9f0a]">{deg(rs.heat ? rs.target : AMBIENT)}</span>}
                </div>
                <h2 id="demo-room" className="mt-1 text-[32px] font-bold leading-tight tracking-tight">
                  {t.rooms[room.id]}
                </h2>
                <div className="no-scrollbar -mx-3 mt-3 flex gap-1.5 overflow-x-auto px-3 sm:-mx-4 sm:px-4" role="tablist" aria-label={t.roomsLabel}>
                  {plan.rooms.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      role="tab"
                      aria-selected={r.id === room.id}
                      onClick={() => setSelected(r.id)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${r.id === room.id ? "bg-white text-ink" : "bg-white/10 text-white/75 hover:bg-white/15"}`}
                    >
                      {t.rooms[r.id]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <Device
                  icon={<CategoryIcon category="lighting" size={19} />}
                  tint="bg-[#ffcc00] text-black"
                  title={t.devices.light}
                  status={rs.light ? `${rs.level}%` : t.state.off}
                  on={rs.light}
                  onToggle={(v) => setRoom(room.id, { light: v })}
                >
                  <div className={`transition-opacity ${rs.light ? "" : "opacity-50"}`}>
                    <Range label={t.state.brightness} value={rs.level} min={1} max={100} color={rs.light ? "#ffd60a" : "#8e8e93"} onChange={(level) => setRoom(room.id, { light: true, level })} />
                  </div>
                </Device>

                {room.blinds && (
                  <Device icon={<BlindsIcon size={19} />} tint="bg-[#64d2ff] text-black" title={t.devices.blinds} status={rs.blinds === 0 ? t.state.closed : blindsPct} on={rs.blinds > 0}>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                      <div className="h-full rounded-full bg-[#64d2ff] transition-[width] duration-100" style={{ width: `${rs.blinds}%` }} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {(
                        [
                          { key: "up", label: t.controls.up, icon: <ChevronRight size={20} className="-rotate-90" />, run: () => moveBlinds(room.id, 1), on: moving?.id === room.id && moving.dir > 0 },
                          { key: "stop", label: t.controls.stop, icon: <PauseIcon size={16} />, run: stopBlinds, on: false },
                          { key: "down", label: t.controls.down, icon: <ChevronRight size={20} className="rotate-90" />, run: () => moveBlinds(room.id, -1), on: moving?.id === room.id && moving.dir < 0 },
                        ] as const
                      ).map((b) => (
                        <button
                          key={b.key}
                          type="button"
                          aria-label={b.label}
                          aria-pressed={b.key === "stop" ? undefined : b.on}
                          onClick={b.run}
                          className={`flex h-10 items-center justify-center rounded-[12px] transition-colors ${b.on ? "bg-[#64d2ff] text-black" : "bg-white/10 text-white hover:bg-white/15"}`}
                        >
                          {b.icon}
                        </button>
                      ))}
                    </div>
                  </Device>
                )}

                {room.heat && (
                  <Device
                    icon={<ThermoIcon size={19} />}
                    tint="bg-[#ff9f0a] text-black"
                    title={t.devices.heating}
                    status={rs.heat ? fill(t.state.heatingTo, { t: deg(rs.target) }) : t.state.off}
                    on={rs.heat}
                    onToggle={(v) => setRoom(room.id, { heat: v })}
                  >
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className={`price text-[40px] font-semibold leading-none tracking-tight transition-opacity ${rs.heat ? "" : "opacity-40"}`}>{deg(rs.target)}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label={t.state.cooler}
                          onClick={() => setRoom(room.id, { target: Math.max(16, rs.target - 0.5) })}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/15"
                        >
                          <MinusIcon size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={t.state.warmer}
                          onClick={() => setRoom(room.id, { target: Math.min(28, rs.target + 0.5) })}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/15"
                        >
                          <PlusIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </Device>
                )}

                {room.speaker && (
                  <Device
                    icon={<CategoryIcon category="entertainment" size={19} />}
                    tint="bg-[#bf5af2] text-white"
                    title={t.devices.music}
                    status={rs.music ? `${t.state.playing} · ${t.state.tracks[track]}` : t.state.tracks[track]}
                    on={rs.music}
                    onToggle={(v) => setRoom(room.id, { music: v })}
                  >
                    <div className="mt-3 flex items-center justify-center gap-6">
                      <button
                        type="button"
                        aria-label={t.controls.prev}
                        onClick={() => setTrack((n) => (n + t.state.tracks.length - 1) % t.state.tracks.length)}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10"
                      >
                        <PrevIcon size={20} />
                      </button>
                      <button
                        type="button"
                        aria-label={rs.music ? t.controls.pause : t.controls.play}
                        onClick={() => setRoom(room.id, { music: !rs.music })}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0a84ff] text-white transition-colors hover:bg-[#2491ff]"
                      >
                        {rs.music ? <PauseIcon size={18} /> : <PlayIcon size={18} className="translate-x-[1px]" />}
                      </button>
                      <button
                        type="button"
                        aria-label={t.controls.next}
                        onClick={() => setTrack((n) => (n + 1) % t.state.tracks.length)}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10"
                      >
                        <NextIcon size={20} />
                      </button>
                    </div>
                    <div className="mt-1 flex items-center gap-3">
                      <SpeakerIcon size={18} className="shrink-0 text-white/55" />
                      <div className="flex-1">
                        <Range label={t.state.volume} value={rs.volume} min={0} max={100} color="#ffffff" onChange={(volume) => setRoom(room.id, { volume })} />
                      </div>
                    </div>
                  </Device>
                )}

                {room.cams && (
                  <Device
                    icon={<CameraIcon size={19} />}
                    tint="bg-[#30d158] text-black"
                    title={room.cams.length > 1 ? `${t.devices.camera} × ${room.cams.length}` : t.devices.camera}
                    status={rs.cam ? t.state.watching : t.state.off}
                    on={rs.cam}
                    onToggle={(v) => setRoom(room.id, { cam: v })}
                  >
                    {rs.cam && (
                      <div className="mt-3">
                        <CameraFeed label={t.state.live} alert={state.alerts.motion && room.id === "hall"} />
                      </div>
                    )}
                  </Device>
                )}

                {room.id === "hall" && (
                  <Device
                    icon={state.locked ? <LockIcon size={19} /> : <UnlockIcon size={19} />}
                    tint={state.locked ? "bg-[#30d158] text-black" : "bg-[#ff9f0a] text-black"}
                    title={t.devices.lock}
                    status={state.locked ? t.state.locked : t.state.unlocked}
                    on={state.locked}
                    onToggle={(v) => setState((s) => ({ ...s, locked: v }))}
                  />
                )}

                {room.sensors && room.sensors.length > 0 && (
                  <div className="rounded-[20px] bg-white/[0.07] p-4">
                    <p className="text-[13px] font-semibold text-white/55">{t.devices.sensors}</p>
                    <ul className="mt-2 space-y-2">
                      {room.sensors.map((sensor, i) => {
                        const alarmed = sensorAlert(sensor.kind, room.id, state);
                        return (
                          <li key={i} className="flex items-center justify-between gap-3 text-[14px]">
                            <span className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ background: alarmed ? "#ff3b30" : sensorColor[sensor.kind] }}>
                                {sensorIcon(sensor.kind)}
                              </span>
                              {t.sensors[sensor.kind]}
                            </span>
                            <span className={alarmed ? "font-semibold text-[#ff6961]" : "text-[#30d158]"}>
                              {alarmed ? t.sensorState[sensor.kind === "window" ? "open" : sensor.kind === "leak" ? "leak" : "motion"] : t.sensorState.ok}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Scenes */}
        <section className="rounded-[28px] bg-white p-5 shadow-[0_10px_40px_-24px_rgba(0,0,0,0.25)] ring-1 ring-line sm:p-7" aria-labelledby="demo-scenes">
          <h2 id="demo-scenes" className="text-[17px] font-semibold tracking-tight">
            {t.scenesTitle}
          </h2>
          <div className="mt-5 grid grid-cols-5 gap-1">
            {sceneButtons.map((b) => {
              const on = scene?.id === b.id;
              return (
                <button key={b.id} type="button" onClick={() => runScene(b.id)} aria-pressed={on} className="group flex flex-col items-center gap-2 rounded-[16px] py-1 text-center">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-white transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14 ${b.tint} ${on ? "ring-[3px] ring-ink ring-offset-2" : ""}`}
                  >
                    {b.icon}
                  </span>
                  <span className="text-[11.5px] font-semibold leading-tight sm:text-[13px]">{t.scenes[b.id]}</span>
                </button>
              );
            })}
          </div>
          {scene ? (
            <ol className="mt-5 space-y-1.5" aria-live="polite">
              {scene.steps.slice(0, scene.done).map((text, i) => (
                <li key={`${scene.run}-${i}`} className="demo-step flex items-center gap-2 text-[14px] text-ink-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#34c759] text-white">
                    <CheckIcon size={13} strokeWidth={2.6} />
                  </span>
                  {text}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 text-[14px] text-mute">{t.scenesHint}</p>
          )}
        </section>

        {/* Events */}
        <section className="rounded-[28px] bg-white p-5 shadow-[0_10px_40px_-24px_rgba(0,0,0,0.25)] ring-1 ring-line sm:p-7" aria-labelledby="demo-events">
          <h2 id="demo-events" className="text-[17px] font-semibold tracking-tight">
            {t.eventsTitle}
          </h2>
          <div className="mt-5 grid grid-cols-4 gap-1">
            {eventButtons.map((b) => (
              <button key={b.id} type="button" onClick={() => trigger(b.id)} className="group flex flex-col items-center gap-2 rounded-[16px] py-1 text-center">
                <span className={`flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14 ${b.tint}`}>{b.icon}</span>
                <span className="text-[11.5px] font-semibold leading-tight sm:text-[13px]">{t.events[b.id]}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* The home right now */}
      <section className="grid grid-cols-1 gap-6 rounded-[28px] bg-white p-5 shadow-[0_10px_40px_-24px_rgba(0,0,0,0.25)] ring-1 ring-line sm:p-7 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-10" aria-labelledby="demo-status">
        <div>
          <h2 id="demo-status" className="text-[17px] font-semibold tracking-tight">
            {t.statusTitle}
          </h2>
          <p className="mt-3 text-[12px] font-medium text-mute">{t.alarm}</p>
          <div className="mt-1.5 inline-flex rounded-full bg-cloud p-1" role="radiogroup" aria-label={t.alarm}>
            {(["off", "home", "away"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={state.alarm === mode}
                onClick={() => setState((s) => ({ ...s, alarm: mode }))}
                className={`rounded-full px-3 py-1 text-[13px] font-semibold transition-colors ${state.alarm === mode ? (mode === "off" ? "bg-white text-ink shadow-sm" : "bg-[#ff3b30] text-white") : "text-mute"}`}
              >
                {t.alarmModes[mode]}
              </button>
            ))}
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          {[
            [t.stats.lights, `${roomsOf((r, s) => s.light)} / ${plan.rooms.length}`],
            [t.stats.heating, `${roomsOf((r, s) => !!r.heat && s.heat)} / ${indoor.filter((r) => r.heat).length}`],
            [t.stats.cameras, String(camCount)],
            [t.stats.sensors, String(sensorCount)],
            [t.stats.door, state.locked ? t.state.locked : t.state.unlocked],
            [t.stats.power, power],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-[13px] text-mute">{label}</dt>
              <dd className={`price mt-0.5 text-[20px] font-semibold tracking-tight ${value === t.state.unlocked ? "text-[#c25e00]" : ""}`}>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="lg:w-[260px]">
          <Link href={calcHref} className="btn btn-primary w-full">
            {t.cta}
          </Link>
          <p className="mt-2 text-center text-[13px] text-mute">{t.ctaText}</p>
        </div>
      </section>
    </div>
  );
}

// ---------- Phone pieces ----------

function Device({
  icon,
  tint,
  title,
  status,
  on,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  tint: string;
  title: string;
  status: string;
  on: boolean;
  onToggle?: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] bg-white/[0.07] p-3 sm:p-3.5">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span className={`flex h-8 w-8 shrink-0 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-colors ${on ? tint : "bg-white/10 text-white/60"}`}>{icon}</span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[15px] font-semibold [overflow-wrap:anywhere]">{title}</span>
          <span className="block text-[13px] text-white/55">{status}</span>
        </span>
        {onToggle && (
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={title}
            onClick={() => onToggle(!on)}
            className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-[#0a84ff]" : "bg-[#39393d]"}`}
          >
            <span className={`absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition-transform duration-300 ${on ? "translate-x-5" : ""}`} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Range({ label, value, min, max, color, onChange }: { label: string; value: number; min: number; max: number; color: string; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="mt-3 block">
      <span className="sr-only">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="demo-range"
        style={{ "--v": `${pct}%`, "--fill": color, "--track": "rgba(255,255,255,0.12)" } as React.CSSProperties}
      />
    </label>
  );
}

function CameraFeed({ label, small, alert }: { label: string; small?: boolean; alert?: boolean }) {
  const [now, setNow] = useState("");
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString("en-GB"));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div
      className={`relative overflow-hidden bg-[radial-gradient(120%_90%_at_70%_20%,#5d6b78_0%,#2b333b_55%,#14181c_100%)] ${small ? "h-12 w-[72px] shrink-0 rounded-[10px]" : "aspect-video rounded-[14px]"}`}
      aria-hidden="true"
    >
      <div className="absolute inset-x-[30%] bottom-0 top-[38%] rounded-t-full bg-black/35 blur-[1px]" />
      <div className="absolute left-[44%] top-[22%] h-[22%] w-[12%] rounded-full bg-black/35" />
      <span className={`absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 font-semibold text-white ${small ? "text-[8px]" : "text-[10px]"}`}>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff3b30]" />
        {label}
      </span>
      {!small && <span className="price absolute bottom-1.5 right-2 text-[10px] text-white/80">{now}</span>}
      {alert && <span className="absolute inset-0 ring-2 ring-inset ring-[#ff3b30]" />}
    </div>
  );
}

const sensorColor: Record<SensorKind, string> = { leak: "#0a84ff", motion: "#bf5af2", window: "#ff9f0a", smoke: "#8e8e93" };

function sensorIcon(kind: SensorKind) {
  if (kind === "leak") return <DropIcon size={15} />;
  if (kind === "motion") return <MotionIcon size={15} />;
  if (kind === "window") return <WindowIcon size={15} />;
  return <SmokeIcon size={15} />;
}

function sensorAlert(kind: SensorKind, roomId: RoomId, s: HomeState) {
  if (kind === "leak") return s.alerts.leak && roomId === "bath";
  if (kind === "window") return s.alerts.window && roomId === "bedroom";
  if (kind === "motion") return s.alerts.motion && roomId === "hall";
  return false;
}

// ---------- Floor plan drawing ----------

const floorOf = (id: RoomId) => (id === "kitchen" || id === "bath" ? "tile" : id === "garage" ? "concrete" : "wood");

function FloorPlan({
  plan,
  state,
  selected,
  onSelect,
  onToggleLock,
}: {
  plan: Plan;
  state: HomeState;
  selected: RoomId;
  onSelect: (id: RoomId) => void;
  onToggleLock: () => void;
}) {
  const night = state.night;
  const pal = night
    ? { wallTop: "#cfcac1", wallSide: "#5e5a54", glass: "#2f6b93", blinds: "#6b6760", grass: "#121c10", tree: "#1c2b19", treeLight: "#24361f", path: "#24221f", device: "#636366", stroke: "#0b0b0d" }
    : { wallTop: "#f4f1eb", wallSide: "#9c968c", glass: "#9fdcff", blinds: "#8e8a83", grass: "#4c7a3d", tree: "#3b6630", treeLight: "#5b8f4a", path: "#b3ab9e", device: "#c7c7cc", stroke: "#0b0b0d" };

  const shape = (s: Shape, i: number) => {
    const common = { key: i, fill: s.c ?? "#ebe5db", stroke: "rgba(0,0,0,0.22)", strokeWidth: 1.5 };
    if (s.t === "rect") return <rect {...common} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r ?? 0} />;
    if (s.t === "circle") return <circle {...common} cx={s.x} cy={s.y} r={s.r} />;
    return <ellipse {...common} cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} />;
  };

  const cone = (at: { x: number; y: number }, angle: number) => {
    const len = 210;
    const spread = 34;
    const p = (a: number) => ({ x: at.x + len * Math.cos((a * Math.PI) / 180), y: at.y + len * Math.sin((a * Math.PI) / 180) });
    const a = p(angle - spread);
    const b = p(angle + spread);
    return `M${at.x} ${at.y} L${a.x.toFixed(1)} ${a.y.toFixed(1)} A${len} ${len} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)} Z`;
  };

  const walls = (stroke: string) => (
    <>
      {plan.rooms
        .filter((r) => !r.outdoor)
        .map((r) => (
          <rect key={r.id} {...boxAttrs(r.box)} fill="none" stroke={stroke} strokeWidth="8" />
        ))}
      {plan.shells.map((b, i) => (
        <rect key={i} {...boxAttrs(b)} fill="none" stroke={stroke} strokeWidth="14" />
      ))}
    </>
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full select-none overflow-visible" aria-hidden="true">
      <defs>
        <pattern id="shd-wood" width="120" height="18" patternUnits="userSpaceOnUse">
          <rect width="120" height="18" fill="#a9825e" />
          <rect y="9" width="120" height="9" fill="#a37b57" />
          <path d="M0 0h120M0 9h120M44 0v9M104 9v9" stroke="#86613f" strokeWidth="0.8" opacity="0.5" />
        </pattern>
        <pattern id="shd-tile" width="34" height="34" patternUnits="userSpaceOnUse">
          <rect width="34" height="34" fill="#d9d4cc" />
          <path d="M0 0h34M0 0v34" stroke="#b5aea3" strokeWidth="1.5" />
        </pattern>
        <pattern id="shd-concrete" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="#8c8a86" />
          <circle cx="12" cy="18" r="1.4" fill="#7a7874" />
          <circle cx="40" cy="44" r="1.2" fill="#9a9894" />
          <circle cx="48" cy="12" r="1" fill="#7a7874" />
        </pattern>
        <radialGradient id="shd-glow" cx="50%" cy="50%" r="70%">
          <stop offset="0" stopColor="#ffe2a8" stopOpacity="0.7" />
          <stop offset="0.55" stopColor="#ffbe5c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ff9f43" stopOpacity="0.05" />
        </radialGradient>
        <radialGradient id="shd-tree" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor={pal.treeLight} />
          <stop offset="1" stopColor={pal.tree} />
        </radialGradient>
        <filter id="shd-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.45" />
        </filter>
        <filter id="shd-blur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        {plan.rooms.flatMap((r) =>
          (r.cams ?? []).map((c, i) => (
            <radialGradient key={`${r.id}-${i}`} id={`shd-cone-${r.id}-${i}`} gradientUnits="userSpaceOnUse" cx={c.at.x} cy={c.at.y} r="210">
              <stop offset="0" stopColor="#30d158" stopOpacity="0.5" />
              <stop offset="1" stopColor="#30d158" stopOpacity="0" />
            </radialGradient>
          )),
        )}
        <mask id={`shd-walls-${plan.id}`} maskUnits="userSpaceOnUse" x="-20" y="-20" width={W + 40} height={H + 40}>
          <rect x="-20" y="-20" width={W + 40} height={H + 40} fill="white" />
          {[...plan.doors, plan.entrance].map((d, i) => (
            <rect key={i} x={d.x} y={d.y} width={d.w} height={d.h} fill="black" />
          ))}
        </mask>
      </defs>

      {plan.garden && (
        <g>
          <rect x="0" y="0" width={W} height={H} rx="28" fill={pal.grass} style={{ transition: "fill .7s" }} />
          <rect {...boxAttrs(plan.garden.path)} rx="10" fill={pal.path} style={{ transition: "fill .7s" }} />
          {plan.garden.trees.map((tr, i) => (
            <circle key={i} cx={tr.x} cy={tr.y + 6} r={tr.r} fill="#000" opacity="0.35" filter="url(#shd-blur)" />
          ))}
          {plan.garden.trees.map((tr, i) => (
            <circle key={i} cx={tr.x} cy={tr.y} r={tr.r} fill="url(#shd-tree)" />
          ))}
        </g>
      )}

      {/* Shadow of the building */}
      <g transform="translate(0 14)" opacity="0.6" filter="url(#shd-blur)">
        {plan.shells.map((b, i) => (
          <rect key={i} {...boxAttrs(b)} fill="#000" />
        ))}
      </g>

      {/* Rooms */}
      {plan.rooms.map((r) => {
        const s = state.rooms[r.id]!;
        const lamp = s.light ? s.level / 100 : 0;
        const hasWindow = plan.windows.some((w) => w.room === r.id);
        const daylight = night ? 0 : hasWindow ? (r.blinds ? 0.3 + (0.7 * s.blinds) / 100 : 1) : 0.6;
        const dark = r.outdoor ? 0 : 0.88 * (1 - Math.max(daylight * 0.92, lamp));
        const glow = lamp * (night ? 1 : 0.5);
        const leak = r.id === "bath" && state.alerts.leak;
        return (
          <g key={r.id}>
            {!r.outdoor && <rect {...boxAttrs(r.box)} fill={`url(#shd-${floorOf(r.id)})`} />}
            <g filter="url(#shd-shadow)">{r.furniture.map(shape)}</g>
            <rect {...boxAttrs(r.box)} rx={r.outdoor ? 18 : 0} fill="#05060a" opacity={dark} style={{ transition: "opacity .6s" }} />
            <rect {...boxAttrs(r.box)} rx={r.outdoor ? 18 : 0} fill="url(#shd-glow)" opacity={glow} style={{ transition: "opacity .6s" }} />
            {leak && <rect {...boxAttrs(r.box)} fill="#0a84ff" className="demo-flash" />}
          </g>
        );
      })}

      {/* Walls, drawn with a little height */}
      <g mask={`url(#shd-walls-${plan.id})`}>
        <g transform="translate(0 6)">{walls("#000")}</g>
        <g transform="translate(0 3)" style={{ transition: "stroke .7s" }}>
          {walls(pal.wallSide)}
        </g>
        <g style={{ transition: "stroke .7s" }}>{walls(pal.wallTop)}</g>
      </g>

      {/* Windows with blinds */}
      {plan.windows.map((w, i) => {
        const def = plan.rooms.find((r) => r.id === w.room);
        const closed = def?.blinds ? 1 - state.rooms[w.room]!.blinds / 100 : 0;
        return (
          <g key={i}>
            <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke={pal.wallTop} strokeWidth="14" />
            <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke={pal.glass} strokeWidth="6" />
            {def?.blinds && (
              <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke={pal.blinds} strokeWidth="12" strokeDasharray="3 2" opacity={closed} style={{ transition: "opacity .3s" }} />
            )}
          </g>
        );
      })}

      {/* Cameras */}
      {plan.rooms.flatMap((r) =>
        (r.cams ?? []).map((c, i) => {
          const on = state.rooms[r.id]!.cam;
          return (
            <g key={`${r.id}-cam-${i}`}>
              <path d={cone(c.at, c.angle)} fill={`url(#shd-cone-${r.id}-${i})`} opacity={on ? 1 : 0} style={{ transition: "opacity .5s" }} />
              <circle cx={c.at.x} cy={c.at.y} r="9" fill={on ? "#30d158" : pal.device} stroke={pal.stroke} strokeWidth="2.5" />
            </g>
          );
        }),
      )}

      {/* Sensors */}
      {plan.rooms.flatMap((r) =>
        (r.sensors ?? []).map((sn, i) => {
          const alert = sensorAlert(sn.kind, r.id, state);
          const armed = sn.kind === "leak" || sn.kind === "smoke" || state.alarm !== "off";
          const color = alert ? "#ff3b30" : sensorColor[sn.kind];
          return (
            <g key={`${r.id}-s-${i}`}>
              {(alert || armed) && <circle cx={sn.at.x} cy={sn.at.y} r="6" fill="none" stroke={color} strokeWidth="2" className={alert ? "demo-ring demo-ring-fast" : "demo-ring"} />}
              <circle cx={sn.at.x} cy={sn.at.y} r={alert ? 8 : 6} fill={color} stroke={pal.stroke} strokeWidth="2" />
            </g>
          );
        }),
      )}

      {/* Speakers */}
      {plan.rooms
        .filter((r) => r.speaker)
        .map((r) => {
          const on = state.rooms[r.id]!.music;
          const at = r.speaker!;
          return (
            <g key={`${r.id}-spk`}>
              {on &&
                [0, 0.8, 1.6].map((d) => (
                  <circle key={d} cx={at.x} cy={at.y} r="9" fill="none" stroke="#bf5af2" strokeWidth="2" className="demo-ring" style={{ animationDelay: `${d}s` }} />
                ))}
              <circle cx={at.x} cy={at.y} r="9" fill={on ? "#bf5af2" : pal.device} stroke={pal.stroke} strokeWidth="2.5" />
            </g>
          );
        })}

      {/* Doorbell */}
      <g>
        {state.ringing && <circle cx={plan.doorbell.x} cy={plan.doorbell.y} r="8" fill="none" stroke={BLUE} strokeWidth="2.5" className="demo-ring demo-ring-fast" />}
        <circle cx={plan.doorbell.x} cy={plan.doorbell.y} r="8" fill={state.ringing ? BLUE : pal.device} stroke={pal.stroke} strokeWidth="2.5" />
      </g>

      {/* Selection */}
      {plan.rooms
        .filter((r) => r.id === selected)
        .map((r) => (
          <rect
            key={r.id}
            x={r.box.x + 9}
            y={r.box.y + 9}
            width={r.box.w - 18}
            height={r.box.h - 18}
            rx="14"
            fill="rgba(10,132,255,0.08)"
            stroke={BLUE}
            strokeWidth="3.5"
            className="pointer-events-none"
          />
        ))}

      {/* Click areas */}
      {plan.rooms.map((r) => (
        <rect key={`hit-${r.id}`} {...boxAttrs(r.box)} fill="transparent" className="cursor-pointer" onClick={() => onSelect(r.id)} />
      ))}

      {/* Front door lock */}
      <g className="cursor-pointer" onClick={onToggleLock}>
        <circle cx={plan.lock.x} cy={plan.lock.y} r="14" fill={state.locked ? "#30d158" : "#ff9f0a"} stroke={pal.stroke} strokeWidth="3" style={{ transition: "fill .3s" }} />
        <rect x={plan.lock.x - 5} y={plan.lock.y - 1} width="10" height="8" rx="2" fill="#fff" />
        <path
          d={state.locked ? `M${plan.lock.x - 3} ${plan.lock.y - 1}v-3a3 3 0 0 1 6 0v3` : `M${plan.lock.x - 3} ${plan.lock.y - 1}v-3a3 3 0 0 1 5.6-1.5`}
          fill="none"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function boxAttrs(b: { x: number; y: number; w: number; h: number }) {
  return { x: b.x, y: b.y, width: b.w, height: b.h };
}

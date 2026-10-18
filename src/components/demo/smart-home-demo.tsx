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
  DropIcon,
  FilmIcon,
  HouseIcon,
  LeaveIcon,
  LockIcon,
  LogoMark,
  MinusIcon,
  MoonIcon,
  MotionIcon,
  PlusIcon,
  SmokeIcon,
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
  alert?: boolean;
  camera?: boolean;
  actions: { label: string; primary?: boolean; run: () => void }[];
};

const AMBIENT = 19;
const STEP_MS = 380;
const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));

function initialState(plan: Plan): HomeState {
  const rooms: HomeState["rooms"] = {};
  for (const r of plan.rooms) {
    rooms[r.id] = {
      light: r.id === "living",
      level: r.id === "living" ? 60 : 70,
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
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => clearTimers, []);

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
        camera: true,
        actions: [
          {
            label: n.unlock,
            primary: true,
            run: () => {
              setState((s) => ({ ...s, locked: false, ringing: false }));
              show({ title: n.unlockedTitle, text: n.unlockedText, actions: [] }, 3200);
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
    { id: "morning", icon: <SunriseIcon size={20} />, tint: "bg-[#ff9f0a]" },
    { id: "away", icon: <LeaveIcon size={20} />, tint: "bg-[#0a84ff]" },
    { id: "evening", icon: <SunsetIcon size={20} />, tint: "bg-[#ff6b3d]" },
    { id: "movie", icon: <FilmIcon size={20} />, tint: "bg-[#bf5af2]" },
    { id: "night", icon: <MoonIcon size={20} />, tint: "bg-[#5e5ce6]" },
  ];
  const eventButtons: { id: EventId; icon: React.ReactNode }[] = [
    { id: "doorbell", icon: <BellIcon size={18} /> },
    { id: "leak", icon: <DropIcon size={18} /> },
    { id: "window", icon: <WindowIcon size={18} /> },
    { id: "motion", icon: <MotionIcon size={18} /> },
  ];

  return (
    <div className="container-wide grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0 space-y-4">
        {/* Plan */}
        <div className={`tile p-3 transition-colors duration-700 sm:p-5 ${state.night ? "bg-[#0b0b0d]" : "bg-cloud"}`}>
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
                      on ? (state.night ? "bg-white text-ink" : "bg-white text-ink shadow-sm ring-2 ring-accent") : state.night ? "bg-white/10 text-white/80 hover:bg-white/15" : "bg-white/60 text-ink-2 hover:bg-white"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="leading-tight">
                      <span className="block text-[14px] font-semibold sm:text-[15px]">{t.homes[id].title}</span>
                      <span className={`hidden text-[12px] sm:block ${on ? "text-mute" : "opacity-70"}`}>{t.homes[id].text}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className={`flex rounded-full p-1 ${state.night ? "bg-white/10" : "bg-white/70"}`} role="radiogroup" aria-label={`${t.day} / ${t.night}`}>
              {([false, true] as const).map((night) => (
                <button
                  key={String(night)}
                  type="button"
                  role="radio"
                  aria-checked={state.night === night}
                  onClick={() => setState((s) => ({ ...s, night }))}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    state.night === night ? (night ? "bg-white text-ink" : "bg-ink text-white") : state.night ? "text-white/70" : "text-ink-2"
                  }`}
                >
                  {night ? <MoonIcon size={15} /> : <SunIcon size={15} />}
                  {night ? t.night : t.day}
                </button>
              ))}
            </div>
          </div>

          <div className="@container relative mt-4" style={{ aspectRatio: `${W} / ${H}` }}>
            <FloorPlan plan={plan} state={state} selected={room.id} onSelect={setSelected} onToggleLock={() => setState((s) => ({ ...s, locked: !s.locked }))} />
            {plan.rooms.map((r) => {
              const s = state.rooms[r.id]!;
              const on = r.id === room.id;
              const x = r.box.x + r.box.w / 2;
              const y = r.outdoor ? r.box.y + r.box.h - 22 : r.box.y + 26;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelected(r.id)}
                  aria-pressed={on}
                  className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 overflow-hidden rounded-[10px] px-1 py-0.5 text-[9px] font-semibold leading-[1.15] shadow-sm backdrop-blur-md transition-colors @[300px]:text-[9.5px] @[400px]:px-1.5 @[400px]:text-[10.5px] @[560px]:rounded-[12px] @[560px]:px-2.5 @[560px]:py-1 @[560px]:text-[12px] ${
                    on ? "bg-accent text-white" : state.night ? "bg-black/55 text-white ring-1 ring-white/10" : "bg-white/90 text-ink ring-1 ring-black/5"
                  }`}
                  style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, maxWidth: `${(r.box.w / W) * 100 - 0.5}%` }}
                >
                  <span className="min-w-0 text-center">{t.rooms[r.id]}</span>
                  {r.heat && (
                    <span className={`hidden shrink-0 items-center gap-0.5 font-medium @[640px]:inline-flex ${on ? "text-white/85" : "opacity-70"}`}>
                      {s.heat && <span className="h-1.5 w-1.5 rounded-full bg-[#ff9500]" />}
                      {deg(s.heat ? s.target : AMBIENT)}
                    </span>
                  )}
                </button>
              );
            })}

            {toast && (
              <div className="pointer-events-none absolute inset-x-2 top-2 flex justify-center sm:inset-x-3 sm:top-3" aria-live="polite">
                <div
                  key={toast.id}
                  role="status"
                  className="demo-toast pointer-events-auto w-full max-w-[400px] rounded-[22px] bg-white/90 p-3 text-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)] ring-1 ring-black/5 backdrop-blur-xl sm:p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-ink text-white">
                      <LogoMark size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between text-[11px] text-mute">
                        <span>SmartHomeKJ</span>
                        <span>{t.notify.now}</span>
                      </div>
                      <p className={`text-[14px] font-semibold leading-snug ${toast.alert ? "text-danger" : ""}`}>{toast.title}</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{toast.text}</p>
                    </div>
                    {toast.camera && <CameraFeed small label={t.state.live} />}
                  </div>
                  {toast.actions.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {toast.actions.map((a) => (
                        <button
                          key={a.label}
                          type="button"
                          onClick={a.run}
                          className={`flex-1 rounded-full px-3 py-2 text-[13px] font-semibold ${a.primary ? "bg-accent text-white" : "bg-black/5 text-ink"}`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <p className={`mt-3 text-[13px] ${state.night ? "text-white/50" : "text-mute"}`}>{t.hint}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Scenes */}
          <section className="rounded-[24px] bg-white p-5 ring-1 ring-line sm:p-6" aria-labelledby="demo-scenes">
            <h2 id="demo-scenes" className="text-[17px] font-semibold tracking-tight">
              {t.scenesTitle}
            </h2>
            <div className="mt-4 grid grid-cols-5 gap-1.5">
              {sceneButtons.map((b) => {
                const on = scene?.id === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => runScene(b.id)}
                    aria-pressed={on}
                    className={`flex flex-col items-center gap-1.5 rounded-[16px] px-1 py-2.5 text-center transition-colors ${on ? "bg-ink text-white" : "bg-cloud hover:bg-[#ebebef]"}`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-white ${b.tint}`}>{b.icon}</span>
                    <span className="text-[11.5px] font-semibold leading-tight sm:text-[12px]">{t.scenes[b.id]}</span>
                  </button>
                );
              })}
            </div>
            {scene ? (
              <ol className="mt-4 space-y-1.5" aria-live="polite">
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
              <p className="mt-4 text-[14px] text-mute">{t.scenesHint}</p>
            )}
          </section>

          {/* Events */}
          <section className="rounded-[24px] bg-white p-5 ring-1 ring-line sm:p-6" aria-labelledby="demo-events">
            <h2 id="demo-events" className="text-[17px] font-semibold tracking-tight">
              {t.eventsTitle}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {eventButtons.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => trigger(b.id)}
                  className="flex items-center gap-2.5 rounded-[16px] bg-cloud px-3 py-3 text-left text-[14px] font-semibold transition-colors hover:bg-[#ebebef]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sm">{b.icon}</span>
                  {t.events[b.id]}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Room panel and status */}
      <div className="min-w-0 space-y-4 lg:sticky lg:top-16 lg:self-start">
        <section className="rounded-[24px] bg-white p-5 ring-1 ring-line sm:p-6" aria-labelledby="demo-room">
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label={t.roomsLabel}>
            {plan.rooms.map((r) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={r.id === room.id}
                onClick={() => setSelected(r.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${r.id === room.id ? "bg-ink text-white" : "bg-cloud text-ink-2 hover:bg-[#ebebef]"}`}
              >
                {t.rooms[r.id]}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-end justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-mute">{t.selected}</p>
              <h2 id="demo-room" className="mt-1 text-[28px] font-semibold leading-none tracking-tight">
                {t.rooms[room.id]}
              </h2>
            </div>
            {room.heat && <span className="price text-[24px] font-semibold text-[#ff9500]">{deg(rs.heat ? rs.target : AMBIENT)}</span>}
          </div>

          <div className="mt-4 space-y-2.5">
            <Device
              icon={<CategoryIcon category="lighting" size={20} />}
              tint="bg-[#ffcc00]"
              title={t.devices.light}
              status={rs.light ? `${rs.level}%` : t.state.off}
              on={rs.light}
              onToggle={(v) => setRoom(room.id, { light: v })}
            >
              {rs.light && (
                <Range label={t.state.brightness} value={rs.level} min={1} max={100} color="#ffcc00" onChange={(level) => setRoom(room.id, { level })} />
              )}
            </Device>

            {room.blinds && (
              <Device
                icon={<BlindsIcon size={20} />}
                tint="bg-[#5ac8fa]"
                title={t.devices.blinds}
                status={rs.blinds === 0 ? t.state.closed : fill(t.state.open, { n: rs.blinds })}
                on={rs.blinds > 0}
                onToggle={(v) => setRoom(room.id, { blinds: v ? 100 : 0 })}
              >
                <Range label={t.state.position} value={rs.blinds} min={0} max={100} color="#5ac8fa" onChange={(blinds) => setRoom(room.id, { blinds })} />
              </Device>
            )}

            {room.heat && (
              <Device
                icon={<ThermoIcon size={20} />}
                tint="bg-[#ff9500]"
                title={t.devices.heating}
                status={rs.heat ? fill(t.state.heatingTo, { t: deg(rs.target) }) : t.state.off}
                on={rs.heat}
                onToggle={(v) => setRoom(room.id, { heat: v })}
              >
                {rs.heat && (
                  <div className="mt-3 flex items-center justify-between rounded-[14px] bg-cloud p-1.5">
                    <button
                      type="button"
                      aria-label={t.state.cooler}
                      onClick={() => setRoom(room.id, { target: Math.max(16, rs.target - 0.5) })}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
                    >
                      <MinusIcon size={16} />
                    </button>
                    <span className="price text-[20px] font-semibold">{deg(rs.target)}</span>
                    <button
                      type="button"
                      aria-label={t.state.warmer}
                      onClick={() => setRoom(room.id, { target: Math.min(28, rs.target + 0.5) })}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
                    >
                      <PlusIcon size={16} />
                    </button>
                  </div>
                )}
              </Device>
            )}

            {room.speaker && (
              <Device
                icon={<CategoryIcon category="entertainment" size={20} />}
                tint="bg-[#af52de]"
                title={t.devices.music}
                status={rs.music ? `${t.state.playing} · ${t.state.track}` : t.state.off}
                on={rs.music}
                onToggle={(v) => setRoom(room.id, { music: v })}
              >
                {rs.music && <Range label={t.state.volume} value={rs.volume} min={0} max={100} color="#af52de" onChange={(volume) => setRoom(room.id, { volume })} />}
              </Device>
            )}

            {room.cams && (
              <Device
                icon={<CameraIcon size={20} />}
                tint="bg-[#30b14c]"
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
                icon={state.locked ? <LockIcon size={20} /> : <UnlockIcon size={20} />}
                tint={state.locked ? "bg-[#30b14c]" : "bg-[#ff9500]"}
                title={t.devices.lock}
                status={state.locked ? t.state.locked : t.state.unlocked}
                on={state.locked}
                onToggle={(v) => setState((s) => ({ ...s, locked: v }))}
              />
            )}

            {room.sensors && room.sensors.length > 0 && (
              <div className="rounded-[18px] bg-cloud p-4">
                <p className="text-[13px] font-semibold text-mute">{t.devices.sensors}</p>
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
                        <span className={alarmed ? "font-semibold text-danger" : "text-success"}>
                          {alarmed ? t.sensorState[sensor.kind === "window" ? "open" : sensor.kind === "leak" ? "leak" : "motion"] : t.sensorState.ok}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[24px] bg-white p-5 ring-1 ring-line sm:p-6" aria-labelledby="demo-status">
          <div className="flex items-center justify-between gap-3">
            <h2 id="demo-status" className="text-[17px] font-semibold tracking-tight">
              {t.statusTitle}
            </h2>
            <div className="flex rounded-full bg-cloud p-1" role="radiogroup" aria-label={t.alarm}>
              {(["off", "home", "away"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={state.alarm === mode}
                  onClick={() => setState((s) => ({ ...s, alarm: mode }))}
                  className={`rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors ${state.alarm === mode ? (mode === "off" ? "bg-white text-ink shadow-sm" : "bg-[#ff3b30] text-white") : "text-mute"}`}
                >
                  {t.alarmModes[mode]}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 text-[12px] text-mute">{t.alarm}</p>
          <dl className="mt-4 space-y-2.5 text-[15px]">
            {[
              [t.stats.lights, `${roomsOf((r, s) => s.light)} / ${plan.rooms.length}`],
              [t.stats.heating, `${roomsOf((r, s) => !!r.heat && s.heat)} / ${indoor.filter((r) => r.heat).length}`],
              [t.stats.cameras, String(camCount)],
              [t.stats.sensors, String(sensorCount)],
              [t.stats.door, state.locked ? t.state.locked : t.state.unlocked],
              [t.stats.power, power],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-mute">{label}</dt>
                <dd className={`price font-semibold ${value === t.state.unlocked ? "text-[#c25e00]" : ""}`}>{value}</dd>
              </div>
            ))}
          </dl>
          <Link href={calcHref} className="btn btn-primary mt-6 w-full">
            {t.cta}
          </Link>
          <p className="mt-2 text-center text-[13px] text-mute">{t.ctaText}</p>
        </section>
      </div>
    </div>
  );
}

// ---------- Panel pieces ----------

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
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-[18px] p-4 ring-1 transition-colors ${on ? "bg-white ring-line" : "bg-cloud ring-transparent"}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${on ? `${tint} text-white` : "bg-white text-mute"}`}>{icon}</span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[15px] font-semibold">{title}</span>
          <span className="block text-[13px] text-mute">{status}</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={title}
          onClick={() => onToggle(!on)}
          className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-[#34c759]" : "bg-[#d9d9de]"}`}
        >
          <span className={`absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-transform duration-300 ${on ? "translate-x-5" : ""}`} />
        </button>
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
        style={{ "--v": `${pct}%`, "--fill": color } as React.CSSProperties}
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
      className={`relative overflow-hidden bg-[radial-gradient(120%_90%_at_70%_20%,#5d6b78_0%,#2b333b_55%,#14181c_100%)] ${small ? "h-14 w-20 shrink-0 rounded-[10px]" : "aspect-video rounded-[14px]"}`}
      aria-hidden="true"
    >
      <div className="absolute inset-x-[30%] bottom-0 top-[38%] rounded-t-full bg-black/35 blur-[1px]" />
      <div className="absolute left-[44%] top-[22%] h-[22%] w-[12%] rounded-full bg-black/35" />
      <span className={`absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 font-semibold text-white ${small ? "text-[8px]" : "text-[10px]"}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${alert ? "bg-[#ff3b30]" : "bg-[#ff3b30]"} animate-pulse`} />
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
    ? { floor: "#1c1c1e", wall: "#55555a", furniture: "rgba(255,255,255,0.13)", furnitureLit: "rgba(70,40,0,0.22)", glass: "#2f6b93", blinds: "#5a5a5f", grass: "#0f1a11", tree: "#1b2c1e", path: "#1e1e20", device: "#636366" }
    : { floor: "#ffffff", wall: "#1d1d1f", furniture: "rgba(0,0,0,0.13)", furnitureLit: "rgba(90,55,0,0.2)", glass: "#8fd3ff", blinds: "#8e8e93", grass: "#e6efe0", tree: "#d2e3c8", path: "#f2f2f4", device: "#c7c7cc" };

  const shape = (s: Shape, i: number, stroke: string) => {
    const common = { key: i, fill: "none", stroke, strokeWidth: 2.5 };
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

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full select-none" aria-hidden="true">
      <defs>
        <radialGradient id="shd-glow" cx="50%" cy="45%" r="72%">
          <stop offset="0" stopColor="#fff3cf" />
          <stop offset="0.45" stopColor="#ffd37c" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffb547" stopOpacity="0.28" />
        </radialGradient>
        {plan.rooms.flatMap((r) =>
          (r.cams ?? []).map((c, i) => (
            <radialGradient key={`${r.id}-${i}`} id={`shd-cone-${r.id}-${i}`} gradientUnits="userSpaceOnUse" cx={c.at.x} cy={c.at.y} r="210">
              <stop offset="0" stopColor="#30d158" stopOpacity="0.45" />
              <stop offset="1" stopColor="#30d158" stopOpacity="0" />
            </radialGradient>
          )),
        )}
        <mask id={`shd-walls-${plan.id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <rect width={W} height={H} fill="white" />
          {[...plan.doors, plan.entrance].map((d, i) => (
            <rect key={i} x={d.x} y={d.y} width={d.w} height={d.h} fill="black" />
          ))}
        </mask>
      </defs>

      {plan.garden && (
        <g>
          <rect x="0" y="0" width={W} height={H} rx="24" fill={pal.grass} style={{ transition: "fill .7s" }} />
          <rect {...boxAttrs(plan.garden.path)} rx="10" fill={pal.path} />
          {plan.garden.trees.map((tr, i) => (
            <circle key={i} cx={tr.x} cy={tr.y} r={tr.r} fill={pal.tree} />
          ))}
        </g>
      )}

      {/* Rooms */}
      {plan.rooms.map((r) => {
        const s = state.rooms[r.id]!;
        const level = s.light ? s.level / 100 : 0;
        const glow = s.light ? (night ? 0.3 + 0.7 * level : 0.15 + 0.5 * level) : 0;
        const shade = !night && r.blinds ? (1 - s.blinds / 100) * 0.12 : 0;
        const leak = r.id === "bath" && state.alerts.leak;
        return (
          <g key={r.id}>
            {!r.outdoor && <rect {...boxAttrs(r.box)} fill={pal.floor} style={{ transition: "fill .7s" }} />}
            <rect {...boxAttrs(r.box)} rx={r.outdoor ? 18 : 0} fill="url(#shd-glow)" opacity={r.outdoor ? glow * 0.7 : glow} style={{ transition: "opacity .6s" }} />
            {shade > 0 && <rect {...boxAttrs(r.box)} fill="#000" opacity={shade} style={{ transition: "opacity .6s" }} />}
            {leak && <rect {...boxAttrs(r.box)} fill="#0a84ff" className="demo-flash" />}
            {r.furniture.map((f, i) => shape(f, i, night && level > 0.35 ? pal.furnitureLit : pal.furniture))}
          </g>
        );
      })}

      {/* Walls */}
      <g mask={`url(#shd-walls-${plan.id})`} style={{ transition: "stroke .7s" }}>
        {plan.rooms
          .filter((r) => !r.outdoor)
          .map((r) => (
            <rect key={r.id} {...boxAttrs(r.box)} fill="none" stroke={pal.wall} strokeWidth="6" />
          ))}
        {plan.shells.map((b, i) => (
          <rect key={i} {...boxAttrs(b)} fill="none" stroke={pal.wall} strokeWidth="12" />
        ))}
      </g>

      {/* Windows with blinds */}
      {plan.windows.map((w, i) => {
        const def = plan.rooms.find((r) => r.id === w.room);
        const closed = def?.blinds ? 1 - state.rooms[w.room]!.blinds / 100 : 0;
        return (
          <g key={i}>
            <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke={pal.floor} strokeWidth="13" />
            <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke={pal.glass} strokeWidth="5" />
            {def?.blinds && (
              <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke={pal.blinds} strokeWidth="11" strokeDasharray="3 2" opacity={closed} style={{ transition: "opacity .6s" }} />
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
              <circle cx={c.at.x} cy={c.at.y} r="8" fill={on ? "#30d158" : pal.device} stroke={pal.floor} strokeWidth="2.5" />
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
              <circle cx={sn.at.x} cy={sn.at.y} r={alert ? 8 : 6} fill={color} stroke={pal.floor} strokeWidth="2" />
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
              <circle cx={at.x} cy={at.y} r="9" fill={on ? "#bf5af2" : pal.device} stroke={pal.floor} strokeWidth="2.5" />
            </g>
          );
        })}

      {/* Doorbell */}
      <g>
        {state.ringing && <circle cx={plan.doorbell.x} cy={plan.doorbell.y} r="8" fill="none" stroke="#0a84ff" strokeWidth="2.5" className="demo-ring demo-ring-fast" />}
        <circle cx={plan.doorbell.x} cy={plan.doorbell.y} r="8" fill={state.ringing ? "#0a84ff" : pal.device} stroke={pal.floor} strokeWidth="2.5" />
      </g>

      {/* Selection */}
      {plan.rooms
        .filter((r) => r.id === selected)
        .map((r) => (
          <rect
            key={r.id}
            x={r.box.x + 7}
            y={r.box.y + 7}
            width={r.box.w - 14}
            height={r.box.h - 14}
            rx="12"
            fill="rgba(0,113,227,0.05)"
            stroke="#0071e3"
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
        <circle cx={plan.lock.x} cy={plan.lock.y} r="14" fill={state.locked ? "#30d158" : "#ff9f0a"} stroke={pal.floor} strokeWidth="3" style={{ transition: "fill .3s" }} />
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

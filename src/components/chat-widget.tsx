"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getVisitorId } from "./cookie-banner";
import { ChatIcon, CloseIcon, LogoMark, PersonIcon, SendIcon } from "./icons";

type Message = { id: string; role: "USER" | "BOT" | "ADMIN" | "SYSTEM"; content: string; createdAt: string };

type Labels = {
  open: string;
  title: string;
  subtitle: string;
  greeting: string;
  placeholder: string;
  send: string;
  aiDisclosure: string;
  privacy: string;
  human: string;
  error: string;
  you: string;
  team: string;
};

const CONV_KEY = "shkj_chat_conversation";

export function ChatWidget({
  locale,
  labels,
  botName,
  privacyHref,
  privacyLabel,
}: {
  locale: Locale;
  labels: Labels;
  botName: string;
  privacyHref: string;
  privacyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [mode, setMode] = useState<"BOT" | "HUMAN" | "CLOSED">("BOT");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const lastAt = useRef<string | null>(null);

  const append = useCallback((incoming: Message[]) => {
    if (!incoming.length) return;
    setMessages((current) => {
      const ids = new Set(current.map((m) => m.id));
      const merged = [...current, ...incoming.filter((m) => !ids.has(m.id))];
      lastAt.current = merged[merged.length - 1]?.createdAt ?? lastAt.current;
      return merged;
    });
  }, []);

  const poll = useCallback(
    async (convId: string) => {
      const params = new URLSearchParams({ conversationId: convId, visitorId: getVisitorId() });
      if (lastAt.current) params.set("after", lastAt.current);
      const res = await fetch(`/api/chat?${params}`);
      if (!res.ok) {
        if (res.status === 404) {
          localStorage.removeItem(CONV_KEY);
          setConversationId(null);
          setMessages([]);
        }
        return;
      }
      const data = await res.json();
      setMode(data.mode);
      append(data.messages);
    },
    [append],
  );

  // Restore an earlier conversation when the panel opens.
  useEffect(() => {
    if (!open) return;
    const saved = localStorage.getItem(CONV_KEY);
    if (saved && !conversationId) {
      setConversationId(saved);
      poll(saved);
    }
  }, [open, conversationId, poll]);

  // Pick up replies from the team while the panel is open.
  useEffect(() => {
    if (!open || !conversationId) return;
    const timer = setInterval(() => poll(conversationId), 4000);
    return () => clearInterval(timer);
  }, [open, conversationId, poll]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  async function send(text: string, requestHuman = false) {
    const content = text.trim();
    if ((!content && !requestHuman) || busy) return;
    setBusy(true);
    setError(false);
    if (content) {
      append([{ id: `local-${Date.now()}`, role: "USER", content, createdAt: new Date().toISOString() }]);
    }
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId, visitorId: getVisitorId(), message: content, locale, requestHuman }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem(CONV_KEY, data.conversationId);
      }
      setMode(data.mode);
      // Replace the optimistic message with the stored one.
      setMessages((current) => current.filter((m) => !m.id.startsWith("local-")));
      append(data.messages);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const greeting = labels.greeting.replace("{bot}", botName);
  const [privacyBefore, privacyAfter] = labels.privacy.split("{privacy}");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="support-chat"
        aria-label={open ? labels.title : labels.open}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        {!open && <span className="pulse-ring absolute inset-0 rounded-full bg-accent/40" aria-hidden="true" />}
        {open ? <CloseIcon size={22} /> : <ChatIcon size={22} />}
      </button>

      {open && (
        <section
          id="support-chat"
          aria-label={labels.title}
          className="fixed bottom-24 right-3 z-50 flex h-[min(620px,calc(100dvh-120px))] w-[calc(100vw-24px)] max-w-[380px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.25)] ring-1 ring-black/5 sm:right-5"
          style={{ animation: "chatIn .35s cubic-bezier(.28,.11,.32,1)" }}
        >
          <header className="flex items-center gap-3 border-b border-black/5 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cloud">
              {mode === "HUMAN" ? <PersonIcon size={20} /> : <LogoMark size={22} />}
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold leading-tight">{mode === "HUMAN" ? labels.team : botName}</h2>
              <p className="flex items-center gap-1.5 text-[12px] text-mute">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                {labels.subtitle}
              </p>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            <p className="rounded-2xl bg-cloud px-4 py-3 text-[12px] leading-snug text-mute">{labels.aiDisclosure}</p>
            <Bubble role="BOT" content={greeting} />
            {messages.map((m) => (
              <Bubble key={m.id} role={m.role} content={m.content} />
            ))}
            {busy && (
              <div className="flex gap-1 px-3 py-2" aria-label="…">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full bg-faint"
                    style={{ animation: `typing 1s ${i * 0.15}s infinite ease-in-out` }}
                  />
                ))}
              </div>
            )}
            {error && <p className="text-center text-[12px] text-danger">{labels.error}</p>}
          </div>

          <div className="border-t border-black/5 p-3">
            {mode === "BOT" && messages.length > 0 && (
              <button
                type="button"
                onClick={() => send("", true)}
                disabled={busy}
                className="mb-2 w-full rounded-full bg-cloud px-3 py-1.5 text-[12px] text-ink-2 hover:bg-line/60"
              >
                {labels.human}
              </button>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-end gap-2"
            >
              <label htmlFor="chat-input" className="sr-only">
                {labels.placeholder}
              </label>
              <textarea
                id="chat-input"
                rows={1}
                value={input}
                maxLength={1500}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder={labels.placeholder}
                className="max-h-28 flex-1 resize-none rounded-[20px] bg-cloud px-4 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-accent/40"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-opacity disabled:opacity-30"
                aria-label={labels.send}
              >
                <SendIcon size={18} />
              </button>
            </form>
            <p className="mt-2 px-1 text-[11px] text-faint">
              {privacyBefore}
              <Link href={privacyHref} className="underline">
                {privacyLabel}
              </Link>
              {privacyAfter}
            </p>
          </div>
          <style>{`@keyframes chatIn{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}@keyframes typing{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}`}</style>
        </section>
      )}
    </>
  );
}

function Bubble({ role, content }: { role: Message["role"]; content: string }) {
  if (role === "SYSTEM") {
    return <p className="py-1 text-center text-[12px] text-mute">{content}</p>;
  }
  const mine = role === "USER";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-[20px] px-4 py-2.5 text-[15px] leading-snug ${
          mine ? "rounded-br-md bg-accent text-white" : role === "ADMIN" ? "rounded-bl-md bg-ink text-white" : "rounded-bl-md bg-cloud text-ink"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

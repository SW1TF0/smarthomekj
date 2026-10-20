"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { faqAnswer, postChatMessage, requestHuman, startChat, useSettings, watchChat, type ChatMode, type ChatRole } from "@/lib/store";
import { getVisitorId } from "./cookie-banner";
import { ChatIcon, CloseIcon, LogoMark, PersonIcon, SendIcon } from "./icons";

type Message = { id: string; role: ChatRole; content: string };

type Labels = {
  open: string;
  title: string;
  subtitle: string;
  greeting: string;
  placeholder: string;
  send: string;
  aiDisclosure: string;
  fallback: string;
  privacy: string;
  human: string;
  humanRequested: string;
  error: string;
  you: string;
  team: string;
};

const CONV_KEY = "shkj_chat_conversation";

export function ChatWidget({
  locale,
  labels,
  privacyHref,
  privacyLabel,
}: {
  locale: Locale;
  labels: Labels;
  privacyHref: string;
  privacyLabel: string;
}) {
  const settings = useSettings();
  const botName = settings.chatBotName;
  // On phones the floating button would cover the order form and totals.
  const onCheckout = /\/(cart|checkout)\/?$/.test(usePathname());
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>("BOT");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Restore an earlier conversation when the panel opens.
  useEffect(() => {
    if (!open || conversationId) return;
    const saved = localStorage.getItem(CONV_KEY);
    if (saved) setConversationId(saved);
  }, [open, conversationId]);

  // Live updates: bot answers and replies from the team arrive through Firestore.
  useEffect(() => {
    if (!conversationId) return;
    return watchChat(
      conversationId,
      setMode,
      (rows) => {
        setMessages(rows);
        setPending([]);
      },
      () => {
        localStorage.removeItem(CONV_KEY);
        setConversationId(null);
        setMessages([]);
      },
    );
  }, [conversationId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, busy, open]);

  async function ensureConversation() {
    if (conversationId) return conversationId;
    const id = await startChat(getVisitorId(), locale);
    localStorage.setItem(CONV_KEY, id);
    setConversationId(id);
    return id;
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setBusy(true);
    setError(false);
    setPending([{ id: "pending", role: "USER", content }]);
    setInput("");
    try {
      const id = await ensureConversation();
      await postChatMessage(id, "USER", content);
      if (mode === "BOT") {
        const answer = await faqAnswer(content, locale);
        await postChatMessage(id, "BOT", answer ?? labels.fallback.replace("{email}", settings.email).replace("{phone}", settings.phone));
      }
    } catch {
      setPending([]);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function askForPerson() {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const id = await ensureConversation();
      await requestHuman(id, "", "");
      await postChatMessage(id, "BOT", labels.humanRequested);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (!settings.chatEnabled) return null;

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
        className={`fixed bottom-[max(16px,env(safe-area-inset-bottom))] right-4 z-50 h-12 w-12 items-center justify-center rounded-full bg-ink text-white shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-transform duration-300 hover:scale-105 active:scale-95 sm:bottom-5 sm:right-5 sm:h-14 sm:w-14 ${onCheckout && !open ? "hidden md:flex" : "flex"}`}
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
            {[...messages, ...pending].map((m) => (
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
                onClick={askForPerson}
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

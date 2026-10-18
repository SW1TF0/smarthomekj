"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export const CONSENT_COOKIE = "shkj_consent";
export const CONSENT_VERSION = "1";
const OPEN_EVENT = "shkj:cookie-settings";

export type Consent = { analytics: boolean; marketing: boolean; version: string };

export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`${CONSENT_COOKIE}=([^;]+)`));
  if (!match) return null;
  try {
    const value = JSON.parse(decodeURIComponent(match[1])) as Consent;
    return value.version === CONSENT_VERSION ? value : null;
  } catch {
    return null;
  }
}

/** Ask for consent before loading any optional script: `if (hasConsent("analytics")) ...` */
export function hasConsent(kind: "analytics" | "marketing") {
  return !!readConsent()?.[kind];
}

export function getVisitorId() {
  let id = localStorage.getItem("shkj_visitor");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("shkj_visitor", id);
  }
  return id;
}

type Labels = {
  title: string;
  text: string;
  acceptAll: string;
  rejectAll: string;
  customize: string;
  save: string;
  necessary: string;
  necessaryText: string;
  analytics: string;
  analyticsText: string;
  marketing: string;
  marketingText: string;
  policy: string;
};

export function CookieBanner({ labels, policyHref }: { labels: Labels; policyHref: string }) {
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) setVisible(true);
    else {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
    }
    const open = () => {
      setVisible(true);
      setDetails(true);
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  function save(choice: { analytics: boolean; marketing: boolean }) {
    const consent: Consent = { ...choice, version: CONSENT_VERSION };
    const maxAge = 60 * 60 * 24 * 180;
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(consent))}; path=/; max-age=${maxAge}; samesite=lax`;
    fetch("/api/consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...consent, visitorId: getVisitorId() }),
    }).catch(() => {});
    setAnalytics(choice.analytics);
    setMarketing(choice.marketing);
    setVisible(false);
    setDetails(false);
    window.dispatchEvent(new CustomEvent("shkj:consent", { detail: consent }));
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-[680px] rounded-[24px] bg-white/90 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.18)] ring-1 ring-black/5 backdrop-blur-xl md:bottom-6"
    >
      <h2 id="cookie-title" className="text-[19px] font-semibold tracking-tight">
        {labels.title}
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
        {labels.text}{" "}
        <Link href={policyHref} className="text-link hover:underline">
          {labels.policy}
        </Link>
      </p>

      {details && (
        <div className="mt-4 space-y-3">
          <Toggle label={labels.necessary} text={labels.necessaryText} checked disabled />
          <Toggle label={labels.analytics} text={labels.analyticsText} checked={analytics} onChange={setAnalytics} />
          <Toggle label={labels.marketing} text={labels.marketingText} checked={marketing} onChange={setMarketing} />
        </div>
      )}

      {/* Accept and reject have equal weight, as EDPB guidance requires. */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button type="button" className="btn btn-dark btn-sm flex-1" onClick={() => save({ analytics: false, marketing: false })}>
          {labels.rejectAll}
        </button>
        {details ? (
          <button type="button" className="btn btn-dark btn-sm flex-1" onClick={() => save({ analytics, marketing })}>
            {labels.save}
          </button>
        ) : (
          <button type="button" className="btn btn-sm flex-1 bg-cloud hover:bg-line/60" onClick={() => setDetails(true)}>
            {labels.customize}
          </button>
        )}
        <button type="button" className="btn btn-dark btn-sm flex-1" onClick={() => save({ analytics: true, marketing: true })}>
          {labels.acceptAll}
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  text,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  text: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-start justify-between gap-4 rounded-2xl bg-cloud p-4 ${disabled ? "opacity-70" : "cursor-pointer"}`}>
      <span>
        <span className="block text-[14px] font-semibold">{label}</span>
        <span className="block text-[13px] text-mute">{text}</span>
      </span>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className="relative mt-1 h-[26px] w-[44px] shrink-0 rounded-full bg-line transition-colors peer-checked:bg-success peer-focus-visible:ring-2 peer-focus-visible:ring-accent after:absolute after:left-[2px] after:top-[2px] after:h-[22px] after:w-[22px] after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-[18px]"
      />
    </label>
  );
}

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button type="button" className="hover:text-ink hover:underline" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      {label}
    </button>
  );
}

"use client";

import { useSettings } from "@/lib/store";

export function ContactInfo({ labels }: { labels: { title: string; phone: string; hours: string; address: string } }) {
  const settings = useSettings();
  return (
    <aside className="tile h-fit bg-cloud p-8">
      <h2 className="text-[21px] font-semibold tracking-tight">{labels.title}</h2>
      <dl className="mt-5 space-y-4 text-[15px]">
        <div>
          <dt className="text-mute">Email</dt>
          <dd>
            <a href={`mailto:${settings.email}`} className="text-link">
              {settings.email}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-mute">{labels.phone}</dt>
          <dd>
            <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="text-link">
              {settings.phone}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-mute">{labels.hours}</dt>
          <dd>{settings.workingHours}</dd>
        </div>
        <div>
          <dt className="text-mute">{labels.address}</dt>
          <dd>
            {settings.address}
            <br />
            {settings.city}
          </dd>
        </div>
      </dl>
    </aside>
  );
}

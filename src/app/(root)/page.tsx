import type { Metadata } from "next";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = { title: "SmartHomeKJ", robots: { index: false } };

// The site always opens in Bulgarian; visitors switch to English or Turkish in the menu.
// On Vercel, vercel.json already redirects "/" to "/bg/" before this page loads; this is the fallback for other hosts.
const script = `location.replace(${JSON.stringify(`${base}/bg/`)});`;

export default function RootRedirect() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${base}/bg/`} />
      <script dangerouslySetInnerHTML={{ __html: script }} />
      <p style={{ padding: 40, textAlign: "center" }}>
        <a href={`${base}/bg/`}>SmartHomeKJ</a>
      </p>
    </>
  );
}

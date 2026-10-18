import type { Metadata } from "next";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = { title: "SmartHomeKJ", robots: { index: false } };

// Static hosting has no server to pick a language, so the browser does it: Bulgarian unless the visitor uses English or Turkish.
const script = `(function(){var l=(navigator.language||"bg").slice(0,2).toLowerCase();var t=l==="en"||l==="tr"?l:"bg";location.replace(${JSON.stringify(base)}+"/"+t+"/");})();`;

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

/** Re-mounted on every navigation, so each page rises in softly (globals.css .page-enter; off with reduced motion). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}

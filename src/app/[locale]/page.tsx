import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeShowcase } from "@/components/home-showcase";
import { ProductCard } from "@/components/product-card";
import { CategoryWidget } from "@/components/category-widget";
import { Reveal } from "@/components/reveal";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { getProducts } from "@/lib/products";

const sceneStyles = [
  { bg: "bg-[#ff9f0a] text-white", icon: "M12 3v2M5.6 5.6l1.4 1.4M3 12h2M19 12h2M17 7l1.4-1.4M7 16a5 5 0 1 1 10 0M3 20h18" },
  { bg: "bg-[#0a84ff] text-white", icon: "M14 4h5v16h-5M10 12h9M6 8l-4 4 4 4" },
  { bg: "bg-[#bf5af2] text-white", icon: "M4 6h16v12H4zM4 10h16M8 6v4M12 6v4M16 6v4" },
  { bg: "bg-[#5e5ce6] text-white", icon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" },
];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const h = dict.home;
  const featured = (await getProducts(locale, { featured: true })).slice(0, 3);
  const [titleLine1, titleLine2] = h.title.split("\n");
  const [introLine1, introLine2] = h.introTitle.split("\n");
  const tileLabels = Object.fromEntries(h.tiles.map((t) => [t.key, t.title]));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-12 text-center md:pt-24">
        <div className="container-apple relative">
          <p className="text-[17px] font-semibold text-mute md:text-[19px]">{h.eyebrow}</p>
          <h1 className="headline-hero mt-3">
            {titleLine1}
            <br />
            <span className="text-mute">{titleLine2}</span>
          </h1>
          <p className="lead mx-auto mt-6 max-w-[720px] text-ink-2">{h.subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href={`/${locale}/contact`} className="btn btn-primary">
              {h.ctaPrimary}
            </Link>
            <Link href={`/${locale}/shop`} className="link-chevron text-[19px]">
              {h.ctaSecondary}
            </Link>
          </div>
        </div>
        <div className="container-wide relative mt-14 md:mt-20">
          <HomeShowcase labels={tileLabels} app={h.app} scenes={h.scenes.map((s) => s.title)} />
        </div>
      </section>

      {/* Intro statement */}
      <section className="section">
        <Reveal className="container-apple text-center">
          <h2 className="headline-xl">
            {introLine1}
            <br />
            <span className="text-mute">{introLine2}</span>
          </h2>
          <p className="lead mx-auto mt-8 max-w-[760px] text-mute">{h.introText}</p>
        </Reveal>
      </section>

      {/* Category tiles */}
      <section className="pb-24" aria-label={dict.nav.solutions}>
        <div className="container-wide grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {h.tiles.map((tile, i) => (
            <Reveal key={tile.key} delay={(i % 3) * 80}>
              <Link
                href={`/${locale}/solutions#${tile.key}`}
                className="tile tile-hover flex h-full min-h-[380px] flex-col justify-between bg-cloud p-8 md:min-h-[440px] md:p-10"
              >
                <div>
                  <h3 className="headline-md">{tile.title}</h3>
                  <p className="mt-3 max-w-[340px] text-[17px] text-mute">{tile.text}</p>
                  <span className="link-chevron mt-4 inline-block text-[17px]">{dict.common.learnMore}</span>
                </div>
                <div className="mt-10 flex justify-center">
                  <CategoryWidget category={tile.key} title={tile.title} app={h.app} />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Scenes */}
      <section className="section bg-night text-white">
        <div className="container-apple">
          <Reveal className="text-center">
            <h2 className="headline-xl">{h.scenesTitle}</h2>
            <p className="lead mx-auto mt-5 max-w-[640px] text-white/60">{h.scenesText}</p>
          </Reveal>
          <div className="mt-16 grid gap-4 md:grid-cols-2">
            {h.scenes.map((scene, i) => (
              <Reveal key={scene.title} delay={i * 80}>
                <div className="tile h-full bg-night-2 p-8 md:p-10">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full ${sceneStyles[i % 4].bg}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={sceneStyles[i % 4].icon} />
                    </svg>
                  </span>
                  <h3 className="mt-6 text-[28px] font-semibold tracking-tight">{scene.title}</h3>
                  <p className="mt-2 text-[17px] text-white/60">{scene.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section">
        <div className="container-apple">
          <Reveal>
            <h2 className="headline-lg text-center">{h.statsTitle}</h2>
          </Reveal>
          <dl className="mt-16 grid grid-cols-2 gap-y-12 md:grid-cols-4">
            {h.stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 80} className="text-center">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block text-[56px] font-bold leading-none tracking-tight md:text-[72px]">{s.value}</span>
                  <span className="mt-2 block text-[15px] text-mute">{s.label}</span>
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* Steps */}
      <section className="section bg-cloud">
        <div className="container-apple">
          <Reveal>
            <h2 className="headline-lg text-center">{h.stepsTitle}</h2>
          </Reveal>
          <ol className="mt-16 grid gap-4 md:grid-cols-4">
            {h.steps.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 80} className="tile bg-white p-8">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-[15px] font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-6 text-[21px] font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-[15px] text-mute">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="section">
          <div className="container-wide">
            <Reveal className="text-center">
              <h2 className="headline-lg">{h.featuredTitle}</h2>
              <p className="lead mx-auto mt-4 max-w-[640px] text-mute">{h.featuredText}</p>
            </Reveal>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {featured.map((p, i) => (
                <Reveal key={p.id} delay={i * 80}>
                  <ProductCard product={p} locale={locale} dict={dict} />
                </Reveal>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href={`/${locale}/shop`} className="link-chevron text-[19px]">
                {dict.common.shopNow}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Ecosystem */}
      <section className="section bg-night text-white">
        <Reveal className="container-apple text-center">
          <h2 className="headline-lg">{h.ecosystemTitle}</h2>
          <p className="lead mx-auto mt-4 max-w-[640px] text-white/60">{h.ecosystemText}</p>
          <ul className="mt-12 flex flex-wrap justify-center gap-3">
            {["Apple Home", "Google Home", "Amazon Alexa", "Matter", "Thread", "Zigbee", "Shelly", "Philips Hue", "Aqara", "Sonos"].map((name) => (
              <li key={name} className="rounded-full bg-white/10 px-5 py-2.5 text-[15px] font-medium ring-1 ring-white/10">
                {name}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="section">
        <Reveal className="container-apple text-center">
          <h2 className="headline-xl">{h.ctaTitle}</h2>
          <p className="lead mx-auto mt-5 max-w-[600px] text-mute">{h.ctaText}</p>
          <Link href={`/${locale}/contact`} className="btn btn-primary mt-10 !px-8 !py-4 !text-[19px]">
            {h.ctaPrimary}
          </Link>
        </Reveal>
      </section>
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeShowcase } from "@/components/home-showcase";
import { CategoryIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { categoryTheme } from "@/components/product-visual";
import { Reveal } from "@/components/reveal";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { getProducts } from "@/lib/products";

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
        <div className="hero-glow" aria-hidden="true" />
        <div className="container-apple relative">
          <p className="text-[19px] font-semibold text-[#bf4800] md:text-[21px]">{h.eyebrow}</p>
          <h1 className="headline-hero mt-2">
            {titleLine1}
            <br />
            <span className="text-gradient">{titleLine2}</span>
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
          <HomeShowcase labels={tileLabels} />
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
          {h.tiles.map((tile, i) => {
            const theme = categoryTheme[tile.key];
            return (
              <Reveal key={tile.key} delay={(i % 3) * 80}>
                <Link
                  href={`/${locale}/solutions#${tile.key}`}
                  className={`tile tile-hover flex h-full min-h-[340px] flex-col justify-between bg-gradient-to-br ${theme.bg} p-8 md:min-h-[420px] md:p-10`}
                >
                  <div>
                    <h3 className="headline-md">{tile.title}</h3>
                    <p className="mt-3 max-w-[320px] text-[17px] text-ink-2">{tile.text}</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="link-chevron text-[17px]">{dict.common.learnMore}</span>
                    <span
                      className="flex h-24 w-24 items-center justify-center rounded-[30%] bg-white/70 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.25)] ring-1 ring-black/5 backdrop-blur md:h-28 md:w-28"
                      aria-hidden="true"
                    >
                      <CategoryIcon category={tile.key} size={48} className={theme.icon === "text-white" ? "text-ink" : theme.icon} strokeWidth={1.3} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
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
                <div className="tile h-full bg-night-2 p-8 ring-1 ring-white/10 md:p-10">
                  <span className="text-[13px] font-semibold text-white/40">0{i + 1}</span>
                  <h3 className="mt-3 text-[28px] font-semibold tracking-tight">
                    <span className={i % 2 ? "text-gradient" : "text-gradient-warm"}>{scene.title}</span>
                  </h3>
                  <p className="mt-3 text-[17px] text-white/70">{scene.text}</p>
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
                  <span className="text-gradient block text-[56px] font-bold leading-none tracking-tight md:text-[72px]">{s.value}</span>
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

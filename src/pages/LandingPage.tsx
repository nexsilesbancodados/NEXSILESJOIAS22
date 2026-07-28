import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
  AnimatePresence,
  wrap,
} from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Check,
  Star,
  Instagram,
  Play,
  Zap,
  Heart,
} from "lucide-react";

import warm01 from "@/assets/landing-warm-01.jpg";
import warm02 from "@/assets/landing-warm-02.jpg";
import warm03 from "@/assets/landing-warm-03.jpg";
import warm04 from "@/assets/landing-warm-04.jpg";
import warm05 from "@/assets/landing-warm-05.jpg";
import warm06 from "@/assets/landing-warm-06.jpg";
import heroJewel from "@/assets/landing-hero-jewelry.webp";
import dashMock from "@/assets/landing-dashboard-mockup.webp";
import pdvMock from "@/assets/landing-pdv-mockup.webp";
import lojaMock from "@/assets/landing-loja-mockup.webp";
import personaLoj from "@/assets/landing-persona-lojista.webp";
import personaRev from "@/assets/landing-persona-revendedora.webp";
import tAmanda from "@/assets/testimonial-amanda.jpg";
import tCarla from "@/assets/testimonial-carla.jpg";
import tFernanda from "@/assets/testimonial-fernanda.jpg";
import tJuliana from "@/assets/testimonial-juliana.jpg";
import tPatricia from "@/assets/testimonial-patricia.jpg";

/* ---------- palette (warm on white) ----------
   bg      #ffffff
   ink     #1a0f0a
   ember   #ea580c  (primary warm)
   coral   #f43f5e
   amber   #f59e0b
   sand    #fef3c7 / #fde68a
------------------------------------------------- */

const EASE = [0.22, 1, 0.36, 1] as const;

/* ============ CURSOR ============ */
function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 400, damping: 35 });
  const sy = useSpring(y, { stiffness: 400, damping: 35 });
  const [hover, setHover] = useState(false);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement;
      setHover(!!t.closest("a,button,[data-cursor]"));
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);
  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden md:block"
      style={{ x: sx, y: sy }}
    >
      <motion.div
        className="rounded-full bg-[#ea580c] mix-blend-multiply"
        animate={{
          width: hover ? 56 : 14,
          height: hover ? 56 : 14,
          x: hover ? -28 : -7,
          y: hover ? -28 : -7,
          opacity: hover ? 0.9 : 0.7,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
    </motion.div>
  );
}

/* ============ SCROLL PROGRESS ============ */
function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const w = useSpring(scrollYProgress, { stiffness: 120, damping: 20 });
  return (
    <motion.div
      className="fixed left-0 top-0 z-[90] h-[3px] w-full origin-left bg-gradient-to-r from-[#f59e0b] via-[#ea580c] to-[#f43f5e]"
      style={{ scaleX: w }}
    />
  );
}

/* ============ NAV ============ */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onS = () => setScrolled(window.scrollY > 40);
    onS();
    window.addEventListener("scroll", onS);
    return () => window.removeEventListener("scroll", onS);
  }, []);
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-[#1a0f0a]/8"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 lg:px-10">
        <Link to="/landing" className="flex items-center gap-2" data-cursor>
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#f59e0b] to-[#ea580c] text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-[#1a0f0a]">
            Nexsiles
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {[
            ["Sobre", "#sobre"],
            ["Recursos", "#recursos"],
            ["Depoimentos", "#depoimentos"],
            ["Plano", "#plano"],
            ["FAQ", "#faq"],
          ].map(([l, h]) => (
            <a
              key={h}
              href={h}
              className="group relative text-sm text-[#1a0f0a]/70 transition hover:text-[#1a0f0a]"
              data-cursor
            >
              {l}
              <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-[#ea580c] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>
        <Link
          to="/auth"
          className="group inline-flex items-center gap-2 rounded-full bg-[#1a0f0a] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#ea580c]"
          data-cursor
        >
          Começar
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
        </Link>
      </div>
    </motion.header>
  );
}

/* ============ REVEAL TEXT ============ */
function Reveal({
  children,
  delay = 0,
  className = "",
  as: As = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: any;
}) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      className={className}
    >
      <As>{children}</As>
    </motion.div>
  );
}

/* ============ SPLIT WORDS ============ */
function SplitWords({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pr-[0.25em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.9, ease: EASE, delay: i * 0.06 }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ============ VELOCITY MARQUEE ============ */
function Marquee({
  children,
  baseVelocity = 40,
  className = "",
}: {
  children: React.ReactNode;
  baseVelocity?: number;
  className?: string;
}) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smooth = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const vFactor = useTransform(smooth, [0, 1000], [0, 5], { clamp: false });
  const x = useTransform(baseX, (v) => `${wrap(-25, -75, v)}%`);
  const dir = useRef(1);
  useAnimationFrame((_t, delta) => {
    let m = ((baseVelocity * delta) / 1000) * dir.current;
    if (vFactor.get() < 0) dir.current = -1;
    else if (vFactor.get() > 0) dir.current = 1;
    m += dir.current * m * vFactor.get();
    baseX.set(baseX.get() + m);
  });
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div className="flex whitespace-nowrap" style={{ x }}>
        <span className="mr-12 inline-block">{children}</span>
        <span className="mr-12 inline-block">{children}</span>
        <span className="mr-12 inline-block">{children}</span>
        <span className="mr-12 inline-block">{children}</span>
      </motion.div>
    </div>
  );
}

/* ============ HERO ============ */
function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -220]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const rot = useTransform(scrollYProgress, [0, 1], [0, 12]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-[100vh] overflow-hidden bg-white pb-24 pt-32 lg:pt-40"
    >
      {/* radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#fef3c7] via-[#fed7aa]/50 to-transparent blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-[#f43f5e]/10 blur-3xl" />
      </div>

      {/* floating jewel images */}
      <motion.img
        src={warm01}
        alt=""
        style={{ y: y1, rotate: rot }}
        className="absolute right-[4%] top-[18%] hidden h-52 w-40 rounded-2xl object-cover shadow-2xl md:block lg:h-72 lg:w-56"
      />
      <motion.img
        src={warm04}
        alt=""
        style={{ y: y2 }}
        className="absolute left-[3%] top-[60%] hidden h-44 w-36 rounded-2xl object-cover shadow-xl md:block lg:h-60 lg:w-48"
      />
      <motion.img
        src={warm06}
        alt=""
        style={{ y: y3, scale }}
        className="absolute right-[8%] top-[72%] hidden h-36 w-36 rounded-full object-cover shadow-xl lg:block"
      />

      <motion.div
        style={{ opacity }}
        className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-10"
      >
        <Reveal className="mb-8 flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ea580c]/20 bg-[#fef3c7]/60 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#9a3412]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ea580c]" />
            Sistema completo · Semijoias
          </span>
        </Reveal>

        <h1 className="max-w-5xl font-serif text-[clamp(3rem,10vw,10rem)] font-normal leading-[0.95] tracking-[-0.03em] text-[#1a0f0a]">
          <div className="overflow-hidden">
            <SplitWords text="Sua marca," />
          </div>
          <div className="overflow-hidden">
            <SplitWords
              text="brilhando"
              className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#f59e0b] via-[#ea580c] to-[#f43f5e]"
            />
          </div>
          <div className="overflow-hidden">
            <SplitWords text="sem parar." />
          </div>
        </h1>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr,1fr] lg:items-end">
          <Reveal delay={0.4}>
            <p className="max-w-xl text-lg text-[#1a0f0a]/70 lg:text-xl">
              O sistema que gerencia estoque, PDV, revendedoras, maletas em consignação,
              catálogos e loja online — tudo em um só lugar, feito para quem vive de
              semijoia.
            </p>
          </Reveal>
          <Reveal delay={0.5}>
            <div className="flex flex-col items-start gap-4 sm:flex-row lg:justify-end">
              <Link
                to="/auth"
                className="group inline-flex items-center gap-3 rounded-full bg-[#1a0f0a] px-7 py-4 text-sm font-medium text-white transition hover:bg-[#ea580c]"
                data-cursor
              >
                Começar agora
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 transition group-hover:rotate-45">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </Link>
              <a
                href="#recursos"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#1a0f0a] underline-offset-4 hover:underline"
                data-cursor
              >
                <Play className="h-4 w-4" /> Ver como funciona
              </a>
            </div>
          </Reveal>
        </div>

        {/* stats */}
        <Reveal delay={0.7} className="mt-24 grid grid-cols-2 gap-8 border-t border-[#1a0f0a]/10 pt-10 md:grid-cols-4">
          {[
            ["+2.4k", "lojistas ativas"],
            ["R$ 38M", "processados/mês"],
            ["99.9%", "uptime garantido"],
            ["4.9★", "avaliação média"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="font-serif text-4xl text-[#1a0f0a] lg:text-5xl">{n}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-[#1a0f0a]/50">
                {l}
              </div>
            </div>
          ))}
        </Reveal>
      </motion.div>
    </section>
  );
}

/* ============ MARQUEE STRIP ============ */
function Strip() {
  return (
    <section className="relative border-y border-[#1a0f0a]/10 bg-gradient-to-r from-[#fef3c7] via-white to-[#fed7aa]/60 py-8">
      <Marquee baseVelocity={30}>
        <span className="flex items-center gap-8 font-serif text-4xl italic text-[#1a0f0a] md:text-6xl">
          Estoque
          <Sparkles className="h-6 w-6 text-[#ea580c]" />
          Maletas
          <Sparkles className="h-6 w-6 text-[#f43f5e]" />
          Revendedoras
          <Sparkles className="h-6 w-6 text-[#f59e0b]" />
          Catálogo Online
          <Sparkles className="h-6 w-6 text-[#ea580c]" />
          PDV
          <Sparkles className="h-6 w-6 text-[#f43f5e]" />
          Loja Virtual
          <Sparkles className="h-6 w-6 text-[#f59e0b]" />
        </span>
      </Marquee>
    </section>
  );
}

/* ============ ABOUT ============ */
function About() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [80, -80]);
  return (
    <section ref={ref} id="sobre" className="relative bg-white py-32 lg:py-44">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid gap-16 lg:grid-cols-[1fr,1.3fr] lg:gap-24">
          <Reveal>
            <div className="text-xs uppercase tracking-[0.3em] text-[#ea580c]">
              ( 01 ) Sobre
            </div>
            <h2 className="mt-8 font-serif text-5xl leading-[1.05] text-[#1a0f0a] lg:text-7xl">
              Nascemos <em className="italic text-[#ea580c]">dentro</em> do balcão da
              semijoia.
            </h2>
            <p className="mt-8 max-w-md text-[#1a0f0a]/70">
              Cansadas de planilhas, cadernos e apps genéricos, criamos o Nexsiles com
              lojistas reais — cada tela, cada botão, cada relatório resolve uma dor que
              nasceu no chão de loja.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              {["Feito no Brasil", "Suporte humano", "Atualizações semanais"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[#1a0f0a]/15 px-4 py-2 text-xs text-[#1a0f0a]/70"
                >
                  {t}
                </span>
              ))}
            </div>
          </Reveal>

          <div className="relative">
            <motion.img
              src={warm05}
              alt="Lojista de semijoia"
              style={{ y: imgY }}
              className="aspect-[4/5] w-full rounded-2xl object-cover shadow-2xl"
              loading="lazy"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -6 }}
              whileInView={{ opacity: 1, scale: 1, rotate: -3 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
              className="absolute -bottom-6 -left-6 w-64 rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-[#1a0f0a]/5"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#fef3c7]">
                  <Heart className="h-5 w-5 text-[#ea580c]" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#1a0f0a]/50">
                    Satisfação
                  </div>
                  <div className="font-serif text-2xl text-[#1a0f0a]">98%</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#1a0f0a]/60">
                das lojistas indicam o Nexsiles pra outra colega.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ FEATURES ============ */
const FEATURES = [
  {
    n: "01",
    t: "Estoque em tempo real",
    d: "Cada peça rastreada com custo, margem e alertas de reposição inteligente.",
    img: warm03,
  },
  {
    n: "02",
    t: "PDV que voa",
    d: "Venda em 3 toques, com fiado, PIX, cartão e comprovante no WhatsApp.",
    img: pdvMock,
  },
  {
    n: "03",
    t: "Maletas em consignação",
    d: "Assinatura digital, fechamento automático e comissão sem dor de cabeça.",
    img: warm01,
  },
  {
    n: "04",
    t: "Loja online própria",
    d: "Catálogo público com checkout Mercado Pago e PIX direto pra sua conta.",
    img: lojaMock,
  },
  {
    n: "05",
    t: "Revendedoras conectadas",
    d: "App PWA exclusivo pra sua rede vender de onde estiver.",
    img: warm02,
  },
  {
    n: "06",
    t: "IA Bella 24/7",
    d: "Vendedora virtual no WhatsApp com carrinho, catálogo e persona da sua marca.",
    img: dashMock,
  },
];

function Features() {
  return (
    <section id="recursos" className="relative bg-[#fffaf3] py-32 lg:py-44">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="mb-20 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[#ea580c]">
              ( 02 ) Recursos
            </div>
            <h2 className="mt-8 max-w-3xl font-serif text-5xl leading-[1.05] text-[#1a0f0a] lg:text-7xl">
              Tudo o que você precisa,{" "}
              <em className="italic text-[#ea580c]">nada</em> que atrapalhe.
            </h2>
          </div>
          <p className="max-w-sm text-[#1a0f0a]/70">
            Um único painel — do estoque à loja online — pensado pra lojista real, não
            pra manual de software.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.n}
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, ease: EASE, delay: (i % 3) * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#1a0f0a]/5 transition-all hover:shadow-2xl"
              data-cursor
            >
              <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-2xl bg-[#fef3c7]">
                <motion.img
                  src={f.img}
                  alt={f.t}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.7, ease: EASE }}
                />
                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium tracking-widest text-[#1a0f0a] backdrop-blur">
                  {f.n}
                </div>
              </div>
              <h3 className="font-serif text-2xl text-[#1a0f0a]">{f.t}</h3>
              <p className="mt-3 text-sm text-[#1a0f0a]/60">{f.d}</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[#ea580c]">
                Explorar
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ STICKY SHOWCASE ============ */
const SHOWCASE = [
  { t: "Dashboard", d: "KPIs de venda, margem e ticket médio em tempo real.", img: dashMock },
  { t: "PDV", d: "Venda com fiado, PIX, cartão e comprovante instantâneo.", img: pdvMock },
  { t: "Loja Online", d: "Vitrine premium com checkout Mercado Pago.", img: lojaMock },
];

function StickyShowcase() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      const i = Math.min(SHOWCASE.length - 1, Math.floor(v * SHOWCASE.length));
      setActive(i);
    });
  }, [scrollYProgress]);
  return (
    <section
      ref={ref}
      className="relative bg-white"
      style={{ height: `${SHOWCASE.length * 100}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1400px] gap-16 px-6 lg:grid-cols-2 lg:px-10">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[#ea580c]">
              ( 03 ) Módulos
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <h3 className="mt-6 font-serif text-6xl text-[#1a0f0a] lg:text-8xl">
                  {SHOWCASE[active].t}
                </h3>
                <p className="mt-6 max-w-md text-lg text-[#1a0f0a]/70">
                  {SHOWCASE[active].d}
                </p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-10 flex gap-2">
              {SHOWCASE.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-12 rounded-full transition-all ${
                    i === active ? "bg-[#ea580c]" : "bg-[#1a0f0a]/10"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-[#fef3c7] via-[#fed7aa]/50 to-[#fecaca]/50" />
            <AnimatePresence mode="wait">
              <motion.img
                key={active}
                src={SHOWCASE[active].img}
                alt={SHOWCASE[active].t}
                loading="lazy"
                initial={{ y: 60, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -60, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="relative z-10 max-h-[75vh] w-[90%] rounded-2xl object-contain shadow-2xl"
              />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ PERSONAS ============ */
function Personas() {
  return (
    <section className="relative bg-[#1a0f0a] py-32 text-white lg:py-44">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="mb-16">
          <div className="text-xs uppercase tracking-[0.3em] text-[#f59e0b]">
            ( 04 ) Pra quem é
          </div>
          <h2 className="mt-8 max-w-3xl font-serif text-5xl leading-[1.05] lg:text-7xl">
            Feito pra{" "}
            <em className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#f59e0b] to-[#f43f5e]">
              mulheres
            </em>{" "}
            que empreendem.
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {[
            {
              img: personaLoj,
              t: "Lojistas",
              d: "Você controla estoque, revendedoras, maletas e loja online sem virar refém de planilha.",
              tags: ["Multi-loja", "Multi-usuário", "Relatórios"],
            },
            {
              img: personaRev,
              t: "Revendedoras",
              d: "Um app PWA feito pra sua rede vender com maleta, tirar pedido e receber comissão.",
              tags: ["PWA", "Comissão auto", "WhatsApp"],
            },
          ].map((p) => (
            <motion.div
              key={p.t}
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, ease: EASE }}
              className="group relative overflow-hidden rounded-3xl"
              data-cursor
            >
              <motion.img
                src={p.img}
                alt={p.t}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.9, ease: EASE }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f0a] via-[#1a0f0a]/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8">
                <h3 className="font-serif text-5xl">{p.t}</h3>
                <p className="mt-3 max-w-md text-white/70">{p.d}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ TESTIMONIALS ============ */
const T = [
  {
    n: "Amanda R.",
    r: "Lojista · Goiânia",
    q: "Em 60 dias meu faturamento subiu 32%. O controle de maletas é surreal.",
    img: tAmanda,
  },
  {
    n: "Carla M.",
    r: "Fundadora · Fortaleza",
    q: "Larguei 4 planilhas e um caderno. Nunca mais.",
    img: tCarla,
  },
  {
    n: "Fernanda L.",
    r: "Loja + Revenda · SP",
    q: "Minhas revendedoras adoraram o app. Vendas subiram sozinhas.",
    img: tFernanda,
  },
  {
    n: "Juliana P.",
    r: "Lojista · Rio",
    q: "O PDV é rápido demais. Fila zerada, cliente feliz.",
    img: tJuliana,
  },
  {
    n: "Patrícia S.",
    r: "Marketplace · MG",
    q: "A Bella (IA) fecha venda enquanto eu durmo. Sério.",
    img: tPatricia,
  },
];

function Testimonials() {
  return (
    <section id="depoimentos" className="relative overflow-hidden bg-white py-32 lg:py-44">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="mb-16 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[#ea580c]">
              ( 05 ) Vozes
            </div>
            <h2 className="mt-8 max-w-3xl font-serif text-5xl leading-[1.05] text-[#1a0f0a] lg:text-7xl">
              +2.400 lojistas.{" "}
              <em className="italic text-[#ea580c]">Uma</em> só voz.
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#1a0f0a]/60">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" />
            ))}
            <span className="ml-2">4.9 · avaliação média</span>
          </div>
        </div>
      </div>
      <Marquee baseVelocity={20} className="py-4">
        <div className="flex gap-6">
          {[...T, ...T].map((t, i) => (
            <div
              key={i}
              className="flex w-[380px] flex-shrink-0 flex-col gap-5 rounded-3xl border border-[#1a0f0a]/10 bg-gradient-to-br from-white to-[#fffaf3] p-8 shadow-sm"
            >
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" />
                ))}
              </div>
              <p className="font-serif text-2xl leading-snug text-[#1a0f0a]">"{t.q}"</p>
              <div className="mt-auto flex items-center gap-3">
                <img
                  src={t.img}
                  alt={t.n}
                  loading="lazy"
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <div className="text-sm font-medium text-[#1a0f0a]">{t.n}</div>
                  <div className="text-xs text-[#1a0f0a]/50">{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Marquee>
    </section>
  );
}

/* ============ PRICING ============ */
function Pricing() {
  const features = [
    "Estoque + custo + margem",
    "PDV completo (PIX, cartão, fiado)",
    "Maletas em consignação",
    "Catálogo público + loja online",
    "App pra revendedoras",
    "IA Bella no WhatsApp",
    "Até 25 usuários",
    "Suporte humano no WhatsApp",
    "Atualizações semanais",
  ];
  return (
    <section id="plano" className="relative bg-[#fffaf3] py-32 lg:py-44">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="mb-16 text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-[#ea580c]">
            ( 06 ) Plano
          </div>
          <h2 className="mx-auto mt-8 max-w-4xl font-serif text-5xl leading-[1.05] text-[#1a0f0a] lg:text-7xl">
            Um plano. <em className="italic text-[#ea580c]">Tudo</em> incluso.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[#1a0f0a]/70">
            Chega de "essa função é do plano maior". Aqui é tudo pra todo mundo.
          </p>
        </div>

        <motion.div
          initial={{ y: 60, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl ring-1 ring-[#1a0f0a]/5"
        >
          <div className="grid gap-0 md:grid-cols-2">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#f59e0b] via-[#ea580c] to-[#f43f5e] p-10 text-white lg:p-14">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-widest backdrop-blur">
                  <Zap className="h-3 w-3" /> Nexsiles Prime
                </div>
                <div className="mt-8 flex items-end gap-2">
                  <span className="font-serif text-7xl leading-none">R$129</span>
                  <span className="pb-2 text-sm text-white/70">/mês</span>
                </div>
                <p className="mt-4 max-w-xs text-white/80">
                  Tudo o que a Nexsiles oferece, sem cobrança extra por módulo, sem
                  limite de peça.
                </p>
                <Link
                  to="/auth"
                  className="mt-10 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-[#1a0f0a] transition hover:bg-[#1a0f0a] hover:text-white"
                  data-cursor
                >
                  Começar agora
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="p-10 lg:p-14">
              <ul className="space-y-4">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[#1a0f0a]">
                    <div className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-[#fef3c7]">
                      <Check className="h-3 w-3 text-[#ea580c]" />
                    </div>
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ FAQ ============ */
const FAQS = [
  ["Preciso de cartão pra começar?", "Sim, o plano Prime é R$129/mês via Mercado Pago. Você cancela quando quiser."],
  ["Funciona no celular?", "Sim, é 100% responsivo e as revendedoras têm PWA dedicado."],
  ["Consigo importar meu estoque?", "Sim, temos importação CSV e nossa equipe ajuda no onboarding."],
  ["A loja online tem custo extra?", "Não. Loja, catálogo, PDV e app das revendedoras estão inclusos."],
  ["E se eu quiser cancelar?", "Cancela direto no painel. Sem multa, sem burocracia."],
];
function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative bg-white py-32 lg:py-44">
      <div className="mx-auto max-w-[1000px] px-6 lg:px-10">
        <div className="mb-16">
          <div className="text-xs uppercase tracking-[0.3em] text-[#ea580c]">
            ( 07 ) Dúvidas
          </div>
          <h2 className="mt-8 font-serif text-5xl leading-[1.05] text-[#1a0f0a] lg:text-7xl">
            Perguntas <em className="italic text-[#ea580c]">honestas</em>.
          </h2>
        </div>
        <div className="divide-y divide-[#1a0f0a]/10 border-y border-[#1a0f0a]/10">
          {FAQS.map(([q, a], i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between py-6 text-left"
                data-cursor
              >
                <span className="font-serif text-2xl text-[#1a0f0a] lg:text-3xl">{q}</span>
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-[#1a0f0a]/15 text-[#ea580c]"
                >
                  +
                </motion.span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 pr-16 text-[#1a0f0a]/70">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ CTA ============ */
function CTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#fef3c7] via-[#fed7aa] to-[#fecaca] py-32 lg:py-44">
      <motion.div
        initial={{ scale: 1.2, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 0.6 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: EASE }}
        className="absolute inset-0"
      >
        <img
          src={warm03}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover opacity-30 mix-blend-multiply"
        />
      </motion.div>
      <div className="relative mx-auto max-w-[1400px] px-6 text-center lg:px-10">
        <div className="mx-auto max-w-4xl">
          <SplitWords
            text="Comece hoje."
            className="block font-serif text-[clamp(3.5rem,12vw,11rem)] leading-[0.95] text-[#1a0f0a]"
          />
          <SplitWords
            text="Brilhe amanhã."
            className="block font-serif text-[clamp(3.5rem,12vw,11rem)] italic leading-[0.95] text-[#ea580c]"
          />
        </div>
        <Reveal delay={0.4} className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/auth"
            className="group inline-flex items-center gap-3 rounded-full bg-[#1a0f0a] px-8 py-4 text-sm font-medium text-white transition hover:bg-[#ea580c]"
            data-cursor
          >
            Ativar Nexsiles Prime
            <ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" />
          </Link>
          <span className="text-sm text-[#1a0f0a]/60">R$129/mês · sem fidelidade</span>
        </Reveal>
      </div>
    </section>
  );
}

/* ============ FOOTER ============ */
function Footer() {
  return (
    <footer className="border-t border-[#1a0f0a]/10 bg-white py-16">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#f59e0b] to-[#ea580c] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-serif text-xl text-[#1a0f0a]">Nexsiles</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-[#1a0f0a]/60">
              O sistema completo para lojistas e revendedoras de semijoia.
            </p>
          </div>
          {[
            ["Produto", ["Recursos", "Plano", "Depoimentos", "FAQ"]],
            ["Empresa", ["Sobre", "Blog", "Contato", "Suporte"]],
            ["Legal", ["Termos", "Privacidade", "LGPD"]],
          ].map(([title, items]) => (
            <div key={title as string}>
              <div className="text-xs uppercase tracking-widest text-[#1a0f0a]/50">
                {title}
              </div>
              <ul className="mt-4 space-y-2 text-sm text-[#1a0f0a]/80">
                {(items as string[]).map((i) => (
                  <li key={i}>
                    <a href="#" className="hover:text-[#ea580c]" data-cursor>
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#1a0f0a]/10 pt-8 text-xs text-[#1a0f0a]/50 md:flex-row">
          <span>© {new Date().getFullYear()} Nexsiles. Todos os direitos reservados.</span>
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="grid h-9 w-9 place-items-center rounded-full border border-[#1a0f0a]/10 hover:border-[#ea580c] hover:text-[#ea580c]"
              data-cursor
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============ PAGE ============ */
export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-[#1a0f0a] antialiased">
      <Cursor />
      <ScrollBar />
      <Nav />
      <main>
        <Hero />
        <Strip />
        <About />
        <Features />
        <StickyShowcase />
        <Personas />
        <Testimonials />
        <Pricing />
        <Faq />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

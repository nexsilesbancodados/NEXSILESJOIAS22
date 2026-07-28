import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Star,
  Instagram,
  Sparkles,
  Store,
  Package,
  Users,
  ShoppingBag,
  BarChart3,
  Smartphone,
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
   ember   #ea580c  primary
   coral   #f43f5e
   amber   #f59e0b
   sand    #fef3c7
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
        className="rounded-full bg-[#ea580c] mix-blend-multiply -translate-x-1/2 -translate-y-1/2"
        animate={{ width: hover ? 56 : 12, height: hover ? 56 : 12, opacity: hover ? 0.35 : 0.9 }}
        transition={{ duration: 0.25, ease: EASE }}
      />
    </motion.div>
  );
}

/* ============ SCROLL PROGRESS ============ */
function Progress() {
  const { scrollYProgress } = useScroll();
  const w = useSpring(scrollYProgress, { stiffness: 120, damping: 20 });
  return (
    <motion.div
      style={{ scaleX: w }}
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[90] bg-gradient-to-r from-[#f59e0b] via-[#ea580c] to-[#f43f5e]"
    />
  );
}

/* ============ NAV ============ */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 20);
    s();
    window.addEventListener("scroll", s);
    return () => window.removeEventListener("scroll", s);
  }, []);
  const links = [
    ["Recursos", "#recursos"],
    ["Módulos", "#modulos"],
    ["Clientes", "#clientes"],
    ["Preço", "#preco"],
    ["FAQ", "#faq"],
  ];
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-[#1a0f0a]/8 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between">
        <Link to="/landing" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#f43f5e] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-serif text-xl text-[#1a0f0a] tracking-tight">Nexsiles</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-[#1a0f0a]/70">
          {links.map(([l, h]) => (
            <a key={h} href={h} className="hover:text-[#ea580c] transition-colors">
              {l}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="hidden sm:inline text-sm text-[#1a0f0a]/70 hover:text-[#ea580c]"
          >
            Entrar
          </Link>
          <a
            href="#preco"
            className="text-sm bg-[#1a0f0a] text-white px-5 py-2.5 rounded-full hover:bg-[#ea580c] transition-colors inline-flex items-center gap-1.5"
          >
            Começar <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

/* ============ HERO ============ */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -220]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative pt-32 md:pt-40 pb-24 md:pb-32 overflow-hidden">
      {/* soft warm background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#fff7ed] via-white to-white" />
        <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] rounded-full bg-[#fed7aa] blur-[120px] opacity-60" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-[#fecdd3] blur-[120px] opacity-60" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <motion.div style={{ opacity }} className="grid md:grid-cols-12 gap-10 items-center">
          {/* left copy */}
          <div className="md:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#1a0f0a]/10 shadow-sm text-xs uppercase tracking-[0.15em] text-[#1a0f0a]/70 mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-pulse" />
              Plataforma nº1 para semijoias no Brasil
            </motion.div>

            <h1 className="font-serif text-[52px] md:text-[88px] lg:text-[104px] leading-[0.92] tracking-[-0.03em] text-[#1a0f0a]">
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE }}
                className="block"
              >
                Sua loja de
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
                className="block italic"
              >
                <span className="bg-gradient-to-r from-[#f59e0b] via-[#ea580c] to-[#f43f5e] bg-clip-text text-transparent">
                  semijoias
                </span>
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
                className="block"
              >
                em um só lugar.
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.35 }}
              className="mt-8 text-lg md:text-xl text-[#1a0f0a]/70 max-w-xl leading-relaxed"
            >
              Estoque, PDV, revendedoras, catálogo digital e loja virtual — tudo integrado,
              bonito e feito para quem vive de brilho.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.45 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <a
                href="#preco"
                className="group inline-flex items-center gap-2 bg-[#1a0f0a] text-white px-8 py-4 rounded-full hover:bg-[#ea580c] transition-colors"
              >
                Começar por R$129/mês
                <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              </a>
              <a
                href="#modulos"
                className="inline-flex items-center gap-2 text-[#1a0f0a] px-6 py-4 rounded-full border border-[#1a0f0a]/15 hover:border-[#ea580c] hover:text-[#ea580c] transition-colors"
              >
                Ver módulos
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-12 flex items-center gap-3 text-sm text-[#1a0f0a]/60"
            >
              <Check className="w-4 h-4 text-[#ea580c]" />
              Sem fidelidade · Cancele quando quiser · Suporte humano
            </motion.div>

          </div>

          {/* right visual — collage */}
          <div className="md:col-span-5 relative h-[520px] md:h-[640px]">
            <motion.div
              style={{ y: y1 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: EASE, delay: 0.2 }}
              className="absolute top-0 right-0 w-[75%] aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl"
            >
              <img src={heroJewel} alt="" className="w-full h-full object-cover" />
            </motion.div>
            <motion.div
              style={{ y: y2 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: EASE, delay: 0.4 }}
              className="absolute bottom-8 left-0 w-[60%] aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
            >
              <img src={warm02} alt="" className="w-full h-full object-cover" />
            </motion.div>
            <motion.div
              style={{ y: y3 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="absolute top-10 left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-[#1a0f0a]/5"
            >
              <div className="w-10 h-10 rounded-full bg-[#fef3c7] flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#ea580c]" />
              </div>
              <div>
                <div className="text-xs text-[#1a0f0a]/60">Vendas hoje</div>
                <div className="font-serif text-lg text-[#1a0f0a]">R$ 4.280</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9 }}
              className="absolute bottom-4 right-8 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-[#1a0f0a]/5"
            >
              <div className="w-10 h-10 rounded-full bg-[#fecdd3] flex items-center justify-center">
                <Package className="w-5 h-5 text-[#f43f5e]" />
              </div>
              <div>
                <div className="text-xs text-[#1a0f0a]/60">Peças em estoque</div>
                <div className="font-serif text-lg text-[#1a0f0a]">1.284</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ LOGO MARQUEE / STATS ============ */
function Stats() {
  const items = [
    ["+2.000", "Lojistas ativos"],
    ["R$ 48M", "Vendas processadas"],
    ["99.9%", "Uptime garantido"],
    ["24/7", "Suporte humano"],
  ];
  return (
    <section className="py-20 md:py-28 border-y border-[#1a0f0a]/8 bg-[#fffaf5]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {items.map(([v, l], i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE, delay: i * 0.1 }}
            className="text-center md:text-left"
          >
            <div className="font-serif text-4xl md:text-6xl text-[#1a0f0a] tracking-tight">{v}</div>
            <div className="mt-2 text-sm text-[#1a0f0a]/60 uppercase tracking-[0.15em]">{l}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ============ FEATURES GRID ============ */
function Features() {
  const items = [
    { icon: Store, title: "PDV completo", desc: "Vendas rápidas, cupom fiscal, formas de pagamento e caixa fechado no clique." },
    { icon: Package, title: "Estoque real", desc: "Movimentações automáticas, alertas de baixa e histórico de preços." },
    { icon: Users, title: "Revendedoras", desc: "Maletas, comissões, portal PWA e conferência com scanner." },
    { icon: ShoppingBag, title: "Loja virtual", desc: "Vitrine pública, checkout Mercado Pago e PIX direto para você." },
    { icon: BarChart3, title: "Relatórios", desc: "Métricas de lucro, giro, top vendedoras e projeção de estoque." },
    { icon: Smartphone, title: "Multiplataforma", desc: "Web, tablet e celular. PWA offline para o PDV e para a revendedora." },
  ];
  return (
    <section id="recursos" className="py-28 md:py-36">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl mb-16 md:mb-20">
          <div className="text-xs uppercase tracking-[0.2em] text-[#ea580c] mb-4">01 — Recursos</div>
          <h2 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight text-[#1a0f0a]">
            Tudo o que sua loja precisa,
            <span className="italic text-[#ea580c]"> nada que ela não precise.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: EASE, delay: (i % 3) * 0.1 }}
              className="group p-8 rounded-3xl bg-white border border-[#1a0f0a]/8 hover:border-[#ea580c]/40 hover:shadow-xl transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fed7aa] to-[#fecdd3] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <it.icon className="w-5 h-5 text-[#1a0f0a]" />
              </div>
              <h3 className="font-serif text-2xl text-[#1a0f0a] mb-2">{it.title}</h3>
              <p className="text-[#1a0f0a]/65 leading-relaxed">{it.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ MODULES SHOWCASE (alternating) ============ */
function Modules() {
  const rows = [
    {
      tag: "Gestão",
      title: "Um dashboard que fala com você.",
      desc: "Veja em segundos o que vendeu, o que está parado e onde está seu lucro. Cards vivos, gráficos limpos e insights com IA.",
      img: dashMock,
      bullets: ["Vendas em tempo real", "Alertas inteligentes", "Metas e ranking"],
    },
    {
      tag: "Ponto de venda",
      title: "PDV que voa, mesmo sem internet.",
      desc: "Interface pensada para o toque, atalhos de teclado, leitor de código de barras e sincronização offline.",
      img: pdvMock,
      bullets: ["Modo offline", "Cupom fiscal", "Fidelidade & fiado"],
    },
    {
      tag: "Loja virtual",
      title: "Sua vitrine online, pronta em minutos.",
      desc: "Domínio próprio, checkout completo, PIX direto e SEO otimizado — sem depender de marketplace.",
      img: lojaMock,
      bullets: ["Checkout MP + PIX", "SEO dinâmico", "Cupons e frete"],
    },
  ];
  return (
    <section id="modulos" className="py-28 md:py-36 bg-[#fffaf5]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl mb-20">
          <div className="text-xs uppercase tracking-[0.2em] text-[#ea580c] mb-4">02 — Módulos</div>
          <h2 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight text-[#1a0f0a]">
            Três produtos.
            <span className="italic"> Uma assinatura.</span>
          </h2>
        </div>

        <div className="space-y-28 md:space-y-40">
          {rows.map((r, i) => (
            <div key={i} className={`grid md:grid-cols-2 gap-12 md:gap-20 items-center ${i % 2 ? "md:[direction:rtl]" : ""}`}>
              <motion.div
                initial={{ opacity: 0, x: i % 2 ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: EASE }}
                className="[direction:ltr]"
              >
                <div className="rounded-3xl overflow-hidden shadow-2xl border border-[#1a0f0a]/8 bg-white">
                  <img src={r.img} alt={r.title} className="w-full h-auto" />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
                className="[direction:ltr]"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-[#ea580c] mb-4">{r.tag}</div>
                <h3 className="font-serif text-3xl md:text-5xl text-[#1a0f0a] leading-[1.05] tracking-tight mb-6">
                  {r.title}
                </h3>
                <p className="text-lg text-[#1a0f0a]/70 leading-relaxed mb-8">{r.desc}</p>
                <ul className="space-y-3">
                  {r.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-3 text-[#1a0f0a]">
                      <div className="w-5 h-5 rounded-full bg-[#ea580c]/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-[#ea580c]" />
                      </div>
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ PERSONAS ============ */
function Personas() {
  const items = [
    { img: personaLoj, tag: "Para lojistas", title: "Controle total da sua operação", desc: "Do estoque ao lucro, com relatórios que valem por um gerente." },
    { img: personaRev, tag: "Para revendedoras", title: "Um portal só para elas", desc: "Maleta, comissão, pedidos e histórico — no celular, offline." },
  ];
  return (
    <section id="clientes" className="py-28 md:py-36">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-[#ea580c] mb-4">03 — Para quem</div>
          <h2 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight text-[#1a0f0a]">
            Feito para <span className="italic">os dois lados</span> do balcão.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {items.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: EASE, delay: i * 0.1 }}
              className="group relative rounded-3xl overflow-hidden aspect-[4/5] md:aspect-[3/4]"
            >
              <img src={p.img} alt={p.tag} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f0a] via-[#1a0f0a]/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 text-white">
                <div className="text-xs uppercase tracking-[0.2em] text-white/70 mb-3">{p.tag}</div>
                <h3 className="font-serif text-3xl md:text-4xl leading-tight mb-3">{p.title}</h3>
                <p className="text-white/80 max-w-md">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ TESTIMONIALS ============ */
function Testimonials() {
  const items = [
    { img: tAmanda, name: "Amanda R.", role: "Loja em SP", text: "Em 2 meses dobrei o faturamento. O PDV é o mais rápido que já usei." },
    { img: tCarla, name: "Carla M.", role: "Rede com 3 lojas", text: "Consegui integrar todas as unidades e ver o estoque em tempo real." },
    { img: tFernanda, name: "Fernanda S.", role: "Revendedora", text: "O portal me organizou. Recebo pedidos e vejo minha comissão no dia." },
    { img: tJuliana, name: "Juliana P.", role: "Loja em MG", text: "A loja virtual me trouxe clientes de outros estados. Vale cada centavo." },
    { img: tPatricia, name: "Patrícia L.", role: "Franqueada", text: "Suporte humano e rápido. Nunca fiquei na mão em dia de venda." },
  ];
  return (
    <section className="py-28 md:py-36 bg-[#1a0f0a] text-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-[#f59e0b] mb-4">04 — Vozes</div>
          <h2 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight">
            Quem usa, <span className="italic text-[#f59e0b]">indica.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: EASE, delay: (i % 3) * 0.1 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur"
            >
              <div className="flex items-center gap-1 text-[#f59e0b] mb-4">
                {[...Array(5)].map((_, s) => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <p className="text-lg leading-relaxed mb-6 text-white/90">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="text-sm">{t.name}</div>
                  <div className="text-xs text-white/60">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ GALLERY MARQUEE ============ */
function Gallery() {
  const imgs = [warm01, warm02, warm03, warm04, warm05, warm06];
  const track = [...imgs, ...imgs];
  return (
    <section className="py-20 overflow-hidden">
      <motion.div
        className="flex gap-6"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
      >
        {track.map((src, i) => (
          <div key={i} className="shrink-0 w-[280px] md:w-[380px] aspect-[4/5] rounded-3xl overflow-hidden">
            <img src={src} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </motion.div>
    </section>
  );
}

/* ============ PRICING ============ */
function Pricing() {
  const feats = [
    "Usuários ilimitados",
    "Até 25 funcionários",
    "PDV + Estoque + Revendedoras",
    "Loja virtual com checkout MP",
    "Portal PWA da revendedora",
    "Relatórios avançados & IA",
    "Suporte humano 24/7",
    "Backup automático diário",
  ];
  return (
    <section id="preco" className="py-28 md:py-36 bg-gradient-to-b from-white to-[#fff7ed]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-[#ea580c] mb-4">05 — Preço</div>
          <h2 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight text-[#1a0f0a]">
            Um plano. <span className="italic">Tudo dentro.</span>
          </h2>
          <p className="mt-6 text-lg text-[#1a0f0a]/70">
            Sem pegadinha. Sem upsell. Sem taxa por transação da assinatura.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="relative max-w-2xl mx-auto p-1 rounded-[32px] bg-gradient-to-br from-[#f59e0b] via-[#ea580c] to-[#f43f5e] shadow-2xl"
        >
          <div className="bg-white rounded-[28px] p-10 md:p-14">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#ea580c]">Nexsiles Prime</div>
                <div className="font-serif text-3xl text-[#1a0f0a] mt-1">Plano único</div>
              </div>
              <div className="text-xs px-3 py-1.5 rounded-full bg-[#fef3c7] text-[#92400e]">
                Melhor valor
              </div>
            </div>

            <div className="flex items-end gap-2 mb-8">
              <span className="font-serif text-7xl md:text-8xl text-[#1a0f0a] tracking-tight">R$129</span>
              <span className="text-[#1a0f0a]/60 pb-3">/mês</span>
            </div>

            <ul className="grid sm:grid-cols-2 gap-3 mb-10">
              {feats.map((f) => (
                <li key={f} className="flex items-center gap-3 text-[#1a0f0a]">
                  <div className="w-5 h-5 rounded-full bg-[#ea580c]/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-[#ea580c]" />
                  </div>
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/auth"
              className="group flex items-center justify-center gap-2 w-full bg-[#1a0f0a] text-white py-4 rounded-full hover:bg-[#ea580c] transition-colors"
            >
              Começar agora
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            </Link>
            <p className="text-center text-xs text-[#1a0f0a]/50 mt-4">
              Cancele quando quiser. Sem multa.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ FAQ ============ */
function FAQ() {
  const items = [
    ["Preciso de cartão para começar?", "Sim, a assinatura é ativada logo após o pagamento via Mercado Pago (PIX, cartão ou boleto)."],
    ["Consigo migrar meu estoque atual?", "Sim. Importamos CSV/Excel e ajudamos na configuração inicial gratuitamente."],
    ["Funciona sem internet?", "O PDV e o portal da revendedora têm modo offline com sincronização automática."],
    ["Posso cancelar quando quiser?", "Sim, sem multa. Seus dados ficam disponíveis por 30 dias após o cancelamento."],
    ["Tem limite de vendas ou peças?", "Não. Vendas, peças e clientes são ilimitados no plano Prime."],
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-28 md:py-36">
      <div className="max-w-[900px] mx-auto px-6 md:px-10">
        <div className="max-w-2xl mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-[#ea580c] mb-4">06 — Dúvidas</div>
          <h2 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight text-[#1a0f0a]">
            Perguntas <span className="italic">frequentes.</span>
          </h2>
        </div>
        <div className="divide-y divide-[#1a0f0a]/10 border-y border-[#1a0f0a]/10">
          {items.map(([q, a], i) => (
            <div key={i} className="py-6">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between text-left gap-6"
              >
                <span className="font-serif text-xl md:text-2xl text-[#1a0f0a]">{q}</span>
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  className="w-8 h-8 rounded-full border border-[#1a0f0a]/20 flex items-center justify-center text-[#ea580c] shrink-0"
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
                    transition={{ duration: 0.35, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <p className="pt-4 text-[#1a0f0a]/70 leading-relaxed max-w-2xl">{a}</p>
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
    <section className="py-28 md:py-40 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f59e0b] via-[#ea580c] to-[#f43f5e]" />
      <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: `url(${warm05})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      <div className="relative max-w-[1200px] mx-auto px-6 md:px-10 text-center text-white">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight"
        >
          Comece hoje.
          <br />
          <span className="italic">Brilhe amanhã.</span>
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-12"
        >
          <Link
            to="/auth"
            className="group inline-flex items-center gap-3 bg-white text-[#1a0f0a] px-10 py-5 rounded-full font-medium hover:bg-[#1a0f0a] hover:text-white transition-colors"
          >
            Ativar Nexsiles Prime
            <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ FOOTER ============ */
function Footer() {
  return (
    <footer className="bg-[#1a0f0a] text-white/70 py-16">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#f43f5e] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-xl text-white">Nexsiles</span>
          </div>
          <p className="text-sm">A plataforma completa para lojas de semijoias.</p>
        </div>
        <div>
          <div className="text-white text-sm mb-4">Produto</div>
          <ul className="space-y-2 text-sm">
            <li><a href="#recursos" className="hover:text-[#f59e0b]">Recursos</a></li>
            <li><a href="#modulos" className="hover:text-[#f59e0b]">Módulos</a></li>
            <li><a href="#preco" className="hover:text-[#f59e0b]">Preço</a></li>
          </ul>
        </div>
        <div>
          <div className="text-white text-sm mb-4">Empresa</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/politica-privacidade" className="hover:text-[#f59e0b]">Privacidade</Link></li>
            <li><Link to="/termos" className="hover:text-[#f59e0b]">Termos</Link></li>
            <li><a href="https://wa.me/5511937687369" className="hover:text-[#f59e0b]">Contato</a></li>
          </ul>
        </div>
        <div>
          <div className="text-white text-sm mb-4">Social</div>
          <a href="#" className="inline-flex items-center gap-2 hover:text-[#f59e0b]">
            <Instagram className="w-4 h-4" /> @nexsiles
          </a>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 mt-12 pt-8 border-t border-white/10 text-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div>© {new Date().getFullYear()} Nexsiles. Todos os direitos reservados.</div>
        <div>Feito com brilho no Brasil.</div>
      </div>
    </footer>
  );
}

/* ============ PAGE ============ */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#1a0f0a] font-body antialiased overflow-x-hidden">
      <Cursor />
      <Progress />
      <Nav />
      <Hero />
      <Stats />
      <Features />
      <Modules />
      <Personas />
      <Gallery />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

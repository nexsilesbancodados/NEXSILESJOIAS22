import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, ShoppingCart, Users, Package, Zap, Shield, Star,
  MessageSquare, TrendingUp, Smartphone, ArrowRight, Check,
  Sparkles, Store, Bot, Crown, ChevronDown, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import heroBackground from '@/assets/landing-hero-bg.jpg';
import dashboardMockup from '@/assets/landing-dashboard-mockup.jpg';
import mobileMockup from '@/assets/landing-mobile-mockup.jpg';
import logo from '@/assets/logo.png';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

const FEATURES = [
  { icon: BarChart3, title: 'Dashboard Inteligente', desc: 'Visualize vendas, estoque e métricas em tempo real com gráficos interativos.' },
  { icon: ShoppingCart, title: 'PDV Completo', desc: 'Ponto de venda profissional com leitor de código de barras, descontos e múltiplas formas de pagamento.' },
  { icon: Package, title: 'Gestão de Estoque', desc: 'Controle total do inventário com alertas de reposição, histórico de preços e etiquetas.' },
  { icon: Users, title: 'Revendedoras & Maletas', desc: 'Gerencie revendedoras, maletas, comissões e portal exclusivo para cada revendedora.' },
  { icon: MessageSquare, title: 'WhatsApp Integrado', desc: 'Envie catálogos, cobranças e notificações automáticas via WhatsApp.' },
  { icon: TrendingUp, title: 'Relatórios Avançados', desc: 'Relatórios de lucratividade, desempenho de vendas, ranking de revendedoras e muito mais.' },
  { icon: Bot, title: 'Assistente IA 24/7', desc: 'Chatbot inteligente que atende seus clientes, sugere produtos e fecha vendas automaticamente.' },
  { icon: Store, title: 'Loja Virtual', desc: 'E-commerce completo com checkout PIX/Cartão/Boleto, carrinho, cupons e cálculo de frete.' },
  { icon: Shield, title: 'Multi-tenant Seguro', desc: 'Cada empresa tem seus dados isolados com RLS. Funcionários com permissões granulares.' },
];

const PLANOS = [
  {
    nome: 'E-commerce Premium',
    tier: 'E-COMMERCE',
    preco: 149,
    destaque: false,
    icon: Store,
    cor: 'hsl(var(--vendico-blue))',
    recursos: ['Loja virtual com domínio', 'Checkout Pix, Cartão, Boleto', 'Gestão de estoque', 'Carrinho com cupons', 'Cálculo de frete automático', 'SEO otimizado', 'Catálogo digital'],
  },
  {
    nome: 'Nexsiles',
    tier: 'PRATA',
    preco: 189,
    destaque: false,
    icon: Sparkles,
    cor: 'hsl(var(--muted-foreground))',
    recursos: ['Dashboard inteligente', 'PDV completo', 'Estoque ilimitado', 'Revendedoras & Maletas', 'Catálogos digitais', 'Relatórios completos', 'Sistema de fidelidade', 'Integração WhatsApp'],
  },
  {
    nome: 'Nexsiles Ysis',
    tier: 'OURO',
    preco: 249,
    destaque: true,
    icon: Bot,
    cor: 'hsl(var(--warning))',
    recursos: ['Tudo do plano Prata', 'Assistente IA WhatsApp', 'Chatbot integrado 24/7', 'Respostas automáticas', 'Sugestões de vendas por IA', 'Análise preditiva de estoque', 'Atendimento automático', 'Relatórios de IA'],
  },
  {
    nome: 'Nexsiles Commerce',
    tier: 'DIAMANTE',
    preco: 299,
    destaque: false,
    icon: Crown,
    cor: 'hsl(var(--primary))',
    recursos: ['Tudo do plano Ouro', 'Loja virtual com domínio', 'Checkout Pix, Cartão, Boleto', 'Carrinho com cupons', 'Gestão de pedidos', 'Cálculo de frete', 'SEO otimizado', 'Campanhas e promoções'],
  },
];

const TESTIMONIALS = [
  { name: 'Carla M.', role: 'Dona de loja de semijoias', text: 'O Nexsiles transformou minha gestão! Antes eu perdia horas no controle manual, agora tudo é automático.' },
  { name: 'Fernanda S.', role: 'Revendedora', text: 'O portal da revendedora é incrível. Consigo ver minhas peças, vendas e comissões em tempo real.' },
  { name: 'Juliana R.', role: 'E-commerce de joias', text: 'A IA no WhatsApp responde minhas clientes 24h. Minhas vendas cresceram 40% no primeiro mês!' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[hsl(224,30%,8%)] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[hsl(224,30%,8%)]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Nexsiles" className="h-8 w-auto" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Nexsiles</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#screenshots" className="hover:text-white transition-colors">Screenshots</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            <a href="#depoimentos" className="hover:text-white transition-colors">Depoimentos</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="text-white/70 hover:text-white" onClick={() => navigate('/auth')}>Entrar</Button>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" onClick={() => navigate('/auth')}>
              Teste Grátis <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-[hsl(224,30%,10%)] border-t border-white/5 px-4 py-4 space-y-3">
            <a href="#features" className="block text-white/70 hover:text-white">Funcionalidades</a>
            <a href="#planos" className="block text-white/70 hover:text-white">Planos</a>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white" onClick={() => navigate('/auth')}>Teste Grátis</Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0">
          <img src={heroBackground} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(224,30%,8%)]/60 via-[hsl(224,30%,8%)]/30 to-[hsl(224,30%,8%)]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Badge className="mb-6 bg-purple-500/20 text-purple-300 border-purple-500/30 px-4 py-1.5 text-sm">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Plataforma #1 para Semijoias
            </Badge>
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
            Gerencie seu negócio de{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              semijoias
            </span>{' '}
            com inteligência
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto mb-10">
            Dashboard, PDV, estoque, revendedoras, loja virtual, WhatsApp com IA — tudo em um só lugar. 
            A plataforma mais completa do Brasil para quem vende semijoias.
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_hsl(263,70%,50%,0.4)]"
              onClick={() => navigate('/auth')}>
              Começar Grátis por 3 Dias <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-xl"
              onClick={() => { const el = document.getElementById('screenshots'); el?.scrollIntoView({ behavior: 'smooth' }); }}>
              Ver Demonstração
            </Button>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="mt-8 flex items-center justify-center gap-6 text-sm text-white/40">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> Sem cartão de crédito</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> Cancele quando quiser</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> Suporte humano</span>
          </motion.div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/30" />
        </div>
      </section>

      {/* Dashboard Screenshot */}
      <section id="screenshots" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">Dashboard</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Visão completa do seu negócio</h2>
            <p className="text-white/50 max-w-2xl mx-auto">Acompanhe vendas, estoque, metas, aniversariantes e mais — tudo num painel elegante e intuitivo.</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_60px_hsl(263,70%,50%,0.15)]">
            <img src={dashboardMockup} alt="Dashboard Nexsiles" className="w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(224,30%,8%)] via-transparent to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-[hsl(224,30%,6%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">Funcionalidades</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tudo que você precisa em um só sistema</h2>
            <p className="text-white/50 max-w-2xl mx-auto">Mais de 30 módulos integrados para gerir seu negócio do início ao fim.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}>
                <Card className="bg-white/[0.03] border-white/[0.06] hover:border-purple-500/30 transition-all duration-300 group h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                      <f.icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile + IA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <Badge className="mb-4 bg-pink-500/20 text-pink-300 border-pink-500/30">Loja Virtual + IA</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Venda online 24 horas com inteligência artificial</h2>
              <p className="text-white/50 mb-8 leading-relaxed">
                Sua loja virtual pronta para vender com checkout PIX, cartão e boleto. 
                O assistente IA responde clientes no WhatsApp, sugere produtos e fecha vendas — mesmo quando você está dormindo.
              </p>
              <div className="space-y-4">
                {['Chatbot IA no WhatsApp 24/7', 'Loja com checkout completo', 'Catálogo digital compartilhável', 'Carrinho abandonado com recuperação'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <span className="text-white/70">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="flex justify-center">
              <div className="relative w-72 sm:w-80">
                <img src={mobileMockup} alt="Loja Virtual Mobile" className="w-full rounded-3xl shadow-[0_0_60px_hsl(263,70%,50%,0.2)]" />
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl px-4 py-2 shadow-lg">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Bot className="w-4 h-4" /> IA Ativa
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-24 bg-[hsl(224,30%,6%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">Planos</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Escolha o plano ideal para seu negócio</h2>
            <p className="text-white/50 max-w-2xl mx-auto">Todos incluem 3 dias grátis. Cancele quando quiser.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANOS.map((plano, i) => (
              <motion.div key={plano.nome} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}>
                <Card className={`relative h-full bg-white/[0.03] border-white/[0.06] ${plano.destaque ? 'border-purple-500/50 shadow-[0_0_40px_hsl(263,70%,50%,0.15)]' : ''}`}>
                  {plano.destaque && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-4">
                        <Star className="w-3 h-3 mr-1" /> Mais Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6 pt-8 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-1">
                      <plano.icon className="w-5 h-5 text-purple-400" />
                      <Badge variant="outline" className="text-xs border-white/20 text-white/60">{plano.tier}</Badge>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{plano.nome}</h3>
                    <div className="mb-6">
                      <span className="text-sm text-white/40">R$</span>
                      <span className="text-4xl font-extrabold text-white mx-1">{plano.preco}</span>
                      <span className="text-sm text-white/40">/mês</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      {plano.recursos.map((r) => (
                        <li key={r} className="flex items-start gap-2.5 text-sm text-white/60">
                          <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                          {r}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${plano.destaque ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' : 'bg-white/10 hover:bg-white/15 text-white'}`}
                      onClick={() => navigate('/auth')}
                    >
                      Começar Grátis
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">Depoimentos</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">O que nossas clientes dizem</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}>
                <Card className="bg-white/[0.03] border-white/[0.06] h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed mb-6">"{t.text}"</p>
                    <div>
                      <p className="font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-white/40">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-pink-900/40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-6">Pronta para transformar seu negócio?</h2>
            <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto">
              Junte-se a centenas de empreendedoras que já usam o Nexsiles para vender mais e trabalhar menos.
            </p>
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-10 py-6 rounded-xl shadow-[0_0_40px_hsl(263,70%,50%,0.4)]"
              onClick={() => navigate('/auth')}>
              Começar Meu Teste Grátis <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[hsl(224,30%,5%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Nexsiles" className="h-7 w-auto" />
              <span className="font-bold text-white/80">Nexsiles</span>
            </div>
            <div className="flex gap-6 text-sm text-white/40">
              <a href="#features" className="hover:text-white/70">Funcionalidades</a>
              <a href="#planos" className="hover:text-white/70">Planos</a>
              <a href="#depoimentos" className="hover:text-white/70">Depoimentos</a>
            </div>
            <p className="text-xs text-white/30">© {new Date().getFullYear()} Nexsiles. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

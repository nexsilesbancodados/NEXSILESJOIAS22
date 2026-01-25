import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, User, ArrowRight, Sparkles, Shield, Zap, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import logo from '@/assets/logo.png';
import loginBg from '@/assets/login-background.jpg';
import { ValidatedInput } from '@/components/ui/validated-input';
import { motion, AnimatePresence } from 'framer-motion';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');
const nomeSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres');

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginTouched, setLoginTouched] = useState<Record<string, boolean>>({});
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  
  // Signup form
  const [signupNome, setSignupNome] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupTouched, setSignupTouched] = useState<Record<string, boolean>>({});
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // Reset password form
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const validateLoginField = (field: string, value: string): string => {
    switch (field) {
      case 'email':
        if (!value) return 'Email é obrigatório';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
        break;
      case 'password':
        if (!value) return 'Senha é obrigatória';
        if (value.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
        break;
    }
    return '';
  };

  const validateSignupField = (field: string, value: string): string => {
    switch (field) {
      case 'nome':
        if (!value.trim()) return 'Nome é obrigatório';
        if (value.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        break;
      case 'email':
        if (!value) return 'Email é obrigatório';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
        break;
      case 'password':
        if (!value) return 'Senha é obrigatória';
        if (value.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
        break;
      case 'confirmPassword':
        if (!value) return 'Confirmação é obrigatória';
        if (value !== signupPassword) return 'As senhas não coincidem';
        break;
    }
    return '';
  };

  const handleLoginBlur = (field: string, value: string) => {
    setLoginTouched(prev => ({ ...prev, [field]: true }));
    setLoginErrors(prev => ({ ...prev, [field]: validateLoginField(field, value) }));
  };

  const handleSignupBlur = (field: string, value: string) => {
    setSignupTouched(prev => ({ ...prev, [field]: true }));
    setSignupErrors(prev => ({ ...prev, [field]: validateSignupField(field, value) }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos');
      } else if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
        toast.error('Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.');
      } else {
        toast.error('Erro ao fazer login. Tente novamente.');
      }
      return;
    }

    toast.success('Login realizado com sucesso!');
    navigate('/');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      nomeSchema.parse(signupNome);
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupNome);
    setLoading(false);

    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error('Erro ao criar conta. Tente novamente.');
      }
      return;
    }

    toast.success('Conta criada! Verifique seu email para confirmar o cadastro.', {
      duration: 6000,
    });
    setActiveTab('login');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(resetEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);
    const { error } = await resetPassword(resetEmail);
    setLoading(false);

    if (error) {
      toast.error('Erro ao enviar email. Tente novamente.');
      return;
    }

    setResetSent(true);
    toast.success('Email de recuperação enviado!');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center relative"
      style={{ backgroundImage: `url(${loginBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Branding - Top Left */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-6 left-6 z-20 flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
          <img src={logo} alt="Nexsiles" className="w-8 h-8 object-contain" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Nexsiles</span>
      </motion.div>

      {/* Features - Bottom Left (hidden on mobile) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="absolute bottom-6 left-6 z-20 hidden lg:flex items-center gap-6 text-white"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">PDV Rápido</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Catálogos Online</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">Dados Seguros</span>
        </div>
      </motion.div>

      {/* Footer - Bottom Right */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="absolute bottom-6 right-6 z-20 text-sm text-white/60 hidden lg:block"
      >
        © 2024 Nexsiles. Todos os direitos reservados.
      </motion.p>

      {/* Auth Form - Rectangular Card Design */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Outer glow - golden to match jewelry background */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/30 via-yellow-500/20 to-orange-400/30 blur-2xl scale-105" />
        
        {/* Card Container - Warm golden theme */}
        <div className="relative rounded-2xl bg-gradient-to-br from-amber-50/95 via-white/95 to-yellow-50/95 dark:from-amber-950/95 dark:via-card/95 dark:to-yellow-950/95 backdrop-blur-xl shadow-2xl shadow-amber-900/30 border border-amber-200/50 dark:border-amber-700/30 p-8">
          {/* Inner content container */}
          <div className="w-full relative z-10">
            <AnimatePresence mode="wait">
              {activeTab === 'reset' ? (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: -90 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <form onSubmit={handleResetPassword} className="space-y-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-amber-700/70 hover:text-amber-600 hover:bg-amber-100/50 mb-1"
                      onClick={() => {
                        setActiveTab('login');
                        setResetSent(false);
                      }}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Voltar
                    </Button>
                    
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-amber-800 dark:text-amber-200">Recuperar Senha</h2>
                      <p className="text-xs text-amber-700/70 dark:text-amber-300/70">
                        {resetSent 
                          ? 'Verifique seu email'
                          : 'Digite seu email'
                        }
                      </p>
                    </div>

                    {!resetSent ? (
                      <>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600/60" />
                          <ValidatedInput
                            id="reset-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            className="h-10 pl-10 bg-white/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700/50 focus:border-amber-500 rounded-full text-sm"
                          />
                        </div>
                        <Button type="submit" className="w-full h-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-full shadow-lg shadow-amber-500/30 transition-all" disabled={loading}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Link'}
                        </Button>
                      </>
                    ) : (
                      <div className="py-3">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Mail className="w-6 h-6 text-amber-600" />
                        </div>
                        <Button 
                          type="button" 
                          className="w-full h-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-full shadow-lg shadow-amber-500/30 transition-all"
                          onClick={() => {
                            setActiveTab('login');
                            setResetSent(false);
                            setResetEmail('');
                          }}
                        >
                          Voltar ao Login
                        </Button>
                      </div>
                    )}
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: 90 }}
                  transition={{ duration: 0.4 }}
                >
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
                    {/* Logo */}
                    <div className="text-center mb-2">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <img src={logo} alt="Nexsiles" className="w-7 h-7 object-contain" />
                      </div>
                      <h1 className="text-sm font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">Nexsiles</h1>
                    </div>
                    
                    <TabsList className="grid w-full grid-cols-2 h-9 p-1 bg-amber-100/50 dark:bg-amber-900/20 rounded-full border border-amber-200/50 dark:border-amber-700/30">
                      <TabsTrigger 
                        value="login" 
                        className="h-7 text-xs font-medium rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-amber-800/50 data-[state=active]:shadow-sm data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-200 transition-all"
                      >
                        Entrar
                      </TabsTrigger>
                      <TabsTrigger 
                        value="signup" 
                        className="h-7 text-xs font-medium rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-amber-800/50 data-[state=active]:shadow-sm data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-200 transition-all"
                      >
                        Criar Conta
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="mt-0 space-y-3">
                      <form onSubmit={handleLogin} className="space-y-3">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600/60" />
                          <ValidatedInput
                            id="login-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={loginEmail}
                            onChange={(e) => {
                              setLoginEmail(e.target.value);
                              if (loginTouched.email) {
                                setLoginErrors(prev => ({ ...prev, email: validateLoginField('email', e.target.value) }));
                              }
                            }}
                            onBlur={() => handleLoginBlur('email', loginEmail)}
                            error={loginErrors.email}
                            touched={loginTouched.email}
                            required
                            className="h-10 pl-10 bg-white/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700/50 focus:border-amber-500 focus:ring-amber-500/20 rounded-full text-sm"
                          />
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600/60" />
                          <ValidatedInput
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => {
                              setLoginPassword(e.target.value);
                              if (loginTouched.password) {
                                setLoginErrors(prev => ({ ...prev, password: validateLoginField('password', e.target.value) }));
                              }
                            }}
                            onBlur={() => handleLoginBlur('password', loginPassword)}
                            error={loginErrors.password}
                            touched={loginTouched.password}
                            required
                            className="h-10 pl-10 bg-white/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700/50 focus:border-amber-500 focus:ring-amber-500/20 rounded-full text-sm"
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="link" 
                          className="px-0 text-xs text-amber-700/70 hover:text-amber-600 h-auto py-0"
                          onClick={() => setActiveTab('reset')}
                        >
                          Esqueceu sua senha?
                        </Button>
                        <Button type="submit" className="w-full h-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-full shadow-lg shadow-amber-500/30 transition-all" disabled={loading}>
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              Entrar
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup" className="mt-0 space-y-2">
                      <form onSubmit={handleSignup} className="space-y-2">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600/60" />
                          <ValidatedInput
                            id="signup-nome"
                            placeholder="Seu nome"
                            value={signupNome}
                            onChange={(e) => {
                              setSignupNome(e.target.value);
                              if (signupTouched.nome) {
                                setSignupErrors(prev => ({ ...prev, nome: validateSignupField('nome', e.target.value) }));
                              }
                            }}
                            onBlur={() => handleSignupBlur('nome', signupNome)}
                            error={signupErrors.nome}
                            touched={signupTouched.nome}
                            required
                            className="h-9 pl-10 bg-white/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700/50 focus:border-amber-500 rounded-full text-sm"
                          />
                        </div>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600/60" />
                          <ValidatedInput
                            id="signup-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={signupEmail}
                            onChange={(e) => {
                              setSignupEmail(e.target.value);
                              if (signupTouched.email) {
                                setSignupErrors(prev => ({ ...prev, email: validateSignupField('email', e.target.value) }));
                              }
                            }}
                            onBlur={() => handleSignupBlur('email', signupEmail)}
                            error={signupErrors.email}
                            touched={signupTouched.email}
                            required
                            className="h-9 pl-10 bg-white/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700/50 focus:border-amber-500 rounded-full text-sm"
                          />
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600/60" />
                          <ValidatedInput
                            id="signup-password"
                            type="password"
                            placeholder="Senha (mín. 6)"
                            value={signupPassword}
                            onChange={(e) => {
                              setSignupPassword(e.target.value);
                              if (signupTouched.password) {
                                setSignupErrors(prev => ({ ...prev, password: validateSignupField('password', e.target.value) }));
                              }
                            }}
                            onBlur={() => handleSignupBlur('password', signupPassword)}
                            error={signupErrors.password}
                            touched={signupTouched.password}
                            required
                            className="h-9 pl-10 bg-white/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700/50 focus:border-amber-500 rounded-full text-sm"
                          />
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600/60" />
                          <ValidatedInput
                            id="signup-confirm"
                            type="password"
                            placeholder="Confirmar senha"
                            value={signupConfirmPassword}
                            onChange={(e) => {
                              setSignupConfirmPassword(e.target.value);
                              if (signupTouched.confirmPassword) {
                                setSignupErrors(prev => ({ ...prev, confirmPassword: validateSignupField('confirmPassword', e.target.value) }));
                              }
                            }}
                            onBlur={() => handleSignupBlur('confirmPassword', signupConfirmPassword)}
                            error={signupErrors.confirmPassword}
                            touched={signupTouched.confirmPassword}
                            required
                            className="h-9 pl-10 bg-white/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700/50 focus:border-amber-500 rounded-full text-sm"
                          />
                        </div>
                        <Button type="submit" className="w-full h-9 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-full shadow-lg shadow-amber-500/30 transition-all" disabled={loading}>
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              Criar Conta
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Mobile Footer */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:hidden text-center text-xs text-white/60 z-20">
        © 2024 Nexsiles
      </p>
    </div>
  );
}

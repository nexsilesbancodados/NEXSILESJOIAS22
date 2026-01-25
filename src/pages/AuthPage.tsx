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
    <div className="min-h-screen w-full flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${loginBg})` }}
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/70 to-primary/60" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <img src={logo} alt="Nexsiles" className="w-9 h-9 object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Nexsiles</span>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
                Gestão completa para seu negócio de semijoias
              </h1>
              <p className="text-xl text-white/80 max-w-md">
                Controle vendas, estoque, revendedoras e muito mais em uma única plataforma.
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-4 max-w-md">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">PDV Rápido</p>
                  <p className="text-sm text-white/70">Vendas em segundos com interface intuitiva</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Catálogos Online</p>
                  <p className="text-sm text-white/70">Compartilhe produtos via WhatsApp</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Dados Seguros</p>
                  <p className="text-sm text-white/70">Seus dados protegidos na nuvem</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-sm text-white/60"
          >
            © 2024 Nexsiles. Todos os direitos reservados.
          </motion.p>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <img src={logo} alt="Nexsiles" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gradient">Nexsiles</h1>
            <p className="text-sm text-muted-foreground mt-1">Sistema de Gestão de Semijoias</p>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'reset' ? (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-xl shadow-black/5 bg-card/80 backdrop-blur-sm">
                  <form onSubmit={handleResetPassword}>
                    <CardHeader className="pb-4 space-y-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setActiveTab('login');
                          setResetSent(false);
                        }}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Voltar
                      </Button>
                      <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
                      <CardDescription>
                        {resetSent 
                          ? 'Enviamos um link de recuperação para seu email.'
                          : 'Digite seu email para receber o link de recuperação.'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!resetSent ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <ValidatedInput
                              id="reset-email"
                              type="email"
                              placeholder="seu@email.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              required
                              className="h-12 pl-11 bg-muted/50 border-muted-foreground/20 focus:border-primary"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                            <Mail className="w-8 h-8 text-success" />
                          </div>
                          <p className="text-muted-foreground">
                            Verifique sua caixa de entrada e spam.
                          </p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex-col gap-3">
                      {!resetSent ? (
                        <Button type="submit" className="w-full h-12 btn-gold text-base font-medium" disabled={loading}>
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              Enviar Link
                              <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          type="button" 
                          className="w-full h-12 btn-gold text-base font-medium"
                          onClick={() => {
                            setActiveTab('login');
                            setResetSent(false);
                            setResetEmail('');
                          }}
                        >
                          Voltar ao Login
                        </Button>
                      )}
                    </CardFooter>
                  </form>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-xl shadow-black/5 bg-card/80 backdrop-blur-sm">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <CardHeader className="pb-2">
                      <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50">
                        <TabsTrigger 
                          value="login" 
                          className="h-10 text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                        >
                          Entrar
                        </TabsTrigger>
                        <TabsTrigger 
                          value="signup" 
                          className="h-10 text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                        >
                          Criar Conta
                        </TabsTrigger>
                      </TabsList>
                    </CardHeader>

                    <TabsContent value="login" className="mt-0">
                      <form onSubmit={handleLogin}>
                        <CardHeader className="pt-4 pb-2">
                          <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
                          <CardDescription>Entre com suas credenciais para acessar</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-4">
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
                                className="h-12 pl-11 bg-muted/50 border-muted-foreground/20 focus:border-primary"
                              />
                            </div>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
                                className="h-12 pl-11 bg-muted/50 border-muted-foreground/20 focus:border-primary"
                              />
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            variant="link" 
                            className="px-0 text-sm text-muted-foreground hover:text-primary"
                            onClick={() => setActiveTab('reset')}
                          >
                            Esqueceu sua senha?
                          </Button>
                        </CardContent>
                        <CardFooter>
                          <Button type="submit" className="w-full h-12 btn-gold text-base font-medium" disabled={loading}>
                            {loading ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                Entrar
                                <ArrowRight className="w-5 h-5 ml-2" />
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup" className="mt-0">
                      <form onSubmit={handleSignup}>
                        <CardHeader className="pt-4 pb-2">
                          <CardTitle className="text-2xl font-bold">Criar nova conta</CardTitle>
                          <CardDescription>Preencha seus dados para começar</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-4">
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
                                className="h-12 pl-11 bg-muted/50 border-muted-foreground/20 focus:border-primary"
                              />
                            </div>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
                                className="h-12 pl-11 bg-muted/50 border-muted-foreground/20 focus:border-primary"
                              />
                            </div>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <ValidatedInput
                                id="signup-password"
                                type="password"
                                placeholder="Senha (mín. 6 caracteres)"
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
                                className="h-12 pl-11 bg-muted/50 border-muted-foreground/20 focus:border-primary"
                              />
                            </div>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
                                className="h-12 pl-11 bg-muted/50 border-muted-foreground/20 focus:border-primary"
                              />
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button type="submit" className="w-full h-12 btn-gold text-base font-medium" disabled={loading}>
                            {loading ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                Criar Conta
                                <ArrowRight className="w-5 h-5 ml-2" />
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </form>
                    </TabsContent>
                  </Tabs>
                </Card>

                {/* Terms */}
                <p className="text-center text-xs text-muted-foreground mt-6">
                  Ao criar uma conta, você concorda com nossos{' '}
                  <button className="text-primary hover:underline">Termos de Uso</button>
                  {' '}e{' '}
                  <button className="text-primary hover:underline">Política de Privacidade</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Footer */}
          <p className="lg:hidden text-center text-xs text-muted-foreground mt-8">
            © 2024 Nexsiles. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import logo from '@/assets/logo.png';
import { ValidatedInput } from '@/components/ui/validated-input';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');
const nomeSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres');

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  // Redirect if already logged in
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

    toast.success('Conta criada com sucesso!');
    navigate('/');
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

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="auth-background flex items-center justify-center p-4">
      {/* Floating shapes */}
      <div className="floating-shape w-96 h-96 bg-primary -top-48 -left-48" style={{ animationDelay: '0s' }} />
      <div className="floating-shape w-80 h-80 bg-accent -bottom-40 -right-40" style={{ animationDelay: '-5s' }} />
      <div className="floating-shape w-64 h-64 bg-primary top-1/2 left-1/4" style={{ animationDelay: '-10s' }} />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl glass-card flex items-center justify-center shadow-[var(--shadow-large)]">
            <img src={logo} alt="Nexsiles" className="w-16 h-16 object-contain" width={64} height={64} decoding="async" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">
            Nexsiles
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Sistema de Gestão de Semijoias</p>
        </div>

        <Card className="auth-card">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-2">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Criar Conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="animate-fade-in">
              <form onSubmit={handleLogin}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold">Bem-vindo de volta</CardTitle>
                  <CardDescription className="text-sm">Entre com suas credenciais para acessar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ValidatedInput
                    id="login-email"
                    type="email"
                    label="Email"
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
                    className="h-11"
                  />
                  <ValidatedInput
                    id="login-password"
                    type="password"
                    label="Senha"
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
                    className="h-11"
                  />
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <Button type="submit" className="w-full btn-gold h-11" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-sm text-muted-foreground"
                    onClick={() => setActiveTab('reset')}
                  >
                    Esqueceu sua senha?
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="animate-fade-in">
              <form onSubmit={handleSignup}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold">Criar nova conta</CardTitle>
                  <CardDescription className="text-sm">Preencha os dados para começar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ValidatedInput
                    id="signup-nome"
                    label="Nome"
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
                    className="h-11"
                  />
                  <ValidatedInput
                    id="signup-email"
                    type="email"
                    label="Email"
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
                    className="h-11"
                  />
                  <ValidatedInput
                    id="signup-password"
                    type="password"
                    label="Senha"
                    placeholder="••••••••"
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
                    className="h-11"
                  />
                  <ValidatedInput
                    id="signup-confirm"
                    type="password"
                    label="Confirmar Senha"
                    placeholder="••••••••"
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
                    className="h-11"
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full btn-gold h-11" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="reset" className="animate-fade-in">
              <form onSubmit={handleResetPassword}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold">Recuperar Senha</CardTitle>
                  <CardDescription className="text-sm">
                    {resetSent 
                      ? 'Verifique seu email para redefinir sua senha'
                      : 'Digite seu email para receber o link de recuperação'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!resetSent && (
                    <ValidatedInput
                      id="reset-email"
                      type="email"
                      label="Email"
                      placeholder="seu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  )}
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  {!resetSent ? (
                    <Button type="submit" className="w-full btn-gold h-11" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Enviar Link'
                      )}
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      className="w-full btn-gold h-11"
                      onClick={() => {
                        setActiveTab('login');
                        setResetSent(false);
                        setResetEmail('');
                      }}
                    >
                      Voltar ao Login
                    </Button>
                  )}
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-sm text-muted-foreground"
                    onClick={() => {
                      setActiveTab('login');
                      setResetSent(false);
                    }}
                  >
                    Voltar
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 Nexsiles. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

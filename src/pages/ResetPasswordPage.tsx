import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import logo from '@/assets/logo.png';
import { ValidatedInput } from '@/components/ui/validated-input';

const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (type === 'recovery' && accessToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        });
        
        if (error) {
          setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
        }
      } else if (!session) {
        setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
      }
    };

    checkSession();
  }, []);

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'password':
        if (!value) return 'Senha é obrigatória';
        if (value.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
        break;
      case 'confirmPassword':
        if (!value) return 'Confirmação é obrigatória';
        if (value !== password) return 'As senhas não coincidem';
        break;
    }
    return '';
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password });
    
    setLoading(false);

    if (error) {
      toast.error('Erro ao atualizar senha. Tente novamente.');
      return;
    }

    setSuccess(true);
    toast.success('Senha atualizada com sucesso!');
    
    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate('/auth', { replace: true });
    }, 2000);
  };

  const handleRequestNewLink = () => {
    navigate('/auth?tab=reset');
  };

  return (
    <div className="auth-background flex items-center justify-center p-4">
      <div className="floating-shape w-96 h-96 bg-primary -top-48 -left-48" style={{ animationDelay: '0s' }} />
      <div className="floating-shape w-80 h-80 bg-accent -bottom-40 -right-40" style={{ animationDelay: '-5s' }} />
      <div className="floating-shape w-64 h-64 bg-primary top-1/2 left-1/4" style={{ animationDelay: '-10s' }} />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
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
          {error ? (
            <>
              <CardHeader className="pb-4 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <CardTitle className="text-xl font-semibold">Link Expirado</CardTitle>
                <CardDescription className="text-sm">{error}</CardDescription>
              </CardHeader>
              <CardFooter className="flex-col gap-3">
                <Button 
                  className="w-full btn-gold h-11"
                  onClick={handleRequestNewLink}
                >
                  Solicitar Novo Link
                </Button>
                <Button 
                  variant="link" 
                  className="text-sm text-muted-foreground"
                  onClick={() => navigate('/auth')}
                >
                  Voltar ao Login
                </Button>
              </CardFooter>
            </>
          ) : success ? (
            <>
              <CardHeader className="pb-4 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Senha Atualizada!</CardTitle>
                <CardDescription className="text-sm">
                  Sua senha foi alterada com sucesso. Você será redirecionado para o login...
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </CardContent>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold">Definir Nova Senha</CardTitle>
                <CardDescription className="text-sm">
                  Digite sua nova senha abaixo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ValidatedInput
                  id="new-password"
                  type="password"
                  label="Nova Senha"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) {
                      setErrors(prev => ({ ...prev, password: validateField('password', e.target.value) }));
                    }
                  }}
                  onBlur={() => handleBlur('password', password)}
                  error={errors.password}
                  touched={touched.password}
                  required
                  className="h-11"
                />
                <ValidatedInput
                  id="confirm-password"
                  type="password"
                  label="Confirmar Nova Senha"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (touched.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: validateField('confirmPassword', e.target.value) }));
                    }
                  }}
                  onBlur={() => handleBlur('confirmPassword', confirmPassword)}
                  error={errors.confirmPassword}
                  touched={touched.confirmPassword}
                  required
                  className="h-11"
                />
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button type="submit" className="w-full btn-gold h-11" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    'Atualizar Senha'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="link" 
                  className="text-sm text-muted-foreground"
                  onClick={() => navigate('/auth')}
                >
                  Cancelar
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()} Nexsiles. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

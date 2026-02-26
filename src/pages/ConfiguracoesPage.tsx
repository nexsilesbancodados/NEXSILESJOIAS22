import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Percent, Store, Bell, Palette, Printer, LogOut, Loader2, Sun, Moon, Monitor, Target, Database, MessageCircle, User, Crown, RotateCcw, Users, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useConfiguracoes, useSaveConfiguracoes } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MetasConfig } from '@/components/metas/MetasConfig';
import { BackupManager } from '@/components/backup/BackupManager';
import { PrinterSettings } from '@/components/printer/PrinterSettings';

import { ProfileCard } from '@/components/profile/ProfileCard';
import { SubscriptionNotifications } from '@/components/profile/SubscriptionNotifications';
import { useSetupWizard } from '@/components/onboarding/SetupWizard';
import { DataExportManager } from '@/components/export/DataExportManager';
import { SmartAlertsManager } from '@/components/alerts/SmartAlertsManager';
import { FuncionariosTab } from '@/components/funcionarios/FuncionariosTab';
import { EcommerceConfigTab } from '@/components/ecommerce/EcommerceConfigTab';
import { EcommercePedidosTab } from '@/components/ecommerce/EcommercePedidosTab';

export default function ConfiguracoesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'perfil';
  const { signOut, profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: configData, isLoading } = useConfiguracoes();
  const saveConfigs = useSaveConfiguracoes();
  const { resetWizard } = useSetupWizard();
  
  const [config, setConfig] = useState({
    nome_loja: '',
    telefone_loja: '',
    endereco_loja: '',
    cnpj_loja: '',
    comissao_padrao: '10',
    impressora_termica: 'false',
    largura_recibo: '80',
    whatsapp_ativo: 'false',
    whatsapp_numero: '',
    whatsapp_mensagem_aniversario: '🎂 Parabéns {nome}! Desejamos um feliz aniversário cheio de brilho!',
    whatsapp_mensagem_maleta: '⏰ Olá {nome}! Lembramos que a devolução da maleta está próxima.',
  });

  useEffect(() => {
    if (configData) {
      setConfig({
        nome_loja: configData.nome_loja || '',
        telefone_loja: configData.telefone_loja || '',
        endereco_loja: configData.endereco_loja || '',
        cnpj_loja: configData.cnpj_loja || '',
        comissao_padrao: configData.comissao_padrao || '10',
        impressora_termica: configData.impressora_termica || 'false',
        largura_recibo: configData.largura_recibo || '80',
        whatsapp_ativo: configData.whatsapp_ativo || 'false',
        whatsapp_numero: configData.whatsapp_numero || '',
        whatsapp_mensagem_aniversario: configData.whatsapp_mensagem_aniversario || '🎂 Parabéns {nome}! Desejamos um feliz aniversário cheio de brilho!',
        whatsapp_mensagem_maleta: configData.whatsapp_mensagem_maleta || '⏰ Olá {nome}! Lembramos que a devolução da maleta está próxima.',
      });
    }
  }, [configData]);

  const handleSave = () => {
    saveConfigs.mutate(config);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Configurações</h1>
              <p className="text-sm text-muted-foreground">Personalize seu sistema</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="max-w-4xl">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="perfil" className="gap-1">
            <User className="w-3 h-3" />
            Meu Perfil
          </TabsTrigger>
          <TabsTrigger value="loja">Dados da Loja</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="metas">Metas</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="impressao">Impressão</TabsTrigger>
          <TabsTrigger value="aparencia">Aparência</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="funcionarios" className="gap-1">
            <Users className="w-3 h-3" />
            Funcionários
          </TabsTrigger>
          <TabsTrigger value="ecommerce" className="gap-1">
            <ShoppingBag className="w-3 h-3" />
            Loja Virtual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfileCard />
            <SubscriptionNotifications />
          </div>
        </TabsContent>

        <TabsContent value="loja" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                <CardTitle className="font-display">Dados da Empresa</CardTitle>
              </div>
              <CardDescription>Informações que aparecem nos recibos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_loja">Nome da Loja</Label>
                  <Input
                    id="nome_loja"
                    value={config.nome_loja}
                    onChange={(e) => setConfig({ ...config, nome_loja: e.target.value })}
                    placeholder="Minha Loja de Semijoias"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone_loja">Telefone</Label>
                  <Input
                    id="telefone_loja"
                    value={config.telefone_loja}
                    onChange={(e) => setConfig({ ...config, telefone_loja: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco_loja">Endereço</Label>
                <Input
                  id="endereco_loja"
                  value={config.endereco_loja}
                  onChange={(e) => setConfig({ ...config, endereco_loja: e.target.value })}
                  placeholder="Rua, número - Cidade/UF"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj_loja">CNPJ</Label>
                <Input
                  id="cnpj_loja"
                  value={config.cnpj_loja}
                  onChange={(e) => setConfig({ ...config, cnpj_loja: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendas" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-primary" />
                <CardTitle className="font-display">Configurações de Vendas</CardTitle>
              </div>
              <CardDescription>Parâmetros para vendas e comissões</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comissao">Comissão Padrão para Revendedoras (%)</Label>
                <Input
                  id="comissao"
                  type="number"
                  value={config.comissao_padrao}
                  onChange={(e) => setConfig({ ...config, comissao_padrao: e.target.value })}
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground">
                  Percentual padrão de comissão para novas revendedoras
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <CardTitle className="font-display">Notificações</CardTitle>
              </div>
              <CardDescription>Gerencie alertas do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de Estoque Baixo</p>
                  <p className="text-sm text-muted-foreground">
                    Mostrar alerta quando estoque for menor que 5 unidades
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metas" className="space-y-6">
          <MetasConfig />
        </TabsContent>

        <TabsContent value="impressao" className="space-y-6">
          <PrinterSettings />
          
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" />
                <CardTitle className="font-display">Configurações de Papel</CardTitle>
              </div>
              <CardDescription>Configure o tamanho do papel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Modo Impressora Térmica</p>
                  <p className="text-sm text-muted-foreground">
                    Otimizar layout para impressora térmica
                  </p>
                </div>
                <Switch 
                  checked={config.impressora_termica === 'true'}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, impressora_termica: checked ? 'true' : 'false' })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="largura">Largura do Papel (mm)</Label>
                <Input
                  id="largura"
                  type="number"
                  value={config.largura_recibo}
                  onChange={(e) => setConfig({ ...config, largura_recibo: e.target.value })}
                  placeholder="80"
                />
                <p className="text-xs text-muted-foreground">
                  Geralmente 58mm ou 80mm para impressoras térmicas
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <CardTitle className="font-display">Tema do Sistema</CardTitle>
              </div>
              <CardDescription>Personalize a aparência do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === 'light'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Sun className="w-8 h-8 text-warning" />
                  <span className="font-medium">Claro</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Moon className="w-8 h-8 text-primary" />
                  <span className="font-medium">Escuro</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === 'system'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Monitor className="w-8 h-8 text-muted-foreground" />
                  <span className="font-medium">Sistema</span>
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                O tema "Sistema" acompanha a preferência do seu dispositivo.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <DataExportManager />
          <SmartAlertsManager />
          <BackupManager />
          
          
          {/* Opção para reiniciar o wizard */}
          <Card className="glass-card border-dashed">
            <CardHeader>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-primary" />
                <CardTitle className="font-display">Assistente de Configuração</CardTitle>
              </div>
              <CardDescription>
                Execute novamente o wizard de configuração inicial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={() => {
                  resetWizard();
                  navigate('/');
                  toast.success('Wizard de configuração reiniciado!');
                }}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar Wizard de Onboarding
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-success" />
                <CardTitle className="font-display">Configurações do WhatsApp</CardTitle>
              </div>
              <CardDescription>Configure mensagens automáticas e templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ativar Integração WhatsApp</p>
                  <p className="text-sm text-muted-foreground">
                    Habilita envio de mensagens automáticas
                  </p>
                </div>
                <Switch 
                  checked={config.whatsapp_ativo === 'true'}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, whatsapp_ativo: checked ? 'true' : 'false' })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_numero">Número Padrão para Envios</Label>
                <Input
                  id="whatsapp_numero"
                  value={config.whatsapp_numero}
                  onChange={(e) => setConfig({ ...config, whatsapp_numero: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
                <p className="text-xs text-muted-foreground">
                  Número usado como remetente padrão
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <CardTitle className="font-display">Mensagens Automáticas</CardTitle>
              </div>
              <CardDescription>Personalize os templates de mensagens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="msg_aniversario">Mensagem de Aniversário</Label>
                <Textarea
                  id="msg_aniversario"
                  value={config.whatsapp_mensagem_aniversario}
                  onChange={(e) => setConfig({ ...config, whatsapp_mensagem_aniversario: e.target.value })}
                  placeholder="Use {nome} para inserir o nome do cliente"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Variáveis: {'{nome}'}, {'{data}'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="msg_maleta">Lembrete de Maleta</Label>
                <Textarea
                  id="msg_maleta"
                  value={config.whatsapp_mensagem_maleta}
                  onChange={(e) => setConfig({ ...config, whatsapp_mensagem_maleta: e.target.value })}
                  placeholder="Use {nome} para inserir o nome da revendedora"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Variáveis: {'{nome}'}, {'{data_devolucao}'}, {'{codigo_maleta}'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funcionarios" className="space-y-6">
          <FuncionariosTab />
        </TabsContent>

        <TabsContent value="ecommerce" className="space-y-6">
          <Tabs defaultValue="config-loja" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="config-loja">Configurações</TabsTrigger>
              <TabsTrigger value="pedidos-loja">Pedidos</TabsTrigger>
            </TabsList>
            <TabsContent value="config-loja">
              <EcommerceConfigTab />
            </TabsContent>
            <TabsContent value="pedidos-loja">
              <EcommercePedidosTab />
            </TabsContent>
          </Tabs>
        </TabsContent>

      </Tabs>

      <div className="mt-6 max-w-4xl">
        <Button 
          onClick={handleSave} 
          className="btn-gold w-full" 
          size="lg"
          disabled={saveConfigs.isPending}
        >
          {saveConfigs.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações'
          )}
        </Button>
      </div>
    </div>
  );
}

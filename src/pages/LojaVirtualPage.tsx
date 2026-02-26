import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, Settings, Package, LayoutGrid } from 'lucide-react';
import { EcommerceConfigTab } from '@/components/ecommerce/EcommerceConfigTab';
import { EcommercePedidosTab } from '@/components/ecommerce/EcommercePedidosTab';
import { EcommerceProdutosTab } from '@/components/ecommerce/EcommerceProdutosTab';

export default function LojaVirtualPage() {
  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Loja Virtual</h1>
            <p className="text-sm text-muted-foreground">Gerencie sua loja online, produtos e pedidos</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="produtos" className="max-w-5xl">
        <TabsList className="mb-6">
          <TabsTrigger value="produtos" className="gap-1.5">
            <LayoutGrid className="w-4 h-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="pedidos" className="gap-1.5">
            <Package className="w-4 h-4" />
            Pedidos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produtos">
          <EcommerceProdutosTab />
        </TabsContent>
        <TabsContent value="config">
          <EcommerceConfigTab />
        </TabsContent>
        <TabsContent value="pedidos">
          <EcommercePedidosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

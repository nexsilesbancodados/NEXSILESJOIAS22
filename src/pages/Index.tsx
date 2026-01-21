import { useState } from "react";
import { Home, FolderOpen, Settings, Menu, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { icon: Home, label: "Início", active: true },
    { icon: FolderOpen, label: "Projetos", active: false },
    { icon: Settings, label: "Configurações", active: false },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="font-semibold text-foreground">Workspace</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                item.active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="border-0 bg-transparent focus-visible:ring-0 px-0"
            />
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo
          </Button>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Bem-vindo ao seu Workspace
            </h2>
            <p className="text-muted-foreground mb-6">
              Comece criando um novo projeto ou explore suas tarefas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-6 bg-card border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mb-4">
                    <FolderOpen className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">
                    Projeto {i}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Clique para abrir
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface Peca {
  id: string;
  nome: string;
  codigo: string;
  preco_venda: number;
  imagem_url: string | null;
  categoria: string | null;
  [key: string]: any;
}

interface Props {
  pecas: Peca[];
  search: string;
  setSearch: (v: string) => void;
  onSelect: (peca: any) => void;
  textDark: string;
  textMuted: string;
  roseGold: string;
  className?: string;
}

export function SearchAutocomplete({ pecas, search, setSearch, onSelect, textDark, textMuted, roseGold, className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const suggestions = search.length >= 2
    ? pecas.filter(p =>
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(search.toLowerCase()) ||
        p.categoria?.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
      <input
        type="text"
        placeholder="Buscar por nome, código ou categoria..."
        value={search}
        onChange={e => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="w-full pl-9 pr-8 py-2 text-sm rounded-none border-b bg-transparent outline-none transition-colors focus:border-current"
        style={{ borderColor: '#E0D5CF', color: textDark, fontFamily: "'Inter', sans-serif" }}
      />
      {search && (
        <button onClick={() => { setSearch(''); setOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2">
          <X className="w-3.5 h-3.5" style={{ color: textMuted }} />
        </button>
      )}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 border shadow-lg max-h-72 overflow-y-auto"
          style={{ backgroundColor: '#FFFDFB', borderColor: '#F0E6E0' }}>
          {suggestions.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
            >
              {p.imagem_url ? (
                <img src={p.imagem_url} alt={p.nome} className="w-10 h-10 object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#F5EEEA' }}>
                  <Search className="w-4 h-4" style={{ color: '#D4A0A7' }} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: textDark, fontFamily: "'Inter', sans-serif" }}>{p.nome}</p>
                <p className="text-[10px]" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>
                  {p.categoria || ''} · {p.preco_venda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

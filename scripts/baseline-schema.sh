#!/usr/bin/env bash
# Gera a linha de base do esquema a partir do banco que está no ar.
#
# A pasta supabase/migrations/ NÃO reconstrói o banco — o esquema foi escrito
# quatro vezes em versões incompatíveis. Ver docs/RECUPERACAO-desastre.md.
#
# Uso:  ./scripts/baseline-schema.sh
set -euo pipefail

PROJECT_REF="ljofnwcvpzqlhagejgbk"
OUT_DIR="$(dirname "$0")/../supabase/baseline"

if ! command -v supabase >/dev/null 2>&1; then
  echo "CLI do Supabase não encontrada."
  echo "Instale com:  npm install -g supabase"
  echo "Depois rode:  supabase login"
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "Projeto: $PROJECT_REF"
echo "Destino: $OUT_DIR"
echo
echo "A CLI vai pedir a senha do banco."
echo "Ela está no painel: Settings → Database → Database password."
echo

supabase link --project-ref "$PROJECT_REF"

echo "[1/3] Esquema (tabelas, RLS, funções, triggers)..."
supabase db dump --linked -f "$OUT_DIR/schema.sql"

echo "[2/3] Papéis do banco..."
supabase db dump --linked --role-only -f "$OUT_DIR/roles.sql"

echo "[3/3] Dados..."
supabase db dump --linked --data-only -f "$OUT_DIR/data.sql"

echo
echo "Pronto. Arquivos gerados:"
ls -lh "$OUT_DIR"
echo
echo "Commite os três arquivos: git add supabase/baseline/"

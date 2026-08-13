# Gera a linha de base do esquema a partir do banco que está no ar.
#
# A pasta supabase/migrations/ NÃO reconstrói o banco — o esquema foi escrito
# quatro vezes em versões incompatíveis. Ver docs/RECUPERACAO-desastre.md.
#
# Uso:  .\scripts\baseline-schema.ps1

$ErrorActionPreference = "Stop"

$ProjectRef = "ljofnwcvpzqlhagejgbk"
$OutDir = Join-Path $PSScriptRoot "..\supabase\baseline"

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "CLI do Supabase nao encontrada." -ForegroundColor Red
    Write-Host "Instale com:  npm install -g supabase"
    Write-Host "Depois rode:  supabase login"
    exit 1
}

if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

Write-Host "Projeto: $ProjectRef"
Write-Host "Destino: $OutDir"
Write-Host ""
Write-Host "A CLI vai pedir a senha do banco." -ForegroundColor Yellow
Write-Host "Ela esta no painel: Settings -> Database -> Database password."
Write-Host ""

supabase link --project-ref $ProjectRef
if (-not $?) { Write-Host "Falha ao conectar ao projeto." -ForegroundColor Red; exit 1 }

Write-Host "[1/3] Esquema (tabelas, RLS, funcoes, triggers)..."
supabase db dump --linked -f (Join-Path $OutDir "schema.sql")
if (-not $?) { Write-Host "Falha ao exportar o esquema." -ForegroundColor Red; exit 1 }

Write-Host "[2/3] Papeis do banco..."
supabase db dump --linked --role-only -f (Join-Path $OutDir "roles.sql")
if (-not $?) { Write-Host "Falha ao exportar os papeis." -ForegroundColor Red; exit 1 }

Write-Host "[3/3] Dados..."
supabase db dump --linked --data-only -f (Join-Path $OutDir "data.sql")
if (-not $?) { Write-Host "Falha ao exportar os dados." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Pronto. Arquivos gerados:" -ForegroundColor Green
Get-ChildItem $OutDir | Select-Object Name, @{N='Tamanho';E={"{0:N0} KB" -f ($_.Length/1KB)}}, LastWriteTime
Write-Host ""
Write-Host "Commite os tres arquivos: git add supabase/baseline/"

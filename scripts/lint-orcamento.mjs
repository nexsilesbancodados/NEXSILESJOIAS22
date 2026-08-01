// Portão de lint por orçamento: o número de problemas não pode CRESCER.
//
// O projeto tem 711 erros de lint, 683 deles `no-explicit-any`. Exigir zero
// reprovaria toda alteração a partir de hoje, e a equipe aprenderia a ignorar o
// CI — que é pior do que não ter CI. Exigir "não piorar" barra o que interessa:
// o erro NOVO, na alteração que está entrando.
//
// Para baixar o teto: limpe um punhado de erros, rode este script e ele diz o
// número novo para você gravar aqui. O teto só desce.
import { execSync } from 'node:child_process';

const TETO_ERROS = 711;
const TETO_AVISOS = 32;

let saida;
try {
  saida = execSync('npx eslint . -f json', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (e) {
  // O eslint sai com código 1 quando encontra erro — o JSON vem no stdout do
  // mesmo jeito. Só é falha de verdade se não vier nada.
  saida = e.stdout;
  if (!saida) {
    console.error('eslint não produziu resultado:', e.message);
    process.exit(2);
  }
}

const arquivos = JSON.parse(saida);
let erros = 0;
let avisos = 0;
const porRegra = {};
for (const arq of arquivos) {
  for (const m of arq.messages) {
    if (m.severity === 2) erros++;
    else avisos++;
    const chave = m.ruleId ?? '(sem regra)';
    porRegra[chave] = (porRegra[chave] ?? 0) + 1;
  }
}

console.log(`erros:  ${erros} (teto ${TETO_ERROS})`);
console.log(`avisos: ${avisos} (teto ${TETO_AVISOS})`);

const piorou = erros > TETO_ERROS || avisos > TETO_AVISOS;

if (piorou) {
  console.log('\nAs regras que mais aparecem:');
  Object.entries(porRegra).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .forEach(([r, n]) => console.log(`  ${String(n).padStart(4)}  ${r}`));
  console.log(
    `\nEsta alteração acrescenta problemas de lint (${erros - TETO_ERROS} erro(s), `
    + `${avisos - TETO_AVISOS} aviso(s) a mais). Corrija o que você introduziu.`,
  );
  process.exit(1);
}

if (erros < TETO_ERROS || avisos < TETO_AVISOS) {
  console.log(
    `\nMelhorou. Baixe o teto em scripts/lint-orcamento.mjs para `
    + `TETO_ERROS = ${erros} e TETO_AVISOS = ${avisos}, para não voltar atrás.`,
  );
}

console.log('\nOK — o lint não piorou.');

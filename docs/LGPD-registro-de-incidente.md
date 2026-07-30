# Registro de incidente de segurança — LGPD

**Documento interno.** A LGPD (art. 48) exige que o controlador registre incidentes de
segurança e comunique a ANPD e os titulares quando houver risco relevante. Este registro
está preenchido com o que foi apurado tecnicamente; os campos marcados **[preencher]**
dependem de decisão sua.

---

## 1. Identificação

| Campo | Conteúdo |
|---|---|
| Controlador | **[preencher: razão social e CNPJ da Nexsiles]** |
| Encarregado (DPO) | **[preencher: nome, e-mail e telefone]** |
| Sistema afetado | Nexsiles — ERP e loja de semijoias (`nexsiles2567.lovable.app`) |
| Infraestrutura | Supabase (PostgreSQL), projeto `ljofnwcvpzqlhagejgbk`, região São Paulo |
| Data da apuração | 29 e 30 de julho de 2026 |
| Data da correção | 30 de julho de 2026 |

## 2. O que aconteceu

Uma auditoria de segurança do aplicativo identificou que a tabela `purchases`, que guarda
os dados de quem comprou um plano do sistema, estava configurada para leitura pública. Na
prática, qualquer pessoa com a chave pública do aplicativo — que fica visível no código do
site, como em qualquer aplicação desse tipo — conseguia baixar a tabela inteira.

A causa técnica foi uma regra de acesso (`RLS policy`) criada com a condição
`USING (true)`, ou seja, sem nenhuma restrição, acompanhada de um comentário no código que
descrevia a abertura como intencional.

Não é possível determinar exatamente **quando** a exposição começou nem se alguém a
explorou: a regra foi criada em **1º de março de 2026** (migração
`20260301224011`), e o projeto não possui registro de acessos (logs) da API que permita
reconstruir consultas anteriores.

## 3. Dados pessoais expostos

Confirmado por consulta direta no dia 30/07/2026, antes da correção:

| Dado | Registros |
|---|---|
| Nome completo | 18 |
| E-mail | 18 |
| **CPF** | **16** |
| Telefone | 18 |
| Código de acesso ao plano contratado | 18 |
| Plano contratado e situação do pagamento | 18 |

**Titulares afetados: 18 pessoas** (compradores de planos do sistema).

Não havia senha, dado bancário nem número de cartão na tabela. Os pagamentos são
processados pelo Mercado Pago; a tabela guardava apenas o identificador da preferência de
pagamento.

## 4. Riscos aos titulares

- **Alto — exposição de CPF junto com nome, e-mail e telefone.** É a combinação usada em
  fraude de identidade e em golpes direcionados ("golpe do falso funcionário", abertura de
  cadastros em nome da vítima).
- **Médio — código de acesso ao plano.** Permitia identificar quem havia comprado e qual
  plano. Não permitia, por si só, entrar na conta de outra pessoa: a ativação sempre exigiu
  que o e-mail da conta fosse o mesmo da compra.
- **Baixo — situação do pagamento.** Informação comercial, sem sensibilidade especial.

## 5. Outras falhas corrigidas na mesma apuração

Não houve exposição confirmada de dados de clientes finais das lojas, mas as seguintes
falhas permitiam acesso indevido e foram fechadas no mesmo dia:

- portal das revendedoras e área "Meus pedidos" da loja sem sessão no servidor: era possível
  ler e alterar dados de qualquer revendedora informando o identificador dela;
- endpoint que testava senha de revendedora sem limite de tentativas;
- preço de custo das peças legível por qualquer visitante;
- possibilidade de um usuário comum se promover a administrador;
- cerca de 25 regras de acesso permissivas em tabelas com dados de clientes, vendas e
  fidelidade.

## 6. Medidas adotadas

| Data | Medida |
|---|---|
| 30/07/2026 | Leitura pública de `purchases` removida; acesso restrito ao servidor |
| 30/07/2026 | Sessão real (token) no portal da revendedora e na área do cliente |
| 30/07/2026 | Endpoint de teste de senha desativado; login com limite de 10 tentativas por e-mail a cada 10 minutos |
| 30/07/2026 | Preço de custo e margens fora do alcance de visitantes |
| 30/07/2026 | Bloqueio de auto-promoção a administrador e a super administrador |
| 30/07/2026 | Regras de acesso permissivas substituídas por regras por organização |
| **[preencher]** | Rotação dos códigos de acesso expostos (script `ROTACAO-codigos-de-acesso.sql`) |
| **[preencher]** | Comunicação aos titulares |

Todas as correções foram verificadas em produção e em ambiente de teste automatizado
(112 verificações de banco de dados e 80 do aplicativo).

## 7. Comunicação

**[preencher — decisão do controlador]**

Orientação: a ANPD considera comunicável o incidente que possa acarretar risco ou dano
relevante. Exposição de **CPF junto com nome, e-mail e telefone** costuma ser enquadrada
nessa hipótese. O prazo de comunicação à ANPD é de **3 dias úteis** contados do
conhecimento do incidente (Resolução CD/ANPD nº 15/2024), pelo formulário do site da ANPD.

- [ ] Comunicação à ANPD — data: ______
- [ ] Comunicação aos 18 titulares — data: ______
- [ ] Registro no inventário de incidentes da empresa

Modelo de aviso aos titulares em `LGPD-modelo-aviso-titulares.md`.

## 8. Medidas para não repetir

- Testes automatizados de segurança do banco passam a rodar junto com o projeto
  (`supabase/tests/`, 112 verificações) — inclusive um que falha se alguma tabela voltar a
  ficar legível publicamente.
- Nenhuma regra nova com `USING (true)` deve ser aceita em revisão.
- **[recomendado]** contratar plano com backup e retenção de logs: hoje o projeto não tem
  backup nem registro de acessos, o que impediu determinar a extensão real deste incidente.

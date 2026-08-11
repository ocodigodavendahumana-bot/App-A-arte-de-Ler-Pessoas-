# O Código da Venda Humana — App com backend real (pronto para Vercel)

Esta versão substitui o armazenamento fake (`window.storage`, que só existe
dentro do Claude.ai) por um banco de dados real na nuvem (Vercel KV) e por um
login protegido por senha. Assim os dados de clientes ficam salvos de verdade
e sincronizados entre qualquer dispositivo.

## O que mudou em relação ao HTML original
- Todo o quiz, os 5 perfis e a interface visual continuam exatamente iguais.
- `clientes_db` e `access_log` agora vivem em um banco Vercel KV, acessados
  por rotas serverless em `/api`, não mais em `window.storage`.
- O login agora exige uma **senha** (variável `ADMIN_PASSWORD`), além de nome
  e e-mail — evita que qualquer pessoa digite o e-mail do admin e vire admin.
- Nome, telefone, e-mail e observações de clientes são "escapados" antes de
  aparecer na tela, evitando injeção de HTML/script (XSS).
- Os IDs de cliente agora são gerados no servidor (UUID), não mais por
  `Date.now()`.

## Passo a passo para publicar na Vercel

### 1. Criar o projeto
1. Suba esta pasta para um repositório no GitHub (ou use `vercel` CLI direto
   da pasta local: `npx vercel`).
2. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e
   importe o repositório.
3. Framework preset: deixe **Other** (não precisa de build).

### 2. Criar o banco de dados (Vercel KV)
1. No painel do projeto na Vercel, vá em **Storage → Create Database → KV**.
2. Depois de criado, clique em **Connect Project** e conecte ao projeto que
   você acabou de importar. Isso preenche automaticamente as variáveis
   `KV_REST_API_URL` e `KV_REST_API_TOKEN` — você não precisa copiar nada.

### 3. Configurar as variáveis de ambiente
Em **Project Settings → Environment Variables**, adicione:

| Nome | Valor |
|---|---|
| `ADMIN_PASSWORD` | Uma senha forte, escolhida por você |
| `ADMIN_EMAIL` | O e-mail que deve ter acesso ao Painel Admin |
| `SESSION_SECRET` | Uma string aleatória longa (gere com `openssl rand -hex 32`, ou qualquer gerador de senha de 40+ caracteres) |

Veja também o arquivo `.env.example` incluído no projeto.

### 4. Deploy
Clique em **Deploy**. Depois do primeiro deploy, toda alteração enviada ao
repositório é publicada automaticamente.

### 5. Testar
- Acesse a URL gerada pela Vercel.
- Faça login com nome, e-mail e a senha que você definiu em `ADMIN_PASSWORD`.
- Se o e-mail usado for igual ao `ADMIN_EMAIL`, o menu **Admin** aparece,
  mostrando quem já acessou o app.
- Cadastre um cliente de teste, edite e exclua, para confirmar que está
  gravando de verdade no banco (recarregue a página — o cliente deve
  continuar lá).

## Sobre a senha compartilhada
Hoje todo mundo que você deixar usar o app (por exemplo, sua equipe) entra
com a **mesma senha** (`ADMIN_PASSWORD`). Isso já resolve o problema de
qualquer pessoa da internet acessar os dados dos seus clientes, mas ainda é
uma senha única para todo mundo — não identifica cada usuário individualmente
para fins de segurança (o nome/e-mail servem só para o registro de acesso).
Se no futuro você quiser senhas individuais por pessoa, dá para evoluir para
um sistema de contas com Vercel Postgres + Auth — é um passo a mais, mas o
backend que já está montado aqui facilita essa migração.

## Limites desta versão
- O banco de clientes é guardado em uma única "lista" no KV (chave
  `clients_db`). Funciona bem para uso de um consultor/pequena equipe; se um
  dia a base crescer para milhares de registros, vale migrar para um banco
  relacional (Postgres) com paginação.
- Não há exportação de dados (CSV/backup) ainda — posso adicionar se for
  útil para você.

# api-auth

Servico de identidade central em Fastify para autenticacao e autorizacao por aplicacao.

## Funcionalidades

- Cadastro de usuario na API Auth (`POST /api/v1/register`)
- Verificacao de e-mail por codigo (`POST /api/v1/verify-email`)
- Login por aplicacao com JWT + refresh token (`POST /api/v1/login`)
- Renovacao de sessao (`POST /api/v1/refresh-token`)
- Recuperacao de senha com escopo por aplicacao (`POST /api/v1/forgot-password`, `POST /api/v1/reset-password`)
- Encerramento de sessao (`POST /api/v1/logout`)
- Identidade do usuario autenticado (`GET /api/v1/me`)
- Controle de quais clientes podem consumir a API por `x-client-id` e `x-client-secret`
- Controle de acesso do usuario por aplicacao
- Onboarding administrativo por API:
  - `POST /api/v1/admin/applications`
  - `POST /api/v1/admin/clients`
  - `POST /api/v1/admin/clients/:clientId/applications/:applicationSlug`
  - `POST /api/v1/admin/applications/:applicationSlug/users/:userPublicId`

No cadastro de novo usuario, a API envia um codigo para o e-mail informado e retorna `202` com status `verification_required`.

## Contrato de cliente da API

Todos os endpoints publicos de autenticacao exigem headers:

- `x-client-id`
- `x-client-secret`

Nos endpoints com escopo de aplicacao (`login`, `refresh-token`, `forgot-password`, `reset-password`, `logout`), tambem e obrigatorio:

- `x-application-slug`

Excecao no `login`: usuario com role global `root` pode autenticar sem headers de client/aplicacao.

## Regras de administracao

As rotas em `/api/v1/admin/*` exigem:

- Usuario autenticado com role global `root`

## Regras de cadastro de usuario

- `register` e `verify-email` nao dependem de aplicacao previamente cadastrada
- No `register`, o papel global do usuario na API Auth e obrigatorio:
  - `root`: administrador global da API Auth (sem limitacao por vinculo de aplicacao)
  - `application`: usuario de aplicacoes
- O vinculo usuario-aplicacao e feito depois via rota administrativa:
  - `POST /api/v1/admin/applications/:applicationSlug/users/:userPublicId`

## Stack

- Fastify 5
- Zod + `fastify-type-provider-zod`
- Swagger + Scalar API Reference
- Prisma + PostgreSQL (`@prisma/adapter-pg`)
- JWT + Cookie
- Bcrypt
- MailerSend ou Brevo (configuravel via env)

## Provedor de e-mail

Troca rapida por variavel de ambiente:

- `EMAIL_PROVIDER=mailersend` (padrao)
- `EMAIL_PROVIDER=brevo`

Variaveis:

- MailerSend:
  - `MAILERSEND_API_KEY`
  - (`EMAIL_TOKEN` ainda aceito por compatibilidade)
- Brevo:
  - `BREVO_API_KEY`
- Comum aos dois:
  - `DOMAIN`

## Executar

```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate
pnpm seed
pnpm dev
```

## Build

```bash
pnpm build
pnpm start
```

## Docker DEV

```bash
docker compose -f docker-compose.dev.yaml up --build
```

Em outro terminal (primeira vez):

```bash
docker compose -f docker-compose.dev.yaml exec api-auth pnpm prisma:generate
docker compose -f docker-compose.dev.yaml exec api-auth pnpm prisma:migrate
docker compose -f docker-compose.dev.yaml exec api-auth pnpm seed
```

## Docker PROD

Build e subida:

```bash
docker compose -f docker-compose.prod.yaml up -d --build
```
As migracoes rodam automaticamente na inicializacao do container da API.

## Coolify (VPS)

- Dockerfile multi-stage com runtime `node:bookworm-slim` no target `production`
- O container executa `prisma migrate deploy` automaticamente antes de iniciar a API
- Configure no Coolify:
  - Build pack: Dockerfile
  - Docker target: `production`
  - Porta: `3001`
  - Variaveis de ambiente equivalentes ao `.env.prod`
  - `NODE_ENV` como Runtime only (nao disponivel em build-time)

## Documentacao em producao

- Por padrao, docs ficam desabilitadas em producao (`ENABLE_DOCS=false`)
- Para habilitar, defina `ENABLE_DOCS=true`
- Quando habilitadas em producao, exigem Basic Auth:
  - `DOCS_BASIC_USER`
  - `DOCS_BASIC_PASSWORD`

## Seed inicial

O seed cria:

- `user` root inicial da API Auth

No primeiro login de `root` sem `x-application-slug`, a API cria automaticamente a aplicacao padrao usando:

- `ROOT_DEFAULT_APPLICATION_SLUG` (padrao: `api-auth`)
- `ROOT_DEFAULT_APPLICATION_NAME` (padrao: `API Auth`)

Use as variaveis `SEED_*` do `.env.example`.
O seed deve ser usado como bootstrap inicial; depois disso, prefira onboarding via rotas admin.

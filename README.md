# api-auth

Servico de identidade central em Fastify para autenticacao e autorizacao por aplicacao.

## Funcionalidades

- Cadastro de usuario por aplicacao (`POST /api/v1/register`)
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
  - `POST /api/v1/admin/users/:userPublicId/applications/:applicationSlug`

No cadastro de novo usuario, a API envia um codigo para o e-mail informado e retorna `202` com status `verification_required`.

## Contrato de cliente da API

Os endpoints publicos de autenticacao exigem headers:

- `x-client-id`
- `x-client-secret`

O cliente precisa estar ativo e autorizado para a `applicationSlug` enviada no body.

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

Rodar migracoes de producao:

```bash
docker compose -f docker-compose.prod.yaml --profile ops run --rm migrate
```

## Coolify (VPS)

- Dockerfile multi-stage com runtime `distroless` no target `production`
- Configure no Coolify:
  - Build pack: Dockerfile
  - Docker target: `production`
  - Porta: `3001`
  - Variaveis de ambiente equivalentes ao `.env.prod`
  - `NODE_ENV` como Runtime only (nao disponivel em build-time)
- Execute migracoes antes do deploy final usando o target `migrate` (job/one-off)

## Documentacao em producao

- Por padrao, docs ficam desabilitadas em producao (`ENABLE_DOCS=false`)
- Para habilitar, defina `ENABLE_DOCS=true`
- Quando habilitadas em producao, exigem Basic Auth:
  - `DOCS_BASIC_USER`
  - `DOCS_BASIC_PASSWORD`

## Seed inicial

O seed cria:

- `application` (sistema que usara login)
- `auth_client` (cliente autorizado a chamar a API)
- vinculo de acesso entre cliente e aplicacao

Use as variaveis `SEED_*` do `.env.example`.
O seed deve ser usado como bootstrap inicial; depois disso, prefira onboarding via rotas admin.

# Instalação e publicação (ambiente inicial)

## Local

1. Instale Node.js 20+, Java 21, Maven e inicie Docker Desktop com o motor Linux.
2. Copie `.env.example` para `.env`; a senha padrão no exemplo serve somente para desenvolvimento local.
3. Em `apps/web`, rode `npm install` e `npm start`.
4. Na raiz, rode `docker compose up --build`; PostgreSQL persiste no volume Docker `postgres_data`.
5. A API usa `http://localhost:8080`; OpenAPI em `/swagger-ui`; health em `/actuator/health`. O insights fica apenas na rede interna do Compose.

## Variáveis

- `FIREBASE_PROJECT_ID`: projeto Firebase não produtivo.
- `POSTGRES_PASSWORD`: senha local do container. Troque antes de compartilhar o ambiente e nunca reutilize em produção.
- `OPEN_FINANCE_PROVIDER`, `OPEN_FINANCE_CLIENT_ID`, `OPEN_FINANCE_CLIENT_SECRET`: credenciais do contrato do provedor. A conexão continua desabilitada até implementar e revisar o adapter e webhooks.
- `PORT`: porta HTTP da API.

## Publicação

Ainda não existe configuração de produção. Antes de publicar, implemente OAuth/Open Finance e webhooks, configure banco e gestão de segredos gerenciados, MFA, HTTPS, CORS permitido por origem, limites de requisição, backups e restauração testados, monitoramento e política de retenção/exclusão revisada. Não publique os serviços atuais como produto financeiro pronto.

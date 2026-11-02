# Arquitetura inicial

## Decisões

- Angular + TypeScript é o shell e a experiência financeira principal.
- O assistente financeiro é um módulo Angular que chama a API Spring. A OpenAI Responses API é acessada somente do servidor; chaves nunca são entregues ao navegador.
- Spring Boot é a camada de API, autorização e regras de domínio. Firebase Authentication fornece identidade; a API valida assinatura, emissor, audiência, validade e e-mail verificado do token, e deriva o usuário do token.
- PostgreSQL é o armazenamento operacional principal em um container Docker, com volume nomeado e migrations Flyway. Redis é cache efêmero e não fonte de verdade.
- Python é um serviço separado para cálculos estatísticos explicáveis. Não toma decisões financeiras nem transforma projeções em saldos confirmados.
- Firebase Storage e FCM podem ser integrados depois para anexos privados e push; ainda não são usados pelo app.
- C# não foi adicionado: ainda não há um serviço que justifique outro runtime.

## Limites de domínio

Contas, transações importadas e manuais, categorias, regras, cartões, orçamentos, metas, investimentos, consentimentos, conexões bancárias, relatórios e notificações. Registros importados são imutáveis; correções do usuário são armazenadas como anotações/categorização sobre a transação original.

## Open Finance

Pluggy está implementado como provedor de conexão: Spring emite Connect Tokens de curta duração, Pluggy Connect abre o consentimento em tema escuro, e a API verifica que o Item pertence ao UID Firebase. A sincronização manual lê contas/transações, deduplica pelo ID do provedor e marca dados Sandbox separadamente. Credenciais ficam somente no servidor e nenhuma senha bancária é recebida. Webhooks ainda não estão implementados; sincronizações automáticas de atualização do provedor exigem endpoint HTTPS e trabalho adicional.

## Dados e consultas

Transações financeiras incluem UID Firebase, valor em centavos, moeda, tipo, origem, ID externo e Item de origem. A API sempre deriva o UID do token verificado. O extrato filtra texto, tipo, categoria e datas nos 200 registros recentes retornados. A IA recebe totais e os registros mais recentes, com respostas sem persistência do chat e armazenamento de resposta desativado na API OpenAI.

## Decisões ainda necessárias para produção

Credenciais/contrato Pluggy, chave OpenAI, aprovação de produção Open Finance, webhook HTTPS, política de retenção aprovada, gestão de segredos de produção, domínio e backups ainda precisam de configuração. Senha do Compose é apenas para desenvolvimento local.

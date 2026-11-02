# Etapas de entrega

1. Arquitetura e contratos de dados: fundação e decisões registradas.
2. Identidade visual e módulos Angular: iniciar pelo shell responsivo e navegação.
3. API Spring Boot e persistência PostgreSQL em Docker.
4. Autenticação, autorização por usuário e auditoria.
5. Connect Widget Pluggy, Connect Tokens, sincronização manual e deduplicação implementados; falta ativar credenciais do provedor e webhooks de produção.
6. Extrato real com filtros locais, lançamentos manuais e importação Pluggy; categorização de importações usa a categoria retornada pelo provedor com normalização básica.
7. Cartões, lançamentos manuais e recorrência.
8. Dashboard calculado a partir da API, com dados do extrato real quando disponíveis.
9. Chat financeiro conectado à OpenAI Responses API, aguardando chave do projeto; consulta os lançamentos do usuário.
10. Serviço de análise Python.
11. Relatórios e notificações.
12. Testes, revisão de segurança e correções.
13. Deploy e runbooks.

Etapas dependentes de contas/provedor precisam das credenciais e configurações do titular. Nenhum mock será rotulado como conexão ou movimentação real.

# Open Finance e assistente financeiro

## Open Finance via Pluggy

A integração usa o Connect Widget da Pluggy e a API oficial. A senha da instituição é digitada apenas dentro do fluxo hospedado pelo provedor; o app não coleta nem armazena credenciais bancárias. O servidor cria API keys e tokens de conexão; o navegador recebe apenas o token temporário limitado do widget. O `clientUserId` é o UID Firebase autenticado e o backend confirma esse vínculo ao salvar o Item.

No painel Pluggy, crie uma aplicação e guarde `CLIENT_ID`/`CLIENT_SECRET` no `.env` local (nunca no Angular):

```dotenv
OPEN_FINANCE_PROVIDER=pluggy
OPEN_FINANCE_CLIENT_ID=...
OPEN_FINANCE_CLIENT_SECRET=...
OPEN_FINANCE_API_URL=https://api.pluggy.ai
OPEN_FINANCE_INCLUDE_SANDBOX=true
```

Com `OPEN_FINANCE_INCLUDE_SANDBOX=true`, o widget mostra instituições fictícias de teste. Essas transações são marcadas como `Sandbox (teste)` e não devem ser tratadas como movimentações bancárias reais. Antes de uso real, desligue essa opção (`false`) e confirme que a aplicação Pluggy tem cobertura/aprovação para as instituições desejadas.

O endpoint autenticado cria um Connect Token, o widget abre o consentimento institucional em tema escuro e, após sucesso, a API valida que o Item pertence ao UID Firebase. A API sincroniza até 5.000 lançamentos, percorre as páginas de transações, ignora duplicatas por ID do provedor e permite nova sincronização manual. Desconectar remove o Item no provedor e os lançamentos importados daquele Item.

Para configurar uma URL de webhook Pluggy, publique a API em HTTPS e registre no painel/API do provedor os eventos `item/updated`, `item/error`, `transactions/created`, `transactions/updated` e `transactions/deleted`. A configuração de webhook ainda não faz parte deste código; até implementá-la e protegê-la com um segredo dedicado, use o botão de sincronização manual.

## Chat financeiro OpenAI

A chave fica no backend. Configure no `.env`:

```dotenv
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-6-luna
```

Recrie o serviço da API para carregar variáveis novas:

```powershell
docker compose up -d --build api
```

O endpoint autenticado envia à Responses API da OpenAI a pergunta, até 10 mensagens anteriores, totais mensais/categoria e até 100 movimentações recentes resumidas a partir dos 2.000 lançamentos mais recentes. `store: false` desativa o armazenamento de resposta na Responses API. A aplicação não persiste o histórico do chat. O modelo recebe instruções para usar somente esse contexto, explicar quando faltarem registros e identificar dados de Sandbox como testes.

A interface informa que dados financeiros são enviados à OpenAI. Antes de comercialização, revise a política de privacidade e as condições/controles de dados da OpenAI adequados à empresa e ao tratamento de dados financeiros. Nunca configure a chave OpenAI ou o segredo Pluggy no frontend.

## Filtros

A tela Extrato permite filtrar os 200 registros mais recentes retornados pela API por texto, tipo, categoria e intervalo de datas. Categorias e totais são calculados sobre os registros efetivamente carregados; não há dados fictícios. Para relatórios sem limite e filtros no PostgreSQL, implemente paginação e os filtros na consulta da API antes de produção.

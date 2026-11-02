# Planos e cobrança Asaas

## Catálogo

O catálogo é servido pelo backend em `GET /api/v1/billing/plans`. Valores são armazenados em centavos e enviados como preço do checkout hospedado da Asaas.

| Plano | Mensal | Anual | Economia anual | Agentes |
|---|---:|---:|---:|---:|
| Gratuito | R$ 0,00 | — | — | 2 |
| Bronze | R$ 19,99 | R$ 196,70 | R$ 43,18 (18%) | 7 |
| Ouro | R$ 159,00 | R$ 1.564,56 | R$ 343,44 (18%) | 15 |

No anual, a cobrança é feita uma vez por ano. O valor anual resulta do preço mensal vezes 12 com 18% de desconto, arredondado ao centavo.

## Configuração de produção

1. Crie/ative sua conta Asaas e gere uma chave de API de **produção** em **Minha conta → Integrações**.
2. Gere um segredo aleatório exclusivo para autenticar o webhook (mais de 32 caracteres). Não reutilize a chave da API.
3. Copie `.env.example` para `.env` se ainda não existir e configure `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `APP_PUBLIC_URL` e `ASAAS_API_URL=https://api.asaas.com/v3`.
4. Publique a API e o frontend em domínios HTTPS acessíveis pela internet. Defina `APP_PUBLIC_URL` como o endereço HTTPS do frontend. A API deve aceitar `POST /api/v1/billing/webhooks/asaas` diretamente, sem redirecionamento.
5. No painel Asaas, crie um webhook para `https://SEU-DOMINIO-DA-API/api/v1/billing/webhooks/asaas`, configure o mesmo segredo em `authToken` e marque os eventos `CHECKOUT_PAID`, `CHECKOUT_CANCELED`, `CHECKOUT_EXPIRED`, `SUBSCRIPTION_CREATED`, `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED`.
6. Reinicie o serviço `api` depois de atualizar as variáveis. Confira `GET /api/v1/billing/plans` (campo `configured: true`) e faça uma contratação real de baixo valor em conta própria para validar a jornada e os webhooks antes de divulgar o produto.

Nunca envie a chave ou o segredo em conversas, frontend, repositório, logs ou capturas de tela. `.env` já está ignorado pelo Git. Em produção, prefira armazenar os segredos no gerenciador de segredos do provedor de hospedagem.

## Jornada e liberação de acesso

- O usuário precisa entrar com e-mail verificado antes de iniciar checkout.
- A API obtém o usuário exclusivamente do token Firebase validado; o navegador não pode escolher o dono da assinatura.
- A cobrança recorrente é criada no checkout hospedado da Asaas com cartão. Dados do cartão não passam pelo Lucena Finance.
- A URL de retorno do navegador **não** libera o plano. A Asaas deve notificar `CHECKOUT_PAID` ao webhook autenticado. O backend registra eventos com idempotência no PostgreSQL e associa o checkout ao UID que o iniciou.
- As renovações usam `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED` e o ID da assinatura. A API calcula o plano atual por usuário em `GET /api/v1/billing/me`; o gratuito disponibiliza dois agentes.
- `GET /api/v1/assistant/agents` só devolve os agentes liberados pelo plano do usuário. O chat envia o `agentId` escolhido e o backend aplica o perfil correspondente à chamada real da OpenAI; IDs fora da cota são recusados. A chave `OPENAI_API_KEY` também precisa estar configurada para respostas de IA.
- Pix não foi habilitado para assinatura recorrente neste fluxo. O checkout hospedado oferece cartão para a recorrência definida.
- Não há pagamento simulado nem acesso premium concedido por link de retorno.

## Verificação operacional

- O endpoint do webhook deve responder diretamente `2xx`; Asaas repete notificações quando a entrega falha.
- Monitore a fila e os logs de webhook no painel Asaas, além dos logs da API. Eventos são gravados para impedir processamento duplicado.
- Revise cancelamentos, estornos e disputas antes de abrir as vendas ao público. A implementação mantém a assinatura até o fim do período pago e não processa cancelamento de recorrência pelo aplicativo ainda.

## Preço da plataforma

A Asaas informa que a conta não possui mensalidade fixa; há tarifas sobre transações recebidas, conforme o meio de pagamento e as condições da conta. Confira os valores atuais no painel antes de definir a margem comercial.

Referências oficiais: [Asaas Checkout](https://docs.asaas.com/docs/asaas-checkout), [Checkout recorrente](https://docs.asaas.com/docs/checkout-with-subscription-recurring), [eventos de Checkout](https://docs.asaas.com/docs/checkout-events), [webhooks](https://docs.asaas.com/docs/about-webhooks), [eventos de pagamento](https://docs.asaas.com/docs/payment-events), [preços e taxas](https://www.asaas.com/precos-e-taxas).

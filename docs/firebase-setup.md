# Firebase do projeto `lucenas1010`

## Já configurado no código

- `.firebaserc` seleciona `lucenas1010` como projeto Firebase CLI padrão.
- `apps/web/src/app/core/firebase.ts` inicializa o app Web com a configuração enviada pelo proprietário.
- O Angular usa Firebase Authentication para cadastro, login Google, verificação de e-mail e recuperação de senha por e-mail. Requisições para `/api/**` recebem um Firebase ID token.
- A API Java valida o ID token e guarda lançamentos em PostgreSQL pelo UID validado.
- Firestore não participa do fluxo atual. As regras locais negam acesso direto pelo cliente e não foram implantadas no Console.

## Ações no Console

1. Em **Authentication → Sign-in method**, habilite **E-mail/senha** e **Google**. Configure o nome público do app e o e-mail de suporte exigido pelo Google.
2. Em **Authentication → Settings → Authorized domains**, confirme `localhost` para desenvolvimento. Projetos criados após 28/04/2025 não recebem `localhost` por padrão.
3. Em **Authentication → Settings → Password policy**, configure a política mínima alinhada à validação do formulário (12 caracteres). Confira a proteção contra enumeração de e-mails.
4. Em **Authentication → Templates**, revise os modelos de verificação e redefinição de senha.
5. Firestore não é necessário para o fluxo atual baseado em PostgreSQL. Não habilite acesso direto do navegador ao banco sem revisar e testar as regras.
6. TOTP/SMS MFA não está configurado. O Firebase exige Identity Platform para MFA Web; revise custos e requisitos antes de fazer upgrade.

## Credenciais do backend

`FIREBASE_PROJECT_ID=lucenas1010` identifica o projeto. O backend valida tokens com as chaves públicas publicadas pelo Google, sem chave privada de conta de serviço. A chave Web é configuração pública do cliente e não substitui autenticação no backend.

## Próximo passo local

Depois de ativar E-mail/senha e Google, autorizar `localhost` e definir um `PROFILE_ENCRYPTION_KEY` forte no `.env`, inicie Angular e API e teste cadastro/login com dados fictícios válidos. O CPF é cifrado com AES-GCM no backend; não use dados pessoais reais durante a verificação inicial. A chave do exemplo é apenas para desenvolvimento. Para redefinir senha, a aplicação envia o link pelo fluxo de e-mail do Firebase.
## Recuperação de senha por e-mail

O formulário usa Firebase Authentication e agora define o idioma `pt-BR`, mantém uma resposta neutra para não revelar se um endereço está cadastrado e exibe erros acionáveis do Firebase. A página `/auth/action` valida o código de ação e permite salvar uma nova senha sem autenticar a sessão automaticamente.

### Para o e-mail realmente sair

No Console do Firebase do projeto `lucenas1010`:

1. Abra **Authentication → Sign-in method** e habilite **E-mail/senha**.
2. Em **Authentication → Templates → Password reset**, confira o remetente, o assunto, o idioma e o template ativo. Use um endereço de suporte válido e revise Spam/Promoções. O Firebase pode responder sucesso mesmo sem enviar a mensagem quando a proteção contra enumeração está ligada e o endereço não tem conta.
3. Em **Authentication → Settings → Authorized domains**, autorize o domínio público do app e `localhost` para desenvolvimento.
4. Para abrir a página própria e estilizada de redefinição, publique o frontend com HTTPS e configure a URL de ação do template Password reset para `https://SEU-DOMINIO/auth/action`. A URL de continuação enviada pelo app é a raiz pública do app. A rota `/auth/action` processa `mode=resetPassword` e `oobCode` emitidos pelo Firebase.
5. Faça um envio de teste para uma conta que já existe e está sob seu controle; confirme a caixa principal, Spam e Promoções. Se o Firebase rejeitar a solicitação, a tela agora informa códigos comuns como provedor desabilitado, limite de tentativas, e-mail inválido ou falha de rede.

### Aparência da mensagem

O Firebase envia os e-mails padrão de autenticação. Os templates nativos permitem ajustar a identidade e o conteúdo disponíveis no Console, mas não funcionam como um serviço de e-mail transacional com HTML/CSS totalmente livre. A nova rota `/auth/action` entrega a experiência visual premium depois do clique no link. Preparei também um modelo HTML responsivo em `docs/templates/password-reset-email.html`; ele ainda não é enviado pelo Firebase nativo. Para controlar integralmente o HTML da própria mensagem, será necessário um backend com Firebase Admin SDK para gerar o link de ação e um provedor transacional (SMTP/API), com domínio autenticado (SPF, DKIM e DMARC) e credenciais guardadas no servidor. Não coloque segredos de serviço no frontend.

A configuração do Console não é versionada neste repositório e precisa ser aplicada no projeto Firebase publicado. O ambiente de desenvolvimento local em `http://localhost:4200` não torna o link acessível a destinatários externos.

### Publicar no Firebase Hosting

O `firebase.json` já aponta para o build Angular e faz rewrite de rotas SPA, incluindo `/auth/action`. No PowerShell, na raiz do repositório:

```powershell
cd apps/web
npm run build
cd ../..
firebase deploy --only hosting
```

Depois da publicação, copie o domínio HTTPS do Hosting e use-o como domínio autorizado e URL de ação no template de redefinição.

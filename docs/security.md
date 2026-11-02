# Segurança e privacidade (fundação)

- Identidade via Firebase Authentication; endpoints financeiros validam assinatura do token, emissor, audiência, validade e e-mail verificado. O endpoint estreito de cadastro de perfil aceita token válido antes da verificação do e-mail para concluir o registro.
- O endpoint de perfil só aceita um token Firebase válido e grava dados sob o UID do próprio token; o cadastro valida CPF e nascimento no backend e cifra nome, CPF e nascimento com AES-GCM antes de persistir. Use uma chave `PROFILE_ENCRYPTION_KEY` secreta, aleatória e estável fora de desenvolvimento; a chave de exemplo não serve para produção.
- O backend deriva o UID Firebase do token para isolar linhas no PostgreSQL; ignora qualquer uid enviado pelo cliente.
- A validação local por chave pública não consulta revogação/desativação imediatamente. Antes de produção, integrar verificação de revogação do Firebase Admin ou sessão curta revogável.
- Dados bancários e tokens de provedores nunca devem ir a logs. Segredos ficam em secret manager no deploy.
- Webhooks devem validar assinatura e idempotência antes de processar eventos.
- Firestore está fora do fluxo atual; as regras locais negam acesso direto do navegador. Os dados financeiros passam pela API autenticada.
- Tráfego de produção somente HTTPS. Aplicar limites por IP/uid, proteção contra brute force e trilha de auditoria sem payload sensível.
- Exportação e anexos exigem autorização; exclusão deve revogar conexões, agendar remoção e registrar auditoria conforme política LGPD aprovada.
- MFA, retenção, exclusão de conta e revogação de consentimento ainda precisam ser implementadas e revisadas antes de produção.

Esta nota não certifica conformidade LGPD nem substitui revisão jurídica e de segurança.

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4891cb7b-96c9-4c4e-9aa7-16118c1c9905

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Site Express

- O criador está em `/criar-site`. O cliente importa o Perfil da Empresa no Google Maps ou um site público, gera a prévia e escolhe se quer comprar ou solicitar um orçamento personalizado.
- O pedido de uma página custa R$ 497,00. O prazo é de 24 horas corridas a partir da aprovação do pagamento e o pagamento é único.
- O checkout permanece fechado enquanto `ATLAS_EXPRESS_CHECKOUT_MODE` estiver em `off` ou faltarem credenciais. Para testes, configure `test`, as credenciais de teste do Checkout Pro do Mercado Pago, um remetente verificado do Resend e `ATLAS_EXPRESS_PUBLIC_ORIGIN` com a origem do ambiente.
- No painel do seu aplicativo Mercado Pago, configure Webhooks para **Pagamentos** com a URL HTTPS `/api/site-express-webhook`. Salve `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET` no servidor, usando as credenciais do ambiente correspondente. Teste o checkout, a aprovação e os dois e-mails antes de ativar `live`.
- A opção **Projeto personalizado** abre um orçamento pelo WhatsApp. O checkout é exclusivo do pacote de uma página.
- A conta verificada em `ATLAS_CONTACT_OWNER_EMAIL` tem acesso a **Pedidos de Site** no Portal SaaS. Em **Pedidos pagos**, o operador baixa o HTML da versão aprovada, publica no domínio combinado com o cliente e verifica o endereço HTTPS antes de enviar a entrega pelo painel. Disponibilidade, registro e DNS do domínio são tratados pela equipe.

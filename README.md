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

- Fluxo público em `/site-express`. Gemini e a busca do Maps usam as chaves de servidor existentes.
- O pedido de uma página custa R$ 99,90. O prazo é de 48 horas corridas a partir do evento de pagamento e o pagamento é único.
- O checkout permanece fechado enquanto `ATLAS_EXPRESS_CHECKOUT_MODE` estiver em `off` ou faltarem credenciais. Para testes, configure `test`, uma chave Stripe de teste, um remetente verificado do Resend e `ATLAS_EXPRESS_PUBLIC_ORIGIN` com a origem do ambiente.
- Registre na Stripe o endpoint HTTPS `/api/site-express-webhook` para `checkout.session.completed`, `checkout.session.expired` e `charge.refunded`. Configure o segredo do endpoint em `STRIPE_EXPRESS_WEBHOOK_SECRET`. Teste a confirmação e os dois e-mails antes de usar `live` com as chaves de produção.
- A conta verificada em `ATLAS_CONTACT_OWNER_EMAIL` tem acesso a **Pedidos de Site** no Portal SaaS. A entrega é iniciada pelo operador após inserir o endereço HTTPS do site final.

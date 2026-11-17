import { ATLAS_WHATSAPP } from '../../src/lib/contact.js';
import { EXPRESS_HOURS, expressDate, expressMoney } from '../../src/lib/expressOrder.js';

export interface ExpressEmail {
  subject: string;
  text: string;
  html: string;
}

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]!);

function href(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('Invalid email URL');
  return escape(url.href);
}

const supportUrl = (id: string) => `https://wa.me/${ATLAS_WHATSAPP}?text=${encodeURIComponent(`Olá! Preciso de ajuda com meu pedido ${id}.`)}`;
const paragraph = (content: string) => `<p style="margin:0 0 18px;color:#454545;font-size:16px;line-height:1.7;">${content}</p>`;
const button = (label: string, url: string) => `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" bgcolor="#E2B755" style="border-radius:6px;"><a href="${href(url)}" style="display:block;padding:17px 18px;color:#151515;font-size:16px;line-height:22px;font-weight:bold;text-decoration:none;border:1px solid #E2B755;border-radius:6px;">${escape(label)} &rarr;</a></td></tr></table>`;

function layout(options: { origin: string; id: string; preheader: string; label: string; title: string; body: string }) {
  const { origin, id, preheader, label, title, body } = options;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escape(title)} · Atlas Digital</title></head>
<body style="margin:0;padding:0;width:100%;background-color:#EEEDE9;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escape(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#EEEDE9"><tr><td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#FFFFFF;border:1px solid #DFDDD7;">
<tr><td bgcolor="#111214" style="padding:26px 28px;border-bottom:3px solid #E2B755;"><a href="${href(origin)}" style="text-decoration:none;"><img src="${href(origin + '/atlas-email-logo.png')}" width="184" height="60" alt="Atlas Digital — Sites que geram resultados" style="display:block;width:184px;height:60px;border:0;color:#FFFFFF;font-size:18px;"></a></td></tr>
<tr><td style="padding:32px 24px 28px;">
<p style="margin:0 0 14px;color:#8A661C;font-size:11px;line-height:18px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">${escape(label)}</p>
<h1 style="margin:0 0 22px;color:#17181B;font-size:30px;line-height:1.2;letter-spacing:-0.8px;">${escape(title)}</h1>
${body}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;border-top:1px solid #E9E7E1;"><tr><td style="padding-top:24px;">
<p style="margin:0 0 8px;color:#17181B;font-size:16px;line-height:24px;font-weight:bold;">Conte com a gente.</p>
<p style="margin:0 0 14px;color:#666666;font-size:14px;line-height:22px;">Envie informações, fotos ou dúvidas pelo WhatsApp. Seu número de pedido já vai na mensagem.</p>
<a href="${href(supportUrl(id))}" style="color:#74530D;font-size:15px;line-height:24px;font-weight:bold;text-decoration:underline;">Falar com o suporte &rarr;</a>
<p style="margin:8px 0 24px;color:#666666;font-size:13px;line-height:20px;">WhatsApp da Atlas &middot; (51) 99457-8544</p>
<p style="margin:0;color:#17181B;font-size:14px;line-height:22px;">Equipe <strong>Atlas Digital</strong><br><span style="color:#777777;font-size:12px;">Sites que geram resultados.</span></p>
</td></tr></table></td></tr>
<tr><td bgcolor="#F6F5F1" style="padding:20px 24px;border-top:1px solid #E9E7E1;">
<p style="margin:0 0 8px;color:#777777;font-size:11px;line-height:18px;word-break:break-all;">Pedido ${escape(id)}</p>
<p style="margin:0;color:#777777;font-size:12px;line-height:19px;">Este e-mail é automático. Para atendimento, use o WhatsApp acima.</p>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
}

export function receiptEmail(input: { id: string; name: string; amount: number; dueAt: number; origin: string }): ExpressEmail {
  const { id, name, amount, dueAt, origin } = input;
  const trackingUrl = `${origin}/site-express?pedido=${encodeURIComponent(id)}`;
  const deadline = expressDate(dueAt);
  const price = expressMoney(amount);
  return {
    subject: 'Compra confirmada · Seu site com a Atlas Digital',
    text: [
      `Olá! Recebemos o pagamento do Site Express para ${name}. Sua compra está confirmada.`,
      `Pedido ${id} · ${price}`,
      'Agora nossa equipe vai preparar e revisar seu site. A prévia apresentada na compra é uma demonstração.',
      `Prazo de entrega: até ${EXPRESS_HOURS} horas após a aprovação do pagamento. Entrega até ${deadline} (horário de Brasília).`,
      'Você receberá o link do site concluído neste mesmo e-mail assim que a entrega estiver pronta.',
      `Acompanhe seu pedido: ${trackingUrl}`,
      `Envie informações, fotos ou dúvidas ao suporte pelo WhatsApp da Atlas Digital: ${supportUrl(id)}`,
      'Equipe Atlas Digital · Sites que geram resultados.',
      'Este e-mail é automático. O atendimento é realizado pelo WhatsApp acima.',
    ].join('\n\n'),
    html: layout({ origin, id, label: 'Pagamento aprovado · Site Express', title: 'Seu próximo passo começa aqui.',
      preheader: `Compra confirmada para ${name}. Entrega até ${deadline}, no horário de Brasília.`,
      body: paragraph(`Olá! A compra do site de <strong>${escape(name)}</strong> está confirmada. Obrigado por confiar na Atlas Digital.`) +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#F6F5F1" style="margin:24px 0;border:1px solid #E9E7E1;border-radius:6px;"><tr><td style="padding:20px;">
<p style="margin:0 0 8px;color:#777777;font-size:11px;font-weight:bold;letter-spacing:1.5px;">SITE EXPRESS · PAGAMENTO CONFIRMADO</p>
<p style="margin:0;color:#17181B;font-size:28px;line-height:36px;font-weight:bold;">${escape(price)}</p>
<p style="margin:5px 0 0;color:#666666;font-size:14px;line-height:22px;overflow-wrap:anywhere;">${escape(name)}</p>
</td></tr></table>` +
        paragraph('Agora nossa equipe vai preparar e revisar seu site. A prévia que você viu na compra é uma demonstração do projeto.') +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#17181B" style="margin:24px 0;border-radius:6px;"><tr><td style="padding:22px;">
<p style="margin:0 0 6px;color:#E2B755;font-size:11px;font-weight:bold;letter-spacing:1.5px;">PRAZO DE ENTREGA</p>
<p style="margin:0 0 8px;color:#FFFFFF;font-size:25px;line-height:32px;font-weight:bold;">Até ${EXPRESS_HOURS} horas</p>
<p style="margin:0;color:#D7D7D7;font-size:14px;line-height:23px;">Após a aprovação do pagamento.<br>Entrega até <strong style="color:#FFFFFF;">${escape(deadline)}</strong><br>Horário de Brasília.</p>
</td></tr></table>` +
        paragraph('Assim que estiver concluído, você receberá o link do site neste mesmo e-mail. Enquanto isso, acompanhe o andamento do seu pedido.') +
        button('Acompanhar meu pedido', trackingUrl),
    }),
  };
}

export function deliveryEmail(input: { id: string; name: string; finalUrl: string; origin: string }): ExpressEmail {
  const { id, name, finalUrl, origin } = input;
  return {
    subject: 'Seu site está pronto · Atlas Digital',
    text: [
      `Olá! O site de ${name} foi concluído e está disponível.`,
      `Acesse seu site: ${finalUrl}`,
      `Pedido ${id}`,
      'Abra o link e confira seu site no computador e no celular. Você já pode compartilhar o endereço com seus clientes.',
      `Precisa de ajuda com a entrega? Fale com o suporte pelo WhatsApp da Atlas Digital: ${supportUrl(id)}`,
      'Equipe Atlas Digital · Sites que geram resultados.',
      'Este e-mail é automático. O atendimento é realizado pelo WhatsApp acima.',
    ].join('\n\n'),
    html: layout({ origin, id, label: 'Projeto concluído · Site Express', title: 'Seu site está pronto.',
      preheader: `O site de ${name} foi concluído. Acesse seu site e fale com a Atlas se precisar de ajuda.`,
      body: paragraph(`Olá! O site de <strong>${escape(name)}</strong> foi concluído. Sua empresa já tem um novo endereço para apresentar seus serviços e receber clientes.`) +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#F6F5F1" style="margin:24px 0;border:1px solid #E9E7E1;border-radius:6px;"><tr><td style="padding:22px;">
<p style="margin:0 0 10px;color:#8A661C;font-size:11px;font-weight:bold;letter-spacing:1.5px;">SEU SITE, PRONTO PARA COMPARTILHAR</p>
${button('Acessar meu site', finalUrl)}
<p style="margin:16px 0 0;color:#777777;font-size:12px;line-height:20px;">Se o botão não abrir, copie este endereço:</p>
<p style="margin:6px 0 0;font-size:12px;line-height:20px;word-break:break-all;"><a href="${href(finalUrl)}" style="color:#74530D;text-decoration:underline;">${escape(finalUrl)}</a></p>
</td></tr></table>` +
        paragraph('Abra o link e confira seu site no computador e no celular. Você já pode compartilhar o endereço com seus clientes.') +
        paragraph('Se precisar de ajuda para acessar ou tiver dúvidas sobre a entrega, nossa equipe está à disposição pelo WhatsApp.'),
    }),
  };
}

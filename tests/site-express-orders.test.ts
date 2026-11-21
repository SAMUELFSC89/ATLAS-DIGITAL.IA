import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkoutEnabled, dueDate } from '../api/_lib/express-store.ts';
import { receiptEmail } from '../api/_lib/express-email.ts';
import { EXPRESS_HOURS, EXPRESS_PRICE, normalizeExpressDomain } from '../src/lib/expressOrder.ts';

test('novos pedidos Express custam R$ 497 com entrega em 24 horas e mantêm prazos antigos', () => {
  const paidAt = Date.parse('2026-11-20T23:30:00.000Z');
  const origin = 'https://atlasdigital.ia.br';
  assert.equal(EXPRESS_PRICE, 49700);
  assert.equal(dueDate(paidAt), Date.parse('2026-11-21T23:30:00.000Z'));
  const receipt = receiptEmail({ id: 'new', name: 'Empresa', amount: EXPRESS_PRICE, dueAt: dueDate(paidAt), deliveryHours: EXPRESS_HOURS, origin });
  assert.match(receipt.text, /R\$\s*497,00/);
  assert.match(receipt.html, /Até 24 horas/);
  const previous = receiptEmail({ id: 'previous', name: 'Empresa', amount: 29700, dueAt: dueDate(paidAt, 48), deliveryHours: 48, origin });
  assert.match(previous.text, /R\$\s*297,00/);
  assert.match(previous.html, /Até 48 horas/);
});

test('checkout de produção recusa o prefixo TEST e depende da assinatura e do remetente', t => {
  const values = {
    ATLAS_EXPRESS_CHECKOUT_MODE: 'live',
    MERCADO_PAGO_ACCESS_TOKEN: 'TEST-fake',
    MERCADO_PAGO_WEBHOOK_SECRET: 'fake',
    RESEND_API_KEY: 'fake',
    ATLAS_EXPRESS_FROM_EMAIL: 'teste@example.com',
  };
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  Object.assign(process.env, values);
  assert.equal(checkoutEnabled(), false);
  process.env.ATLAS_EXPRESS_CHECKOUT_MODE = 'test';
  assert.equal(checkoutEnabled(), true);
  process.env.ATLAS_EXPRESS_CHECKOUT_MODE = 'live';
  process.env.MERCADO_PAGO_ACCESS_TOKEN = 'APP_USR-fake';
  assert.equal(checkoutEnabled(), true);
  delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  assert.equal(checkoutEnabled(), false);
});

test('domínio do pedido aceita nome DNS sem caminho, porta ou IP', () => {
  assert.equal(normalizeExpressDomain('  WWW.Empresa.COM.BR  '), 'empresa.com.br');
  for (const invalid of ['https://empresa.com.br', 'empresa.com.br/oferta', 'abc:80', '10.0.0.10', 'abc-.com.br', null]) {
    assert.equal(normalizeExpressDomain(invalid), '');
  }
});

/**
 * Medição do Google Ads: registra como conversão cada clique que leva ao WhatsApp.
 *
 * Só liga quando o código da conta está configurado:
 *   VITE_GOOGLE_ADS_ID              ex.: AW-1234567890
 *   VITE_GOOGLE_ADS_WHATSAPP_LABEL  rótulo da ação de conversão "Clique no WhatsApp"
 * Sem esses valores nada é carregado e o site funciona como antes.
 */

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

const env = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env) || {};
const ADS_ID = (env.VITE_GOOGLE_ADS_ID || '').trim();
const WHATSAPP_LABEL = (env.VITE_GOOGLE_ADS_WHATSAPP_LABEL || '').trim();

const WHATSAPP_LINK = /(?:wa\.me\/|api\.whatsapp\.com\/send|web\.whatsapp\.com\/send)/i;

export function isAdsTrackingEnabled(): boolean {
  return /^AW-\d+$/.test(ADS_ID);
}

function reportWhatsAppClick(): void {
  if (!window.gtag) return;
  if (WHATSAPP_LABEL) {
    window.gtag('event', 'conversion', { send_to: `${ADS_ID}/${WHATSAPP_LABEL}` });
  }
  // Evento com nome próprio, útil para criar a conversão pela interface do Google Ads.
  window.gtag('event', 'clique_whatsapp', { send_to: ADS_ID });
}

/** Carrega a tag do Google e passa a contar os cliques em links de WhatsApp de todo o site. */
export function initAdsTracking(): void {
  if (!isAdsTrackingEnabled() || window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // A tag do Google espera receber o objeto "arguments", não uma cópia.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', ADS_ID);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ADS_ID)}`;
  document.head.appendChild(script);

  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (link && WHATSAPP_LINK.test(link.href)) reportWhatsAppClick();
  }, { capture: true });
}

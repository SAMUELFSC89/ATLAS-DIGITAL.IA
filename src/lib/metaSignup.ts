import { auth } from './firebase';

interface SignupConfig {
  appId?: string;
  configId?: string;
  solutionId?: string;
  missing: string[];
}

interface SignupSdk {
  init(options: { appId: string; version: string }): void;
  login(callback: (response: { authResponse?: { code?: string } }) => void, options: Record<string, unknown>): void;
}

const fbWindow = window as Window & { FB?: SignupSdk };
let sdkPromise: Promise<SignupSdk> | undefined;
let initializedApp: string | undefined;

export async function requestMeta(action: string, body?: Record<string, unknown>) {
  const user = auth.currentUser;
  if (!user?.email || user.isAnonymous) throw new Error('Entre na Atlas para configurar o WhatsApp.');
  const response = await fetch(`/api/meta?action=${action}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${await user.getIdToken()}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'A Atlas não conseguiu consultar a conexão do WhatsApp.');
  return data;
}

export async function prepareMetaSignup(): Promise<{ sdk: SignupSdk; configId: string; solutionId?: string }> {
  const config: SignupConfig = await requestMeta('config');
  if (config.missing.length || !config.appId || !config.configId) {
    throw new Error(`A Atlas precisa configurar o cadastro da Meta (${config.missing.join(', ')}). Você também pode validar um número pelo formulário de configuração manual.`);
  }
  if (!sdkPromise) {
    sdkPromise = new Promise<SignupSdk>((resolve, reject) => {
      if (fbWindow.FB) {
        resolve(fbWindow.FB);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      const fail = () => {
        script.remove();
        reject(new Error('Não foi possível carregar a janela da Meta. Confira se o navegador permite o Facebook e tente novamente.'));
      };
      const timeout = window.setTimeout(fail, 12000);
      script.onload = () => {
        window.clearTimeout(timeout);
        if (fbWindow.FB) resolve(fbWindow.FB);
        else fail();
      };
      script.onerror = () => {
        window.clearTimeout(timeout);
        fail();
      };
      document.head.appendChild(script);
    }).catch((error) => {
      sdkPromise = undefined;
      throw error;
    });
  }
  const sdk = await sdkPromise;
  if (initializedApp !== config.appId) {
    sdk.init({ appId: config.appId, version: 'v24.0' });
    initializedApp = config.appId;
  }
  return { sdk, configId: config.configId, solutionId: config.solutionId };
}

export function authorizeWhatsApp(
  signup: Awaited<ReturnType<typeof prepareMetaSignup>>,
  signal: AbortSignal,
  coexistence = false,
): Promise<{ code: string; whatsappBusinessAccountId: string; phoneNumberId?: string; coexistence: boolean }> {
  return new Promise((resolve, reject) => {
    let code = '';
    let accountId = '';
    let phoneId = '';
    let finished = false;
    let finishTimer: number | undefined;
    const timeout = window.setTimeout(() => fail('A autorização expirou. Abra a janela da Meta novamente.'), 600000);
    const abort = () => fail('Autorização encerrada.');
    function cleanup() {
      window.clearTimeout(timeout);
      window.clearTimeout(finishTimer);
      window.removeEventListener('message', onMessage);
      signal.removeEventListener('abort', abort);
    }
    function fail(message: string) {
      cleanup();
      reject(new Error(message));
    }
    function completeIfReady() {
      if (!code || !finished || !accountId || (!coexistence && !phoneId)) return;
      cleanup();
      resolve({ code, whatsappBusinessAccountId: accountId, phoneNumberId: phoneId || undefined, coexistence });
    }
    function onMessage(event: MessageEvent) {
      if (!['https://www.facebook.com', 'https://web.facebook.com', 'https://business.facebook.com', 'https://m.facebook.com'].includes(event.origin)) return;
      let message = event.data;
      if (typeof message === 'string') {
        try { message = JSON.parse(message); } catch { return; }
      }
      if (message?.type !== 'WA_EMBEDDED_SIGNUP') return;
      if (message.event === 'CANCEL') {
        fail('A autorização do WhatsApp foi cancelada.');
      } else if (message.event === 'ERROR') {
        const detail = message.data?.error_message;
        fail(typeof detail === 'string' && detail.trim() ? detail.slice(0, 300) : 'A Meta encontrou um erro na autorização.');
      } else if (['FINISH', 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING', 'FINISH_ONLY_WABA'].includes(message.event)) {
        if (coexistence && message.event !== 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
          return fail('A Meta não confirmou a coexistência. Escolha conectar sua conta existente do WhatsApp Business.');
        }
        finished = true;
        accountId = String(message.data?.waba_id || '');
        phoneId = String(message.data?.phone_number_id || '');
        completeIfReady();
      }
    }

    if (signal.aborted) return abort();
    signal.addEventListener('abort', abort, { once: true });
    window.addEventListener('message', onMessage);
    try {
      signup.sdk.login((response) => {
        code = response.authResponse?.code || '';
        if (!code) return fail('A Meta não concluiu a autorização. Confira se a janela abriu e se você confirmou o número.');
        if (!finished || !accountId || (!coexistence && !phoneId)) {
          finishTimer = window.setTimeout(() => fail('A Meta autorizou a conta, mas não retornou um telefone. Selecione um número na autorização.'), 8000);
        }
        completeIfReady();
      }, {
        config_id: signup.configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: signup.solutionId ? { solutionID: signup.solutionId } : {},
          ...(coexistence ? { featureType: 'whatsapp_business_app_onboarding', sessionInfoVersion: '3' } : {}),
        },
      });
    } catch {
      fail('A janela da Meta não pôde ser aberta.');
    }
  });
}

import type { StudioSite } from './studioSite';

/** Fictional example that exercises every scene of the library; shown at /studio/exemplo with a clear notice. */
export const STUDIO_DEMO: StudioSite = {
  version: 1,
  meta: { businessName: 'Pedra Viva Marmoraria', title: 'Pedra Viva — exemplo', description: 'Exemplo fictício da biblioteca de cenas.', whatsapp: '51900000000', whatsappMessage: 'Olá! Vi o exemplo do site.' },
  tokens: {
    colors: { bg: '#0f0e0c', bgAlt: '#e9e4da', text: '#f3eee6', muted: '#b9b1a5', accent: '#c8a46a', accentText: '#15120d' },
    fonts: { display: 'Cormorant Garamond', body: 'Manrope' }, radius: 0, ease: 'suave', intensity: 'media', grain: true,
  },
  scenes: [
    { id: 'abertura', type: 'hero-particulas', tone: 'base', shape: 'nuvem', eyebrow: 'Exemplo fictício', title: 'A pedra certa muda o ambiente inteiro', text: 'Mármores e granitos sob medida, do projeto à instalação.', cta: 'Pedir orçamento' },
    { id: 'promessa', type: 'manifesto', tone: 'base', title: 'Cada chapa é única. Escolhemos com você a peça que conversa com a luz, o uso e o desenho da sua casa.' },
    { id: 'processo', type: 'cena-presa', tone: 'base', eyebrow: 'Como trabalhamos', title: 'Do showroom à bancada pronta',
      media: [{ need: { file: 'chapa-marmore-close.jpg', description: 'Close da textura de uma chapa de mármore com luz lateral', prompt: 'Macro de chapa de mármore branco com veios dourados, luz lateral suave, fotografia de produto' } }],
      items: [{ title: 'Escolha da chapa', text: 'Você vê a pedra inteira antes do corte.' }, { title: 'Medição no local', text: 'Medidas feitas na obra, sem estimativa.' }, { title: 'Instalação', text: 'Equipe própria e acabamento conferido peça a peça.' }] },
    { id: 'servicos', type: 'cartas-empilhadas', tone: 'base', eyebrow: 'Serviços', title: 'O que fazemos',
      items: [{ title: 'Cozinhas e ilhas', text: 'Bancadas, ilhas e frontões em pedra natural.' }, { title: 'Banheiros', text: 'Lavatórios esculpidos e revestimentos.' }, { title: 'Escadas e pisos', text: 'Peças sob medida com acabamento antiderrapante.' }] },
    { id: 'obras', type: 'galeria-horizontal', tone: 'alt', eyebrow: 'Obras', title: 'Projetos entregues',
      items: ['Cozinha', 'Lavabo', 'Escada', 'Área gourmet'].map(title => ({ title, media: { need: { file: `obra-${title.toLowerCase().replace(/\s/g, '-')}.jpg`, description: `Foto real da obra: ${title}`, prompt: '' } } })) },
    { id: 'sobre', type: 'parallax-camadas', tone: 'base', eyebrow: 'Sobre', title: 'Uma oficina que trabalha a pedra com calma', text: 'Texto de exemplo para a seção sobre.',
      media: [1, 2, 3].map(n => ({ need: { file: `oficina-${n}.jpg`, description: `Foto da oficina ${n}`, prompt: '' } })) },
    { id: 'numeros', type: 'contadores', tone: 'base', title: 'Números de exemplo', items: [{ title: 'obras (exemplo)', value: '+320' }, { title: 'anos (exemplo)', value: '12' }, { title: 'cidades (exemplo)', value: '9' }] },
    { id: 'transformacao', type: 'antes-depois', tone: 'base', eyebrow: 'Antes e depois', title: 'A mesma cozinha, outra sensação',
      media: [{ need: { file: 'cozinha-antes.jpg', description: 'Cozinha antes da reforma', prompt: '' } }, { need: { file: 'cozinha-depois.jpg', description: 'Mesma cozinha depois, mesmo enquadramento', prompt: '' } }] },
    { id: 'contato', type: 'cta-final', tone: 'destaque', title: 'Vamos escolher sua pedra?', cta: 'Chamar no WhatsApp' },
  ],
};

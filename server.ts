import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Diagnosis API Route using Google Gen AI
  app.post("/api/atlas-score", async (req, res) => {
    try {
      const { companyName, city, segment, website, googleMapsUrl } = req.body;

      if (!companyName || !city || !segment) {
        return res.status(400).json({ error: "Nome da empresa, cidade e segmento são obrigatórios." });
      }

      const prompt = `Faça uma auditoria e diagnóstico completo e realista da presença digital para a empresa "${companyName}" localizada em "${city}", atuando no segmento "${segment}".
      Site fornecido: "${website || "Não informado - verifique se há um existente ou estime a ausência"}"
      URL do Google Perfil de Empresa fornecida: "${googleMapsUrl || "Não informada"}"

      Instruções adicionais:
      - O diagnóstico deve ser escrito em PORTUGUÊS (Brasil), de forma extremamente profissional, técnica e realista.
      - Caso o site oficial e o perfil do Google não estejam especificados, simule ou pesquise o cenário mais provável para uma empresa comum de pequeno/médio porte deste setor nesta cidade específica.
      - Para a área de SEO, forneça 5 a 6 palavras-chave reais e volumosas para o segmento "${segment}" na região de "${city}" (ex: se for marmoraria, "marmoraria em ${city}", "bancadas de granito ${city}", etc.), com estimativas de volume de busca realistas, dificuldades de ranqueamento e o ranqueamento estimado do cliente (ou ausente se não possuir site).
      - Para concorrência, liste 5 concorrentes reais ou altamente plausíveis do mesmo segmento em "${city}", e compare as pontuações e estimativas.
      - Gere pontuações realistas de 0 a 100 para cada critério, e calcule a Nota Geral (Atlas Score).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `Você é um Diretor de Marketing Digital de Elite e Engenheiro de SEO Sênior na agência "Atlas Digital.ia", especializado no setor de construção civil e acabamentos (Marmorarias, Vidraçarias, Energia Solar, Arquitetura e Construtoras).
          Sua tarefa é analisar rigorosamente a presença digital da empresa fornecida e retornar um diagnóstico completo em formato JSON perfeitamente estruturado de acordo com o esquema definido.
          Seja crítico, profissional, construtivo e forneça dados detalhados para orientar um plano de ação robusto.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.INTEGER,
                description: "Nota geral da presença digital da empresa (0-100)"
              },
              executiveSummary: {
                type: Type.STRING,
                description: "Resumo executivo consolidado com as principais conclusões e oportunidades em português profissional."
              },
              seo: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER, description: "Pontuação para SEO (0-100)" },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Nome do critério (ex: Sitemap, Robots.txt, Meta Tags, HTTPS, Schema.org, H1)" },
                        status: { type: Type.STRING, description: "Status (ex: 'Otimizado', 'Ausente', 'Não detectado', 'Implementado')" },
                        details: { type: Type.STRING, description: "Detalhamento técnico do que foi identificado ou o que está faltando." }
                      },
                      required: ["name", "status", "details"]
                    }
                  },
                  keywords: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        word: { type: Type.STRING, description: "Palavra-chave do segmento" },
                        volume: { type: Type.INTEGER, description: "Volume mensal estimado de busca" },
                        position: { type: Type.INTEGER, description: "Posição estimada do cliente no Google (ex: 99 para ausente/não ranqueado, ou 1 a 100 para estimativas)" },
                        difficulty: { type: Type.STRING, description: "Dificuldade (ex: 'Baixa', 'Média', 'Alta')" },
                        cpc: { type: Type.STRING, description: "CPC médio estimado em R$ (ex: 'R$ 2,50')" },
                        trend: { type: Type.STRING, description: "Tendência de busca (ex: 'Estável', 'Crescente', 'Sazonal')" }
                      },
                      required: ["word", "volume", "position", "difficulty", "cpc", "trend"]
                    }
                  }
                },
                required: ["score", "items", "keywords"]
              },
              performance: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER, description: "Pontuação de performance (0-100)" },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Nome do item (ex: Velocidade Desktop, Velocidade Mobile, Responsividade, Imagens Otimizadas, Cache do Servidor)" },
                        value: { type: Type.STRING, description: "Valor ou métrica estimada (ex: '3.2s', 'Excelente', 'Necessita Otimização')" },
                        rating: { type: Type.STRING, description: "Avaliação (ex: 'good', 'average', 'poor')" },
                        details: { type: Type.STRING, description: "Descrição técnica das oportunidades de ganho." }
                      },
                      required: ["name", "value", "rating", "details"]
                    }
                  }
                },
                required: ["score", "items"]
              },
              googleProfile: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER, description: "Pontuação do Perfil no Google (0-100)" },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Métrica (ex: Avaliações, Média de Notas, Fotos de Portfólio, Atualização de Posts, Descrição e Horários)" },
                        value: { type: Type.STRING, description: "Valor detectado (ex: '42 avaliações', 'Nota 4.8', 'Não atualiza posts')" },
                        details: { type: Type.STRING, description: "Análise descritiva do Perfil do Google e otimizações." }
                      },
                      required: ["name", "value", "details"]
                    }
                  }
                },
                required: ["score", "items"]
              },
              competitors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Nome do Concorrente" },
                    authority: { type: Type.INTEGER, description: "Autoridade estimada do domínio (0-100)" },
                    speed: { type: Type.INTEGER, description: "Pontuação de velocidade móvel estimada (0-100)" },
                    seoScore: { type: Type.INTEGER, description: "Pontuação de SEO técnico estimada (0-100)" },
                    reviews: { type: Type.STRING, description: "Resumo de Avaliações no Google (ex: '150 avaliações (4.9)')" },
                    position: { type: Type.INTEGER, description: "Posição média para principais palavras-chave" },
                    site: { type: Type.STRING, description: "Site do concorrente ou domínio (ex: concorrente.com.br)" }
                  },
                  required: ["name", "authority", "speed", "seoScore", "reviews", "position", "site"]
                }
              },
              aiIntegrations: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER, description: "Pontuação de Integrações de IA e Automação (0-100)" },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Recurso (ex: Chat Online, Bot Inteligente, Automação WhatsApp, Simulador de Escopo)" },
                        detected: { type: Type.BOOLEAN, description: "Se foi detectado ou sugerido" },
                        details: { type: Type.STRING, description: "Diagnóstico e indicação de como essa tecnologia traria conversão." }
                      },
                      required: ["name", "detected", "details"]
                    }
                  }
                },
                required: ["score", "items"]
              },
              conversion: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER, description: "Pontuação de Conversão (0-100)" },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Fator (ex: Clareza do CTA, Canal Direto WhatsApp, Formulários Inteligentes, Prova Social)" },
                        status: { type: Type.STRING, description: "Status do fator de conversão" },
                        details: { type: Type.STRING, description: "Detalhamento e soluções específicas." }
                      },
                      required: ["name", "status", "details"]
                    }
                  }
                },
                required: ["score", "items"]
              },
              prioritizedActionPlan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    priority: { type: Type.STRING, description: "Prioridade: 'Alta', 'Média' ou 'Baixa'" },
                    action: { type: Type.STRING, description: "Ação corretiva recomendada" },
                    impact: { type: Type.STRING, description: "Impacto estimado (ex: 'Aumento de 35% de leads', 'Dobrar velocidade')" },
                    effort: { type: Type.STRING, description: "Esforço/Dificuldade de implementação" }
                  },
                  required: ["priority", "action", "impact", "effort"]
                }
              }
            },
            required: [
              "score",
              "executiveSummary",
              "seo",
              "performance",
              "googleProfile",
              "competitors",
              "aiIntegrations",
              "conversion",
              "prioritizedActionPlan"
            ]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Resposta nula recebida do modelo Gemini.");
      }

      const diagnosticData = JSON.parse(resultText);
      res.json(diagnosticData);

    } catch (error: any) {
      console.error("Erro ao gerar Atlas Score:", error);
      res.status(500).json({
        error: "Falha na análise de inteligência artificial. Por favor, tente novamente.",
        details: error.message
      });
    }
  });

  // Serve static files in production / Vite middleware in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

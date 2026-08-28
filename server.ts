import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Initialize Gemini SDK with User-Agent header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Edital & Syllabus Parser
app.post("/api/parse-edital", async (req, res) => {
  try {
    const { editalText, targetExam, availableWeeklyHours } = req.body;

    if (!editalText || typeof editalText !== "string" || editalText.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Texto do edital ou conteúdo programático é obrigatório." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Fallback deterministic intelligent parser if no key is configured
      const parsedMock = fallbackParseEdital(editalText, targetExam);
      return res.json({
        success: true,
        source: "local-parser",
        subjects: parsedMock,
        message: "Processado com motor local inteligente."
      });
    }

    const prompt = `
Você é um especialista em planejamento pedagógico e editais de vestibulares concorridos (ENEM, Fuvest, Medicina, ITA) e concursos públicos (Carreiras Policiais, Fiscais, Jurídicas e Administrativas) no Brasil.

Analise o seguinte texto de edital / cronograma / conteúdo programático:
"${editalText.slice(0, 15000)}"

Contexto adicional:
- Exame / Alvo: ${targetExam || "Geral"}
- Horas semanais disponíveis do aluno: ${availableWeeklyHours || 25}h

Sua tarefa:
1. Extrair todas as Disciplinas principais (ex: Matemática, Biologia, Língua Portuguesa, Direito Constitucional, etc.).
2. Para cada disciplina, identificar seus Tópicos / Assuntos específicos e objetivos.
3. Atribuir um peso sugerido (weight) de 1 a 5 baseado na relevância estatística comum da matéria para o exame alvo.
4. Definir uma cor visual (hex code harmônico e moderno, ex: #3B82F6, #10B981, #8B5CF6, #F59E0B, #EC4899, #06B6D4, #6366F1).
5. Estimar horas recomendadas de estudo para cada tópico.

Retorne rigorosamente a estrutura JSON solicitada.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "Lista de disciplinas extraídas com seus tópicos",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nome da disciplina" },
              weight: { type: Type.INTEGER, description: "Peso de 1 a 5" },
              color: { type: Type.STRING, description: "Código Hex de cor representativa" },
              topics: {
                type: Type.ARRAY,
                description: "Tópicos da matéria",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Nome do tópico" },
                    estimatedHours: { type: Type.NUMBER, description: "Horas estimadas" },
                    importance: { type: Type.STRING, description: "ALTA, MEDIA ou BAIXA" }
                  },
                  required: ["title"]
                }
              }
            },
            required: ["name", "weight", "topics"]
          }
        }
      }
    });

    const parsedJson = JSON.parse(response.text || "[]");
    return res.json({
      success: true,
      source: "gemini-ai",
      subjects: parsedJson
    });

  } catch (error: any) {
    console.error("Erro no processamento do edital via IA:", error);
    // Fallback on error so the user is never blocked
    const fallback = fallbackParseEdital(req.body?.editalText || "", req.body?.targetExam);
    return res.json({
      success: true,
      source: "fallback-resilient",
      subjects: fallback,
      warning: "Utilizado extrator resiliente."
    });
  }
});

// AI Diagnostic & Error Analysis Endpoint
app.post("/api/ai-diagnostics", async (req, res) => {
  try {
    const { studyStats, errorLogSummary, targetGoal } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        source: "local",
        insights: [
          "Foco prioritário em tópicos com mais erros conceituais (Falta de Teoria).",
          "Recomendado aplicar o método de reteste após 7 dias para questões com erro de interpretação.",
          "Mantenha sessões de 45-50 min com pausas ativas para prevenir fadiga cognitiva."
        ],
        actionPlan: [
          { subject: "Revisão Ativa", task: "Refazer questões erradas da semana", priority: "Alta" },
          { subject: "Ajuste de Fila", task: "Aumentar peso das disciplinas com menor taxa de acerto", priority: "Média" }
        ]
      });
    }

    const prompt = `
Você é o mentor de estudos e neurociência da aprendizagem do AprovaFlow.
Analise os dados reais de desempenho deste estudante:
- Meta / Foco: ${targetGoal || "Aprovação em exame concorrido"}
- Estatísticas: ${JSON.stringify(studyStats || {})}
- Distribuição de Erros por Causa Raiz: ${JSON.stringify(errorLogSummary || {})}

Forneça:
1. 3 Diagnósticos pedagógicos diretos e acionáveis sobre os pontos cegos do aluno (sem clichês).
2. 3 Ações recomendadas prioritárias para a próxima semana.
3. Sugestão de rebalanceamento de ciclo (quais matérias acelerar ou revisar).
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING, description: "Resumo do diagnóstico em 2 frases" },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 insights diagnósticos claros"
            },
            actionPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  task: { type: Type.STRING },
                  priority: { type: Type.STRING }
                },
                required: ["subject", "task", "priority"]
              }
            },
            recommendationForRetest: { type: Type.STRING }
          },
          required: ["overview", "insights", "actionPlan"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return res.json({ success: true, ...result });

  } catch (err: any) {
    console.error("Erro no diagnóstico IA:", err);
    return res.status(500).json({ success: false, message: "Falha ao gerar diagnóstico com IA." });
  }
});

// Deterministic intelligent parser helper
function fallbackParseEdital(rawText: string, targetExam?: string) {
  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  const subjectsMap: Record<string, { weight: number; color: string; topics: { title: string; estimatedHours: number; importance: string }[] }> = {};
  
  const palette = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#06B6D4", "#6366F1", "#14B8A6", "#E11D48"];
  let colorIndex = 0;
  let currentSubject = "Conteúdo Geral";

  // Common subjects keywords
  const subjectKeywords = [
    "Língua Portuguesa", "Português", "Matemática", "Física", "Química", "Biologia",
    "História", "Geografia", "Filosofia", "Sociologia", "Redação", "Literatura",
    "Direito Constitucional", "Direito Administrativo", "Direito Penal", "Direito Processual Penal",
    "Direito Civil", "Raciocínio Lógico", "Informática", "Legislação Especial", "Contabilidade Geral",
    "Auditoria", "Economia", "Administração Pública", "Inglês", "Espanhol", "Conhecimentos Bancários"
  ];

  for (const line of lines) {
    // Check if line matches a subject name or pattern
    const matchedSubject = subjectKeywords.find(kw => 
      line.toLowerCase().startsWith(kw.toLowerCase()) || 
      line.toLowerCase().includes(`disciplina: ${kw.toLowerCase()}`) ||
      line.toLowerCase().includes(`matéria: ${kw.toLowerCase()}`) ||
      (line.length < 40 && line.toLowerCase().includes(kw.toLowerCase()))
    );

    if (matchedSubject) {
      currentSubject = matchedSubject;
      if (!subjectsMap[currentSubject]) {
        subjectsMap[currentSubject] = {
          weight: Math.floor(Math.random() * 3) + 2,
          color: palette[colorIndex % palette.length],
          topics: []
        };
        colorIndex++;
      }
      continue;
    }

    // Treat numbered items, bullets or comma separated items as topics
    if (!subjectsMap[currentSubject]) {
      subjectsMap[currentSubject] = {
        weight: 3,
        color: palette[colorIndex % palette.length],
        topics: []
      };
      colorIndex++;
    }

    const cleanLine = line.replace(/^[0-9]+(\.[0-9]+)*[\s\-\:]+/, '').replace(/^[\-\•\*\–]\s*/, '').trim();
    if (cleanLine.length > 3 && cleanLine.length < 120) {
      if (cleanLine.includes(";") || cleanLine.includes(",")) {
        const subItems = cleanLine.split(/[;,]/).map(s => s.trim()).filter(s => s.length > 3);
        for (const sub of subItems) {
          subjectsMap[currentSubject].topics.push({
            title: sub,
            estimatedHours: 2,
            importance: "MEDIA"
          });
        }
      } else {
        subjectsMap[currentSubject].topics.push({
          title: cleanLine,
          estimatedHours: 2.5,
          importance: "ALTA"
        });
      }
    }
  }

  const results = Object.entries(subjectsMap).map(([name, data]) => ({
    name,
    weight: data.weight,
    color: data.color,
    topics: data.topics.length > 0 ? data.topics.slice(0, 15) : [
      { title: "Fundamentos e Conceitos Básicos", estimatedHours: 2, importance: "ALTA" },
      { title: "Resolução de Exercícios e Questões da Banca", estimatedHours: 3, importance: "ALTA" },
      { title: "Revisão e Aprofundamento", estimatedHours: 1.5, importance: "MEDIA" }
    ]
  }));

  if (results.length === 0) {
    return [
      {
        name: "Língua Portuguesa",
        weight: 3,
        color: "#3B82F6",
        topics: [
          { title: "Interpretação e Compreensão de Textos", estimatedHours: 3, importance: "ALTA" },
          { title: "Sintaxe da Oração e do Período", estimatedHours: 2.5, importance: "ALTA" },
          { title: "Concordância Verbal e Nominal", estimatedHours: 2, importance: "MEDIA" },
          { title: "Regência e Uso do Sinal Indicativo de Crase", estimatedHours: 2, importance: "ALTA" }
        ]
      },
      {
        name: "Raciocínio Lógico e Matemática",
        weight: 4,
        color: "#10B981",
        topics: [
          { title: "Lógica Proposicional e Conectivos", estimatedHours: 3, importance: "ALTA" },
          { title: "Análise Combinatória e Probabilidade", estimatedHours: 4, importance: "ALTA" },
          { title: "Regra de Três e Porcentagem", estimatedHours: 2, importance: "MEDIA" }
        ]
      }
    ];
  }

  return results;
}

// Vite middleware and static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AprovaFlow server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

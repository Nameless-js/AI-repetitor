// ─────────────────────────────────────────────────────────────────────────────
// AI Provider: Gemini (primary) → Grok/xAI (fallback)
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_KEY   = import.meta.env.VITE_GROQ_API_KEY;

if (!GEMINI_KEY) console.warn('⚠️ VITE_GEMINI_API_KEY отсутствует в .env');
if (!GROQ_KEY)   console.warn('⚠️ VITE_GROQ_API_KEY отсутствует в .env');
if (GROQ_KEY?.startsWith('ВАШ_')) console.warn('⚠️ Замените пласехолдер VITE_GROQ_API_KEY на реальный ключ с console.groq.com');

// Системный промпт — единый для обоих провайдеров
const SYSTEM_TEXT =
  'Ты — ЭдуАИ, дружелюбный и умный ИИ-репетитор для студентов. ' +
  'Объясняй понятно, используй примеры из жизни. Всегда отвечай на русском языке.';

// Список моделей Gemini (пробуются по порядку)
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

// Groq Cloud модели (OpenAI-совместимый API, бесплатный) — пробуются по порядку
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',   // основная, быстрая
  'llama-3.1-8b-instant',      // лёгкая запасная
  'mixtral-8x7b-32768',        // ещё один вариант
];
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ─────────────────────────────────────────────────────────────────────────────
// Низкоуровневые запросы
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Один запрос к Gemini REST API (одна модель).
 * Бросает ошибку при любом сбое.
 */
async function geminiRequest(model, contents, systemInstruction, generationConfig = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 2000, ...generationConfig },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data.error?.message || res.statusText;
    const err = new Error(`Gemini [${model}]: ${msg} (Status: ${res.status})`);
    err.status = res.status;
    throw err;
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Gemini [${model}]: пустой ответ`);

  return text;
}

/**
 * Запрос к Groq Cloud через OpenAI-совместимый API.
 * Перебирает модели по списку GROQ_MODELS.
 */
async function groqRequest(messages) {
  if (!GROQ_KEY || GROQ_KEY.startsWith('ВАШ_')) {
    throw new Error('Ключ Groq не задан. Получите бесплатный ключ на console.groq.com и добавьте в VITE_GROQ_API_KEY');
  }

  let lastError = null;

  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      const rawText = await res.text();
      let data = {};
      try { data = JSON.parse(rawText); } catch { /* не JSON */ }

      if (!res.ok) {
        const apiMsg = data.error?.message || data.message || rawText.slice(0, 300) || res.statusText;
        const err = new Error(`Groq [${model}]: ${apiMsg} (Status: ${res.status})`);
        err.status = res.status;
        console.warn(`[AI] ${err.message}`);

        if (res.status === 401 || res.status === 403) {
          throw new Error(`Groq: ошибка авторизации (${res.status}). Проверьте VITE_GROQ_API_KEY в .env`);
        }
        if (res.status === 404) { lastError = err; continue; }
        throw err;
      }

      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error(`Groq [${model}]: пустой ответ`);

      console.info(`[AI] Ответил Groq (${model})`);
      return text;
    } catch (err) {
      if (err.message.includes('авторизации') || err.message.includes('не задан')) throw err;
      lastError = err;
      if (!err.message.includes('Status: 404')) throw err;
    }
  }

  throw lastError || new Error('Все модели Groq Cloud недоступны');
}

// ─────────────────────────────────────────────────────────────────────────────
// Умный fallback: Gemini → Grok
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Пробует отправить простой текстовый промпт через Gemini,
 * при любой ошибке переключается на Grok.
 */
async function sendPrompt(prompt, genConfig = {}) {
  // --- Попытка Gemini ---
  if (GEMINI_KEY) {
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    for (const model of GEMINI_MODELS) {
      try {
        const text = await geminiRequest(model, contents, SYSTEM_TEXT, genConfig);
        console.info(`[AI] Ответил Gemini (${model})`);
        return text;
      } catch (err) {
        console.warn(`[AI] Gemini ${model} не сработал: ${err.message}`);
        // 404 / 503 — пробуем следующую модель; иначе сразу fallback на Grok
        if (!err.message.includes('Status: 404') && !err.message.includes('Status: 503')) {
          break; // квота, 429, 403 — смена модели не поможет
        }
      }
    }
  }

  // --- Fallback: Groq Cloud ---
  console.info('[AI] Переключаюсь на Groq Cloud...');
  const messages = [
    { role: 'system', content: SYSTEM_TEXT },
    { role: 'user', content: prompt },
  ];
  return groqRequest(messages);
}

/**
 * Пробует отправить чат (история + новое сообщение) через Gemini,
 * при любой ошибке переключается на Grok.
 */
async function sendChat(history, message) {
  // --- Попытка Gemini ---
  if (GEMINI_KEY) {
    // Форматируем историю для Gemini (строгое чередование user/model)
    const contents = [];
    for (const m of history.filter(x => x.text)) {
      const role = m.role === 'user' ? 'user' : 'model';
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += '\n\n' + m.text;
      } else {
        contents.push({ role, parts: [{ text: m.text }] });
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    for (const model of GEMINI_MODELS) {
      try {
        const text = await geminiRequest(model, contents, SYSTEM_TEXT, { maxOutputTokens: 1500 });
        console.info(`[AI] Чат ответил Gemini (${model})`);
        return text;
      } catch (err) {
        console.warn(`[AI] Gemini ${model} chat не сработал: ${err.message}`);
        if (!err.message.includes('Status: 404') && !err.message.includes('Status: 503')) {
          break;
        }
      }
    }
  }

  // --- Fallback: Groq Cloud ---
  console.info('[AI] Чат переключается на Groq Cloud...');
  const messages = [{ role: 'system', content: SYSTEM_TEXT }];
  for (const m of history.filter(x => x.text)) {
    messages.push({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    });
  }
  messages.push({ role: 'user', content: message });
  return groqRequest(messages);
}

// ─────────────────────────────────────────────────────────────────────────────
// Публичное API (те же имена функций — остальной код менять не нужно)
// ─────────────────────────────────────────────────────────────────────────────

export async function tryGenerateContent(prompt) {
  if (!GEMINI_KEY && !GROQ_KEY) throw new Error('Ни один AI-ключ не задан в .env');
  const text = await sendPrompt(prompt);
  return { text };
}

export async function chatWithAI(history, message) {
  try {
    if (!GEMINI_KEY && !GROQ_KEY) throw new Error('Ни один AI-ключ не задан в .env');
    return await sendChat(history, message);
  } catch (err) {
    console.error('[AI] Ошибка chatWithAI:', err);
    return `❌ Ошибка ИИ: ${err.message}`;
  }
}

export async function explainSimpler(textToExplain) {
  try {
    const prompt =
      `Объясни следующий текст максимально просто, "на пальцах", как будто объясняешь 10-летнему ребенку. ` +
      `Используй очень простые аналогии из повседневной жизни. Будь краток и используй эмодзи.\n\nТекст:\n"${textToExplain}"`;
    const { text } = await tryGenerateContent(prompt);
    return text;
  } catch (err) {
    console.error('[AI] Ошибка explainSimpler:', err);
    return `❌ Ошибка ИИ: ${err.message}`;
  }
}

export async function generateQuiz(subject, topic, count = 5) {
  const prompt =
    `Сгенерируй тест из ${count} вопросов по предмету "${subject}", тема: "${topic}".\n` +
    `Ответь СТРОГО в формате JSON-массива без markdown, без \`\`\`, без пояснений. Только чистый JSON:\n` +
    `[{"question":"текст вопроса","options":["вариант1","вариант2","вариант3","вариант4"],"correctAnswer":"правильный вариант точно как в options"}]`;

  const { text } = await tryGenerateContent(prompt);

  const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const match = clean.match(/\[[\s\S]*\]/);

  if (!match) throw new Error('ИИ вернул неверный формат теста. Попробуйте сгенерировать снова.');

  return JSON.parse(match[0]);
}

export async function analyzeMistake(question, userAnswer, correctAnswer) {
  try {
    const prompt =
      `Студент ответил неправильно на вопрос теста. Твоя задача — коротко и дружелюбно объяснить, ПОЧЕМУ он ошибся, и дать правильное направление мысли.\n\n` +
      `Вопрос: ${question}\nОтвет студента: ${userAnswer}\nПравильный ответ: ${correctAnswer}\n\n` +
      `Объясни ошибку на русском языке, используй 2-3 предложения и эмодзи.`;
    const { text } = await tryGenerateContent(prompt);
    return text;
  } catch (err) {
    console.error('[AI] Ошибка analyzeMistake:', err);
    return `❌ Ошибка разбора: ${err.message}`;
  }
}

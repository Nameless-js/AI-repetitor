import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ Отсутствует ключ Gemini API в .env. Используется заглушка.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Актуальный список моделей с правильными системными именами
const MODEL_CANDIDATES = [
  'gemini-1.5-flash',        // Самая быстрая и стабильная модель
  'gemini-1.5-flash-8b',     // Облегченная версия
  'gemini-1.5-pro-latest',   // ИСПРАВЛЕНО: точное имя мощной запасной модели
];

const SYSTEM_TEXT = 'Ты — ЭдуАИ, дружелюбный и умный ИИ-репетитор для студентов. Объясняй понятно, используй примеры из жизни. Всегда отвечай на русском языке.';

function getModel(name) {
  return genAI ? genAI.getGenerativeModel({ model: name }) : null;
}

export async function tryGenerateContent(prompt) {
  let lastError = null;
  for (const name of MODEL_CANDIDATES) {
    try {
      const m = getModel(name);
      if (!m) throw new Error('No genAI client');
      
      const result = await m.generateContent(prompt);
      return { text: result.response.text(), modelUsed: name };
    } catch (err) {
      lastError = err;
      console.warn(`Сканирование: модель ${name} недоступна. Ошибка:`, err?.message);
      // Если это сетевая ошибка или падение сервиса — пробуем следующую модель
      continue;
    }
  }
  throw lastError || new Error(`Ни одна из моделей Gemini недоступна.`);
}

async function tryChatMessage(history, message) {
  let lastError = null;
  for (const name of MODEL_CANDIDATES) {
    try {
      const m = getModel(name);
      if (!m) throw new Error('No genAI client');

      // Клонируем историю, чтобы не повредить оригинал при сбое модели
      const chatHistory = [...history];
      
      const chatOptions = {
        history: chatHistory,
        generationConfig: { maxOutputTokens: 1500, temperature: 0.7 },
      };

      // Передаем системную инструкцию правильно для моделей 1.5
      chatOptions.systemInstruction = { parts: [{ text: SYSTEM_TEXT }] };

      const chat = m.startChat(chatOptions);
      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (err) {
      lastError = err;
      console.warn(`Сканирование: модель ${name} в чате выдала ошибку. Ошибка:`, err?.message);
      // При любой ошибке модели переключаемся на следующую запасную
      continue;
    }
  }
  throw lastError || new Error(`Ни одна из моделей Gemini недоступна в режиме чата.`);
}

function formatError(err) {
  let customHint = '';
  const msg = err?.message || '';
  const status = err?.status;
  
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    customHint = `\n\n🚨 СЕТЕВАЯ БЛОКИРОВКА: Доступ к серверам Google AI заблокирован провайдером.
👉 Решение: Включите системный VPN на компьютере, перезапустите сервер Vite (npm run dev) и обновите страницу.`;
  } else if (status === 429 || status === 403 || msg.includes('API key') || msg.includes('limit')) {
    customHint = `\n\n🚨 ВАЖНО: Ошибка доступа или лимитов API.
👉 Решение: Проверьте ключ VITE_GEMINI_API_KEY в файле .env и убедитесь, что включен VPN.`;
  } else if (status === 400) {
    customHint = `\n\n🚨 ОШИБКА СТРУКТУРЫ (400): Нарушена последовательность сообщений в чате.`;
  }

  const detail = [
    `❌ Ошибка Gemini API`,
    `Сообщение: ${msg}`,
    status ? `HTTP-статус: ${status}` : null,
    customHint,
    `\nПолный лог: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`,
  ].filter(Boolean).join('\n');
  return detail;
}

// Чат с ИИ
export async function chatWithAI(history, message) {
  if (!genAI) return `❌ Ключ Gemini API не найден.\nПроверьте переменную VITE_GEMINI_API_KEY в файле .env`;

  try {
    // Безопасное форматирование истории: склеиваем подряд идущие сообщения одной роли
    const formattedHistory = [];
    for (const m of history.filter(x => x.text)) {
      const role = m.role === 'user' ? 'user' : 'model';
      if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === role) {
        formattedHistory[formattedHistory.length - 1].parts[0].text += '\n\n' + m.text;
      } else {
        formattedHistory.push({ role, parts: [{ text: m.text }] });
      }
    }

    // УДАЛЕНО: ломающая заглушка "Продолжай.", которая вызывала ошибку 400 Bad Request.
    // Метод sendMessage сам корректно добавит новое сообщение пользователя в конец.

    return await tryChatMessage(formattedHistory, message);
  } catch (err) {
    console.error('Ошибка Gemini Chat:', err);
    return formatError(err);
  }
}

// Объяснение "На пальцах"
export async function explainSimpler(textToExplain) {
  if (!genAI) return `❌ Ключ Gemini API не найден.\nПроверьте VITE_GEMINI_API_KEY в .env`;

  try {
    const prompt = `Ты — ЭдуАИ. Объясни следующий текст максимально просто, "на пальцах", как будто объясняешь 10-летнему ребенку. Используй очень простые аналогии из повседневной жизни. Будь краток и используй эмодзи.\n\nТекст:\n"${textToExplain}"`;
    const { text } = await tryGenerateContent(prompt);
    return text;
  } catch (err) {
    console.error('Ошибка Gemini Explain:', err);
    return formatError(err);
  }
}

// Генерация теста по предмету и теме с ключом correctAnswer
export async function generateQuiz(subject, topic, count = 5) {
  if (!genAI) throw new Error('Ключ Gemini API не найден');

  const prompt = `Ты — ЭдуАИ. Сгенерируй тест из ${count} вопросов по предмету "${subject}", тема: "${topic}".
Ответь СТРОГО в формате JSON-массива без markdown, без \`\`\`, без пояснений. Только чистый JSON:
[{"question":"текст вопроса","options":["вариант1","вариант2","вариант3","вариант4"],"correctAnswer":"правильный вариант точно как в options"}]`;

  const { text } = await tryGenerateContent(prompt);
  const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(clean);
}

// Анализ ошибки в тесте
export async function analyzeMistake(question, userAnswer, correctAnswer) {
  if (!genAI) return `❌ Ключ Gemini API не найден.\nПроверьте VITE_GEMINI_API_KEY в .env`;

  try {
    const prompt = `Ты — ЭдуАИ, ИИ-репетитор. Студент ответил неправильно на вопрос теста. Твоя задача — коротко и дружелюбно объяснить, ПОЧЕМУ он ошибся, и дать правильное направление мысли.\n\nВопрос: ${question}\nОтвет студента: ${userAnswer}\nПравильный ответ: ${correctAnswer}\n\nОбъясни ошибку на русском языке, используй 2-3 предложения и эмодзи.`;
    const { text } = await tryGenerateContent(prompt);
    return text;
  } catch (err) {
    console.error('Ошибка Gemini Mistake:', err);
    return formatError(err);
  }
}
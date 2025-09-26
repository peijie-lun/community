// app.js  — LINE Bot x OpenAI v5（CommonJS）
require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const OpenAI = require('openai');                         // v5 寫法
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);
const app = express();

// 健康檢查（喚醒 Render 用）
app.get('/', (_req, res) => res.status(200).send('OK'));

// Webhook：務必在 10 秒內回 200
app.post('/callback', line.middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
  } catch (err) {
    console.error('[Webhook Error]', err);
  } finally {
    res.status(200).end(); // 先回 200，避免超時
  }
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return null;

  try {
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: event.message.text }],
      temperature: 0.7,
      max_tokens: 256,
    });

    const text = (r.choices?.[0]?.message?.content || '').trim() || '...';
    return client.replyMessage(event.replyToken, { type: 'text', text });
  } catch (e) {
    console.error('[OpenAI Error]', e?.response?.data || e.message);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '抱歉，目前無法處理您的訊息，請再傳一次。',
    });
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('listening on ' + PORT));
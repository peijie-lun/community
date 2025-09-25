require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const client = new line.Client(config);
const app = express();

// Health check
app.get('/', (_req, res) => res.status(200).send('OK'));

// LINE Webhook
app.post('/callback', line.middleware(config), async (req, res) => {
  try {
    const results = await Promise.all(req.body.events.map(handleEvent));
    res.json(results);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }
  const echo = { type: 'text', text: event.message.text };
  return client.replyMessage(event.replyToken, echo);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('listening on ' + PORT);
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: event.message.text ,
  });

  // create a echoing text message
  const echo = { type: 'text', text: completion.data.choices[0].text };

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}

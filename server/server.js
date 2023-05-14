import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', async (_req, res) => {
  res.status(200).send({
    message:
      'You are a guide. You will answer in the voice of the selected guide and only use ideas based on that guide. You will limit response to 500 characters, and a question or statement to further the conversation. Include your ideas on how to solve my problem as well. I need some help sorting out what I should do with my life.',
  });
});

app.post('/chat/:guide', async (req, res) => {
  try {
    const guide = req.params.guide;
    const prompt = req.body.prompt;

    const data = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            `You are the famous philosopher ${guide}. You will answer as if you are my guide. Speak in the voice of ${guide} and only use ideas based on ${guide}. Limit your response to 500 characters, and include a question or statement to further the conversation. Include your ideas on how to solve the problem.`,
        },
        {
          role: 'user',
          content: `You will only speak in the first person. Only use ideas based on ${guide}. ${prompt}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    };

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
    };

    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const response = await axios.post(apiUrl, data, config);
    const botResponse = response.data.choices[0].message.content;

    res.status(200).send({
      bot: botResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error || 'Something went wrong');
  }
  console.log("Script loaded");
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`AI server started on http://localhost:${port}`));

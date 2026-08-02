const express = require('express');
const { Groq } = require('groq-sdk');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.get('/', (req, res) => {
  res.send('Server WA Bot Aktif!');
});

app.post('/webhook', async (req, res) => {
  try {
    const message = req.body.pesan || req.body.message;
    const sender = req.body.sender || req.body.pengirim;

    if (!message) {
      return res.json({ status: true });
    }

    console.log(`Pesan masuk dari ${sender}: ${message}`);

    // 1. Minta Jawaban dari Groq AI
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Kamu adalah asisten virtual WhatsApp yang ramah dan membantu.' },
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
    });

    const replyText = completion.choices[0]?.message?.content || 'Maaf, saya tidak bisa memproses pesan ini.';

    // 2. Kirim pesan balasan langsung via API Fonnte
    if (process.env.FONNTE_TOKEN) {
      await axios.post('https://api.fonnte.com/send', {
        target: sender,
        message: replyText,
      }, {
        headers: {
          'Authorization': process.env.FONNTE_TOKEN
        }
      });
    }

    // Response JSON untuk membalas Fonnte
    return res.json({ reply: replyText });

  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
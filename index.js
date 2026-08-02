const express = require('express');
const { Groq } = require('groq-sdk');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inisialisasi Groq AI
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Endpoint utama & tes kesehatan server
app.get('/', (req, res) => {
  res.send('Server WA Bot Aktif!');
});

// Endpoint Webhook untuk Menerima Chat dari Fonnte
app.post('/webhook', async (req, res) => {
  try {
    // Fonnte mengirimkan 'pesan' dan 'sender' / 'pengirim'
    const message = req.body.pesan || req.body.message;
    const sender = req.body.sender || req.body.pengirim;

    console.log(`Pesan masuk dari ${sender}: ${message}`);

    // Jika pesan kosong, beri respons sukses ke Fonnte agar tidak retry
    if (!message) {
      return res.json({ status: true });
    }

    // 1. Minta Jawaban dari Groq AI
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Kamu adalah asisten virtual WhatsApp yang ramah dan membantu.' },
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
    });

    const replyText = completion.choices[0]?.message?.content || 'Maaf, saya tidak bisa memproses pesan ini.';

    // 2. Balas Langsung ke Fonnte (Format JSON Balasan Fonnte)
    return res.json({
      reply: replyText
    });

  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Export app agar bisa dibaca Vercel Serverless Function
module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
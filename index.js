const express = require('express');
const { Groq } = require('groq-sdk');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inisialisasi Groq AI
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Endpoint Webhook untuk Menerima Chat dari Fonnte
app.post('/webhook', async (req, res) => {
  try {
    const sender = req.body.sender;   // Nomor pengirim
    const message = req.body.message; // Teks pesan pengirim

    // Abaikan jika bukan pesan teks biasa
    if (!message) return res.send('OK');

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

    // 2. Balas Langsung ke Fonnte (Format Response Fonnte)
    return res.json({
      reply: replyText
    });

  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.send('Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
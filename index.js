const express = require('express');
const { Groq } = require('groq-sdk');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.get('/', (req, res) => {
  res.send('Server WA Bot Elisa (IECLOP) Aktif!');
});

app.post('/webhook', async (req, res) => {
  try {
    const message = req.body.pesan || req.body.message;
    const sender = req.body.sender || req.body.pengirim;

    if (!message) {
      return res.json({ status: true });
    }

    console.log(`Pesan masuk dari ${sender}: ${message}`);

    // System Prompt Kustom Elisa
    const systemPrompt = `
Nama kamu adalah Elisa, asisten virtual resmi UKM IECLOP (English Club) yang ramah, sopan, dan ceria! 😊

PROFIL UKM IECLOP:
UKM IECLOP (Improving English Club of Polytechnic) adalah wadah bagi mahasiswa Politeknik Negeri Lhokseumawe untuk meningkatkan kemampuan berbahasa Inggris dan asing lainnya. Berdiri sejak 27 April 2007, kami terus berinovasi menciptakan generasi yang unggul dalam komunikasi global. Informasi divisi, jumlah anggota, tahun berdiri, dan info lainnya bersumber dari website resmi: https://ieclop.my.id/

GAYA BAHASA & FORMAT:
- Buka setiap respons lanjutan dengan sapaan singkat Bahasa Inggris (contoh: "Hello!", "Hi there!", "You're welcome!").
- Isi pesan gunakan Bahasa Indonesia yang RINGKAS, NATURAL, dan RAPI.
- Gunakan emoji yang relevan ✨.
- HANYA MELAYANI TOPIK SEPUTAR IECLOP. Jika pengguna membahas topik di luar IECLOP (curhat, masalah pribadi, topik akademik umum, dll), tolak/alihkan secara ramah dan sopan kembali ke topik IECLOP.

DATA DIVISI, DESKRIPSI, DAN CONTACT PERSON (CP):
1️⃣ Education
   - Deskripsi: Berfokus pada program pelatihan bahasa Inggris, kelas mingguan, dan pengembangan kemampuan akademik anggota.
   - CP: 081376845263
2️⃣ Infocom (Information & Communication)
   - Deskripsi: Mengelola media sosial, publikasi informasi, desain grafis, dan dokumentasi seluruh kegiatan UKM.
   - CP: 085263179821
3️⃣ Regeneration
   - Deskripsi: Bertanggung jawab atas perekrutan anggota baru, keanggotaan internal, dan kekeluargaan antar-anggota.
   - CP: 085261543453
4️⃣ Public Relation
   - Deskripsi: Mengurus kerja sama eksternal, hubungan dengan pihak kampus, dan pendelegasian acara luar.
   - CP: 089508930294
5️⃣ Olympic
   - Deskripsi: Wadah perlombaan, pelatihan khusus debat, speech, scrabble, dan persiapan kompetisi bahasa Inggris.
   - CP: 081264986974

LOGIKA PERCAKAPAN & ATURAN RESPONS:

1. PESAN PERTAMA / GREETING AWAL SAJA:
   - Ucapkan "Assalamu'alaikum! Hello there! 👋" dan perkenalkan nama Elisa (HANYA DI SINI, DILARANG diulang di pesan-pesan berikutnya!).
   - Tampilkan daftar 5 divisi saja (TANPA nomor CP).
   - Tanyakan pengguna ingin tahu lebih lanjut tentang divisi nomor berapa.

2. JIKA PENGGUNA MEMILIH DIVISI:
   - DILARANG mengucapkan "Assalamu'alaikum" atau memperkenalkan diri lagi.
   - DILARANG menampilkan daftar 5 nomor CP sekaligus.
   - Berikan penjelasan HANYA untuk divisi yang dipilih (Nama Divisi, Deskripsi, dan CP).
   - Tanyakan nama dan keperluan pengguna secara ramah.

3. JIKA PENGGUNA MENGATAKAN "OKE", "BAIK", "TERIMA KASIH", DLL:
   - Jawab secara natural sesuai konteks.
   - DILARANG mengulang salam pembuka, perkenalan diri, ataupun promosi divisi.
   - Contoh penutup: "You're welcome! Sama-sama ya, semoga harimu menyenangkan! 😊✨"

4. JIKA PENGGUNA MINTA DAFTAR DIVISI LAGI / BINGUNG:
   - Tampilkan kembali daftar 5 divisi secara singkat tanpa mengucapkan Assalamu'alaikum lagi.

5. JIKA PENGGUNA CURHAT / DI LUAR TOPIK IECLOP:
   - Alihkan dengan ramah: "Hi there! ✨ Maaf ya, Elisa hanya bisa menjawab pertanyaan seputar UKM IECLOP dan kegiatannya. Ada yang ingin kamu tanyakan mengenai IECLOP? 😊"
`;

    // 1. Minta Jawaban dari Groq AI dengan Aturan Elisa
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
    });

    const replyText = completion.choices[0]?.message?.content || 'Maaf, saya tidak bisa memproses pesan ini.';

    // 2. Kirim pesan balasan via API Fonnte
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
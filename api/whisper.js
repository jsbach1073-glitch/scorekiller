import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY is missing on the server. Check the Vercel environment settings and redeploy.'
    });
  }

  const form = formidable({ uploadDir: '/tmp', keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });

    const audioFile = files.audio?.[0] || files.audio;
    if (!audioFile) return res.status(400).json({ error: 'No audio file' });

    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(audioFile.filepath), {
        filename: audioFile.originalFilename || 'audio.webm',
        contentType: audioFile.mimetype || 'audio/webm'
      });
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          error: data?.error?.message || `OpenAI request failed with status ${response.status}`,
          type: data?.error?.type || null,
          code: data?.error?.code || null
        });
      }

      return res.status(200).json({ transcript: data.text || '' });
    } catch (e) {
      return res.status(500).json({ error: e.message || 'Unknown server error' });
    }
  });
}

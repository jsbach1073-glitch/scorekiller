export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userAnswer } = req.body;
  if (!userAnswer) return res.status(400).json({ error: 'No user answer provided' });

  const prompt = `You are an IELTS Score Killer Engine. Respond ONLY with a valid JSON object, no markdown, no extra text.

Grammar condition: 5형식 — want/allow/expect + object + to-v
Question: Who is the most influential person in your life?
Student answer: ${userAnswer}

Upgrade the student answer to IELTS Band 7.0+ using the grammar pattern above.
Bold the grammar patterns with ** in the killerCorrection field.

Respond with this exact JSON format:
{"bandBefore":"4.5","bandComment":"한 줄 평 한국어로","killerCorrection":"Corrected English with **bold patterns**","onePointLesson":"핵심 설명 한국어로"}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1000,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const result = JSON.parse(data.choices[0].message.content);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

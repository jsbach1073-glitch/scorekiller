export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userAnswer } = req.body;

  const prompt = `# Role: IELTS Score Killer Engine

# Context:
사용자가 제공한 [문법 조건]을 반드시 활용하여, [문제 내용]에 대한 [사용자 대답]을 IELTS Band 7.0+ 수준으로 업그레이드하라.

# Rules:
1. 사용자가 엉터리로 말했더라도, [문법 조건]의 패턴을 모두 사용하여 문맥에 맞는 세련된 문장으로 재구성한다.
2. [문법 조건]의 패턴은 결과물에서 반드시 **Bold(굵게)** 처리한다.
3. 답변은 하나의 완성된 고득점 문단으로 만든다.
4. Band Score는 (문법, 어휘, 유창성)을 기준으로 엄격하게 산출한다.

# Format Rules:
반드시 아래 JSON 형식으로만 응답하라. 다른 텍스트 일절 금지.
{
  "bandBefore": "4.5",
  "bandComment": "한 줄 평 (한국어)",
  "killerCorrection": "교정된 영어 문장 (**Bold** 처리 포함)",
  "onePointLesson": "핵심 설명 (한국어)"
}

### [Data Input]
(1) 문법 조건: 5형식 — want/allow/expect + 목적어 + to-v
(2) 문제 내용: Who is the most influential person in your life?
(3) 사용자 대답: ${userAnswer}`;

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
        messages: [
          { role: 'system', content: '너는 IELTS Score Killer Engine이다. 반드시 JSON 형식으로만 응답해라.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();
    const text = data.choices[0].message.content;
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

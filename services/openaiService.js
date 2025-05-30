const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function analyzeDocument(text) {
  const prompt = `
The following document may be in Dutch. Please:
- Translate all extracted information to English.
- Extract the following from the document:
  - Document type (e.g., Tax Assessment, Invoice, etc.)
  - Key deadlines (e.g., Payment Due, Appeal Deadline) with their dates
  - Reference number, total due, filing status (if present)
  - Provide a summary (2-3 sentences) in English
  - Give recommendations (as a bullet list) in English

Output as JSON:
{
  "documentType": "...",
  "summary": "...",
  "referenceNumber": "...",
  "totalDue": "...",
  "filingStatus": "...",
  "deadlines": [
    {"type": "...", "date": "..."}
  ],
  "recommendations": ["...", "..."]
}
Document text:
${text}
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  const content = completion.choices[0].message.content;
  let result;
  try {
    result = JSON.parse(content);
  } catch (e) {
    const match = content.match(/\{[\s\S]*\}/);
    result = match ? JSON.parse(match[0]) : { error: "Could not parse AI response" };
  }
  return result;
}

module.exports = { analyzeDocument };
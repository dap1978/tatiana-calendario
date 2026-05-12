const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvSet(key, value) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', key, JSON.stringify(value)]),
  });
  return res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { blocks, text, calendarState } = req.body;

  if (calendarState) {
    const key = `cal_${calendarState.year}_${calendarState.month}`;
    await kvSet(key, calendarState);
  }

  const slackRes = await fetch(SLACK_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks, text }),
  });

  if (slackRes.ok) return res.status(200).json({ ok: true });
  const errText = await slackRes.text();
  return res.status(slackRes.status).json({ error: errText });
};

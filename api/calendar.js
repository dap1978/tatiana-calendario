const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_READ_ONLY_TOKEN;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const kvRes = await fetch(`${KV_URL}/keys/cal_*`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const { result: keys } = await kvRes.json();

  if (!keys || keys.length === 0) {
    return res.status(200).json([]);
  }

  const pipeline = keys.map(k => ['get', k]);
  const mgetRes = await fetch(`${KV_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(pipeline),
  });
  const results = await mgetRes.json();

  const calendars = results
    .map(r => { try { return JSON.parse(r.result); } catch { return null; } })
    .filter(Boolean)
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-3);

  return res.status(200).json(calendars);
};

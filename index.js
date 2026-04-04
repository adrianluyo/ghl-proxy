const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const LOCATION_ID = 'k80FVNdrq5OANEsxRtKu';

app.use(cors());
app.use(express.json());

async function ghl(token, path, params) {
  const q = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = `https://services.leadconnectorhq.com/${path}${q}`;
  const r = await fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    }
  });
  const body = await r.json();
  if (!r.ok) throw new Error('GHL ' + r.status + ': ' + JSON.stringify(body));
  return body;
}

app.get('/pipelines', async (req, res) => {
  const token = req.headers['x-ghl-token'];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const data = await ghl(token, 'opportunities/pipelines', { locationId: LOCATION_ID });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/opportunities', async (req, res) => {
  const token = req.headers['x-ghl-token'];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    let all = [];
    let page = 1;
    let more = true;
    while (more) {
      const data = await ghl(token, 'opportunities/search', {
        location_id: LOCATION_ID,
        pipeline_id: req.query.pipelineId,
        limit: 100,
        page,
      });
      const opps = data.opportunities || [];
      all = all.concat(opps);
      more = opps.length === 100;
      page++;
      if (page > 20) break;
    }
    const { from, to } = req.query;
    if (from || to) {
      const fromDate = from ? new Date(from) : new Date(0);
      const toDate = to ? new Date(to) : new Date();
      toDate.setHours(23, 59, 59, 999);
      all = all.filter(o => {
        const created = new Date(o.createdAt);
        return created >= fromDate && created <= toDate;
      });
    }
    res.json({ opportunities: all, total: all.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok', location: LOCATION_ID }));
app.listen(PORT, () => console.log(`GHL proxy running on port ${PORT}`));

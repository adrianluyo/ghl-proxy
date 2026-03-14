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
  if (!r.ok) throw new Error('GHL error: ' + r.status);
  return r.json();
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
    const data = await ghl(token, 'opportunities/search', {
      locationId: LOCATION_ID,
      pipelineId: req.query.pipelineId,
      limit: req.query.limit || 100,
      page: req.query.page || 1,
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok', location: LOCATION_ID }));
app.listen(PORT, () => console.log(`GHL proxy running on port ${PORT}`));

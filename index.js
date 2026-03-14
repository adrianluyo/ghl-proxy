const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.all('/ghl/*', async (req, res) => {
  const token = req.headers['x-ghl-token'];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  const path = req.path.replace('/ghl/', '');
  const query = new URLSearchParams(req.query).toString();
  const url = `https://services.leadconnectorhq.com/${path}${query ? '?' + query : ''}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.listen(PORT, () => console.log(`GHL v2 proxy running on port ${PORT}`));

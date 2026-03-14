const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Proxy all /ghl/* requests to GHL API
app.all('/ghl/*', async (req, res) => {
  const apiKey = req.headers['x-ghl-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'Missing API key header' });

  const ghlPath = req.path.replace('/ghl/', '');
  const query = new URLSearchParams(req.query).toString();
  const url = `https://rest.gohighlevel.com/v1/${ghlPath}${query ? '?' + query : ''}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
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

app.listen(PORT, () => console.log(`GHL proxy running on port ${PORT}`));

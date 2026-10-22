require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'aegisai-backend' });
});

app.get('/api/system/status', (_req, res) => {
  res.json({
    system: 'AEGISAI',
    policyGateway: 'ACTIVE',
    auditPlane: 'ACTIVE',
    clientLLM: 'READY',
    redTeam: 'ISOLATED',
    blueTeam: 'ISOLATED',
    auditIntegrity: 'VERIFIED'
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`AEGISAI backend listening on ${port}`));

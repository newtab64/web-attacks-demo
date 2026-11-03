const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.ATTACKER_PORT || 4000;

app.use(express.static(path.join(__dirname)));

const server = app.listen(PORT, () => {
  console.log(`Attacker demo server running on http://localhost:${PORT}`);
});

module.exports = { app, server };

const express = require('express');
const app = express();
app.use(express.json());

app.put('/api/surveys/:id/toggle-edit', async (req, res) => {
  res.json({ data: 'it works toggle', error: null });
});

app.put('/api/surveys/:id', async (req, res) => {
  res.json({ data: 'it works id', error: null });
});

app.listen(4005, () => {
  console.log('Test server running');
});

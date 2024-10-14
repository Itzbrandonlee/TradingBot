const express = require('express');
const yahooFinance = require('yahoo-finance2').default;
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

//API endpoint to get historical data
app.get('/api/historical', async (req, res) => {
    try {
      const quotes = await yahooFinance.chart('FNGU', {
        period1: '2021-01-01',
        period2: '2024-10-06',
        interval: '1d',
      });
      res.json(quotes);
    } catch (err) {
      console.error('Error fetching historical data:', err);
      res.status(500).json({ error: 'Error fetching data' });
    }
  });
  
  //API endpoint to get a stock quote
  app.get('/api/quote', async (req, res) => {
    try {
      const quote = await yahooFinance.quote('FNGU', {
        modules: ['price', 'summaryDetail'],
      });
      res.json(quote);
    } catch (err) {
      console.error('Error fetching quote:', err);
      res.status(500).json({ error: 'Error fetching data' });
    }
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


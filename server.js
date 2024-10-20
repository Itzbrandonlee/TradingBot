const express = require('express');
const yahooFinance = require('yahoo-finance2').default;
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

//API endpoint to get historical data
app.get('/api/historical', async (req, res) => {
    try {
      let stock = req.query.symbol;
      console.log(stock);
      let startDate = req.query.startDate;
      let endDate = req.query.endDate;
      console.log(endDate);
      const quotes = await yahooFinance.chart(stock, {
        period1: startDate,
        period2: endDate,
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


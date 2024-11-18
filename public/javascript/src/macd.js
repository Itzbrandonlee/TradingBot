async function backtestMACD(jsonData) {
  
    try {
      const closingPrices = jsonData.map(quote => quote.close);   //Put all the closing prices in one array
  
      const macdLine = calcMACDLine(closingPrices);
      const signalLine = calcSignalLine(macdLine);
      const macdSignals = createMACDSignal(macdLine, signalLine);
  
      transactions = [];
      yearlyInfo = {
        beginningYearIndex: [],
        userBalance: [],
        userStocks: [],
      };
      const userInfo = {
        balance: 100000,
        numStock: 0,
        totalReturn: 0,
      };
  
      let currentYear = jsonData[0].date.substring(0, 4);
      for (let signal of macdSignals) {
        const index = signal.index + 26;
        if (index >= jsonData.length) continue;
  
        if (currentYear < jsonData[index].date.substring(0, 4)) {
          yearlyInfo.beginningYearIndex.push(index);
          yearlyInfo.userBalance.push(userInfo.balance);
          yearlyInfo.userStocks.push(userInfo.numStock);
          currentYear = jsonData[index].date.substring(0, 4);  // Update currentYear
        }
        if (signal.action === 'buy') {
          buyStock(jsonData, userInfo, index, transactions);
        }
        else if (signal.action === 'sell') {
          sellStock(jsonData, userInfo, index, transactions);
        }
      }
  
      // for (let i = 0; i < transactions.length; i++) {
      //   console.log(transactions[i]);
      // }
      calcStats(userInfo, transactions);
      downloadCSV(transactions, "Transactions.csv");   //Download the transactions as a csv
      displayTransactions();
    }
    catch (error) {
      console.error('MACD Error: ', error);
    }
  }

  /* calcEMA - This function is used to calculate the EMA which gives
             weight to the more recent prices of the stock
   Inputs: prices- prices of stocks
           period- period of time over which to calculate ema
   Outputs: An array containing the EMA values
*/
function calcEMA(prices, period) {
    const k = 2 / (period + 1)
    const emaArray = [];
    let ema = prices[0];
  
    prices.forEach((price, index) => {
      if (index === 0) {
        emaArray.push(ema);
      }
      else {
        ema = (price * k) + (ema * (1 - k));
        emaArray.push(ema);
      }
    });
    return emaArray;
  }

  function calcMACDLine(prices) {
    // 12 and 26 period EMA
    const twelveEMA = calcEMA(prices, 12);
    const twentySixEMA = calcEMA(prices, 26);
  
    const macdLine = twelveEMA.map((value, index) => {
      if (index < twentySixEMA.length) {
        return value - twentySixEMA[index];
      }
      else {
        return null;
      }
    }).filter(value => value !== null);
    return macdLine;
  }
  
  
  function calcSignalLine(macdLine) {
    const signalLine = calcEMA(macdLine, 9);
    return signalLine;
  }
  
  function createMACDSignal(macdLine, signalLine) {
    const signals = [];
    let buyPostion = '';
  
    for (let i = 1; i < macdLine.length; i++) {
      if (macdLine[i] > signalLine[i] && macdLine[i - 1] <= signalLine[i - 1]) {
        signals.push({ action: 'buy', index: i });
        buyPostion = 'buy';
      }
      else if (macdLine[i] < signalLine[i] && macdLine[i - 1] >= signalLine[i - 1]) {
        signals.push({ action: 'sell', index: i });
        buyPostion = 'sell';
      }
    }
    return signals;
  }
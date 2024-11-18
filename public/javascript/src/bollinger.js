async function backtestBB(jsonData) {
    try {
      const closingPrices = jsonData.map(quote => quote.close);   //Put all the closing prices in one array
  
      const bbCalc = bollingerBands(closingPrices);
  
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
      yearlyInfo.beginningYearIndex = [];
      yearlyInfo.userBalance = [];
      yearlyInfo.userStocks = [];
  
      let currentYear = jsonData[bbCalc.startingIndex].date.substring(0, 4);
      console.log(bbCalc);
      for (const signal of bbCalc.buySellSignal) {
        const index = signal.index;
  
        if (currentYear < jsonData[index].date.substring(0, 4)) {
          yearlyInfo.beginningYearIndex.push(index);
          yearlyInfo.userBalance.push(userInfo.balance);
          yearlyInfo.userStocks.push(userInfo.numStock);
          currentYear = jsonData[index].date.substring(0, 4);
        }
  
        if (signal.action === 'buy') {
          buyStock(jsonData, userInfo, index, transactions);
        }
        else if (signal.action === 'sell') {
          sellStock(jsonData, userInfo, index, transactions);
        }
      }
  
      calcStats(userInfo, transactions);
      downloadCSV(transactions, "Transactions.csv");   //Download the transactions as a csv
      displayTransactions();
    }
    catch (error) {
      console.error('Error BB: ', error);
    }
  }

  /* bollingerBands - determines if selected period has a buy/sell signal
   Inputs: closingPrices- prices of  stock at closing date selected
           stdDev - Upper and Lower bounds of date range
           sma - simple moving average to base Bands against
           periodDate- date of average 20 days for Bollinger Bands
   Outputs: tbd
 */
function bollingerBands(closingPrices, stdDevMult = 2, periodDate = 20) {
    const buySellSignal = [];
    const movingAvg = [];
    const stdDevs = [];
    const upperBollingerBand = [];
    const lowerBollingerBand = [];
  
  
    //Function for STD
    function standardDeviationCalc(mean, data) {
      console.log('mean:', mean);
      console.log('data:', data);
      const diffOfSquare = Object.values(data).map(value => Math.pow(value - mean, 2));
      const avgOfDiff = diffOfSquare.reduce((sum, value) => sum + value, 0) / data.length;
      return Math.sqrt(avgOfDiff);
    }
  
    //iterate through each price from date range
    for (let i = periodDate - 1; i < closingPrices.length; i++) {
      let lastPeriod = closingPrices.slice(i - periodDate + 1, i + 1);
      let sma = lastPeriod.reduce((sum, price) => sum + price, 0) / periodDate;
      let stdDev = standardDeviationCalc(sma, lastPeriod);
      let upper = sma + (stdDevMult * stdDev);
      let lower = sma - (stdDevMult * stdDev);
  
      movingAvg.push(sma);
      upperBollingerBand.push(upper);
      lowerBollingerBand.push(lower);
      stdDevs.push(stdDev);
  
      let currentPrice = closingPrices[i];
      // console.log(currentPrice, upper, lower);
      if (currentPrice > upper) {
        //sell signal
        buySellSignal.push({ action: 'sell', index: i }); // Sell when price is above upper band
  
  
      }
      else if (currentPrice < lower) {
        // buy signal
        buySellSignal.push({ action: 'buy', index: i }); // Sell when price is above upper band
  
      }
  
    }
    return {
      buySellSignal,
      movingAvg,
      upperBollingerBand,
      lowerBollingerBand,
      stdDevs,
      startingIndex: periodDate - 1
    };
  
  }
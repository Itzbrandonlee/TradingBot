import TradingModel from './tradingModel.js';
import DataModel from './dataModel.js';

class MacdModel {
    static async backtestMACD(jsonData) {
  
        try {
          const closingPrices = jsonData.map(quote => quote.close);   //Put all the closing prices in one array
      
          const macdLine = this.calcMACDLine(closingPrices);
          const signalLine = this.calcSignalLine(macdLine);
          const macdSignals = this.createMACDSignal(macdLine, signalLine);
      
          let transactions = DataModel.getTransactions();
          let yearlyInfo = DataModel.getTransactions();
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
              TradingModel.buyStock(jsonData, userInfo, index, transactions, "MACD", yearlyInfo);
            }
            else if (signal.action === 'sell') {
              TradingModel.sellStock(jsonData, userInfo, index, transactions, "MACD", yearlyInfo);
            }
          }
          DataModel.setTransactions(transactions);
          DataModel.setYearlyInfo(yearlyInfo);
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
    static calcEMA(prices, period) {
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
    
      static calcMACDLine(prices) {
        // 12 and 26 period EMA
        const twelveEMA = this.calcEMA(prices, 12);
        const twentySixEMA = this.calcEMA(prices, 26);
      
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
      
      
      static calcSignalLine(macdLine) {
        const signalLine = this.calcEMA(macdLine, 9);
        return signalLine;
      }
      
      static createMACDSignal(macdLine, signalLine) {
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
}

export default MacdModel;
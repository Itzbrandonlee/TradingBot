import TradingModel from '../models/tradingModel.js';
import TradingView from '../views/tradingView.js';
import DataModel from '../models/dataModel.js';
import Bollinger from '../models/bollingerModel.js';
import SmaModel from '../models/smaModel.js';
import MacdModel from '../models/macdModel.js';
import StatsModel from '../models/statsModel.js';

class TradingController {
  static async fetchHistorical() {
    try {
        const dataset = document.getElementById('dataType').value;
        const startDate = document.getElementById("startDate").value;   //Get the start date entered by the user
        const endDate = document.getElementById("endDate").value;   //Get the end date entered by the user
        const response = await fetch(`/api/historical?symbol=${dataset}&startDate=${startDate}&endDate=${endDate}`);    //We then make a call to the yahoofinance api in our backend and save the response
        const data = await response.json();
        DataModel.setJsonData(data.quotes);
        TradingModel.processData(data); // Call Model logic
        } catch (error) {
        console.error('Error fetching historical data:', error);
        }
    }

        /*  backtest - performs a backtest using the simple moving average (for now, will have to implement other later)
    INPUTS: none (will need an input of the desired formula when more are implemented)
    OUTPUTS: none
*/
 static async backtest(algo) {
    const jsonData = DataModel.getJsonData();
    if (algo == "BB") {
      console.log("BB");
      Bollinger.backtestBB(jsonData);
    }
    else if (algo == "MACD") {
      console.log("MACD");
      MacdModel.backtestMACD(jsonData);
    } else {
      console.log("SMA");
      SmaModel.backtestSMA(jsonData);
    }   

    const transactions = DataModel.getTransactions();
    StatsModel.calcStats(transactions);
    TradingView.downloadCSV(transactions, "Transactions.csv");   //Download the transactions as a csv
    TradingView.displayTransactions(transactions, jsonData);   //Print the data to the webpage 

    return;
  }


}

export default TradingController;

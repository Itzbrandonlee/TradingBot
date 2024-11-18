async function backtestSMA(jsonData){
    try {
      const closingPrices = jsonData.map(quote => quote.close);   //Put all the closing prices in one array
  
      //Assign timeframes for the two moving averages (can be modified if desired, but these are typical timeframes)
      const shortTimeFrame = 5;
      const longTimeFrame = 25;
  
      //Calculate the averages over the given timeframes
      let shortSMA = calcSMA(closingPrices, shortTimeFrame, longTimeFrame);
      let longSMA = calcSMA(closingPrices, longTimeFrame, longTimeFrame);
  
      let currentYear = jsonData[0].date.substring(0, 4);
  
      transactions = [];
      yearlyInfo = {
        beginningYearIndex: [],
        userBalance: [],
        userStocks: [],
      };
      //userInfo has the user's current balance and number of stocks owned
      const userInfo = {
        balance: 100000,
        numStock: 0,
        totalReturn: 0,
      }
  
      //shortBelow is a toggle to indicate whether the short average has been less than or greater than the long average for the previous iteration
      let shortBelow = (shortSMA < longSMA) ? true : false;   //If shortSMA < longSMA then the shortBelow is true. else false
  
      //This is an initial buy that will take place if the short average is greater than the long. This means we are entering at an upward trend
    /*  if(!shortBelow) {
        buyStock(jsonData, userInfo, longTimeFrame, transactions);
      }*/
  
      //Starting at longTimeFrame index, iterate through the closing prices and update the averages. When the short average
      // becomes greater than the long average, we buy. When the short average becomes less than the long average, we sell.
      for (let i = longTimeFrame; i < closingPrices.length; i++) {
  
        //Check if the year has changed yet to update the yearlyInfo.beginningOfYearIndex
        if (currentYear < jsonData[i].date.substring(0, 4)) {
          yearlyInfo.beginningYearIndex.push(i);    //Push the index of the beginning of the new year
          yearlyInfo.userBalance.push(userInfo.balance);   //Push the balance at the beginning of the year
          yearlyInfo.userStocks.push(userInfo.numStock);    //Push the current number of stocks
  
          currentYear++;                          //Update year tracker
        }
  
        //Update the two averages
        shortSMA = updateSMA(closingPrices, shortSMA, i, shortTimeFrame);
        longSMA = updateSMA(closingPrices, longSMA, i, longTimeFrame);
  
        //If the short average just became greater than the long average and was less than in the previous iteration, this is a buy signal
        if (shortSMA > longSMA && shortBelow) {
          buyStock(jsonData, userInfo, i, transactions);    //Buy the stock
          shortBelow = false;   //Reset the toggle so we know the short average is now greater than the long average
        }
  
        //If the short average just became less than the long average and was greater than in the previous iteration, this is a sell signal
        else if (shortSMA < longSMA && !shortBelow) {
          sellStock(jsonData, userInfo, i, transactions);   //Sell the stock
          shortBelow = true;    //Reset the toggle so we know the short average is now less than the long average
        }
      }
  
      //This prints all the transactions. It is not necessary but it is pretty handy so we can keep it for now
      for (let i = 0; i < transactions.length; i++) {
        console.log(transactions[i]);
      }
  
      //Same as the transactions, not necessary but useful to look at sometimes
      console.log("BALANCE: " + userInfo.balance);
      console.log("AMOUNT INVESTED: " + (userInfo.numStock * closingPrices[closingPrices.length - 1]));
      console.log("TOTAL RETURN: " + (((userInfo.numStock * closingPrices[closingPrices.length - 1] + userInfo.balance) - 100000) / 1000).toFixed(2) + "%");
  
      calcStats(userInfo, transactions);
      downloadCSV(transactions, "Transactions.csv");   //Download the transactions as a csv
      displayTransactions();   //Print the data to the webpage 
    } catch (error) {
      console.error('Error fetching sma data:', error);
    }
}

/*  calcSMA - calculates the initial sma
    INPUTS: closingPrices - prices of stock at each closing date
            timeframe - the timeframe of the sma
            startingIndex - the index we will begin the sma crossover tracking
    OUTPUTS: sma - updated simple moving average
*/
function calcSMA(closingPrices, timeFrame, startingIndex) {
    let sum = 0.00;
  
    //Get the sum of all the closing prices in the given timeframe
    for (let i = startingIndex - timeFrame; i < startingIndex; i++) {
      sum += closingPrices[i];
    }
  
    return (sum / timeFrame);   //Return the average over the given timeframe
  }

//This is a testing function to judge the accuracy of updateSMA
function testSMA(closingPrices, sma, index, smaSize) {
    let sum = 0.00;
    for (let i = (index - smaSize); i < index; i++) {    //Accumulate the sum of all the closing prices
      sum += closingPrices[i];
    }
    let avg = sum / smaSize;    //Take the average
  
    //Print both averages and compare
    console.log("SMA: " + sma);
    console.log("TESTED SMA: " + avg);
  }
  
  /*  updateSMA - updates the sma for all iterations after calcSMA()
      INPUTS: closingPrices - prices of stock at each closing date
              sma - the current simple moving average (can be short or long)
              index - the current index of jsonData that we are on
              smaSize - the timeframe of the sma
      OUTPUTS: sma - updated simple moving average
  */
  function updateSMA(closingPrices, sma, index, smaSize) {
    sma = (smaSize * sma - closingPrices[index - smaSize] + closingPrices[index]) / smaSize;    //Formula to replace an old value with a new one in an average
    //Source: https://stackoverflow.com/questions/22999487/update-the-average-of-a-continuous-sequence-of-numbers-in-constant-time/22999488#22999488
    return sma;   //Returns the new sma
  }

  module.exports = {calcSMA, updateSMA};
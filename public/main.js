let jsonData = null;
let transactions = [];

//This will hold general information about the data that may be helpful in the code
let yearlyInfo = {
    beginningYearIndex: [],   //This will hold the index of the beginning of the year in the data. Helpful for calculating annual return 
    userBalance: [],          //This will be the user balance at the beginning of the given year
    userStocks: [],           //This will be the number of stocks the user owned at the beginning of the given year 
};

/*  fetchHistorical - fetches the stock data and saves it into a JSON
    INPUTS: dataset - the name of the stock to be downloaded
    OUTPUTS: none
*/
async function fetchHistorical(dataset) {
  try {
    const startDate = document.getElementById("startDate").value;   //Get the start date entered by the user
    const endDate = document.getElementById("endDate").value;   //Get the end date entered by the user
    const response = await fetch(`/api/historical?symbol=${dataset}&startDate=${startDate}&endDate=${endDate}`);    //We then make a call to the yahoofinance api in our backend and save the response
    const data = await response.json();   //Response is saved a json file
    jsonData = data.quotes;     //We specifically want the quotes portion of the data so we just save that into our global variable   

    console.log(jsonData);    //Not required but useful to look at. Can delete later
    const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });    //This blob is a downloadable json file
    const url = URL.createObjectURL(blob);    //This is a temporary download link

    //This downloads the file
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historical_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error fetching historical data:', error);
  }

}
//chart information 
async function fetchHistoricalGraph(dataset) {
  try {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const response = await fetch(`/api/historical?symbol=${dataset}&startDate=${startDate}&endDate=${endDate}`);
    const data = await response.json();
    jsonData = data.quotes;

    const dateRange = formatDateRange(startDate, endDate, jsonData);
    const closingPrices = jsonData.map(quote => quote.close)
    const openingPrices = jsonData.map(quote => quote.open)
    // console.log(closingPrices);

    const historicalGraph = new Chart("historicalGraph", {
      type: "line",
      data: {
        labels: dateRange,
        datasets: [{
          label: 'Closing Prices',
          data: closingPrices,
          fill: false,
          backgroundColor: 'rgba(13, 110, 253, 1)',
          borderColor: 'rgba(13, 110, 253, 1)',
          tension: 0.1,
          pointRadius: 0
        },
        {
          label: 'Opening Prices',
          data: openingPrices,
          fill: false,
          backgroundColor: 'rgba(40, 167, 69, 1)',
          borderColor: 'rgba(40, 167, 69, 1)',
          tension: 0.1,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#FFFFFF'
            }
          }
        }
      }
    });
  } catch {
    console.err("Error fetch Historical Graph: ");
  }
}

function formatDateRange(startDate, endDate, jsonData) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end - start;
  const dayInMs = 1000 * 60 * 60 * 24;
  const numberOfDays = Math.round(timeDiff / dayInMs);

  let options;

  if (numberOfDays > 365) {
    options = { year: 'numeric' };
  } else if (numberOfDays > 30) {
    options = { year: 'numeric', month: 'short' };
  } else {
    options = { year: 'numeric', month: 'short', day: 'numeric' };
  }

  const formatter = new Intl.DateTimeFormat('en-GB', options);

  return jsonData.map(quote => {
    const date = new Date(quote.date);
    return formatter.format(date);
  });
}


/*  backtest - performs a backtest using the simple moving average (for now, will have to implement other later)
    INPUTS: none (will need an input of the desired formula when more are implemented)
    OUTPUTS: none
*/
async function backtest() {
  try {
    const closingPrices = jsonData.map(quote => quote.close);   //Put all the closing prices in one array

    //Assign timeframes for the two moving averages (can be modified if desired, but these are typical timeframes)
    const shortTimeFrame = 5;
    const longTimeFrame = 10;

    //Calculate the averages over the given timeframes
    let shortSMA = calcSMA(closingPrices, shortTimeFrame, longTimeFrame);
    let longSMA = calcSMA(closingPrices, longTimeFrame, longTimeFrame);

    let currentYear = jsonData[0].date.substring(0, 4);

    //userInfo has the user's current balance and number of stocks owned
    const userInfo = {
      balance: 100000,
      numStock: 0,
      totalReturn: 0,
    }

    //shortBelow is a toggle to indicate whether the short average has been less than or greater than the long average for the previous iteration
    let shortBelow = (shortSMA < longSMA) ? true : false;   //If shortSMA < longSMA then the shortBelow is true. else false

    //Starting at longTimeFrame index, iterate through the closing prices and update the averages. When the short average
    // becomes greater than the long average, we buy. When the short average becomes less than the long average, we sell.
    for (let i = longTimeFrame; i < closingPrices.length; i++) {

      //Check if the year has changed yet to update the yearlyInfo.beginningOfYearIndex
      if(currentYear < jsonData[i].date.substring(0, 4)) {
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
      else if (shortSMA < longSMA && !shortBelow && userInfo.numStock > 0) {
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

/*  buyStock - This function is called when we want to buy stocks
    INPUTS: jsonData - the stock data to base purchase off of
            userInfo - holds the user's current balance and number of stocks
            index - the current index of jsonData that we are on
            transactions - an array of transaction records
    OUTPUTS: none
*/
function buyStock(jsonData, userInfo, index, transactions) {
  const amountToInvest = userInfo.balance * 0.6;    //Currently, it is set to buy the number of stocks <= 60% of current balance. This can be tweaked later if desired and is not integral to the formula
  console.log("TRYING To BUY");
  if (amountToInvest > jsonData[index].close) {    //Check if we can even afford to buy a stock
    const numSharesToBuy = Math.floor(amountToInvest / jsonData[index].close);

    const totalBalance = userInfo.balance + (jsonData[index].close * userInfo.numStock);
    const totalBalanceLastYear = getTotalBalanceLastYear(jsonData, index);
    const annualReturn = (((totalBalance - totalBalanceLastYear) / totalBalanceLastYear) * 100);    //Get the annual return
    const totalReturnDollar = totalBalance - 100000;
    const singleReturnDollar = totalReturnDollar - userInfo.totalReturn;    //Single return is being defined as the amount change since the last display of total return
    userInfo.totalReturn = totalReturnDollar;
    const totalReturnPercent = ((totalReturnDollar / 100000) * 100);    //Get the total return
    const singleTransaction = { isBuy: true, date: jsonData[index].date.split('T')[0], numShares: numSharesToBuy, price: jsonData[index].close, annualReturn: annualReturn, singleReturnDollar: singleReturnDollar, totalReturnDollar: totalReturnDollar, totalReturnPercent: totalReturnPercent };
    transactions.push(singleTransaction);   //Push the new transaction into the array of transactions

    //Adjust user's balance and number of stocks owned
    userInfo.balance -= (numSharesToBuy * jsonData[index].close);
    userInfo.numStock += numSharesToBuy;
  }
}

/*  sellStock - This function is called when we want to sell stocks
    INPUTS: jsonData - the stock data to base sale off of
            userInfo - holds the user's current balance and number of stocks
            index - the current index of jsonData that we are on
            transactions - an array of transaction records
    OUTPUTS: none
*/
function sellStock(jsonData, userInfo, index, transactions) {
  const numSharesToSell = Math.min(userInfo.numStock, Math.floor(userInfo.numStock * 0.6));   //Number of shares to sell is currently 60% of stocks owned. This can be tweaked later
  const totalBalance = userInfo.balance + (jsonData[index].close * numSharesToSell);
  const totalBalanceLastYear = getTotalBalanceLastYear(jsonData, index);
  const annualReturn = (((totalBalance - totalBalanceLastYear) / totalBalanceLastYear) * 100);    //Get the annual return
  const totalReturnDollar = totalBalance - 100000;
  const singleReturnDollar = totalReturnDollar - userInfo.totalReturn;    //Single return is being defined as the amount change since the last display of total return
  userInfo.totalReturn = totalReturnDollar;
  const totalReturnPercent = ((totalReturnDollar / 100000) * 100);    //Get the total return
  const singleTransaction = { isBuy: false, date: jsonData[index].date.split('T')[0], numShares: numSharesToSell, price: jsonData[index].close, annualReturn: annualReturn, singleReturnDollar: singleReturnDollar, totalReturnDollar: totalReturnDollar, totalReturnPercent: totalReturnPercent };
  transactions.push(singleTransaction);     //Push the new transaction into the array of transactions

  //Update user balance and number of stocks after selling
  userInfo.balance += (numSharesToSell * jsonData[index].close);
  userInfo.numStock -= numSharesToSell;
}

/*  calcStats - This function prints the buy/sell data to the web page
    INPUTS: userInfo - holds the user's current balance and number of stocks
            transactions - an array of transaction records
    OUTPUTS: none
*/
let date = null;    //This will be updated with the date of each transaction
  let singleGainLoss = [];   //Gain or Loss of single transaction
  let totalGainLoss = 0;    //Gain or Loss of all transactions
  let totalGainLossAtTransaction = [];
  let currentNumStock = 0;  //Tracks the number of stocks owned during each transaction 
  let currentBalance = 100000;    //Tracks the balance during each transaction
function calcStats(userInfo, transactions) {

  //Iterate through each transaction and update data
  for (let i = 0; i < transactions.length; i++) {
    //Updates values if transaction is a purchase
    if (transactions[i].isBuy) {
      currentNumStock += transactions[i].numShares;
      currentBalance -= transactions[i].numShares * transactions[i].price;
      singleGainLoss[i] = ((currentNumStock * transactions[i].price + currentBalance) - 100000);
      totalGainLoss += singleGainLoss[i];
      totalGainLossAtTransaction[i] = totalGainLoss;
    }

    //Updates values if transaction is a sale
    else {
      currentNumStock -= transactions[i].numShares;
      currentBalance += transactions[i].numShares * transactions[i].price;
      singleGainLoss[i] = ((currentNumStock * transactions[i].price + currentBalance) - 100000);
      totalGainLoss += singleGainLoss[i];
      totalGainLossAtTransaction[i] = totalGainLoss;
    }
  }
}

function getTotalBalanceLastYear(jsonData, index) {
    //This checks if we have even passed a year yet. If we haven't we can just return our starting balance
    if(jsonData[index].date.substring(0, 4) === jsonData[0].date.substring(0, 4)) {
      return 100000;
    }
    const yearIndex = jsonData[index].date.substring(0, 4) - jsonData[0].date.substring(0, 4) - 1;    //This subtracts the starting year by the current year which will give us our index
    console.log(yearIndex);
    console.log(yearlyInfo);
    console.log(jsonData[index].date.substring(0, 4));
    return yearlyInfo.userBalance[yearIndex] + yearlyInfo.userStocks[yearIndex] * jsonData[yearlyInfo.beginningYearIndex[yearIndex]].close;   //This is simply the balance + number of stocks * price all at the given year
}

function roundTwoDecimals(number) {
    return Math.round(number * 100) / 100;
}

function getDropdownValue(){
  const dropdown = document.getElementById("dataType");
  return dropdown.value;
}

//This displays all the transaction data by creating elements and appending html elements to the transactions id div in index.html
function displayTransactions() {
  console.log(singleGainLoss);
  const transactionContainer = document.getElementById('transactions');
  transactionContainer.classList.add('row', 'justify-content-center', 'mt-3');

  for(let i = 0; i < transactions.length; i++) {
    const transactionCard = document.createElement('div');
    transactionCard.classList.add('card', 'col-md-3', 'mb-3', 'mx-3', 'bg-dark', 'text-white', 'shadow', 'rounded', 'border-0');

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body', 'bg-transparent');

    const transactionNumber = document.createElement('h3');
    transactionNumber.classList.add('card-title', 'text-primary');
    transactionNumber.textContent = `Transaction #${(i + 1)}`;

    const buyOrSell = document.createElement('h4');
    buyOrSell.classList.add('card-subtitle', 'mb-2', 'text-muted');
    buyOrSell.textContent = `${transactions[i].isBuy ? "Purchase" : "Sale"} ${transactions[i].date}`;

    const tradeDetails = document.createElement('p');
    tradeDetails.classList.add('card-text', 'fw-light');
    tradeDetails.textContent = `Number of Shares: ${transactions[i].numShares} at price ${transactions[i].price.toFixed(2)}`;

    const singleReturn = document.createElement('p');
    singleReturn.classList.add('card-text');
    singleReturn.textContent = `Gain/Loss: $${transactions[i].singleReturnDollar.toFixed(2)}`;

    const totalReturn = document.createElement('p');
    totalReturn.classList.add('card-text', 'fw-bold');
    totalReturn.textContent = `Total Gain/Loss: $${transactions[i].totalReturnDollar.toFixed(2)}`;

    const annualReturn = document.createElement('p');
    annualReturn.classList.add('card-text', 'text-muted');
    annualReturn.textContent = `Annual Return: ${transactions[i].annualReturn.toFixed(2)}%`;
  
    const totalReturnPercent = document.createElement('p');
    totalReturnPercent.classList.add('card-text', 'text-success');
    totalReturnPercent.textContent = `Total Return: ${transactions[i].totalReturnPercent.toFixed(2)}%`;
    
    transactionCard.appendChild(transactionNumber);
    transactionCard.appendChild(buyOrSell);
    transactionCard.appendChild(tradeDetails);
    transactionCard.appendChild(singleReturn);
    transactionCard.appendChild(totalReturn);
    transactionCard.appendChild(annualReturn);
    transactionCard.appendChild(totalReturnPercent);

    transactionCard.appendChild(cardBody);

    transactionContainer.appendChild(transactionCard);
  }
}
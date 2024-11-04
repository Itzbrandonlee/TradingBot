let jsonData = null;
let transactions = [];
const historicalTable = document.getElementById('historicalTable');
historicalTable.hidden = false;

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

    // Load Historical Table
    historicalTable.hidden = false;

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
    //historical data in table form 
    const column = Object.keys(jsonData[0]);
    const head = document.querySelector('thead');
    let tags = "<tr>";
    for (let i = 0; i < column.length; i++) {
      tags += `<th>${column[i]}</th>`;
    }
    tags += "<th>Percent Change</th>";
    tags += "</tr>"
    head.innerHTML = tags;
    //added percentage change calculations 
    let indexChange = jsonData.length - 2;
    let prevPrice = jsonData[indexChange].close;
    indexChange = 1;
    let percentChange = 0;
    let newPrice = 0;

    const body = document.querySelector('tbody');
    let row = "";
    //flipped it to be seen in decreasing date order
    jsonData.reverse().map((d, index) => {
      newPrice = d.close;

      if (index == jsonData.length - 1) {
        percentChange = 0;
      } else {
        percentChange = (newPrice - prevPrice) / prevPrice * 100;
      }

      row += `<tr>
         <td>${d.date}</td>
         <td>${d.high.toFixed(4)}</td>
         <td>$${d.volume}</td>
         <td>${d.open.toFixed(4)}</td>
         <td>${d.low.toFixed(4)}</td>
         <td>$${d.close.toFixed(4)}</td>
         <td>$${d.adjclose.toFixed(4)}</td>
         <td>${percentChange.toFixed(4)}%</td>
         </td>`
      indexChange++;
      if (indexChange <= 4) {
        prevPrice = jsonData[indexChange].close;
      }
    })
    body.innerHTML = row;


  } catch {
    console.error("Error fetch Historical Graph: ");
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

    displayTransactions();   //Print the data to the webpage 
    downloadCSV(transactions, "Transactions.csv");   //Download the transactions as a csv
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
    const singleTransaction = { isBuy: true, date: jsonData[index].date.split('T')[0], numShares: numSharesToBuy, price: jsonData[index].close, annualReturn: annualReturn, singleReturnDollar: singleReturnDollar, totalReturnDollar: totalReturnDollar, totalReturnPercent: totalReturnPercent, currentBalance: totalBalance };
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
  const singleTransaction = { isBuy: false, date: jsonData[index].date.split('T')[0], numShares: numSharesToSell, price: jsonData[index].close, annualReturn: annualReturn, singleReturnDollar: singleReturnDollar, totalReturnDollar: totalReturnDollar, totalReturnPercent: totalReturnPercent, currentBalance: totalBalance };
  transactions.push(singleTransaction);     //Push the new transaction into the array of transactions

  //Update user balance and number of stocks after selling
  userInfo.balance += (numSharesToSell * jsonData[index].close);
  userInfo.numStock -= numSharesToSell;
}

//Gets the balance of last year's date
function getTotalBalanceLastYear(jsonData, index) {
  //This checks if we have even passed a year yet. If we haven't we can just return our starting balance
  if (jsonData[index].date.substring(0, 4) === jsonData[0].date.substring(0, 4)) {
    return 100000;
  }
  const yearIndex = jsonData[index].date.substring(0, 4) - jsonData[0].date.substring(0, 4) - 1;    //This subtracts the starting year by the current year which will give us our index
  console.log(yearIndex);
  console.log(yearlyInfo);
  console.log(jsonData[index].date.substring(0, 4));
  return yearlyInfo.userBalance[yearIndex] + yearlyInfo.userStocks[yearIndex] * jsonData[yearlyInfo.beginningYearIndex[yearIndex]].close;   //This is simply the balance + number of stocks * price all at the given year
}

//This function downloads the transactions as a CSV
function downloadCSV(array, filename) {
  //Extract the keys from the first object to use as headers
  const keys = Object.keys(array[0]);

  //Convert array of objects to CSV format
  const csvContent = [
    keys.join(','), // Add headers as the first row
    ...array.map(obj => keys.map(key => obj[key] !== undefined ? obj[key] : '').join(',')) // Join each object's values
  ].join('\n');

  //Create a Blob from the CSV string
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  //Create a link element and set the download attribute
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);

  //Simulate a click on the link to trigger the download
  link.click();
  URL.revokeObjectURL(url); // Clean up the URL object
}

function getDropdownValue() {
  const dropdown = document.getElementById("dataType");
  return dropdown.value;
}

//This displays all the transaction data by creating elements and appending html elements to the transactions id div in index.html
function displayTransactions() {
  const transactionContainer = document.getElementById('transactions');
  transactionContainer.classList.add('table-responsive', 'mt-3');

  const table = document.createElement('table');
  table.classList.add('table', 'table-dark', 'table-striped', 'table-hover', 'text-center', 'shadow');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headers = ['Transaction #', 'Type', 'Date', 'Shares', 'Price', 'Gain/Loss ($)',
    'Total Gain/Loss ($)', 'Annual Return (%)', 'Total Return (%)'];

  headers.forEach(headerText => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = headerText;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement('tbody');

  for (let i = 0; i < transactions.length; i++) {
    const row = document.createElement('tr');

    function createStyledCell(value, isCurrency = false) {
      const cell = document.createElement('td');
      cell.textContent = isCurrency ? `$${value.toFixed(2)}` : `${value.toFixed(4)}%`;
      if (value < 0) {
        cell.classList.add('text-danger'); // red for negative
      } else if (value >= 0) {
        cell.classList.add('text-success'); // green for positive
      }
      return cell;
    }

    const transactionNumber = document.createElement('td');
    transactionNumber.textContent = `${(i + 1)}`;

    const buyOrSell = document.createElement('td');
    buyOrSell.textContent = `${transactions[i].isBuy ? "Purchase" : "Sale"}` 
    
    const date = document.createElement('td');
    date.textContent = `${transactions[i].date}`;

    const numOfShares = document.createElement('td');
    numOfShares.textContent = `${transactions[i].numShares}` 
    
    const sharePrice = document.createElement('td');
    sharePrice.textContent = `${transactions[i].price.toFixed(2)}`;

    const singleReturn = createStyledCell(transactions[i].singleReturnDollar, true);
    const totalReturn = createStyledCell(transactions[i].totalReturnDollar, true);
    const annualReturn = createStyledCell(transactions[i].annualReturn);
    const totalReturnPercent = createStyledCell(transactions[i].totalReturnPercent);

    row.appendChild(transactionNumber);
    row.appendChild(buyOrSell);
    row.appendChild(date);
    row.appendChild(numOfShares);
    row.appendChild(sharePrice);
    row.appendChild(singleReturn);
    row.appendChild(totalReturn);
    row.appendChild(annualReturn);
    row.appendChild(totalReturnPercent);

    tbody.appendChild(row);
    table.appendChild(tbody);

    transactionContainer.appendChild(table);
  }
}
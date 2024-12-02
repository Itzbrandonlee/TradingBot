
let jsonData = null;
let transactions = [];

function getHistoricalTable() {
  const historicalTable = document.getElementById('historicalTable');
  historicalTable.hidden = false;
}


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
    const historicalTable = document.getElementById('historicalTable');
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
async function backtest(algo) {
  if (algo == "BB") {
    console.log("BB");
    backtestBB(jsonData);
    return;
  }
  else if (algo == "MACD") {
    console.log("MACD");
    backtestMACD(jsonData);
    return;
  } else {
    console.log("SMA");
    backtestSMA(jsonData);
    return;
  }   
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
  if(userInfo.numStock === 0) {
    return;
  }
  const numSharesToSell = Math.min(userInfo.numStock, Math.floor(userInfo.numStock * 0.6));   //Number of shares to sell is currently 60% of stocks owned. This can be tweaked later
  const totalBalance = userInfo.balance + (jsonData[index].close * userInfo.numStock);
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
  if (jsonData[index].date.substring(0, 4) === jsonData[0].date.substring(0, 4)) {
    return 100000;
  }
  const yearIndex = jsonData[index].date.substring(0, 4) - jsonData[0].date.substring(0, 4) - 1;    //This subtracts the starting year by the current year which will give us our index
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


//This displays all the transaction data by creating elements and appending html elements to the transactions id div in index.html
function displayTransactions() {
  const transactionContainer = document.getElementById('transactions');
  transactionContainer.innerHTML = '';
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

module.exports = {buyStock};
class TradingModel {
  
  //TODO: IMPLEMENT THE STRATEGY METHOD TO DETERMINE AMOUNT OF STOCK TO BUY
  /*  buyStock - This function is called when we want to buy stocks
      INPUTS: jsonData - the stock data to base purchase off of
              userInfo - holds the user's current balance and number of stocks
              index - the current index of jsonData that we are on
              transactions - an array of transaction records
      OUTPUTS: none
  */
  static buyStock(jsonData, userInfo, index, transactions, algo, yearlyInfo) {
    const amountToInvest = userInfo.balance * 0.6;    //Currently, it is set to buy the number of stocks <= 60% of current balance. This can be tweaked later if desired and is not integral to the formula
    if (amountToInvest > jsonData[index].close) {    //Check if we can even afford to buy a stock
      const numSharesToBuy = Math.floor(amountToInvest / jsonData[index].close);
  
      const totalBalance = userInfo.balance + (jsonData[index].close * userInfo.numStock);
      const totalBalanceLastYear = this.getTotalBalanceLastYear(jsonData, index, yearlyInfo);
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
  
  //TODO: IMPLEMENT THE STRATEGY METHOD TO DETERMINE AMOUNT OF STOCK TO SELL
  /*  sellStock - This function is called when we want to sell stocks
      INPUTS: jsonData - the stock data to base sale off of
              userInfo - holds the user's current balance and number of stocks
              index - the current index of jsonData that we are on
              transactions - an array of transaction records
      OUTPUTS: none
  */
  static sellStock(jsonData, userInfo, index, transactions, algo, yearlyInfo) {
    if(userInfo.numStock === 0) {
      return;
    }
    const numSharesToSell = Math.min(userInfo.numStock, Math.floor(userInfo.numStock * 0.6));   //Number of shares to sell is currently 60% of stocks owned. This can be tweaked later
    const totalBalance = userInfo.balance + (jsonData[index].close * userInfo.numStock);
    const totalBalanceLastYear = this.getTotalBalanceLastYear(jsonData, index, yearlyInfo);
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
  
  static getStockAmount(data, algo, valuesNeeded) {
    switch (algo) {
      case "SMA":
        
        break;
      case "BB":
  
        break;
      case "MACD":
  
        break;
    }
  }

  static formatDateRange(startDate, endDate, jsonData) {
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

  static getTotalBalanceLastYear(jsonData, index, yearlyInfo) {
    //This checks if we have even passed a year yet. If we haven't we can just return our starting balance
    if (jsonData[index].date.substring(0, 4) === jsonData[0].date.substring(0, 4)) {
      return 100000;
    }
    const yearIndex = jsonData[index].date.substring(0, 4) - jsonData[0].date.substring(0, 4) - 1;    //This subtracts the starting year by the current year which will give us our index
    return yearlyInfo.userBalance[yearIndex] + yearlyInfo.userStocks[yearIndex] * jsonData[yearlyInfo.beginningYearIndex[yearIndex]].close;   //This is simply the balance + number of stocks * price all at the given year
  }

  static processData(data) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });    //This blob is a downloadable json file
    const url = URL.createObjectURL(blob);    //This is a temporary download link

    //This downloads the file
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historical_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
}

export default TradingModel;
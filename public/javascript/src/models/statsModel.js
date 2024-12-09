class StatsModel {
    constructor() {
      this.date = null;
      this.singleGainLoss = [];
      this.totalGainLoss = 0;
      this.totalGainLossAtTransaction = [];
      this.currentNumStock = 0;
      this.currentBalance = 100000; // Default starting balance
    }
  
    // Reset all stats
    reset() {
      this.date = null;
      this.singleGainLoss = [];
      this.totalGainLoss = 0;
      this.totalGainLossAtTransaction = [];
      this.currentNumStock = 0;
      this.currentBalance = 100000;
    }

    calcStats(transactions) {

        //Iterate through each transaction and update data
        for (let i = 0; i < transactions.length; i++) {
          //Updates values if transaction is a purchase
          if (transactions[i].isBuy) {
            this.currentNumStock += transactions[i].numShares;
            this.currentBalance -= transactions[i].numShares * transactions[i].price;
            this.singleGainLoss[i] = ((this.currentNumStock * transactions[i].price + this.currentBalance) - 100000);
            this.totalGainLoss += this.singleGainLoss[i];
            this.totalGainLossAtTransaction[i] = this.totalGainLoss;
          }
      
          //Updates values if transaction is a sale
          else {
            this.currentNumStock -= transactions[i].numShares;
            this.currentBalance += transactions[i].numShares * transactions[i].price;
            this.singleGainLoss[i] = ((this.currentNumStock * transactions[i].price + this.currentBalance) - 100000);
            this.totalGainLoss += this.singleGainLoss[i];
            this.totalGainLossAtTransaction[i] = this.totalGainLoss;
          }
        }
      }

  }
  
  export default new StatsModel(); // Singleton instance
  
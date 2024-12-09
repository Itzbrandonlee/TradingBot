class DataModel {

    constructor() {
        this.jsonData = null;
        this.transactions = [];
        //This will hold general information about the data that may be helpful in the code
        this.yearlyInfo = {
            beginningYearIndex: [],   //This will hold the index of the beginning of the year in the data. Helpful for calculating annual return 
            userBalance: [],          //This will be the user balance at the beginning of the given year
            userStocks: [],           //This will be the number of stocks the user owned at the beginning of the given year 
        };
    }

    getJsonData() {
        return this.jsonData;
    }

    getTransactions() {
        return this.transactions;
    }

    getYearlyInfo() {
        return this.yearlyInfo;
    }

    setJsonData(data) {
        this.jsonData = data;
    }

    setTransactions(transactions) {
        this.transactions = transactions;
    }

    setYearlyInfo(yearlyInfo) {
        this.yearlyInfo = yearlyInfo;
    }

    addTransation(transaction) {
        this.transactions.push(transaction);
    }
}

export default new DataModel();
/*const {buyStock} = require('../src/main');

describe("Main Functions", () => {
    test("Buy Stock", () => {
        const userInfoTest = {
            balance: 100000,
            numStock: 0,
            totalReturn: 0,
        }
        const stockData = [{
            close: 10,
        },
        {
            close: 20,
        }];
        const transactionsTest = [];
    
        const expectedBalance = 40000;
        const expectedNumStock = 600000;
        const expectedReturn = 0;
    
        buyStock(stockData, userInfoTest, 0, transactionsTest);

        expect(userInfoTest.balance).toBe(expectedBalance);
        expect(userInfoTest.numStock).toBe(expectedNumStock);
        expect(userInfoTest.totalReturn).toBe(expectedReturn);
    })
})

function testBuyStock() {
    const userInfoTest = {
        balance: 100000,
        numStock: 0,
        totalReturn: 0,
    }
    const stockData = [{
        close: 10,
    },
    {
        close: 20,
    }];
    const transactionsTest = [];

    const expectedBalance = 40000;
    const expectedNumStock = 600000;
    const expectedReturn = 0;

    buyStock(stockData, userInfoTest, 0, transactionsTest);

    console.log("BALANCE: ")
    if(userInfoTest.balance === expectedBalance) {
        console.log("PASSED");
    }
    else {
        console.log("FAILED");
    }

    console.log("NUM STOCK: ");
    if(userInfoTest.numStock === expectedNumStock) {
        console.log("PASSED");
    }
    else {
        console.log("FAILED");
    }

    console.log("RETURN: ");
    if(userInfoTest.totalReturn === expectedReturn) {
        console.log("PASSED");
    }
    else {
        console.log("FAIL");
    }
}

function testSellStock() {

} */

test.skip("this test is not implemented yet", () => {
    // Test skipped
  });
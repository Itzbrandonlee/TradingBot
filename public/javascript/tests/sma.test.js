const {calcSMA, updateSMA} = require('../src/sma');

describe("SMA TESTS", () => {
    test("CalcSMA", () => {
        const closingPrices = [100, 98, 95, 102, 106, 200, 50, 80];
        const timeFrame = closingPrices.length;

        const actualResult = calcSMA(closingPrices, timeFrame, 8);
        
        expect(actualResult).toBe(103.875);
    });
    test("UpdateSMA", () => {
        const closingPrices = [100, 98, 95, 102, 106, 200, 50, 80];
        const timeFrame = closingPrices.length;
        let startingIndex = 0;
        const startSMA = calcSMA(closingPrices, timeFrame, timeFrame);
        const newValue = 10;
        const expectedResult = 92.625;
        closingPrices.push(newValue);

        const actualResult = updateSMA(closingPrices, startSMA, timeFrame, timeFrame);

        expect(actualResult).toBe(expectedResult);
    });
});
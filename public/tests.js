
function testFunctions() {
    let testCaseName = "Test calcSMA: ";
    process.stdout.write(testCaseName)
    testCalcSMA();

    testCaseName = "Test updateSMA: ";
    process.stdout.write(testCaseName)
    testUpdateSMA();

    

}
function testCalcSMA() {
    const closingPrices = [100, 98, 95, 102, 106, 200, 50, 80];
    const timeFrame = closingPrices.length;
    const startingIndex = 0;
    const expectedResult = 103.875;

    const actualResult = calcSMA(closingPrices, timeFrame, startingIndex);
    if(expectedResult === actualResult) {
        console.log("PASS");
    }
    else {
        console.log("FAIL");
    }
}
function testUpdateSMA() {
    const closingPrices = [100, 98, 95, 102, 106, 200, 50, 80];
    const timeFrame = closingPrices.length;
    const startingIndex = 0;
    const startSMA = calcSMA(closingPrices, timeFrame, startingIndex);
    const newValue = 10;
    const expectedResult = 92.625;
    closingPrices.push(newValue);

    const actualResult = updateSMA(closingPrices, startSMA, timeFrame, timeFrame);
    if(actualResult === expectedResult) {
        console.log("PASS");
    }
    else {
        console.log("FAIL");
    }

}
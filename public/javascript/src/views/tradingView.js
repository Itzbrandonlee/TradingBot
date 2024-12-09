class TradingView {
   
   //This displays all the transaction data by creating elements and appending html elements to the transactions id div in index.html
    static displayTransactions(transactions, jsonData) {
        const transactionContainer = document.getElementById('transactions');
        transactionContainer.innerHTML = ''; // Clear previous content
        transactionContainer.classList.add('table-responsive', 'mt-3');
      
        // Arrays to store data for the line chart
        const xyValues = [];
        const labels = [];
      
        // Create table elements first
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
      
        // Loop through transactions and fill the table and chart data
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
          buyOrSell.textContent = `${transactions[i].isBuy ? "Purchase" : "Sale"}`;
      
          const date = document.createElement('td');
          date.textContent = `${transactions[i].date}`;
      
          // Store data for the chart
          xyValues.push({ x: transactions[i].date, y: transactions[i].price });
          labels.push(transactions[i].isBuy ? 'Purchase' : 'Sale');
      
          const numOfShares = document.createElement('td');
          numOfShares.textContent = `${transactions[i].numShares}`;
      
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
        }
      
        // Create the chart before the table
        const chartDiv = document.createElement('div');
        chartDiv.classList.add('d-flex', 'justify-content-center');
        const chartCanvas = document.createElement('canvas');
        chartCanvas.id = 'priceChart';
        chartCanvas.style.width = '100%';
        chartCanvas.style.maxWidth = '50%';
      
        chartDiv.appendChild(chartCanvas); // Append chart before the table
        transactionContainer.appendChild(chartDiv);
        transactionContainer.appendChild(table);
      
        const dateRange = transactions.map(transaction => transaction.date);
        const closingPrices = jsonData.map(quote => quote.close);
        const openingPrices = jsonData.map(quote => quote.open);
      
        const ctx = chartCanvas.getContext('2d');
        const priceChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: dateRange, // Dates for X-axis
            datasets: [
              {
                type: 'scatter',
                label: 'Transaction Price ($)',
                data: xyValues, // Scatter plot data
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: (context) => {
                  const index = context.dataIndex;
                  return labels[index] === 'Purchase' ? 'green' : 'red';
                },
                pointRadius: 5,
              },
              {
                type: 'line',
                label: 'Opening Prices',
                data: openingPrices,
                fill: false,
                backgroundColor: 'rgba(128, 0, 128, 1)',
                borderColor: 'rgba(128, 0, 128, 1)',
                tension: 0.1,
                pointRadius: 0
              },
              {
                type: 'line',
                label: 'Closing Prices',
                data: closingPrices,
                fill: false,
                backgroundColor: 'rgba(13, 110, 253, 1)',
                borderColor: 'rgba(13, 110, 253, 1)',
                tension: 0.1,
                pointRadius: 0
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
            },
            scales: {
              y: {
                beginAtZero: false,
                title: {
                  display: true,
                  text: 'Price ($)'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Transaction Date'
                }
              }
            }
          }
        });
      
      }
      //This function downloads the transactions as a CSV
    static downloadCSV(array, filename) {
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

  static showHistoricalTable() {
    const historicalTable = document.getElementById('historicalTable');
    historicalTable.hidden = false;
  }
}

export default TradingView;
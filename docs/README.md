# Trading Bot

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Configuration](#configuration)
6. [Contributing](#contributing)
7. [License](#license)
8. [Contact](#contact)

---

## Project Overview

**Trading Bot** is a system that allows backtesting algorithms on FNGU or FNGD data. It aims to allow comparisons and analysis between these different trading algorithms. If you're looking for the best trading algorithm for you, this project provides the means to perform that analysis yourself.

### Example:


---

## Features


---

## Installation

### 1. Fork and Clone this repository
    Fork and clone this repo in order to run the program and/or modify it

### 2. Install Node JS if you haven't already
    -[https://nodejs.org/en/learn/getting-started/how-to-install-nodejs]

### 3. Install dependencies
    - in the terminal, use "npm install" to install dependencies

### 4. Run server
    - in the terminal, use "node server.js" to run the program

### 5. Copy and paste address into a browser
    - the address should be localhost:3000


---

## Usage

### Access Stock Data
    - Data is downloaded using yahoofinance2. Their full documentation: https://github.com/gadicc/node-yahoo-finance2/blob/devel/docs/README.md
#### Basic Overview
    - Stock data is saved within the variable jsonData. It contains children metadata and quotes. Within quotes, there will be stock data for each individual day
    - for example, to access the closing price of the first day: "jsonData.quotes[0].close
    - Look at the downloaded file so you fully understand the structure of the data

### Access Transaction Data
    - Once backtest has been clicked, every transaction will be stored in an array called transactions. Each index will contain: buy vs sell, number of shares, date, and price. 
// Function to write n lines in a file with some random data. 

const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

const fileName = "myFile.txt"; 
const filePath = path.join(__dirname, fileName);

const start=1;
const end= 10000;

// Start and end dates
const startDate = new Date('2016-01-01');
const endDate = new Date('2024-06-01');

for(let i = start; i <= end; i++){
    for(let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)){
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-based in JavaScript
        const date = `${i}-${year}-${month}-01\n`;
        fs.appendFileSync(filePath, date);
    }
}
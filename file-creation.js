// Function to write n lines in a file with some random data. 

const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

const filePath= "C://Users//user//Desktop//file.txt";

const start=1;
const end= 10000;

for(let i=start; i<=end; i++){
    const data = randomBytes(100).toString('hex');
    fs.appendFileSync(filePath, data + '\n');
}

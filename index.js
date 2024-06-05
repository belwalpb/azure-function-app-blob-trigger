const readline = require('readline');
const { Readable } = require('stream');
const { MongoClient } = require('mongodb');

module.exports = async function (context, myBlob) {
    const stream = Readable.from(myBlob.toString());
    const lineReader = readline.createInterface({ input: stream });

    const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
    await client.connect();
    const collection = client.db(process.env.MONGODB_DB_NAME).collection(process.env.MONGODB_COLLECTION_NAME);

    for await (const line of lineReader) {
        const record = line.split(','); // assuming CSV without quotes
        await collection.insertOne({
            column1: record[0], // replace with your column names
            column2: record[1],
            // ...
        });
    }

    await client.close();
};
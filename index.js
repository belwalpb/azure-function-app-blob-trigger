module.exports = async function (context, myBlob) {
    const stream = Readable.from(myBlob.toString());
    const lineReader = readline.createInterface({ input: stream });

    const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
    await client.connect();
    const collection = client.db(process.env.MONGODB_DB_NAME).collection(process.env.MONGODB_COLLECTION_NAME);

    let records = [];
    for await (const line of lineReader) {
        const record = line.split(','); // assuming CSV without quotes
        records.push({
            column1: record[0], // replace with your column names
            column2: record[1],
            // ...
        });

        if (records.length === 100) {
            await collection.insertMany(records);
            records = [];
        }
    }

    // Insert remaining records if they are less than 100
    if (records.length > 0) {
        await collection.insertMany(records);
    }

    await client.close();
};
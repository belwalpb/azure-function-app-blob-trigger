const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, myBlob, myInputBlob) {
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

    // Move the blob in Azure Blob Storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient('migration');

    const timestamp = Date.now();
    const oldBlobName = `input/${myInputBlob}`;
    const newBlobName = `backup/${path.basename(myInputBlob, '.csv')}_${timestamp}.csv`;

    // Copy the blob
    const newBlobClient = containerClient.getBlobClient(newBlobName);
    const copyResponse = await newBlobClient.beginCopyFromURL(containerClient.getBlobClient(oldBlobName).url);
    await copyResponse.pollUntilDone();

    // Delete the original blob
    await containerClient.deleteBlob(oldBlobName);
};
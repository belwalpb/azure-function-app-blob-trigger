const { MongoClient } = require('mongodb');
const { BlobServiceClient } = require('@azure/storage-blob');
const os = require('os');
const path = require('path');

module.exports = async function (context, myBlob) {

    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient('migration');
    const blockBlobClient = containerClient.getBlockBlobClient(context.bindingData.name);

    const downloadFilePath = path.join(os.tmpdir(), context.bindingData.name);
    await blockBlobClient.downloadToFile(downloadFilePath);
    
    const stream = Readable.from(myBlob.toString());
    const lineReader = readline.createInterface({ input: stream });

    const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
    await client.connect();
    const collection = client.db(process.env.MONGODB_DB_NAME).collection(process.env.MONGODB_COLLECTION_NAME);

    let operations = [];
    for await (const line of lineReader) {
        const record = line.split(','); // assuming CSV without quotes
        operations.push({
            updateOne: {
                filter: { uniqueField: record[0] }, // replace 'uniqueField' with your unique field name
                update: {
                    $set: {
                        column1: record[0], // replace with your column names
                        column2: record[1],
                        // ...
                    }
                },
                upsert: true
            }
        });

        if (operations.length === 100) {
            await collection.bulkWrite(operations);
            operations = [];
        }
    }

    // Insert/Update remaining records if they are less than 100
    if (operations.length > 0) {
        await collection.bulkWrite(operations);
    }

    await client.close();

    // Move the blob in Azure Blob Storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient('migration');

    const timestamp = Date.now();
    const oldBlobName = `input/${context.bindingData.name}.csv`;
    const newBlobName = `backup/${context.bindingData.name}_${timestamp}.csv`;

    // Copy the blob
    const newBlobClient = containerClient.getBlobClient(newBlobName);
    const copyResponse = await newBlobClient.beginCopyFromURL(containerClient.getBlobClient(oldBlobName).url);
    await copyResponse.pollUntilDone();

    // Delete the original blob
    await containerClient.deleteBlob(oldBlobName);
};
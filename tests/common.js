global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
const Logger = require("mongodb").Logger;


Logger.setLevel("debug");

require('util');

const network = "HEDERA";
const debug=false

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

async function createAProof(watcherDb,persistenceDb,docCount = 1000) {
    const collectionName = 'submitProof' + Math.round((Math.random() * 100000));
    if (debug)
        console.log(collectionName);
    const wCollection = watcherDb.collection(collectionName);
    const data = [];
    for (let i = 0; i < docCount; i++) {
        data.push({
            x: i,
            y: i,
            z: 'Hello world'
        });
    }
    wCollection.insertMany(data);

    await sleep(5000);
    const controlId = Math.round(Math.random() * 1000000000).toString();

    console.log('Creating proof with ID ', controlId);
    const insertOut = await watcherDb.collection('provendb_controls').
    insertOne({
        "_id": controlId,
        op: "submitProof",
        anchorType: network,
        "time": new Date(),
        collection: collectionName
    });
    if (debug)
        console.log(insertOut);

    await sleep(5000); //TODO: Need better synchronization
    let completedProof = false;
    let controlRecord;

    while (!completedProof) {
        await sleep(2000);
        controlRecord = await persistenceDb.collection('provendb_controls').findOne({
            "_id": controlId
        });
        if (controlRecord) {
            if (debug)
                console.log(controlRecord);
            await sleep(5000);
            expect(Object.keys(controlRecord)).toContain("status");
            if (controlRecord.status === 'completed') {
                completedProof = true;
            } else if (controlRecord.status === 'error') {
                console.error(controlRecord);
                throw Error('Error in submitProof');

            } else {
                if (debug) console.log(controlRecord.status);

            }
        }
    }
    return {
        collectionName,
        controlRecord
    };
}

module.exports={createAProof,sleep}
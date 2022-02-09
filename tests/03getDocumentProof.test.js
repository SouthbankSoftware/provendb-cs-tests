
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
const MongoClient = require('mongodb').MongoClient;
const Logger = require("mongodb").Logger;

Logger.setLevel("debug");

require('util');
/*const chp = require('chainpoint-client');
const chainpointParse = require('chainpoint-parse');
const chainpointBinary = require('chainpoint-binary');*/
const network = "HEDERA_MAINNET";

require('dotenv').config();

let watcherDb;
let persistenceDb;
let debug = false;
if ("PDB_DEBUG" in process.env)
    debug = true;


describe('Get Document Proof', () => {
    beforeAll(async () => {
        const peristenceUri = process.env.PROVENDB_PERSISTENCE_URI;
        console.log(peristenceUri);
        const persistClient = await MongoClient.connect(
            peristenceUri, {});
        persistenceDb = persistClient.db();

        const watcherUri = process.env.PROVENDB_WATCHABLE_URI;
        console.log(watcherUri);
        const watcherClient = await MongoClient.connect(
            watcherUri, {});
        watcherDb = watcherClient.db();
    });

    beforeEach(() => {});

    afterEach(() => {});

    afterAll(() => {});

    test('simple getDocumentProof', async () => {
        jest.setTimeout(240000);
        const collectionName=await createAProof(10);
        const id=Math.round(Math.random()*10000000).toString();
        const getDocProof={
            "_id" : id,
            "collection" : collectionName,
            "x" : 7,
            "label" : "my-custom-label",
            "op" : "getDocumentProof",
            "time" : new Date()
        };
        console.log(getDocProof);
        const insertOut=await watcherDb.collection('provendb_controls').insertOne(getDocProof);
        console.log(insertOut);
        await sleep(5000);
        const results=await persistenceDb.collection('provendb_controls').find({_id:id}).toArray()[0];
        console.log(results);
        await sleep(2000);
        expect(true).toBeTruthy();

    });
});

 

async function createAProof(docCount = 1000) {
    const collectionName = 'getDocumentProof' + Math.round((Math.random() * 100000));
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

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
/* eslint-disable import/no-named-as-default */

global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
const MongoClient = require('mongodb').MongoClient;
const Logger = require("mongodb").Logger;

Logger.setLevel("debug");
require('util');
require('dotenv').config();

let watcherDb;
let persistenceDb;
const debug = false;


describe('SubmitProof tests', () => {
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

    test('simple SubmitProof', async () => {
        jest.setTimeout(120000);
        const debug = true;

        const collectionName = 'submitProof' + Math.round((Math.random() * 100000));
        if (debug) console.log(collectionName)
        const wCollection = watcherDb.collection(collectionName);

        wCollection.insertOne({
            x: 1
        });

        await sleep(5000);
        const controlId = Math.round(Math.random() * 1000000000).toString();
        if (debug) console.log(controlId);
        const insertOut = await watcherDb.collection('provendb_controls').
        insertOne({
            "_id": controlId,
            op: "submitProof",
            anchorType: "HEDERA",
            "time": new Date(),
            collection: collectionName
        });
        if (debug) console.log(insertOut);


        let completedProof = false;
        let controlRecord;

        while (!completedProof) {
            await sleep(2000);
            controlRecord = await persistenceDb.collection('provendb_controls').findOne({
                "_id": controlId
            });
            if (debug) console.log(controlRecord);
            await sleep(5000);
            expect(Object.keys(controlRecord)).toContain("status");
            if (controlRecord.status === 'completed') {
                completedProof = true;
            } else {
                console.log(controlRecord.status);

            }
        }
        if (debug) console.log(controlRecord);
        expect(controlRecord.data.proof.anchortype).toEqual('HEDERA');
        expect(controlRecord.data.collection).toEqual(collectionName);
        expect(controlRecord.data.proof.status).toEqual('CONFIRMED');
    });
});

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
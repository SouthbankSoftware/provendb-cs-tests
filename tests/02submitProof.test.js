/* eslint-disable import/no-named-as-default */

global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
const MongoClient = require('mongodb').MongoClient;
const Logger = require("mongodb").Logger;

Logger.setLevel("debug");

require('util');
const chp = require('chainpoint-client');
const chainpointParse = require('chainpoint-parse');
const chainpointBinary = require('chainpoint-binary');
const network = "HEDERA";

require('dotenv').config();

let watcherDb;
let persistenceDb;
let debug = false;
if ("PDB_DEBUG" in process.env)
    debug = true;


describe('SubmitProof tests', () => {
    beforeAll(async () => {
        jest.setTimeout(240000);
        const peristenceUri = process.env.PROVENDB_PERSISTENCE_URI;
        console.log(peristenceUri);
        const persistClient = await MongoClient.connect(
            peristenceUri, {});
        persistenceDb = persistClient.db();
        console.log('Persistent db connected');

        const watcherUri = process.env.PROVENDB_WATCHABLE_URI;
        console.log(watcherUri);
        const watcherClient = await MongoClient.connect(
            watcherUri, {});
        watcherDb = watcherClient.db();
        console.log('Watcher connected');
    });

    beforeEach(() => {});

    afterEach(() => {});

    afterAll(() => {});

    test('simple SubmitProof', async () => {
        const debug=true
        jest.setTimeout(240000);

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
            dataId: controlId,
            op: "submitProof",
            anchorType: network,
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
                if (debug) console.log(controlRecord.status);

            }
        }
        if (debug) console.log(controlRecord);
        expect(controlRecord.anchorType).toEqual(network);
        expect(controlRecord.collection).toEqual(collectionName);
        expect(controlRecord.proof.status).toEqual('CONFIRMED');
    });

    test('proof format is valid', async () => {
        const debug=true;
        jest.setTimeout(120000);


        var {
            collectionName,
            controlRecord
        } = await createAProof(1000);
        if (debug) {

            // console.log(collectionName, JSON.stringify(controlRecord));
            console.log(Object.keys(controlRecord));
            console.log(controlRecord);
        }
        let proof = controlRecord.proof;
        await sleep(1000)


        expect(proof.anchortype).toEqual(network);
        expect(controlRecord.collection).toEqual(collectionName);
        expect(proof.status).toEqual('CONFIRMED');

        const objectProof = proof.data;
        if (debug) console.log(JSON.stringify(objectProof));
        const binaryProof = await chainpointBinary.objectToBinarySync(objectProof);
        if (debug) console.log(binaryProof);
        const parsedProof = chainpointParse.parse(binaryProof);
        if (debug) console.log(parsedProof);
        expect(parsedProof.hash).toEqual(objectProof.hash);
        await sleep(2000);

    });

});



async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
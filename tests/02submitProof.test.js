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
const network = "HEDERA_MAINNET";

require('dotenv').config();

let watcherDb;
let persistenceDb;
let debug = false;
if ("PDB_DEBUG" in process.env)
    debug = true;


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
        expect(controlRecord.data.proof.anchorType).toEqual(network);
        expect(controlRecord.data.collection).toEqual(collectionName);
        expect(controlRecord.data.proof.status).toEqual('CONFIRMED');
    });

    test('proof format is valid', async () => {
        jest.setTimeout(120000);

        const debug = true;
        var {
            collectionName,
            controlRecord
        } = await createAProof(1000);
        if (debug) {

            // console.log(collectionName, JSON.stringify(controlRecord));
            console.log(Object.keys(controlRecord));
            console.log(Object.keys(controlRecord.data));
            console.log(controlRecord.data.proof);
        }
        let proof = controlRecord.data.proof;


        expect(proof.anchorType).toEqual(network);
        expect(controlRecord.data.collection).toEqual(collectionName);
        expect(proof.status).toEqual('CONFIRMED');

        const objectProof = proof.data;
        if (debug) console.log(objectProof);
        const binaryProof = await chainpointBinary.objectToBinarySync(objectProof);
        if (debug) console.log(binaryProof);
        const parsedProof = chainpointParse.parse(binaryProof);
        if (debug) console.log(parsedProof);
        expect(parsedProof.hash).toEqual(objectProof.hash);

    });

});

async function createAProof(docCount = 1000) {
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

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
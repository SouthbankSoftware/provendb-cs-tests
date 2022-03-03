global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
const MongoClient = require('mongodb').MongoClient;
const Logger = require("mongodb").Logger;

Logger.setLevel("debug");
require('util');
require('dotenv').config();

let watcherDb;
let persistenceDb;
let debug=false;
if ("PDB_DEBUG" in process.env)
     debug = true;


describe('Basic CRUD tests', () => {
    beforeAll(async () => {
        jest.setTimeout(20000);
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
        // console.log(watcherDb);
        await sleep(500);
    });

    beforeEach(() => {});

    afterEach(() => {});

    afterAll(() => {});

    test('InsertOne', async () => {
        jest.setTimeout(20000);

        const collectionName = 'insertOne' + Math.round((Math.random() * 100000));
        if (debug) console.log(collectionName)
        const wCollection = watcherDb.collection(collectionName);

        wCollection.insertOne({
            x: 1
        });

        await sleep(5000);
        const pCollection = persistenceDb.collection(collectionName);
        const data = await pCollection.find().toArray();
        if (debug) console.log(data);
        expect(data.length).toEqual(1);
        const doc = data[0];
        expect(Object.keys(doc)).toEqual(['_id', 'data', 'dataId', 'metadata']);
        expect(doc.data.x).toEqual(1);
        expect(doc.metadata.endedAt).toEqual(null);

    });

    test('UpdateMany', async () => {
        jest.setTimeout(200000);
        const debug = true;
        const nDocs = 100;
        const nUpdates = 4;

        const collectionName = 'updateMany' + Math.round((Math.random() * 100000));
        if (debug) console.log(collectionName)
        const controlCollectionName = collectionName + '_control';
        console.log(watcherDb);
        await sleep(1000);
        const wCollection = watcherDb.collection(collectionName);
        const wControlCollection = watcherDb.collection(controlCollectionName);
        const pCollection = persistenceDb.collection(collectionName);
        const pControlCollection = persistenceDb.collection(controlCollectionName);

        const data = [];
        for (let i = 0; i < nDocs; i++) {
            data.push({
                _id: i,
                x: 1,
                y: 1,
                z: i
            });
        }
        insOut = await wCollection.insertMany(data);


        for (let i = 0; i < nUpdates; i++) {
            const updateOut = await wCollection.updateMany({}, {
                "$set": {
                    y: i,x:i
                }
            }, {
                multi: true
            });
        }
        wControlCollection.insertOne({
            done: true
        });
        let syncDone = false;
        const startSync = new Date();
        let syncTime = -1;
        while (!syncDone) {
            console.log("Waiting for sync");
            await sleep(5000);
            /*const controlData = await wControlCollection.findOne();
            console.log(controlData);
            if ("data" in controlData && "done" && controlData.data && controlData.data.done === true) {
                syncDone = true;
                syncTime = (new Date()) - startSync;
            }*/
            const targetCount= await pCollection.count();
            console.log('target count ',targetCount);
            if (targetCount===((nUpdates+1)*nDocs)) {
                syncDone = true;
                syncTime = (new Date()) - startSync;
            }
        }
        console.log("Sync time ", syncTime, nDocs * (nUpdates + 1) * 1000 / syncTime, 'docs/s');
        const wCollectionCount = await wCollection.count();
        expect(wCollectionCount).toEqual(nDocs);

        let expectedSumX = 1;
        for (let i = 0; i < nUpdates; i++) {
            expectedSumX += i;
        }
        expectedSumX *= nDocs;

        const singleDocResult = await pCollection.find({
            dataId: 1
        }).toArray();
        expect(singleDocResult.length).toEqual((nUpdates + 1));
        const allDocsAgg = await pCollection.aggregate(
            [{
                $group: {
                    _id: 0,
                    "count": {
                        $sum: 1
                    },
                    "data-x-sum": {
                        $sum: "$data.x"
                    }
                }
            }, ]
        ).toArray();
        if (debug) console.log(allDocsAgg);
        await sleep(2000);
        const actualSumX=allDocsAgg[0]["data-x-sum"];
        expect(actualSumX).toEqual(expectedSumX);


    });

    test('UpdateOne', async () => {
        jest.setTimeout(20000);
        const debug = true;

        const collectionName = 'updateOne' + Math.round((Math.random() * 100000));
        if (debug) console.log(collectionName)
        const wCollection = watcherDb.collection(collectionName);

        await wCollection.insertOne({
            x: 1
        });
        const updateOut = await wCollection.updateOne({
            x: 1
        }, {
            "$set": {
                x: 2
            }
        });
        console.log(updateOut);

        await sleep(5000);

        const pCollection = persistenceDb.collection(collectionName);
        const data = await pCollection.find().sort({
            "createdAt": 1
        }).toArray();
        if (debug) console.log(data);
        expect(data.length).toEqual(2);
        expect(data[0].metadata.endedAt).toBeDefined;
        expect(data[0].metadata.endedAt).not.toEqual(null);
        expect(data[0].data.x).toEqual(1);
        expect(data[1].metadata.endedAt).toEqual(null);
        expect(data[1].data.x).toEqual(2);
        expect(data[0].dataId).toEqual(data[1].dataId);
        expect(data[0].metadata.hash).not.toEqual(data[1].metadata.hash);

    });

    test('simpleDelete', async () => {
        jest.setTimeout(20000);

        const debug = true;
        const collectionName = 'simpleDelete' + Math.round((Math.random() * 100000));
        if (debug) console.log(collectionName)
        const wCollection = watcherDb.collection(collectionName);

        await wCollection.insertOne({
            x: 1
        });
        const updateOut = await wCollection.updateOne({
            x: 1
        }, {
            "$set": {
                x: 2
            }
        });
        if (debug) console.log(updateOut);
        await sleep(1000);
        const deleteOut = await wCollection.deleteMany({});
        if (debug) console.log(deleteOut);

        //TODO: Better sync required here. 
        await sleep(5000);

        const pCollection = persistenceDb.collection(collectionName);
        const data = await pCollection.find().sort({
            "createdAt": 1
        }).toArray();
        if (debug) console.log(data);
        await sleep(5000);
        expect(data.length).toEqual(2);

        expect(data[0].metadata.endedAt).not.toEqual(null)
        expect(data[1].metadata.endedAt).toEqual(null)



    });
});

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
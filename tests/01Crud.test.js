global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
const MongoClient = require('mongodb').MongoClient;
const Logger  = require("mongodb").Logger;

Logger.setLevel("debug");
require('util');
require('dotenv').config();

let watcherDb;
let persistenceDb;
const debug=false;


describe('Basic CRUD tests', () => {
    beforeAll(async () => {
        const peristenceUri=process.env.PROVENDB_PERSISTENCE_URI;
        console.log(peristenceUri);
        const persistClient = await MongoClient.connect(
            peristenceUri, {});
        persistenceDb = persistClient.db();
 
        const watcherUri=process.env.PROVENDB_WATCHABLE_URI;
        console.log(watcherUri);
        const watcherClient = await MongoClient.connect(
            watcherUri,{ });
        watcherDb = watcherClient.db();
    });

    beforeEach(() => {});

    afterEach(() => {});

    afterAll(() => {});

    test('InsertOne', async () => {
        jest.setTimeout(20000);

        const collectionName='insertOne'+Math.round((Math.random()*100000));
        if (debug) console.log(collectoinName)
        const wCollection=watcherDb.collection(collectionName);
  
        wCollection.insertOne({x:1});
 
        await sleep(5000);
        const pCollection=persistenceDb.collection(collectionName); 
        const data=await pCollection.find().toArray();
        if (debug) console.log(data);
        expect(data.length).toEqual(1);
        const doc=data[0];
        expect(Object.keys(doc)).toEqual(['_id','data','dataId','metadata']);
        expect(doc.data.x).toEqual(1);
        expect(doc.metadata.endedAt).toEqual(null);

    });

    test('UpdateOne', async () => {
        jest.setTimeout(20000);
        const debug=true;

        const collectionName='updateOne'+Math.round((Math.random()*100000));
        if (debug) console.log(collectionName)
        const wCollection=watcherDb.collection(collectionName);
  
        await wCollection.insertOne({x:1});
        const updateOut=await wCollection.updateOne({x:1},{"$set":{x:2}});
        console.log(updateOut);

        await sleep(5000);
 
        const pCollection=persistenceDb.collection(collectionName); 
        const data=await pCollection.find().sort({"createdAt":1}).toArray();
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

        const debug=true;
        const collectionName='simpleDelete'+Math.round((Math.random()*100000));
        if (debug) console.log(collectionName)
        const wCollection=watcherDb.collection(collectionName);
  
        await wCollection.insertOne({x:1});
        const updateOut=await wCollection.updateOne({x:1},{"$set":{x:2}});
        if (debug) console.log(updateOut);
        await sleep(1000);
        const deleteOut=await wCollection.deleteMany({});
        if (debug) console.log(deleteOut);

        await sleep(5000);
 
        const pCollection=persistenceDb.collection(collectionName); 
        const data=await pCollection.find().sort({"createdAt":1}).toArray();
        if (debug) console.log(data);
        expect(data.length).toEqual(2); 

            expect(data[0].metadata.endedAt).not.toEqual(null)
            expect(data[1].metadata.endedAt).not.toEqual(null)
 
 

    });
});

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
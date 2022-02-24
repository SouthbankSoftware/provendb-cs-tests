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
        jest.setTimeout(100000);
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
        console.log(watcherDb);
        await sleep(500);
    });

    beforeEach(() => {});

    afterEach(() => {});

    afterAll(() => {});

    test('InsertPerformance', async () => {
        jest.setTimeout(520000);
        const documentCount=2000;
        const sleepDelay=2000;
        const collectionName = 'InsertPerformance' + Math.round((Math.random() * 100000));
        if (debug) console.log(collectionName)
        const wCollection = watcherDb.collection(collectionName);
        const pCollection = persistenceDb.collection(collectionName);
        const data=[];
        for (let i=0;i<documentCount;i++) {
            data.push({_id:i,x:i,y:new Date()});
        }
        const startTs=new Date();
        wCollection.insertMany(data);
        const elapsedWatcher=(new Date()-startTs);
        let pCount=0;
        while (pCount<documentCount) {
            await sleep(sleepDelay);
            pCount=await pCollection.count();
        }
        const elapsedPersistence=(new Date()-startTs);

        console.log('Inserts ',documentCount,' watcher elapsed: ',elapsedWatcher,' persistence elapsed: ',elapsedPersistence);
        console.log('Doc/Sec ',documentCount*1000/elapsedPersistence);
        await sleep(1000);
        expect(elapsedPersistence).toBeLessThan(elapsedWatcher*4);
    });

    test('UpdatePerformance', async () => {
        jest.setTimeout(520000);
        const documentCount=2000;
        const sleepDelay=2000;
        const collectionName = 'UpdatePerformance' + Math.round((Math.random() * 100000));
        if (debug) console.log(collectionName)
        const wCollection = watcherDb.collection(collectionName);
        const pCollection = persistenceDb.collection(collectionName);
        const data=[];
        for (let i=0;i<documentCount;i++) {
            data.push({_id:i,x:i,y:new Date()});
        }

        wCollection.insertMany(data);

        let pCount=0;
        while (pCount<documentCount) {
            await sleep(sleepDelay);
            pCount=await pCollection.count();

        }

        const startTs=new Date();
        wCollection.updateMany({},{$inc:{x:1}},{multi:true});
        const elapsedWatcher=(new Date()-startTs);

         pCount=0;
        while (pCount<documentCount*2) {
            await sleep(sleepDelay);
            pCount=await pCollection.count();
        }
        const elapsedPersistence=(new Date()-startTs);

        console.log('Updates ',documentCount,' watcher elapsed: ',elapsedWatcher,' persistence elapsed: ',elapsedPersistence);
        console.log('Doc/Sec ',documentCount*1000/elapsedPersistence);
        await sleep(1000);
        expect(elapsedPersistence).toBeLessThan(elapsedWatcher*4);
    });

    test('deletePerformance', async () => {
        jest.setTimeout(520000);
        const documentCount=2000;
        const sleepDelay=2000;
        const collectionName = 'deletePerformance' + Math.round((Math.random() * 100000));
        if (debug) console.log(collectionName)
        const wCollection = watcherDb.collection(collectionName);
        const pCollection = persistenceDb.collection(collectionName);
        const data=[];
        for (let i=0;i<documentCount;i++) {
            data.push({_id:i,x:i,y:new Date()});
        }

        wCollection.insertMany(data);

        let pCount=0;
        while (pCount<documentCount) {
            await sleep(sleepDelay);
            pCount=await pCollection.count();

        }

        const startTs=new Date();
        wCollection.deleteMany({});
        const elapsedWatcher=(new Date()-startTs);

         pCount=0;
        while (pCount<documentCount) {
            await sleep(sleepDelay);
            pCount=await pCollection.find({"metadata.endedAt":{$ne:null}}).count();
        }
        const elapsedPersistence=(new Date()-startTs);

        console.log('Deletes ',documentCount,' watcher elapsed: ',elapsedWatcher,' persistence elapsed: ',elapsedPersistence);
        console.log('Doc/Sec ',documentCount*1000/elapsedPersistence);
        await sleep(1000);
        expect(elapsedPersistence).toBeLessThan(elapsedWatcher*4);
    });
 
});

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
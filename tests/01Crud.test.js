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

    });
});

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
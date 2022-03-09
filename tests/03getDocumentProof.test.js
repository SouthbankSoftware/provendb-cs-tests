/* eslint-disable import/no-named-as-default */

global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
const MongoClient = require('mongodb').MongoClient;
const Logger = require("mongodb").Logger;

Logger.setLevel("debug");

require('util');

const chainpointParse = require('chainpoint-parse');
const chainpointBinary = require('chainpoint-binary');

const {
    createAProof,sleep
} = require('./common');

const network = "HEDERA";

require('dotenv').config();

let watcherDb;
let persistenceDb;
let debug = false;
if ("PDB_DEBUG" in process.env)
    debug = true;


describe('Get Document Proof', () => {
    beforeAll(async () => {
        jest.setTimeout(200000);
        const peristenceUri = process.env.PROVENDB_PERSISTENCE_URI;
        console.log(peristenceUri);
        const persistClient = await MongoClient.connect(
            peristenceUri, {});
        persistenceDb = persistClient.db();

        const watcherUri = process.env.PROVENDB_WATCHABLE_URI;
        console.log(watcherUri);
        const watcherClient = await MongoClient.connect(
            watcherUri, {});
        console.log('connected',watcherUri);
        watcherDb = watcherClient.db();
    });

    beforeEach(() => {});

    afterEach(() => {});

    afterAll(() => {});

    test('simple getDocumentProof', async () => {
        const debug=true
        jest.setTimeout(240000);
        const createAProofOut=await createAProof(watcherDb,persistenceDb,10);
        const collectionName=createAProofOut.collectionName;
        const id=Math.round(Math.random()*10000000).toString();
        const getDocProofDoc={
            "_id" : id,
            "collection" : collectionName,
            "dataId" : 7,
            "label" : "my-custom-label",
            "op" : "getDocumentProof",
            "time" : new Date()
        };
        if (debug) console.log(getDocProofDoc);
        await sleep(1000);
        const insertOut=await watcherDb.collection('provendb_controls').insertOne(getDocProofDoc);
        if (debug) console.log(insertOut);
        await sleep(5000);
        console.log(await persistenceDb.collection('provendb_controls').find({},{_id:1}).toArray());
        const getDocProofResult=await persistenceDb.collection('provendb_controls').find({_id:id}).toArray();
        expect(getDocProofResult.length).toEqual(1);
        const results=getDocProofResult[0];
        if (debug) console.log(results);
        await sleep(2000);
        const proof = results.proof;
        if (debug) console.log(proof);
        await sleep(1000);
        expect(proof.anchortype).toEqual(network);
        expect(results.collection).toEqual(collectionName);
        expect(proof.status).toEqual('CONFIRMED');

    });

 

    test('getDocumentProof multi-versions', async () => {
        let debug=true;
        jest.setTimeout(240000);
        const data=[];
        for (let i=0;i<100;i++) {
            data.push({_id:i,x:i});
        }
        const collectionName='getProofMulti'+Math.round(Math.random()*10000000).toString();
        const collection=watcherDb.collection(collectionName);
        const collectionP=persistenceDb.collection(collectionName);
        await collection.insertMany(data);
        await sleep(5000);
        const time1=new Date();   
        await proveCollection(collectionName);
        const time2=new Date();  // Should be a proof now 
        const dataId=7;
        await collection.updateOne({_id:dataId},{$inc:{x:1}});
        await sleep(5000);
        await proveCollection(collectionName);
        const time3=new Date();

        let persistData=await collectionP.find({"data._id":dataId}).sort({createdAt:1}).toArray()
        if (debug) console.log(persistData)
  
        const getDocProofResult1 = await getADocProof(collectionName, dataId,time1);
        if (debug) console.log(JSON.stringify(getDocProofResult1));
        let proof1=getDocProofResult1[0].proof
        if (debug) console.log(JSONproof1);
        await sleep(2000)
        expect(proof1.hash).toEqual(persistData[0].metadata.hash);


        expect(getDocProofResult1).toContain("pdb_hedera_anchor_branch");
        if (debug) console.log('second proof should be for first version of data');
        const getDocProofResult2 = await getADocProof(collectionName, dataId,time2);
        if (debug) console.log(JSON.stringify(getDocProofResult2));
        if (debug) console.log('third proof should be for second version of data');
        const getDocProofResult3 = await getADocProof(collectionName, dataId,time3);
        if (debug) console.log(JSON.stringify(getDocProofResult3));
        
        await sleep(1000);
    });

    test('getDocumentProof chainpoint format', async () => {
        jest.setTimeout(240000);
        const createAProofOut=await createAProof(watcherDb,persistenceDb,10);
        const collectionName=createAProofOut.collectionName;
        const id=Math.round(Math.random()*10000000).toString();
        const getDocProofDoc={
            "_id" : id,
            "collection" : collectionName,
            "dataId" : 7,
            "label" : "my-custom-label",
            "op" : "getDocumentProof",
            "time" : new Date()
        };
        if (debug) console.log(getDocProofDoc);
        await sleep(1000);
        const insertOut=await watcherDb.collection('provendb_controls').insertOne(getDocProofDoc);
        if (debug) console.log(insertOut);
        await sleep(5000);
        console.log(await persistenceDb.collection('provendb_controls').find({},{_id:1}).toArray());
        const getDocProofResult=await persistenceDb.collection('provendb_controls').find({_id:id}).toArray();
        expect(getDocProofResult.length).toEqual(1);
        const results=getDocProofResult[0];
        if (debug) console.log(results);
        await sleep(2000);
        const proof = results.proof;
        if (debug) console.log(proof);
        await sleep(1000);
        expect(proof.anchortype).toEqual(network);
        expect(results.collection).toEqual(collectionName);
        expect(proof.status).toEqual('CONFIRMED');

        const objectProof = proof.data;
        if (debug) console.log(JSON.stringify(objectProof));
        await sleep(1000);
        const binaryProof = await chainpointBinary.objectToBinarySync(objectProof);
        if (debug) console.log(binaryProof);
        const parsedProof = chainpointParse.parse(binaryProof);
        if (debug) console.log(parsedProof);
        expect(parsedProof.hash).toEqual(objectProof.hash);
    });
});

async function getADocProof(collectionName, dataId,timestamp) {
    const id = Math.round(Math.random() * 10000000).toString();
    const getDocProofDoc = {
        "_id": id,
        "collection": collectionName,
        "dataId": dataId,
        "label": "my-custom-label",
        "op": "getDocumentProof",
        "time": timestamp
    };
    if (debug)
        console.log(getDocProofDoc);
    await sleep(1000);
    const insertOut = await watcherDb.collection('provendb_controls').insertOne(getDocProofDoc);
    if (debug)
        console.log(insertOut);
    await sleep(5000);
    const getDocProofResult = await persistenceDb.collection('provendb_controls').find({ _id: id }).toArray();
    if (debug) console.log(getDocProofResult);
    return getDocProofResult;
}

async function proveCollection(collectionName) {

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
        controlRecord
    };
}


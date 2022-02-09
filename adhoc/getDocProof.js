

let data=[];
for (let i=1;i<10;i++)  {
    data.push({_id:i,x:i});}


db.tests.insertMany(data);

sleep(5000);

db.provendb_controls.insertOne({
    "_id" : Math.round(Math.random()*1000000).toString(),
    "anchorType" : "HEDERA_MAINNET",
    "collection" : "tests",
    "op" : "submitProof",
    "startAt" : new ISODate(),
    "time" : new ISODate()
    });

sleep(5000);

db.provendb_controls.insertOne({
    "_id" : Math.round(Math.random()*10000000).toString(),
    "collection" : "tests",
    "dataId" : 7,
    "label" : "my-custom-label",
    "op" : "getDocumentProof",
    "time" : new ISODate()
});
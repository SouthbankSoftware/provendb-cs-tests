use provendb-cs-tests

var data=[];
for (let i=0;i<100;i++) {
    data.push({_id:i,x:i});
}
var collectionName='testProof'
var collection=db.getCollection(collectionName);
collection.insertMany(data);
sleep(5000);


id=Math.round(Math.random()*10000000).toString();
db.getCollection('provendb_controls').
    insertOne({
        "_id": id,
        op: "submitProof",
        anchorType: 'HEDERA',
        "time": new Date(),
        collection: collectionName
    });
sleep(30000);
var time1=new Date();


sleep(5000);
 collection.updateOne({},{$inc:{x:1}},{multi:true});
sleep(10000);
var time2=new Date();
id=Math.round(Math.random()*10000000).toString();
db.getCollection('provendb_controls').
    insertOne({
        "_id": id,
        op: "submitProof",
        anchorType: 'HEDERA',
        "time": new Date(),
        collection: collectionName
    });
sleep(30000);
var time3=new Date();




id=Math.round(Math.random()*10000000).toString();
db.provendb_controls.insertOne(
{
    _id: id,
    collection: collectionName,
    dataId: 7,
    label: 'my-custom-label',
    op: 'getDocumentProof',
    time: time1
  });


sleep(15000);

id=Math.round(Math.random()*10000000).toString();
db.provendb_controls.insertOne(
{
    _id: id,
    collection: collectionName,
    dataId: 7,
    label: 'my-custom-label',
    op: 'getDocumentProof',
    time: time2
  });
// Should be no proof 

id=Math.round(Math.random()*10000000).toString();
db.provendb_controls.insertOne(
{
    _id: id,
    collection: collectionName,
    dataId: 7,
    label: 'my-custom-label',
    op: 'getDocumentProof',
    time: time3
  });
// Should be a proof

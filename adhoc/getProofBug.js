var data=[];
for (let i=0;i<100;i++) {
    data.push({_id:i,x:i});
}
var collectionName='testProof'
var collection=db.getCollection(collectionName);
db.getCollection('provendb_controls').
    insertOne({
        "_id": controlId,
        op: "submitProof",
        anchorType: 'HEDERA',
        "time": new Date(),
        collection: collectionName
    });



 collection.insertMany(data);
 sleep(5000);
var time1=new Date();   // Should be no proof for this time
db.getCollection('provendb_controls').
    insertOne({
        "_id": controlId,
        op: "submitProof",
        anchorType: 'HEDERA',
        "time": new Date(),
        collection: collectionName
    });
var time2=new Date();  // Should be a proof now 
var dataId=7;
 collection.updateOne({_id:dataId},{$inc:{x:1}});
 sleep(5000);
 db.getCollection('provendb_controls').
 insertOne({
     "_id": controlId,
     op: "submitProof",
     anchorType: 'HEDERA',
     "time": new Date(),
     collection: collectionName
 });
 // wait to complete
 sleep(30000);
var time3=new Date();
getDocProofDoc = {
    "_id": id,
    "collection": collectionName,
    "dataId": dataId,
    "label": "my-custom-label",
    "op": "getDocumentProof",
    "time": time1
};
 
id=Math.round(Math.random()*10000000).toString();
db.provendb_controls.insertOne(
{
    _id: id,
    collection: 'getProofMulti2013018',
    dataId: 7,
    label: 'my-custom-label',
    op: 'getDocumentProof',
    time: time2
  });

  id=Math.round(Math.random()*10000000).toString();
  db.provendb_controls.insertOne(
  {
      _id: id,
      collection: 'getProofMulti2013018',
      dataId: 7,
      label: 'my-custom-label',
      op: 'getDocumentProof',
      time: time3
    });
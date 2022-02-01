for (let i=0;i<100;i++) {
    db.test2.insertOne({_id:i,x:0});
}
for (let i=1;i<=10;i++) {
    db.test2.updateMany({},{$set:{x:i}},{multi:true});
}
const CryptoJS = require('crypto-js');
const BSON = require('bson');

function getHash(doc) {
    const data = doc.toString();
    const calculatedHash = CryptoJS.SHA256(CryptoJS.enc.Base64.parse(data)).toString();
    return(calculatedHash);
}

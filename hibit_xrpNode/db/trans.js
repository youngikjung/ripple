require('./db.js');
var CONSTS = require('../const/commConsts');

var mongoose = require('mongoose');
var hibitDB = mongoose.model('hibitDB');

exports.getTrasaction = async (address, callback) => {
  await hibitDB.find({"TX_TO" : CONSTS.RIPPLE.ADDRESS, "USE_YN" : "N", "TX_TO" : address}).then(docs => {
    callback(docs);
    return true;
  }).catch(e => {
    console.log("\n!!! db find fail !!!\n"+e.message+"\n");
    return true;
  });

  await hibitDB.findAndModify({query:{"TX_TO" : CONSTS.RIPPLE.ADDRESS, "USE_YN" : "N", "TX_TO" : address}, update:{$set:{"USE_YN":"Y"}}}).then(docs => {
    console.log("*** db update success ***");
    return true;
  }).catch(e => {
    console.log("\n!!! db update fail !!!\n"+e.message+"\n");
    return true;
  });
  return true;
}

exports.setTrasaction = (TX_ID, TX_FROM, TX_TO, TX_TAG, TX_TO_VALUE, TX_FROM_VALUE) => {
  var xrpRippleDB = {
    TX_ID : TX_ID,
    TX_FROM : TX_FROM,
    TX_TO : TX_TO,
    TX_TAG : TX_TAG,
    TX_TO_VALUE : TX_TO_VALUE,
    TX_FROM_VALUE : TX_FROM_VALUE,
    USE_YN : "N"
  }

  return new Promise((resolve, reject) => {
    hibitDB.collection.insert(xrpRippleDB).then(docs => {
      console.log("\n*** db Insert success ***");
      resolve(true);
    }).catch(e => {
      console.log("\n!!! db Insert fail !!!\n"+e.message+"\n");
      resolve(true);
    });
  });
}

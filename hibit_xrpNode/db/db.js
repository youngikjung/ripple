var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;

var rippleDB = new Schema({
  TX_ID : String,
  TX_FROM : String,
  TX_TO : String,
  TX_TAG : String,
  TX_TO_value : String,
  TX_TO_VALUE : String,
  USE_YN : String
});

module.exports.hibitDB = mongoose.model('hibitDB', rippleDB);

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hibitXrpDB');

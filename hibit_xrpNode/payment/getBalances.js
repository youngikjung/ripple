const RippleAPI = require('ripple-lib').RippleAPI;
var CONSTS = require('../const/commConsts');
//server: 'ws://222.239.119.57:6006 ' // Public rippled server hosted by Ripple, Inc. 

function fnLogEvent(param, state, msg){
  var date = new Date();
  var log = {};

  log.function = "getBalance";
  log.time = date.toString().substring(0,24);
  log.parameter = {"address" : param};
  log.state = state;
  log.result = {msg};
  console.log("%j", log);
}

exports.getBalances = function(address, callback) {
  const api = new RippleAPI({
    server: CONSTS.RIPPLE.WS // Public rippled server hosted by Ripple, Inc.
  });

  api.on('error', (errorCode, errorMessage) => {
    var msg = errorCode + ' : ' + errorMessage;
    fnLogEvent(address, 'error', msg);
  });

  api.on('connected', () => {
  });

  api.on('disconnected', (code) => {
  // code - [close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent) sent by the server
  // will be 1000 if this was normal closure
  });

  api.connect().then(async () => {
    let balance = await api.getBalances(address);
    fnLogEvent(address, 'success', balance);
    callback(balance);
    return true;

  }).then(() => {
    return api.disconnect();
  }).catch(console.error);
}

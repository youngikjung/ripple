const RippleAPI = require('ripple-lib').RippleAPI;
var CONSTS = require('./const/commConsts');
//server: 'ws://222.239.119.57:6006 ' // Public rippled server hosted by Ripple, Inc. 

const api = new RippleAPI({
  server: CONSTS.RIPPLE.WS // Public rippled server hosted by Ripple, Inc.
});
api.on('error', (errorCode, errorMessage) => {
  console.log(errorCode + ': ' + errorMessage);
});
api.on('connected', () => {
  console.log('connected');
});
api.on('disconnected', (code) => {
  // code - [close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent) sent by the server
  // will be 1000 if this was normal closure
  console.log('disconnected, code:', code);
  //process.exit(0);
});
api.connect().then(async () => {

  let balacne = await api.getBalances('rNXp81JJsfCVZoKD9FzKGv6DXDeS3fLgxa');
  console.log(balacne);
  return true;

}).then(() => {
  return api.disconnect();
}).catch(console.error);


const RippleAPI = require('ripple-lib').RippleAPI;
var CONSTS = require('../const/commConsts');
var uuid = require('uuid/v4')

const fetch = require('node-fetch');

function fnLogEvent(param, state, result){
  var date = new Date();
  var log = {};

  log.function = 'sendTransaction';
  log.time = date.toString().substring(0,24);
  log.parameter = param;
  log.state = state;
  log.result = result;
  console.log("%j", log);
}

function remitInsert(remitInfo) {
    var date = new Date();

    var obj = {
        "id" : remitInfo.id,
        "exchange" : remitInfo.exchange,
        "coin" : remitInfo.coin,
        "txid" : remitInfo.txid,
        "from" : remitInfo.from,
        "to" : remitInfo.to,
        "amt" : remitInfo.amt,
        "state" : remitInfo.state,
        "message" : remitInfo.message,
        "time" : remitInfo.time,
        "core" : "core"
    }

    fetch('http://61.97.253.163:5100/remitInsert', {method : 'POST', body : JSON.stringify(obj), headers:{'Content-Type':'application/json'}})
    .catch((e)=>{
        console.log(e);
    });
}

exports.sendTrasaction = function(TX_TO,TX_TO_VALUE,TX_TAG, exchange, callback) {

  var param = {};
  param.TX_TO = TX_TO;
  param.TX_TO_VALUE = TX_TO_VALUE;
  param.TX_TAG = TX_TAG;

  var remitInfo = {};
  remitInfo.id = uuid();
  remitInfo.exchange = exchange;
  remitInfo.coin = "xrp";
  remitInfo.txid = "null";
  remitInfo.from = "rBqMDS57dh5p4eGk2jy3eH8Ai6Eu14oT9L";
  remitInfo.to = TX_TO+"_"+TX_TAG;
  remitInfo.amt = TX_TO_VALUE;
  remitInfo.state = "error";
  remitInfo.message = "null";

  const api = new RippleAPI({
    server: CONSTS.RIPPLE.WS // Public rippled server hosted by Ripple, Inc.
  });

  api.on('error', (errorCode, errorMessage) => {
    var msg = {};
    msg.errorCode = errorCode;
    msg.errorMessage = errorMessage;
    fnLogEvent(param, 'error', msg)
  });

  api.on('connected', () => {
  });

  api.connect().then(async () => { /* insert code here */

    let transcation = await api.preparePayment(CONSTS.RIPPLE.ADDRESS,  {
      "source": {
        "address": CONSTS.RIPPLE.ADDRESS, //출발지 주소 //"tag" : unsigned 32bit integer,
        "maxAmount": {
          "value": TX_TO_VALUE, //몇 개 보낼거임?
          "currency": "XRP" //돈의 단위, XRP인 경우에는 counterparty 필드를 생략해도 됩니다.
        }
      },
      "destination": {
        "address": TX_TO,
        "tag" : Number(TX_TAG),
        "amount": {
          "value": TX_TO_VALUE,
          "currency": "XRP"
        }
      }
    });

    let signedTransaction = api.sign(transcation.txJSON , 'ssuj2PPdy8eN3sFNQHjAsKkhyjc66');

    let submitResult = await api.submit(signedTransaction.signedTransaction);

    if(submitResult.resultCode == 'tesSUCCESS' ) {
      var response = "{\"result\":\""+signedTransaction.id+"\", \"code\" :\"0\", \"message\":\"\", \"id\":\""+remitInfo.id+"\" }";
      fnLogEvent(param, 'success', response);
	  remitInfo.state = "success";
      remitInfo.txid = signedTransaction.id;
      remitInsert(remitInfo);
      callback(response);
    } else {
      var response = "{\"result\":\"\", \"code\" :\"-1\", \"message\":\""+submitResult.resultMessage+"\", \"id\":\""+remitInfo.id+"\" }";
      fnLogEvent(param, 'error', response);
	  remitInfo.message = submitResult.resultMessage;
      remitInsert(remitInfo);
      callback(response);
    }
      return true;
  }).then(() => {
    return api.disconnect();
  }).catch(function(error) {
    var obj = String(error);
    if(obj.indexOf("instance.payment.destination is not exactly") > -1) {
      var response = "{\"result\":\"\", \"code\" :\"-2\", \"message\":\"instance.payment.destination is not exactly\", \"id\":\""+remitInfo.id+"\" }";
      fnLogEvent(param, 'error', response);
	  remitInfo.message = "payment destination is not exactly";
      remitInsert(remitInfo);
      callback(response);
    } else {
      var response = "{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+obj+"\", \"id\":\""+remitInfo.id+"\" }";
      fnLogEvent(param, 'error', response);
	  remitInfo.message = obj;
      remitInsert(remitInfo);
      callback(response);
    }
  });
}

var fetch = require('node-fetch');
var CONSTS = require("../const/accetInfoConst");
var uuid = require('uuid/v4')

function fnAcceptIPCHK(ip) {
//    console.log("ip test ==>"+ip);
    if(CONSTS.ACCEPT_IP.API1 == ip ||
       CONSTS.ACCEPT_IP.API2 == ip ||
       CONSTS.ACCEPT_IP.API3 == ip ||
       CONSTS.ACCEPT_IP.LAPI1 == ip ||
       CONSTS.ACCEPT_IP.LAPI2 == ip ||
       CONSTS.ACCEPT_IP.LAPI3 == ip ||
       CONSTS.ACCEPT_IP.LAPI4 == ip ||
       CONSTS.ACCEPT_IP.CME == ip ||
       CONSTS.ACCEPT_IP.XLOGIC== ip ||
       CONSTS.ACCEPT_IP.LOCAL == ip ) {
       return true;
     } else {
       return false;
     }
}

function fnGetIP(req) {
    var IPFromRequest=req.connection.remoteAddress;
    var indexOfColon = IPFromRequest.lastIndexOf(':');
    var ipv4 = IPFromRequest.substring(indexOfColon+1,IPFromRequest.length);
    return ipv4;
}

function fnLogEvent(fnName, parameter, state, result){
  var date = new Date();
  var log = {};

  log.function = fnName;
  log.time = date.toString().substring(0,24);
  log.parameter = parameter;
  log.state = state; //err || success
  log.result = result;
  console.log("%j",log);
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

function fnSendTransactionResult(err,_res,type,param, remitInfo) {
    var msg = "";
            if (err) {
				remitInfo.message = err;
                remitInsert(remitInfo)
                fnLogEvent(type,param,"error",err);
            } else if (_res.error) {
                var code = JSON.stringify(_res.error.code);
				remitInfo.message = _res.error.message;
                remitInsert(remitInfo);
                if(code == "-5") {
                    msg = '{"result":"", "code" :"-2", "message":'+JSON.stringify(_res.error)+', "id":"'+remitInfo.id+'"}';
                } else if(code == "-6") {
                    msg = '{"result":"", "code" :"-1", "message":'+JSON.stringify(_res.error)+', "id":"'+remitInfo.id+'"}';
                } else {
                    msg = '{"result":"", "code" :"-99", "message":'+JSON.stringify(_res.error)+', "id":"'+remitInfo.id+'"}';
                }
                fnLogEvent(type,param,"error",msg);
            } else {
				remitInfo.txid = JSON.stringify(_res.result);
				remitInfo.state = "success";
                remitInsert(remitInfo);
                msg = '{"result":'+JSON.stringify(_res.result)+', "code" :"0", "message":"", "id":"'+remitInfo.id+'"}';
                fnLogEvent(type,param,"success",msg);
            }
    return msg;
}

function fnCommReturnValue(err,_res,type,param) {
    var msg = "";
            if (err !== null) {
                msg = '{"result":"", "code" :"-100", "message":'+JSON.stringify(err)+'}';
                fnLogEvent(type,param,"error", msg);
            } else if (_res.error) {
                msg = '{"result":"", "code" :"-100", "message":'+JSON.stringify(_res.error)+'}';
                fnLogEvent(type,param,"error", msg);
            } else if(type == "transactionOfBlock") {
                msg = '{"result":['+_res.resArr+'], "code" :"0", "message":""}';
                fnLogEvent(type,param,"success", msg);
            }  else {
                msg = '{"result":'+JSON.stringify(_res.result+"")+', "code" :"0", "message":""}';
                fnLogEvent(type,param,"success", msg);
            }
    return msg;
}

function decoderawtransaction(result,blockNumber,time, callback) {
  var config = require('../config');
  var bitcoin_rpc = require('node-bitcoin-rpc')
  bitcoin_rpc.init(config.host, config.port, config.user, config.pass)
  bitcoin_rpc.call('decoderawtransaction', [result], function(err, _res2){
    try {
        if(err) {
            return callback(err);
        }
        var resArr = [];
        var docsAddrLength = _res2.result.vout.length;
        var k = 0;
        var addrList = function(k, docsAddrLength){
            if(k == docsAddrLength ){
                return callback(null,resArr);
            } else {
                if(_res2.result.vout[k].value > 0 && _res2.result.vout[k].scriptPubKey.type == "pubkeyhash" ) {
                    var resValue = {};
                    resValue._id = "";
                    resValue.blockNumber = blockNumber;
                    resValue.from = "";
                    resValue.hash = _res2.result.txid;

                    if(typeof(_res2.result.vout[k].scriptPubKey.addresses) == 'undefined'){
                        resValue.to = "";
                    } else {
                        resValue.to = _res2.result.vout[k].scriptPubKey.addresses[0];
                    }

                    resValue.value = _res2.result.vout[k].value;
                    resValue.timestamp = time;
                    resArr.push(JSON.stringify(resValue));
                    addrList(k+1, docsAddrLength);
                }
                else {
                    addrList(k+1, docsAddrLength);
                }
            }
        }
        addrList(k, docsAddrLength);
    } catch(e){
//        fnLogEvent("sendTransaction", param, "error", e);
        res.send("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
        res.end();
    }
  });
}

//liveCheck
const liveCheck = function(bitcoin){
    var coreChecking = coreCheck(bitcoin);
    return coreChecking;
}


//coreCheck
const coreCheck = (bitcoin) => {
    var resObj = {};
    return new Promise((resolve, reject) => {
        bitcoin.call('getblockcount', [] ,(err, _res) => {
            try{
                if(err){
                    resObj.result = "-1";
                    resObj.message = err;
                    resolve(resObj);
                } else {
                    resObj.result = "0";
                    resObj.message = _res.result;
                    resolve(resObj);
                }
            } catch(e) {
                resObj.result = "-99";
                resObj.message = e;
                resolve(resObj);
            }
        });
    });
}

module.exports = function(app, fs)
{
     app.get('/getIP', function(req,res) {
        var msg = ""
        if(!fnAcceptIPCHK(fnGetIP(req)) ) {
            res.end("비정상적인 접근입니다.");
        } else {
            res.end("정상적인 접근입니다.");
        }
     });

    app.get('/liveCheck', (req, res) => {

    	var config = require('../config');
    	var bitcoin_rpc = require('node-bitcoin-rpc');
    	bitcoin_rpc.init(config.host, config.port, config.user, config.pass);
    
    	liveCheck(bitcoin_rpc).then((_res) => {
            if(_res.result == "0"){
            	fnLogEvent("liveCheck", null, "success", JSON.stringify(_res), function(resValue){});
            	res.end(JSON.stringify(_res));
            	return true;
            } else {
            	fnLogEvent("liveCheck", null, "error", JSON.stringify(_res), function(resValue){});
            	res.end(JSON.stringify(_res));
            	return true;
            }
    	});
    });

     //__dirname 은 현재 모듈의 위치를 나타냅니다.
     //router 모듈은 router 폴더에 들어있으니, data 폴더에 접근하려면
     ///../ 를 앞부분에 붙여서 먼저 상위폴더로 접근해야합니다
    app.get('/newAccount/:account', function(req, res){
        if(!Boolean(fnAcceptIPCHK(fnGetIP(req)))) {
            res.end(JSON.stringify("비정상적인 접근입니다."));
            return true;
        }

        var config = require('../config');
        var bitcoin_rpc = require('node-bitcoin-rpc')
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass)
        var _account = req.params.account;

        var param = {};
        param.account = _account;

        bitcoin_rpc.call('getnewaddress', [_account], function (err, _res) {
          try {
            res.end(fnCommReturnValue(err,_res,'newAccount',param));
          } catch(e) {
            fnLogEvent('newAccount', param, 'error', e);
            res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
          }
        });
    });

    app.get('/getBalance/:account', function(req, res){
        if(!fnAcceptIPCHK(fnGetIP(req))) {
            res.end(JSON.stringify("비정상적인 접근입니다."));
            return true;
        }
        var config = require('../config');

        var bitcoin_rpc = require('node-bitcoin-rpc')
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass)
        var _account = req.params.account;

        var param = {};
        param.account = _account;

        if(_account == 'main') {
          bitcoin_rpc.call('getbalance', [""], function (err, _res) {
            try {
              res.end(fnCommReturnValue(err,_res,'getBalance',param));
            } catch(e) {
              fnLogEvent('getBalance', param, 'error', e);
              res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
            }
          });
        } else if(_account == 'all') {
          bitcoin_rpc.call('getbalance', [], function (err, _res) {
            try {
              res.end(fnCommReturnValue(err,_res,'getBalance',param));
            } catch(e) {
              fnLogEvent('getBalance', param, 'error', e);
              res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
            }
          });
        } else {
          bitcoin_rpc.call('getbalance', [_account], function (err, _res) {
            try {
              res.end(fnCommReturnValue(err,_res,'getBalance',param));
            } catch(e) {
              fnLogEvent('getBalance', param, 'error', e);
              res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
            }
          });
        }
    });

    app.get('/listTransactions/:account', function(req, res){
        if(!fnAcceptIPCHK(fnGetIP(req))) {
            res.end(JSON.stringify("비정상적인 접근입니다."));
            return true;
        }
        var config = require('../config');

        var bitcoin_rpc = require('node-bitcoin-rpc')
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass)
        var _account = req.params.account;

        var param = {};
        param.account = _account;

        if(_account == 'main') {
          bitcoin_rpc.call('listtransactions', [""], function (err, _res) {
            try {
              res.end(fnCommReturnValue(err,_res,'listTransactions',param));
            } catch(e) {
              fnLogEvent('listTransactions', param, 'error', e);
              res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
            }
          });
        } else {
          bitcoin_rpc.call('listtransactions', [_account], function (err, _res) {
            try {
              res.end(fnCommReturnValue(err,_res,'listTransactions',param));
            } catch(e) {
              fnLogEvent('listTransactions', param, 'error', e);
              res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
            }
          });
        }
    });


    app.post('/coinMove', function(req, res){
        if(!fnAcceptIPCHK(fnGetIP(req))) {
            res.end(JSON.stringify("비정상적인 접근입니다."));
            return true;
        }
        var _from = req.body["from"];
        var _to = req.body["to"];
        var _amt = req.body["amt"];

        var config = require('../config');

        var bitcoin_rpc = require('node-bitcoin-rpc')
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass)

        var param = {};
        param.from = _from;
        param.to = _to;
        param.amt = _amt;

        if(_to == 'main') {
          bitcoin_rpc.call('move', [_from,"",parseFloat(_amt)], function (err, _res) {
            try {
              res.end(fnCommReturnValue(err,_res,'coinMove',param));
            } catch(e) {
              nLogEvent('coinMove', param, 'error', e);
              res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
            }
          });
        } else {
          bitcoin_rpc.call('move', [_from,_to,parseFloat(_amt)], function (err, _res) {
            try {
              res.end(fnCommReturnValue(err,_res,'coinMove',param));
            } catch(e) {
              fnLogEvent('coinMove', param, 'error', e);
              res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
            }
          });
        }
    });

    app.post('/sendTransaction', function(req, res){
        if(!fnAcceptIPCHK(fnGetIP(req))) {
            res.end(JSON.stringify("비정상적인 접근입니다."));
            return true;
        }
        var _from = req.body.from;
        var _to = req.body["to"];
        var _amt = req.body["amt"];

        var param = {};
        param.from = _from;
        param.to = _to;
        param.amt = _amt;

		var remitInfo = {};
        remitInfo.id = uuid();
		remitInfo.exchange = (req.body.exchange).toLowerCase();
        remitInfo.coin = "dash";
        remitInfo.txid = "null";
        remitInfo.from = _from;
        remitInfo.to = _to;
        remitInfo.amt = _amt;
        remitInfo.state = "error";
        remitInfo.message = "null";

        var config = require('../config');

        var bitcoin_rpc = require('node-bitcoin-rpc');
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass);
		bitcoin_rpc.setTimeout(10000);

        if(_from == "main") {
            bitcoin_rpc.call('sendfrom', ["",_to,parseFloat(_amt)], function (err, _res) {
              try {
                res.end(fnSendTransactionResult(err, _res, 'sendTransaction', param, remitInfo));
              } catch(e) {
                fnLogEvent('sendTransaction', param, 'error', e);
                res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
              }
            });
        } else {
            bitcoin_rpc.call('sendfrom', [_from,_to,parseFloat(_amt)], function (err, _res) {
              try {
                res.end(fnSendTransactionResult(err, _res, 'sendTransaction', param, remitInfo));
              } catch(e) {
                fnLogEvent('sendTransaction', param, 'error', e);
                res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
              }
            });
        }
    });

    app.get('/lastBlock', function(req, res){
      if(!Boolean(fnAcceptIPCHK(fnGetIP(req)))) {
        res.end(JSON.stringify("비정상적인 접근입니다."));
        return true;
      }

      var config = require('../config');

      var bitcoin_rpc = require('node-bitcoin-rpc')
      bitcoin_rpc.init(config.host, config.port, config.user, config.pass)

      var param ={};

      bitcoin_rpc.call('getblockcount', [], function(err, docs){
        try {
            docs.result = docs.result-3;
            res.send(fnCommReturnValue(err, docs, "lastBlock", param));
            res.end();
            return true;
        } catch(e) {
            res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
            return true;
        }
      });
    });

    app.get('/transactionOfBlock/:blockNumber', function(req, res){
        var config = require('../config');
        var blockHash;

        var blockNumber = req.params.blockNumber;

        var param = {};
        param.blockNumber = blockNumber;

        var bitcoin_rpc = require('node-bitcoin-rpc');
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass);

        bitcoin_rpc.call('getblockhash',[Number(blockNumber)],function(err, _res){
          try {
            if(err){
                res.end();
                return true;
            }
            blockHash = _res.result;

            bitcoin_rpc.call('getblock',[String(blockHash)],function(err, _res){
                try{
                    var resArr = [];
                    var docs = _res.result;
                    var i = 0;

                    if(err){
                        res.send(fnCommReturnValue(err, _res, "transactionOfBlock", param));
                        res.end();
                        return true;
                    }

                    // if(err) {
                    //     res.send(JSON.stringify({"txs": resArr}));
                    //     res.end();
                    //     return true;
                    // }

                    var time = docs.time;
                    var listTx = function(docs, i) {
                        if(i == docs.tx.length){
                            res.send(fnCommReturnValue(err, {resArr}, 'transactionOfBlock', param));
                            res.end();
                            return true;
                        } else {
                            bitcoin_rpc.call('getrawtransaction',[docs.tx[i]], function(err, _res){
                              try {
                                if(err){
                                    res.end();
                                    return true;
                                }else {
                                    if(_res.result == null) {
                                        bitcoin_rpc.call('gettransaction',[docs.tx[i]], function(err, __res){
                                          try {
                                            if(err) {
                                                listTx(docs, i+1);
                                            }
                                            if( __res == null) {
                                                listTx(docs, i+1);
                                            } else if(!__res.error) {
                                                decoderawtransaction(__res.result.hex,blockNumber,time, function(err, resValue) {
                                                  try {
                                                    if(err) {
                                                        listTx(docs, i+1);
                                                    } else {
                                                        resArr = resArr.concat(resValue);
                                                        listTx(docs, i+1);
                                                    }
                                                  } catch(e4) {
                                                    fnLogEvent("transactionOfBlock", param, "error", e4);
                                                    res.send("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e4+"\" }");
                                                    res.end();
                                                  }
                                                });
                                            } else {
                                                listTx(docs, i+1);
                                            }
                                          } catch(e3) {
                                            fnLogEvent("transactionOfBlock", param, "error", e3);
                                            res.send("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e3+"\" }");
                                            res.end();
                                          }
                                        });
                                    }

                                    else {
                                        decoderawtransaction(_res.result,blockNumber,time, function(err, resValue) {
                                          try {
                                            if(err) {
                                                listTx(docs, i+1);
                                            } else {
                                                resArr = resArr.concat(resValue);
                                                listTx(docs, i+1);
                                            }
                                          } catch(e3) {
                                            fnLogEvent("transactionOfBlock", param, "error", e3);
                                            res.send("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e3+"\" }");
                                            res.end();
                                          }
                                        });
                                    }
                                }
                              } catch(e2){
                                fnLogEvent("transactionOfBlock", param, "error", e2);
                                res.send("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e2+"\" }");
                                res.end();
                              }
                            });
                        }
                    }
                    listTx(docs, i);
                }catch(e1){
                    fnLogEvent("transactionOfBlock", param, "error", e1);
                    res.send("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e1+"\" }");
                    res.end();
                }
            });
          } catch(e) {
            fnLogEvent("transactionOfBlock", param, "error", e);
            res.send("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
            res.end();
          }
        });
    });

    app.get('/feeCheck/:tx', (req, res) => {
        var tx = req.params.tx;

        var config = require('../config');
        var bitcoin_rpc = require('node-bitcoin-rpc')
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass);

        var param = {};
        param.txid = tx;

        bitcoin_rpc.call('gettransaction', [tx], (err, docs) => {
            try {
                if(err) {
                    fnLogEvent('feeCheck', param, 'error', err);
                    res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+err+"\" }");
                } else {
                    var fee = String(docs.result.fee);
                    fee = fee.replace('-', "");
                    fnLogEvent('feeCheck', param, 'success', "{\"result\":\""+ fee +"\", \"code\" :\"0\", \"message\":\"\" }");
                    res.end("{\"result\":\""+ fee +"\", \"code\" :\"0\", \"message\":\"\" }");
                }
            } catch(e) {
                fnLogEvent('feeCheck', param, 'error', e);
                res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
            }
        });

    });
}

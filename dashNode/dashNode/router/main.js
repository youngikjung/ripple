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
            } else if(type == "transactionOfBlock" || type == "unconfirmTx") {
                msg = '{"result":['+_res.resArr+'], "code" :"0", "message":""}';
                fnLogEvent(type,param,"success", msg);
            }  else {
                msg = '{"result":'+JSON.stringify(_res.result+"")+', "code" :"0", "message":""}';
                fnLogEvent(type,param,"success", msg);
            }
    return msg;
}

var getblockhash = (blockNumber) => {
	var config = require('../config');
    var bitcoin_rpc = require('node-bitcoin-rpc');
    bitcoin_rpc.init(config.host, config.port, config.user, config.pass);
    return new Promise((resolve, reject) => {
        bitcoin_rpc.call('getblockhash', [Number(blockNumber)], (err, res) => {
            //console.log('getblockhash : ' + JSON.stringify(res));
            if(err){
                reject(err);
            }else{
                resolve(res.result);
            }
        });
    });
}

var getTxids = (blockhash) => {
	var config = require('../config');
    var bitcoin_rpc = require('node-bitcoin-rpc');
    bitcoin_rpc.init(config.host, config.port, config.user, config.pass);
    return new Promise((resolve, reject) => {
        bitcoin_rpc.call('getblock', [blockhash], (err, res) => {
                //console.log('getblock : ' + JSON.stringify(res));
                var resArr = [];
                if(err){
                    reject(err);
                }else{
                    resolve(res.result.tx);
                }
        });

    });
}

var getrawtransaction = (txid) => {
	var config = require('../config');
    var bitcoin_rpc = require('node-bitcoin-rpc');
    bitcoin_rpc.init(config.host, config.port, config.user, config.pass);
    return new Promise((resolve, reject) => {
        bitcoin_rpc.call('getrawtransaction', [txid], function(err, res) {
            //console.log('getrawtransaction : ' + JSON.stringify(res));
            if(err){
                reject(err);
            }else{
                resolve(res.result);
            }
        });
    });
}

var decoderawtransaction = (decode) => {
	var config = require('../config');
   var bitcoin_rpc = require('node-bitcoin-rpc');
    bitcoin_rpc.init(config.host, config.port, config.user, config.pass);

    return new Promise((resolve, reject) => {
        bitcoin_rpc.call('decoderawtransaction', [decode], function(err, res) {
            if(err){
                reject(err);
            }else{
                var values = {};
                var txid = res.result.txid;
                var outs = res.result.vout;
                values.txid = txid;
                values.outs = outs;
                resolve(values);
            }
        });
    });
}

var pushResArr = (txid, out, resArr) => {
    return new Promise((resolve, reject) => {
        var resVal = {};
        resVal.hash = JSON.stringify(txid);
        resVal.value = JSON.stringify(out.value);
        //console.log('out.scriptPubKey : ' + JSON.stringify(out.scriptPubKey.addresses));
        if(out.scriptPubKey != undefined && out.scriptPubKey.addresses != undefined) {
            resVal.to = out.scriptPubKey.addresses[0];
            resArr.push(JSON.stringify(resVal));
        }
        resolve(resArr);
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

    app.get('/isAddr/:addr', function(req,res) {
         if(!fnAcceptIPCHK(fnGetIP(req)) ) {
            fnLogEvent("getIP","{}","disconnct",fnAcceptIPCHK(fnGetIP(req)));
            res.end("비정상적인 접근입니다.");
        } else {
            var WAValidator = require('wallet-address-validator');
            var _addr = req.params.addr;
            var valid = WAValidator.validate(_addr, 'DASH');
            if(valid) {
                console.log('This is a valid address');
                res.end('{"result":"0", "code" :"0", "message":"This is a valid address"}');
            } else {
                console.log('Address INVALID');
                res.end('{"result":"-2", "code" :"-2", "message":"Address INVALID"}');
            }
        //      res.end('{"result":'+JSON.stringify(_res.result)+', "code" :"0", "message":""}');
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
    // 2019-01-30 add function   by.kiseokPark
	app.get('/unconfirmLastBlock', (req, res) => {
        if(!Boolean(fnAcceptIPCHK(fnGetIP(req)))) {
            res.end(JSON.stringify("비정상적인 접근입니다."));
            return true;
        }

        var config = require('../config');
        var bitcoin_rpc = require('node-bitcoin-rpc')
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass);

        var param = {};

        bitcoin_rpc.call('getblockcount', [], function(err, docs){
            try{
                docs.result = Number(docs.result);
                res.end(fnCommReturnValue(err, docs, "unconfirmLastBlock", param));
                return true;
            } catch(e) {
                res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
                return true;
            }
        });
    });

    // 2019-01-30 add function   by.kiseokPark
	app.get('/unconfirmTx/:blockNumber', async (req, res) => {
        try{
            var resArr = [];
            var blockNumber = req.params.blockNumber;
            var blockHash = await getblockhash(blockNumber).catch(e => {
                throw e;
            });
            var txids = await getTxids(blockHash).catch(e => {
                throw e;                
            });

            for(var i = 0; i < txids.length; i++) {
                var decode = await getrawtransaction(txids[i]).catch(e => {
                    throw e;
                });
                var values = await decoderawtransaction(decode).catch(e => {
                    throw e;
                });
                for(var j = 0; j < values.outs.length; j++) {
                    resArr = await pushResArr(values.txid, values.outs[j], resArr);
                }
            }
            res.end(fnCommReturnValue(null, {resArr}, "unconfirmTx", blockNumber));
            return true;
        }catch(e){
            res.end(fnCommReturnValue(e, null, "unconfirmTx", blockNumber));
            return true;
        }
   });
   // 2019-01-30 add function   by.kiseokPark
    app.get('/transactionOfBlock/:blockNumber', async (req, res) => {
        try{
            var resArr = [];
            var blockNumber = req.params.blockNumber;
            var blockHash = await getblockhash(blockNumber).catch(e => {
                throw e;
            });
            var txids = await getTxids(blockHash).catch(e => {
                throw e;
            });

            for(var i = 0; i < txids.length; i++) {
                var decode = await getrawtransaction(txids[i]).catch(e => {
                    throw e;
                });
                var values = await decoderawtransaction(decode).catch(e => {
                    throw e;
                });
                for(var j = 0; j < values.outs.length; j++) {
                    resArr = await pushResArr(values.txid, values.outs[j], resArr);
                }
            }
            res.end(fnCommReturnValue(null, {resArr}, "transactionOfBlock", blockNumber));
            return true;
        }catch(e){
            res.end(fnCommReturnValue(e, null, "transactionOfBlock", blockNumber));
            return true;
        }
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


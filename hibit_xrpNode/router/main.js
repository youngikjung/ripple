var fetch = require('node-fetch');

function fnLogEvent(name, param, state, result){
  var date = new Date();
  var log = {}

  log.function = name;
  log.time = date.toString().substring(0,24);
  log.parameter = param;
  log.state = state;
  log.result = {result};
  console.log("%j", log);
}
/*
function sendInsert(category, market, core, fnName, from, to, amt, state, result, error) {
    var date = new Date();

    var obj = {
        "category" : category,
        "market" : market,
        "core" : core,
        "function" : fnName,
        "from" : from,
        "to" : to,
        "amt" : amt,
        "state" : state,
        "result" : result,
        "error" : error
    }

    fetch('http://10.10.0.59:3100/sendTxInsert', {method : 'POST', body : JSON.stringify(obj), headers:{'Content-Type':'application/json'}}).catch((e)=>{
        console.log(e);
    });
}
*/
module.exports = function(app){
    app.get('/getTransaction/:address', function(req, res){
        var trans = require('../db/trans.js');
        var _address = req.params.address;

        var param = {};
        param.address = _address;

        trans.getTrasaction(_address, function(data) {
          try {
            var param = {}
            param.address = _address;

            fnLogEvent('getTransaction', param, 'success', data);
            res.end( JSON.stringify(data) );
          } catch(e) {
            fnLogEvent('getTransaction', param, 'error', e);
            res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
          }
        });
    });

    app.get('/getBalance/:address', function(req, res){
        var trans = require('../payment/getBalances.js');
        var _address = req.params.address;

        var param = {};
        param.address = _address;

        trans.getBalances(_address, function(data) {
          try {
	    var msg = "{\"result\":"+JSON.stringify(data[0].value)+", \"code\" :\"0\", \"message\":\"\" }";
            res.end(msg+"");
          } catch(e) {
            fnLogEvent('getBalance', param, 'error', e);
            res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
          }
        });
    });

    app.post('/sendTransaction', function(req, res){
        var trans = require('../payment/sendPayment.js');

        var _to = req.body.to;
        var _amt = req.body.amt;
        var _tag = req.body.tag;
	var exchange = (req.body.exchange).toLowerCase();

        var param = {};
        param.to = _to;
        param.amt = _amt;
        param.tag = _tag;

        trans.sendTrasaction(_to, _amt, _tag, exchange, function(data) {
          try {
            res.end( JSON.stringify(data) );
          } catch(e) {
            fnLogEvent("sendTransaction", param, 'error', e);
            res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
          }
        });
    });

    app.get('/feeCheck/:tx', function(req, res){
	try {
	    var tx = req.params.tx;

	    var param ={};
	    param.txid = tx;

	    fnLogEvent('feeCheck', param, 'success', "0,000012");
	    res.end("{\"result\":\""+0.000012+"\", \"code\" :\"0\", \"message\":\"\" }");
	} catch(e) {
	    fnLogEvent('feeCheck', param, 'success', e);
            res.end("{\"result\":\"\", \"code\" :\"-99\", \"message\":\""+e+"\" }");
	}
    });
}

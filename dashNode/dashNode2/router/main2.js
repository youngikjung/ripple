function fnCommReturnValue(err, _res, type) {
    var msg = "";
    if (err !== null) {
        msg = JSON.stringify(err);
        console.log(type + ' err :( ' + err)
    } else if (_res.error) {
        console.log(type + ' error :( ' + err + ' ' + _res.error)
        msg = JSON.stringify(_res.error);
    } else {
        msg = JSON.stringify(_res.result);
        console.log(type + ' success ::' + JSON.stringify(_res.result))
    }
    return msg;

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


module.exports = function (app, fs) {

    app.get('/liveCheck', (req, res) => {

        var config = require('../config');
        var bitcoin_rpc = require('node-bitcoin-rpc');
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass);

        liveCheck(bitcoin_rpc).then((_res) => {
            if(_res.result == "0"){
                res.end(JSON.stringify(_res));
                return true;
            } else {
                res.end(JSON.stringify(_res));
                return true;
            }
        });
    });

    app.get('/getBalance/:account', function (req, res) {
        // if (!fnAcceptIPCHK(fnGetIP(req))) {
        //     res.end(JSON.stringify("비정상적인 접근입니다."));
        // }
        var config = require('../config2');

        var bitcoin_rpc = require('node-bitcoin-rpc')
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass)
        var _account = req.params.account;

        if (_account == 'main') {
            bitcoin_rpc.call('getbalance', [""], function (err, _res) {
                res.end(fnCommReturnValue(err, _res, 'main balance'));
            });
        } else if(_account == 'all') {
            bitcoin_rpc.call('getbalance', [], function (err, _res) {
                res.end(fnCommReturnValue(err, _res, 'all balance'));
            });
        }else {
            bitcoin_rpc.call('getbalance', [_account], function (err, _res) {
                res.end(fnCommReturnValue(err, _res, 'balance'));
            });
        }
    });

}

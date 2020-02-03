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

module.exports = function (app, fs) {
/*
    app.use(function (req, res, next) {
        res.setTimeout(10, function () {
            console.log('Request has timed out.');

            const exec = require('child_process').exec;
            const testscript = exec('sh restart.sh /home/node2/');

            testscript.stdout.on('data', function (data) {
                console.log(data);
                // sendBackInfo();
            });

            testscript.stderr.on('data', function (data) {
                console.log(data);
                // triggerErrorStuff();
            });
        });

        next();
    });
*/
    app.get('/liveCheck', (req, res) => {
        var liveCheck = require('../utils/liveCheck.js');

    var config = require('../config');
        var bitcoin_rpc = require('node-bitcoin-rpc');
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass);

        liveCheck.liveCheck(bitcoin_rpc).then((_res) => {
            if(_res.result == "0"){
				console.log(JSON.stringify(_res))
                res.end(JSON.stringify(_res));
                return true;
            } else {
				console.log(JSON.stringify(_res));
                res.end(JSON.stringify(_res));
                return true;
            }
        });
    });


    app.get('/getBalance/:account', function (req, res) {

        var config = require('../config2');

        var bitcoin_rpc = require('node-bitcoin-rpc')
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass)
        var _account = req.params.account;

        if (_account == 'main') {
            bitcoin_rpc.call('getbalance', [""], function (err, _res) {
                res.end(fnCommReturnValue(err, _res, 'main balance'));
            });
        } else if (_account == 'all') {
            bitcoin_rpc.call('getbalance', [], function (err, _res) {
	      res.end("{\"result\":\""+JSON.stringify(_res.result)+"\", \"code\" :\"0\", \"message\":\"\" }");
            });
        } else {
            bitcoin_rpc.call('getbalance', [_account], function (err, _res) {
                res.end(fnCommReturnValue(err, _res, 'balance'));
            });
        }
    });
    
    app.get('/listaccounts', function (req, res) {

        var config = require('../config2');

        var bitcoin_rpc = require('node-bitcoin-rpc')
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass)
        bitcoin_rpc.call('listaccounts', [], function (err, _res) {
            console.log(JSON.stringify(_res));
			res.end(_res);
        });
    });
/*
    app.get('/restart/', function (req, res) {
        const exec = require('child_process').exec;
        const testscript = exec('sh restart.sh /home/node2/');

        testscript.stdout.on('data', function (data) {
            console.log(data);
            // sendBackInfo();
        });

        testscript.stderr.on('data', function (data) {
            console.log(data);
            // triggerErrorStuff();
        });
    });
*/
}

const Promise = require('bluebird');
const fetch = require('node-fetch');

//liveCheck
exports.liveCheck = async (bitcoin) => {
    var coreChecking = await coreCheck(bitcoin);
    return coreChecking;
}

//coreCheck
const coreCheck = async (bitcoin) => {
    var exApi = await preCoreCheck().catch(e => {console.log(e)});
    var resObj = {};

    return new Promise((resolve, reject) => {
        bitcoin.call('getblockcount', [] ,(err, _res) => {
            try{
                if(err){
                    resObj.result = "-1";
                    resObj.message = err;
                    resolve(resObj);
                } else {
                    var blockGap = exApi-_res.result;
                    if(blockGap<=10){
                        resObj.result = "0";
                        resObj.message = _res.result;
                        resolve(resObj);
                    } else {
                        resObj.result = "-3";
                        resObj.message = "external api and core blockGap is too hight. blockGap is :: "+blockGap;
                        resolve(resObj);
                    }
                }
            } catch(e) {
                resObj.result = "-99";
                resObj.message = e;
                resolve(resObj);
            }
        });
    });
}

const preCoreCheck = () => {
    return new Promise((resolve, reject) => {
        fetch('https://chain.api.btc.com/v3/block/latest',{method:'GET'}).then( res => {
           return res.json();
        }).then(_res => {
            resolve(_res.data.height);
        }).catch((e)=>{
	    	reject(e);
        });
    });
}


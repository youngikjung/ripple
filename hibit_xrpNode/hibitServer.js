WebSocket = require('ws')
Payment = require('./payment/payment')
var CONSTS = require('./const/commConsts');


function readJSONResponse(response) {
  var responseData = '';
  console.log("readJSONResponse call1");
  response.on('data', function (chunk) {
    responseData += chunk;
  });
  console.log("readJSONResponse call2");
  response.on('end', function () {
    var dataObj = JSON.parse(responseData);
    console.log("Raw Response: " +responseData);
  });
}

websocket = new WebSocket(CONSTS.RIPPLE.WS)
desiredMessage = '{"command":"subscribe","id":0,"accounts":["'+CONSTS.RIPPLE.ADDRESS+'"]}'
function connect() {
  websocket.on('open', function() {
   console.log('connected to the Ripple Payment Network')
   websocket.send(desiredMessage)
  })

  websocket.on('message', function(message) {
    console.log("message --> " + message)
    try {
      payment = new Payment(message);
      console.log(payment.toJSON());

      //DB INSERT
      var obj = payment.toJSON();
      var trans = require('./db/trans.js');
      trans.setTrasaction(obj.txHash,obj.fromAddress,obj.toAddress,obj.destinationTag,obj.toAmount,obj.fromAmount);

    } catch (err) {
      console.log(err);
    }
  })

  websocket.on('close',function(){
    connect();
  })
}

connect();

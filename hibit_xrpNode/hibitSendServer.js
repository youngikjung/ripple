var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');


var server = app.listen(3200,'10.10.20.77', function(){
 console.log("Express server has started on port 3200")
});

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var router = require('./router/main')(app);

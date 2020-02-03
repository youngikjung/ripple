function define(name, value) {
    Object.defineProperty(exports, name, {
        value: value,
        enumerable : true,
    });
}

define("RIPPLE", {"ADDRESS": "rBqMDS57dh5p4eGk2jy3eH8Ai6Eu14oT9L","WS":"ws://localhost:6006"});

//example
//function define(name, value) {
//    Object.defineProperty(exports, name, {
//        value: value,
//        enumerable : true,
//    });
//}

//공통 상수 정의를 사용하는 route js
//define("OFFICE_TYPE", {"PERSONAL": "P", "TOTAL":"T", "GOVERNMENT":"G"});
//define("MEMBER_TYPE", {"PERSONAL": "B", "OFFICE": "C"});

//var CONSTS = require('./consts');

//router.get('/loginb', function(req, res, next) {
//    res.render('./member/login', {
//        logintype: CONSTS.MEMBER_TYPE.PERSONAL});
//});

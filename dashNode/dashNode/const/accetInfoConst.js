function define(name, value) {
    Object.defineProperty(exports, name, {
        value: value,
        enumerable : true,
    });
}

//define("ACCEPT_IP", {"CME":"1.223.21.114", "API1": "222.239.218.109", "API2":"222.239.218.110", "API3":"222.239.218.111", "LAPI1": "10.10.0.109", "LAPI2":"10.10.0.110", "LAPI3":"10.10.0.111" });
define("ACCEPT_IP", {"CME":"222.239.218.126", "API1": "10.10.20.66", "API2":"180.70.92.6", "API3":"180.70.92.7", "LAPI1":"10.10.20.80" , "LAPI2":"10.10.20.81" , "LAPI3":"10.10.0.7",  "LAPI4":"10.10.0.120","XLOGIC":"10.10.0.225","LOCAL":"10.10.20.69"});

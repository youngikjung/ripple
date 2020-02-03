const RippleAPI = require('ripple-lib').RippleAPI;
const api = new RippleAPI();
const address = api.generateAddress();
console.log(address);


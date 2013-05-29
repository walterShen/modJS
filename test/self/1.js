define('self/1.js', function(require, exports, module){
//------------------------------------------------------------

exports.test = function() {
	return mod.val;
};

exports.val = 123;

var mod = require('self/1.js');

//------------------------------------------------------------
});

var require, define;
(function(self) {
    var modules = {};

    require = function(name){
        var mod = modules[name], msg;
        if (!mod) {
            msg = 'Requiring unknown module "' + name + '"';
            throw new Error(msg);
        }
        if (mod.hasError){
            throw new Error('Requiring module "' + name + '" which threw an exception');
        }
        if (!mod.defined) {//避免循环调用
            var exp = mod.exports = {}, fac = mod.factory;
            if (Object.prototype.toString.call(fac) === '[object Function]') {
                var ret, args = [];
                try {
                    mod.defined = true;
                    ret = fac.call(self, require, exp, mod);
                } catch (err) {
                    mod.hasError = true;
                    throw err;
                }
                if (ret) mod.exports = ret;
            } else{
                mod.exports = fac;
            }
        }
        return mod.exports;
    }

    define = function (name, factory) {
        var mod = {
            id: name,
            factory: factory
        }

        modules[name] = mod;
    };

    define.amd = {
        'jQuery': true,
        'version' : '1.0.0'
    };
})(this);

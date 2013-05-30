var require, define;
(function(self) {
    var modules = {},//模块
        asyncCallbacks = [],//异步调用回调
        asyncResources = {},//异步模块信息
        asyncMap = {};//打包信息

    // 1 - 加载模块
    // 2 - 模块加载回来
    // 3 - 模块和依赖都已经加载完成准备初始化
    // 4 - 模块初始化进行中
    // 5 - 模块初始化完成
    var STATUS_FETCHING = 1;
    var STATUS_SAVED = 2;
    var STATUS_LOADED = 3;
    var STATUS_EXECUTING = 4;
    var STATUS_EXECUTED = 5;

    function hasProp(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }

    function isType(type) {
        return function(obj) {
            return Object.prototype.toString.call(obj) === "[object " + type + "]"
        }
    }
    var isString = isType("String");
    var isArray = Array.isArray || isType("Array");
    var isFunction = isType("Function");

    function forEach(o, fn) {
        if(isArray(o)) {
            var i, l = o.length;
            for(i = 0; i < l; i++) {
                if(fn.call(o[i], o[i], i) === false) {
                    return;
                }
            }
        } else {
            for(var i in o) {
                if(hasProp(o, i)) {
                    if(fn.call(o[i], o[i], i) === false) {
                        return;
                    }
                }
            }
        }
        return true;
    }

    function indexOf(arr, item) {
        if(Array.prototype.indexOf) {
            return arr.indexOf(item);
        }

        for(var i = 0, len = arr.length; i < len; i++) {
            if(arr[i] === item) {
                return i;
            }
        }
        return -1;
    }


    //获取模块
    function get(id) {
        var mod = modules[id];
        if(!mod){
            mod = modules[id] = {
                id: id, 
                status: 0,
                deps: asyncResources[id] ? asyncResources[id].deps : [] 
            };
        }
        return mod;
    }

    //检查模块依赖是否加载完成，如果未完成则触发加载
    function check(mod, track) {
        if (isString(mod)) {
            mod = get(mod);
        }
        if(mod.status == STATUS_EXECUTED){
            return true;
        }

        var flag = true;
        track = track || [];
        if(mod.id){
            track.push(mod.id);
        }

        if(mod.status == 0){//加载模块
            mod.status = STATUS_FETCHING;
            inject(mod.id);
            flag = false;
        }else if(mod.status == STATUS_FETCHING){
            flag = false;
        }
        forEach(mod.deps, function(id){
            if(indexOf(track, id) < 0){//避免循环调用
                flag = check(get(id), track) && flag;
            }               
        });
        return flag;
    }

    //检查队列中模块依赖是否都已经加载
    function checkAll() {
        forEach(asyncCallbacks, function(mod, i){
            if (mod && check(mod)) {
                mod.status = STATUS_LOADED;
                exec(mod);
                delete asyncCallbacks[i];
            }
        })
    }

    //初始化模块
    function exec(mod) {
        var msg;
        if (mod.status != STATUS_EXECUTING && mod.status != STATUS_EXECUTED) {
            var exp = mod.exports = {}, fac = mod.factory;
            if (isFunction(fac)) {
                var ret, args = [];
                mod.status = STATUS_EXECUTING;
                if(mod.async){//初始化异步加载回调
                    forEach(mod.deps, function(id){
                        args.push(exec(get(id)));
                    });
                    ret = fac.apply(self, args);
                }else{//初始化模块factory
                    ret = fac.call(mod, require, exp, mod);
                }
                if (ret) mod.exports = ret;
            } else{
                mod.exports = fac;
            }
            mod.status = STATUS_EXECUTED;
        }
        return mod.exports;
    }

    function inject(id) {
        var head = document.getElementsByTagName('head')[0],
            script = document.createElement("script");

        script.async = true;
        script.type = 'text/javascript';
        script.src =  asyncResources[id] ? (asyncResources[id]['pkg'] || asyncResources[id]['url'] || id) : id;

        script.onload = script.onerror = script.onreadystatechange = function (evt) {
            if ((!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                script.onload = script.onerror = script.onreadystatechange = null;
                script.parentNode && head.removeChild(script);
                script = undefined;
                checkAll();
            }
        };
        head.insertBefore(script, head.firstChild);
    }

    require = function(name){
        var mod = get(name);
        return exec(mod);
    }

    define = function (name, factory) {
        var mod = get(name);
        mod.factory = factory;
        mod.status = STATUS_SAVED;
    };

    require.async = function(deps, callback){
        var asyncModule = {
            factory: callback,
            deps: isString(deps) ? [deps] : deps,
            async: true,
            status: STATUS_SAVED
        };
        
        if(check(asyncModule)){
            exec(asyncModule);
        }else{
            asyncCallbacks.push(asyncModule);
        }
    }

    require.resourceMap = function(obj) {
        if(obj['res']){
            forEach(obj['res'], function(value, key){
                asyncResources[key] = value;
            })
        }
        if(obj['pkg']){
            forEach(obj['pkg'], function(value, key){
                asyncMap[key] = value;
            })
        }
    };

    define.amd = {
        'jQuery': true,
        'version' : '1.0.0'
    };
})(this);

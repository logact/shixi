window.NeptuneHttp = {
    ajax: function () {
        var arr = _.toArray(arguments);
        var cfg = {
            type: 'get',
            dataType: 'json',
            cache: false
        };
        _.extend(cfg, arr[0]);
        arr.shift();

        var flag = true;
        if (arr && arr.length) {
            flag = _.last(arr);
            if (flag === false) {
                arr.pop();
            }
            var data = _.last(arr);
            if (_.isObject(data)) {
                cfg.data = arr.pop();
            }
        }

        cfg.url = cynovan.c_path + '/' + arr.join('/');
        if (flag === false) {
            cfg.exec = function () {
                return $.ajax(cfg);
            };
            return cfg;
        }
        return $.ajax(cfg);
    },
    get: function () {
        var arr = _.toArray(arguments);
        arr.unshift({
            type: 'get'
        });
        return this.ajax.apply(null, arr);
    },
    post: function () {
        var arr = _.toArray(arguments);
        arr.unshift({
            type: 'post'
        });
        return this.ajax.apply(null, arr);
    }
};


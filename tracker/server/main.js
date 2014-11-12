'use strict';

var express = require('express');
var http = require('http');
var _ = require('lodash');


var app = express();
var execute = require('../execute');
var calandar = require('../calendar');
var extend = require('node.extend');
var stat  = require('./components/stat');
var Param = require('../param');
var logAttr = require('./components/logAttribute');
var Search = require('../search/search');
var Moment = require('moment');

app.get('/actions/:actionName', function(req, res) {
    var actionName = req.params.actionName;
    execute.exec('ltt action ' + actionName + ' --cups 1');
    res.send('done');
});

useHandler('calendars', '/:type/:year/:month?/:day?', calandar);
useHandler('stats', '/:year?/:month?/:day?', stat);
useHandler('sleepPeriods');
useHandler('classes', null, getLogAttr);
useHandler('projects', null, getLogAttr);
useHandler('tags', null, getLogAttr);
useHandler('logs', null, queryLogs);

function getLogAttr(params, type) {
    return logAttr.get(type, params);
}

function queryLogs(params) {
    return Search.query(params);
}

function useHandler(type, url, handler) {
    handler = handler || require('./components/' + type);
    url = url || '/:year/:month?/:day?';
    app.get('/' + type + url, function(req, res) {
        var params = getCommonRequestParams(req.params, req.query);
        var promise;
        try {
            if (_.isFunction(handler)) {
                promise = handler(params, type);
            } else {
                promise = handler.generate(params);
            }
        } catch (e) {
            res.status(500).send({msg: 'Server Error', err: e.message});
        }
        promise.then(function(result) {
            res.send(result);
        }).catch(function(err) {
            console.error(err.stack || err);
            res.status(500).send({msg: 'Server Error'});
        });
    });
}

exports.run = function(options) {
    var port = options.port || 3333;
    http.createServer(app).listen(port, function() {
        console.log("Server listening on port " + port);
    });
};


function getCommonRequestParams(params, query) {
    var dateStr = [
        params.year,
        params.month,
        params.day
    ].filter(function(val) {
        return !!val;
    }).join('-');
    preprocessQuery(query, ['projects', 'tags', 'classes', 'versions', 'tasks']);
    var dateParams = {};
    if (dateStr) {
        dateParams = Param.getDateParams(dateStr);
    } else {
        if (query.start && query.end) {
            dateStr = [
                new Moment(query.start).format('YYYY-MM-DD'),
                new Moment(query.end).format('YYYY-MM-DD')
            ].join('~');
        }
        dateParams = Param.getDateParams(dateStr);
    }

    return extend({}, {
        type: params.type
    }, dateParams, query);

    function preprocessQuery(query, attrs) {
        if (_.isEmpty(attrs)) {
            attrs = [];
        }
        Object.keys(query).forEach(function (key) {
            if (attrs.indexOf(key) >= 0) {
                var val = query[key],
                    arr = !val ? [] : val.split(',');
                query[key] = arr;
            }
        });
    }
}

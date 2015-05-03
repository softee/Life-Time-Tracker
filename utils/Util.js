'use strict';
var Moment = require('moment');
var TrackerHelper = require('tracker/helper');
var _ = require('lodash');

function walkTree(parentElement, func) {
    parentElement.depth = 0;
    parentElement.next = null;
    var children, i, len, child;
    var depth, current;
    current = parentElement;
    while (current) {
        depth = current.depth;
        children = current.children;
        var done = func(current);
        if (done === false) {
            return;
        }
        //removes this item from the linked list
        current = current.next;
        for (i = 0, len = children ? children.length : 0; i < len; i++) {
            child = children[i];
            child.depth = depth + 1;
            //place new item at the head of the list
            child.next = current;
            current = child;
        }
    }
}

function toDate(type) {
    var params = {};
    if (type === 'yesterday') {
        params.start = new Moment().subtract(1, 'day').startOf('day').toDate();
        params.end = new Moment().subtract(1, 'day').endOf('day').toDate();
    } else if (type === 'weekly' || type === 'week') {
        params.start = new Moment().startOf('week').toDate();
        params.end = new Moment().endOf('week').toDate();
    } else if ( type === 'today' || type === 'day') {
        params.start = new Moment().startOf('day').toDate();
        params.end = new Moment().endOf('day').toDate();
    } else if ( type === 'monthly' || type === 'month') {
        params.start = new Moment().startOf('month').toDate();
        params.end = new Moment().endOf('month').toDate();
    } else if ( type === 'last_seven_day') {
        params.start = new Moment().subtract(7, 'day').startOf('day').toDate();
        params.end = new Moment().endOf('day').toDate();
    } else if ( type === 'last_three_day') {
        params.start = new Moment().subtract(3, 'day').startOf('day').toDate();
        params.end = new Moment().endOf('day').toDate();
    } else if (type === 'last_month') {
        params.start = new Moment().subtract(1, 'month').startOf('day').toDate();
        params.end = new Moment().endOf('day').toDate();
    }
    return params;
}


function genId(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ ) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

function getUrlFromTask(task) {
    var url;
    if (!task) {return;}
    if (task.versionId) {
        url = '/projects/' + task.projectId + '/versions/' + task.versionId + '/tasks/' + task._id;
    } else {
        url = '/projects/' + task.projectId + '/tasks/' + task._id;
    }
    return url;
}




exports.walkTree = walkTree;
exports.toDate = toDate;
exports.genId = genId;
exports.getUrlFromTask = getUrlFromTask;
exports.checkLogContent = function (date, content) {
    var includeErrorInfo = true;
    var includeLogWithoutTime = false;
    var result = TrackerHelper.getLogs(content, date, includeLogWithoutTime, includeErrorInfo);
    var logSequenceError = TrackerHelper.getLogSequenceError(result.logs);
    result.errors = result.errors.concat(logSequenceError);
    return result;
};


exports.isValidLog = function (log) {
    return TrackerHelper.isValidLog(log);
};


exports.getDoingLog = function (date, logContent) {
    var logs, target;
    try {
        logs = TrackerHelper.getLogs(logContent, date);
        target = _.find(logs, function (log) {
            var timeStr = TrackerHelper.getTimeStr(log.origin);
            if (timeStr && timeStr.indexOf('~') >= 0) {
                var time = TrackerHelper.getTimeSpan(log.origin, {date: date, patchEnd: false});
                return time.start && !time.end;
            } else {
                return false;
            }
        });
    } catch (err) {
        console.error(err.stack);
        return null;
    }
    return target;
};
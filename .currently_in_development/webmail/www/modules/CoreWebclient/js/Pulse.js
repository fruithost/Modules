'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	moment = require('moment'),
	
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	aEveryMinuteFunctions = [],
	aDayOfMonthFunctions = [],
	koNowDayOfMonth = ko.observable(moment().date()),
	
	aWakeupFunctions = [],
	oLastCheck = moment()
;

window.setInterval(function () {
	_.each(aEveryMinuteFunctions, function (fEveryMinute) {
		fEveryMinute();
	});
	
	koNowDayOfMonth(moment().date());
	
	if (moment().diff(oLastCheck, 'minute') > 2)
	{
		_.each(aWakeupFunctions, function (fWakeup) {
			fWakeup();
		});
	}
	oLastCheck = moment();
}, 1000 * 60); // every minute

koNowDayOfMonth.subscribe(function () {
	_.each(aDayOfMonthFunctions, function (fDayOfMonth) {
		fDayOfMonth();
	});
}, this);

module.exports = {
	registerEveryMinuteFunction: function (fEveryMinute)
	{
		if (_.isFunction(fEveryMinute))
		{
			aEveryMinuteFunctions.push(fEveryMinute);
		}
	},
	registerWakeupFunction: function (fWakeup)
	{
		if (_.isFunction(fWakeup))
		{
			aWakeupFunctions.push(fWakeup);
		}
	},
	registerDayOfMonthFunction: function (fDayOfMonth)
	{
		if (_.isFunction(fDayOfMonth))
		{
			aDayOfMonthFunctions.push(fDayOfMonth);
		}
	}
};
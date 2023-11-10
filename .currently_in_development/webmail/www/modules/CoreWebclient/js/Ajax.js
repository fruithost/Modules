'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	moment = require('moment'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),

	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	AlertPopup = require('%PathToCoreWebclientModule%/js/popups/AlertPopup.js'),

	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Pulse = require('%PathToCoreWebclientModule%/js/Pulse.js'),
	Settings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),

	aFilterDebugInfo = []
;

function _getRequestDataString (oReqData)
{
	return 'start time:' + oReqData.Time.format('DD.MM, HH:mm:ss') + '<br />' + JSON.stringify(oReqData.Request).substr(0, 300) + '<br />'
				+ 'readyState:' + oReqData.Xhr.readyState + (Types.isString(oReqData.Xhr.statusText) ? ':' + oReqData.Xhr.statusText : '') + '<br />'
				+ (Types.isString(oReqData.Xhr.responseText) ? ':' + oReqData.Xhr.responseText.substr(0, 300) + '<br />' : '');
}

/**
 * @constructor
 */
function CAjax()
{
	this.requests = ko.observableArray([]);

	this.aOnAllRequestsClosedHandlers = [];
	this.requests.subscribe(function () {
		if (this.requests().length === 0)
		{
			_.each(this.aOnAllRequestsClosedHandlers, function (fHandler) {
				if (_.isFunction(fHandler))
				{
					fHandler();
				}
			});
		}
	}, this);

	this.aAbortRequestHandlers = {};

	this.bAllowRequests = true;
	this.bInternetConnectionProblem = false;

	if (Settings.AllowClientDebug)
	{
		App.subscribeEvent('%ModuleName%::GetDebugInfo', _.bind(function (oParams) {
			var aInfo = [];

			if (this.requests().length)
			{
				aInfo.push('<b>Current requests:</b>');
				_.each(this.requests(), function (oReqData) {
					aInfo.push(_getRequestDataString(oReqData));
				});
			}

			if (aFilterDebugInfo.length > 0)
			{
				aInfo.push('');
				aInfo.push('<b>aFilterDebugInfo:</b>');
				aInfo = aInfo.concat(aFilterDebugInfo);
			}

			oParams.Info.push(aInfo.join('<br />'));
		}, this));
	}
}

/**
 * @param {string} sModule
 * @param {string} sMethod
 * @returns {object}
 */
CAjax.prototype.getOpenedRequest = function (sModule, sMethod)
{
	var oFoundReqData = _.find(this.requests(), function (oReqData) {
		return oReqData.Request.Module === sModule && oReqData.Request.Method === sMethod;
	});

	return oFoundReqData ? oFoundReqData.Request : null;
};

/**
 * @param {string=} sModule = ''
 * @param {string=} sMethod = ''
 * @returns {boolean}
 */
CAjax.prototype.hasOpenedRequests = function (sModule, sMethod)
{
	// Do not change requests here. It calls hasOpenedRequests and we get a loop.

	sModule = Types.pString(sModule);
	sMethod = Types.pString(sMethod);

	if (sMethod === '')
	{
		return this.requests().length > 0;
	}
	else
	{
		return !!_.find(this.requests(), function (oReqData) {
			return oReqData && oReqData.Request.Module === sModule && oReqData.Request.Method === sMethod;
		});
	}
};

/**
 * @param {string} sModule
 * @param {function} fHandler
 */
CAjax.prototype.registerAbortRequestHandler = function (sModule, fHandler)
{
	this.aAbortRequestHandlers[sModule] = fHandler;
};

/**
 * @param {function} fHandler
 */
CAjax.prototype.registerOnAllRequestsClosedHandler = function (fHandler)
{
	this.aOnAllRequestsClosedHandlers.push(fHandler);
};

/**
 * @param {string} sModule
 * @param {string} sMethod
 * @param {object} oParameters
 * @param {function=} fResponseHandler
 * @param {object=} oContext
 * @param {number=} iTimeout
 * @param {object=} oMainParams
 */
CAjax.prototype.send = function (sModule, sMethod, oParameters, fResponseHandler, oContext, iTimeout, oMainParams)
{
	oParameters = oParameters || {};

	var oRequest = _.extendOwn({
		Module: sModule,
		Method: sMethod,
		Parameters: oParameters
	}, App.getCommonRequestParameters());

	if (oMainParams)
	{
		oRequest = _.extendOwn(oRequest, oMainParams);
	}

	if (this.bAllowRequests && !this.bInternetConnectionProblem)
	{
		var oEventParams = {
			'Module': sModule,
			'Method': sMethod,
			'Parameters': oParameters, // can be changed by reference
			'ResponseHandler': fResponseHandler,
			'Context': oContext,
			'Continue': true
		};
		App.broadcastEvent('SendAjaxRequest::before', oEventParams);

		if (oEventParams.Continue)
		{
			this.abortSameRequests(oRequest);

			this.doSend(oRequest, fResponseHandler, oContext, iTimeout);
		}
	}
	else
	{
		var oResponse = { Result: false, ErrorCode: Enums.Errors.NotDisplayedError };
		this.executeResponseHandler(fResponseHandler, oContext, oResponse, oRequest, 'error');
	}
};

/*************************private*************************************/

/**
 * @param {Object} oRequest
 * @param {Function=} fResponseHandler
 * @param {Object=} oContext
 * @param {number=} iTimeout
 */
CAjax.prototype.doSend = function (oRequest, fResponseHandler, oContext, iTimeout)
{
	var
		doneFunc = _.bind(this.done, this, oRequest, fResponseHandler, oContext),
		failFunc = _.bind(this.fail, this, oRequest, fResponseHandler, oContext),
		alwaysFunc = _.bind(this.always, this, oRequest),
		oXhr = null,
		oCloneRequest = _.clone(oRequest),
		sAuthToken = $.cookie('AuthToken') || '',
		oHeader = { 'X-Client': 'WebClient' }
	;

	if (sAuthToken === '' && App.getUserRole() !== Enums.UserRole.Anonymous)
	{
		App.logoutAndGotoLogin();
	}

	if (sAuthToken !== '')
	{
		oHeader['Authorization'] = 'Bearer ' + sAuthToken;
	}

	oHeader['X-DeviceId'] = Utils.getUUID();

	oCloneRequest.Parameters = JSON.stringify(oCloneRequest.Parameters);

	oXhr = $.ajax({
		url: '?/Api/',
		type: 'POST',
		async: true,
		dataType: 'json',
		headers: oHeader,
		data: oCloneRequest,
		success: doneFunc,
		error: failFunc,
		complete: alwaysFunc,
		timeout: iTimeout === undefined ? 50000 : iTimeout
	});

	this.requests().push({ Request: oRequest, Xhr: oXhr, Time: moment() });
};

/**
 * @param {Object} oRequest
 */
CAjax.prototype.abortSameRequests = function (oRequest)
{
	var fHandler = this.aAbortRequestHandlers[oRequest.Module];

	if (_.isFunction(fHandler) && this.requests().length > 0)
	{
		_.each(this.requests(), _.bind(function (oReqData) {
			if (oReqData)
			{
				var oOpenedRequest = oReqData.Request;
				if (oRequest.Module === oOpenedRequest.Module)
				{
					if (fHandler(oRequest, oOpenedRequest))
					{
						oReqData.Xhr.abort();
					}
				}
			}
		}, this));
	}
};

/**
 * @param {object} oExcept
 */
CAjax.prototype.abortAllRequests = function (oExcept)
{
	if (typeof oExcept !== 'object')
	{
		oExcept = {
			Module: '',
			Method: ''
		};
	}
	_.each(this.requests(), function (oReqData) {
		if (oReqData && (oReqData.Request.Module !== oExcept.Module || oReqData.Request.Method !== oExcept.Method))
		{
			oReqData.Xhr.abort();
		}
	}, this);
};

/**
 * @param {object} oExcept
 */
CAjax.prototype.abortAndStopSendRequests = function (oExcept)
{
	this.bAllowRequests = false;
	this.abortAllRequests(oExcept);
};

CAjax.prototype.startSendRequests = function ()
{
	this.bAllowRequests = true;
};

/**
 * @param {Object} oRequest
 * @param {Function} fResponseHandler
 * @param {Object} oContext
 * @param {{Result:boolean}} oResponse
 * @param {string} sType
 * @param {Object} oXhr
 */
CAjax.prototype.done = function (oRequest, fResponseHandler, oContext, oResponse, sType, oXhr)
{
	if (App.getUserRole() !== Enums.UserRole.Anonymous && oResponse && Types.isNumber(oResponse.AuthenticatedUserId) && oResponse.AuthenticatedUserId !== 0 && oResponse.AuthenticatedUserId !== App.getUserId())
	{
		Popups.showPopup(AlertPopup, [TextUtils.i18n('%MODULENAME%/ERROR_AUTHENTICATED_USER_CONFLICT'), function () {
			App.logoutAndGotoLogin();
		}, '', TextUtils.i18n('%MODULENAME%/ACTION_LOGOUT')]);
	}

	// if oResponse.Result === 0 or oResponse.Result === '' this is not an error
	if (oResponse && (oResponse.Result === false || oResponse.Result === null || oResponse.Result === undefined))
	{
		switch (oResponse.ErrorCode)
		{
			case Enums.Errors.InvalidToken:
				this.abortAndStopSendRequests();
				App.tokenProblem();
				break;
			case Enums.Errors.AuthError:
				if (App.getUserRole() !== Enums.UserRole.Anonymous)
				{
					App.logoutAndGotoLogin();
				}
				break;
		}

		oResponse.Result = false;
	}

	this.executeResponseHandler(fResponseHandler, oContext, oResponse, oRequest, sType);
};

/**
 * @param {Object} oRequest
 * @param {Function} fResponseHandler
 * @param {Object} oContext
 * @param {Object} oXhr
 * @param {string} sType
 * @param {string} sErrorText
 */
CAjax.prototype.fail = function (oRequest, fResponseHandler, oContext, oXhr, sType, sErrorText)
{
	var oResponse = { Result: false, ErrorCode: 0 };

	switch (sType)
	{
		case 'abort':
			oResponse = { Result: false, ErrorCode: Enums.Errors.NotDisplayedError };
			break;
		default:
		case 'error':
		case 'parseerror':
			if (sErrorText === '')
			{
				oResponse = { Result: false, ErrorCode: Enums.Errors.NotDisplayedError, ResponseText:  oXhr.responseText};
			}
			else
			{
				var oReqData = _.find(this.requests(), function (oTmpReqData, iIndex) {
					return oTmpReqData && _.isEqual(oTmpReqData.Request, oRequest);
				});
				if (oReqData)
				{
					Utils.log('DataTransferFailed', _getRequestDataString(oReqData));
				}
				else
				{
					var sResponseText = Types.pString(oXhr && oXhr.responseText);
					Utils.log('DataTransferFailed', sErrorText, '<br />' + sResponseText.substr(0, 300));
				}
				oResponse = { Result: false, ErrorCode: Enums.Errors.DataTransferFailed, ResponseText:  oXhr.responseText };
			}
			break;
	}

	this.executeResponseHandler(fResponseHandler, oContext, oResponse, oRequest, sType);
};

/**
 * @param {Function} fResponseHandler
 * @param {Object} oContext
 * @param {Object} oResponse
 * @param {Object} oRequest
 * @param {string} sType
 */
CAjax.prototype.executeResponseHandler = function (fResponseHandler, oContext, oResponse, oRequest, sType)
{
	if (!oResponse)
	{
		oResponse = { Result: false, ErrorCode: 0 };
	}

	// Check the Internet connection before passing control to the modules.
	// It forbids or allows further AJAX requests.
	this.checkConnection(oRequest.Module, oRequest.Method, sType);

	if (_.isFunction(fResponseHandler) && !oResponse.StopExecuteResponse)
	{
		fResponseHandler.apply(oContext, [oResponse, oRequest]);
	}

	App.broadcastEvent('ReceiveAjaxResponse::after', {'Request': oRequest, 'Response': oResponse});
};

/**
 * @param {object} oXhr
 * @param {string} sType
 * @param {object} oRequest
 */
CAjax.prototype.always = function (oRequest, oXhr, sType)
{
	this.filterRequests(oRequest);
};

CAjax.prototype.filterRequests = function (oRequest, sCallerName)
{
	this.requests(_.filter(this.requests(), function (oReqData, iIndex) {
		if (oReqData)
		{
			if (_.isEqual(oReqData.Request, oRequest))
			{
				return false;
			}
			var
				bComplete = oReqData.Xhr.readyState === 4,
				bFail = oReqData.Xhr.readyState === 0 && (oReqData.Xhr.statusText === 'abort' || oReqData.Xhr.statusText === 'error'),
				bTooLong = moment().diff(oReqData.Time) > 1000 * 60 * 5 // 5 minutes
			;
			if (Settings.AllowClientDebug && (bComplete || bFail || bTooLong))
			{
				if (bTooLong)
				{
					Utils.log(sCallerName, 'remove more than 5 minutes request', _getRequestDataString(oReqData));
				}
				else if (bFail)
				{
					Utils.log(sCallerName, 'remove fail request', _getRequestDataString(oReqData));
				}
				else if (bComplete)
				{
					Utils.log(sCallerName, 'remove complete request', _getRequestDataString(oReqData));
				}
			}
			return !bComplete && !bFail && !bTooLong;
		}
	}, this));
};

CAjax.prototype.checkConnection = (function () {

	var iTimer = -1;

	return function (sModule, sMethod, sStatus)
	{
		clearTimeout(iTimer);
		if (sStatus !== 'error')
		{
			Ajax.bInternetConnectionProblem = false;
			Screens.hideError(true);
		}
		else if (this.bAllowRequests)
		{
			if (sModule === 'Core' && sMethod === 'Ping')
			{
				Ajax.bInternetConnectionProblem = true;
				Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_NO_INTERNET_CONNECTION'), true, true);
				iTimer = setTimeout(function () {
					Ajax.doSend({ Module: 'Core', Method: 'Ping' });
				}, 10000);
			}
			else
			{
				Ajax.doSend({ Module: 'Core', Method: 'Ping' });
			}
		}
	};
}());

var Ajax = new CAjax();

module.exports = {
	getOpenedRequest: _.bind(Ajax.getOpenedRequest, Ajax),
	hasInternetConnectionProblem: function () { return Ajax.bInternetConnectionProblem; },
	hasOpenedRequests: _.bind(Ajax.hasOpenedRequests, Ajax),
	registerAbortRequestHandler: _.bind(Ajax.registerAbortRequestHandler, Ajax),
	registerOnAllRequestsClosedHandler: _.bind(Ajax.registerOnAllRequestsClosedHandler, Ajax),
	abortAndStopSendRequests: _.bind(Ajax.abortAndStopSendRequests, Ajax),
	startSendRequests: _.bind(Ajax.startSendRequests, Ajax),
	send: _.bind(Ajax.send, Ajax)
};

Pulse.registerEveryMinuteFunction(function () {
	Ajax.filterRequests(null, 'pulse');
});

Pulse.registerWakeupFunction(function () {
	Utils.log('<u>wakeup</u>, hasOpenedRequests: ' + Ajax.hasOpenedRequests() + ', bInternetConnectionProblem: ' + Ajax.bInternetConnectionProblem);
	if (Ajax.hasOpenedRequests())
	{
		_.each(Ajax.requests(), function (oReqData) {
			Utils.log('<i>wakeup</i>: ' + _getRequestDataString(oReqData));
		});
		Ajax.filterRequests(null, 'wakeup');
	}
	if (Ajax.bInternetConnectionProblem)
	{
		Ajax.checkConnection();
	}
});

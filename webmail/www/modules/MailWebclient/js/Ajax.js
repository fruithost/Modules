'use strict';

var
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

Ajax.registerAbortRequestHandler(Settings.ServerModuleName, function (oRequest, oOpenedRequest) {
	var
		oParameters = oRequest.Parameters,
		oOpenedParameters = oOpenedRequest.Parameters
	;
	
	switch (oRequest.Method)
	{
		case 'MoveMessages':
		case 'DeleteMessages':
			return	oOpenedRequest.Method === 'GetMessage' || 
					oOpenedRequest.Method === 'GetMessages' && oOpenedParameters.Folder === oParameters.Folder;
		case 'GetMessages':
		case 'SetMessagesSeen':
		case 'SetMessageFlagged':
			return oOpenedRequest.Method === 'GetMessages' && oOpenedParameters.Folder === oParameters.Folder;
		case 'SetAllMessagesSeen':
			return (oOpenedRequest.Method === 'GetMessages' || oOpenedRequest.Method === 'GetMessages') &&
					oOpenedParameters.Folder === oParameters.Folder;
		case 'ClearFolder':
			// GetRelevantFoldersInformation-request aborted during folder cleaning, not to get the wrong information.
			return	oOpenedRequest.Method === 'GetRelevantFoldersInformation' || 
					oOpenedRequest.Method === 'GetUnifiedRelevantFoldersInformation' || 
					oOpenedRequest.Method === 'GetMessages' && oOpenedParameters.Folder === oParameters.Folder;
		case 'GetRelevantFoldersInformation':
			return oOpenedRequest.Method === 'GetRelevantFoldersInformation' && oParameters.AccountID === oOpenedParameters.AccountID ||
					oOpenedRequest.Method === 'GetUnifiedRelevantFoldersInformation';
		case 'GetMessagesFlags':
			return oOpenedRequest.Method === 'GetMessagesFlags';
	}
	
	return false;
});

module.exports = {
	getOpenedRequest: function (sMethod) {
		Ajax.getOpenedRequest('Mail', sMethod);
	},
	hasOpenedRequests: function (sMethod) {
		return Ajax.hasOpenedRequests('Mail', sMethod || '');
	},
	hasInternetConnectionProblem: function () {
		return Ajax.hasInternetConnectionProblem();
	},
	registerOnAllRequestsClosedHandler: Ajax.registerOnAllRequestsClosedHandler,
	send: function (sMethod, oParameters, fResponseHandler, oContext) {
		var
			MailCache = require('modules/%ModuleName%/js/Cache.js'),
			iTimeout = (sMethod === 'GetMessagesBodies') ? 100000 : undefined,
			fBaseResponseHandler = function (oResponse, oRequest) {
				if (!oResponse.Result && oResponse.ErrorCode === 4002)
				{
					var
						AccountList = require('modules/%ModuleName%/js/AccountList.js'),
						iAccountId = Types.pInt(oRequest.Parameters.AccountID),
						oAccount = AccountList.getAccount(iAccountId)
					;
					oAccount.passwordMightBeIncorrect(true);
				}
				if (_.isFunction(fResponseHandler))
				{
					fResponseHandler.apply(oContext, [oResponse, oRequest]);
				}
			}
		;
		if (oParameters && !oParameters.AccountID)
		{
			oParameters.AccountID = MailCache.currentAccountId();
		}
		Ajax.send(Settings.ServerModuleName, sMethod, oParameters, fBaseResponseHandler, null, iTimeout);
	}
};

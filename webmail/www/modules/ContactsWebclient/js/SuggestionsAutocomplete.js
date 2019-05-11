'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	
	AddressUtils = require('%PathToCoreWebclientModule%/js/utils/Address.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('modules/%ModuleName%/js/Ajax.js')
;

/**
 * @param {object} oRequest
 * @param {function} fResponse
 * @param {string} sExceptEmail
 * @param {string} sStorage
 */
function Callback(oRequest, fResponse, sExceptEmail, sStorage)
{
	var
		sTerm = oRequest.term,
		oParameters = {
			'Search': sTerm,
			'Storage': sStorage,
			'SortField': Enums.ContactSortField.Frequency,
			'SortOrder': 1
		}
	;

	Ajax.send('GetContacts', oParameters, function (oResponse) {
		var aList = [];
		if (oResponse && oResponse.Result && oResponse.Result.List)
		{
			aList = _.map(oResponse.Result.List, function (oItem) {
				return oItem && oItem.ViewEmail && oItem.ViewEmail !== sExceptEmail ?
				{
					value: (oItem.FullName && 0 < $.trim(oItem.FullName).length) ? (oItem.ForSharedToAll ? oItem.FullName : ('"' + oItem.FullName + '" <' + oItem.ViewEmail + '>')) : oItem.ViewEmail,
					name: oItem.FullName,
					email: oItem.ViewEmail,
					frequency: oItem.Frequency,
					id: oItem.UUID,
					team: oItem.Storage === 'team',
					sharedToAll: oItem.Storage === 'shared'
				} :
				null;
			});

			aList = _.sortBy(_.compact(aList), function(oItem){
				return -oItem.frequency;
			});
		}

		fResponse(aList);

	});
}

///**
// * @param {string} sStorage
// * @param {object} oRequest
// * @param {function} fResponse
// */
//function StorageCallback(sStorage, oRequest, fResponse)
//{
//	var
//		sTerm = oRequest.term,
//		oParameters = {
//			'Search': sTerm,
//			'SortField': Enums.ContactSortField.Frequency,
//			'SortOrder': 1,
//			'Storage': sStorage
//		}
//	;
//
//	Ajax.send('GetContacts', oParameters, function (oResponse) {
//		var aList = [];
//		if (oResponse && oResponse.Result && oResponse.Result.List)
//		{
//			aList = _.map(oResponse.Result.List, function (oItem) {
//				var
//					sLabel = '',
//					sValue = oItem.ViewEmail
//				;
//
//				if (oItem.IsGroup)
//				{
//					if (oItem.FullName && 0 < $.trim(oItem.FullName).length)
//					{
//						sLabel = '"' + oItem.FullName + '" (' + oItem.ViewEmail + ')';
//					}
//					else
//					{
//						sLabel = '(' + oItem.ViewEmail + ')';
//					}
//				}
//				else
//				{
//					sLabel = AddressUtils.getFullEmail(oItem.FullName, oItem.ViewEmail);
//					sValue = sLabel;
//				}
//
//				return {
//					'label': sLabel,
//					'value': sValue,
//					'frequency': oItem.Frequency,
//					'id': oItem.UUID,
//					'team': oItem.Storage === 'team',
//					'sharedToAll': oItem.Storage === 'shared'
//				};
//			});
//
//			aList = _.sortBy(_.compact(aList), function(oItem) {
//				return -oItem.frequency;
//			});
//		}
//
//		fResponse(aList);
//
//	});
//}

/**
 * @param {object} oRequest
 * @param {function} fResponse
 */
function PhoneCallback(oRequest, fResponse)
{
	var
		sTerm = $.trim(oRequest.term),
		oParameters = {
			'Search': sTerm,
			'SortField': Enums.ContactSortField.Frequency,
			'SortOrder': 1
		}
	;

	if ('' !== sTerm)
	{
		Ajax.send('GetContacts', oParameters, function (oResponse) {
			var aList = [];

			if (oResponse && oResponse.Result && oResponse.Result.List)
			{
				_.each(oResponse.Result.List, function (oItem) {
					_.each(oItem.Phones, function (sPhone, sKey) {
						aList.push({
							label: oItem.FullName !== '' ? oItem.FullName + ' ' + '<' + oItem.ViewEmail + '> ' + sPhone : oItem.ViewEmail + ' ' + sPhone,
							value: sPhone,
							frequency: oItem.Frequency
						});
					});
				});

				aList = _.sortBy(_.compact(aList), function (oItem) { return -(oItem.frequency); });
			}
			
			fResponse(aList);
		});
	}
}

/**
 * @param {Object} oContact
 */
function DeleteHandler(oContact)
{
	Ajax.send('UpdateContact', { 'Contact': { 'UUID': oContact.id, 'Frequency': -1 } });
}

function RequestUserByPhone(sNumber, fCallBack, oContext)
{
	oParameters = {
		'Search': sNumber,
		'SortField': Enums.ContactSortField.Frequency,
		'SortOrder': 1
	};
	
	Ajax.send('GetContacts', oParameters, function (oResponse) {
		var
			oResult = oResponse.Result,
			sUser = '',
			oUser = Types.isNonEmptyArray(oResult.List) ? oResult.List[0] : null
		;
		
		if (oUser && oUser.Phones)
		{
			$.each(oUser.Phones, function (sKey, sUserPhone) {
				var
					regExp = /[()\s_\-]/g,
					sCleanedPhone = (sNumber.replace(regExp, '')),
					sCleanedUserPhone = (sUserPhone.replace(regExp, ''))
				;

				if (sCleanedPhone === sCleanedUserPhone)
				{
					sUser = oUser.FullName === '' ? oUser.ViewEmail + ' ' + sUserPhone : oUser.FullName + ' ' + sUserPhone;
					return false;
				}
			});
		}
		
		fCallBack.call(oContext, sUser);
	});
}

module.exports = {
	callback: Callback,
	phoneCallback: PhoneCallback,
	deleteHandler: DeleteHandler,
	requestUserByPhone: RequestUserByPhone
};

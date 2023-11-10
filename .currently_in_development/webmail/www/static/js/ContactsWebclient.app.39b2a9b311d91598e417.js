(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[1],{

/***/ "+JH/":
/*!**************************************************!*\
  !*** ./modules/ContactsWebclient/js/Settings.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV")
;

module.exports = {
	ServerModuleName: 'Contacts',
	HashModuleName: 'contacts',
	
	ContactsPerPage: 20,
	ImportContactsLink: '',
	Storages: [],
	DefaultStorage: 'personal',
	ImportExportFormats: [],
	SaveVcfServerModuleName: '',

	EContactsPrimaryEmail: {},
	EContactsPrimaryPhone: {},
	EContactsPrimaryAddress: {},
	EContactSortField: {},
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var oAppDataSection = oAppData[this.ServerModuleName];
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.ContactsPerPage = Types.pPositiveInt(oAppDataSection.ContactsPerPage, this.ContactsPerPage);
			this.ImportContactsLink = Types.pString(oAppDataSection.ImportContactsLink, this.ImportContactsLink);
			this.Storages = Types.pArray(oAppDataSection.Storages, this.Storages);
			if (this.Storages.length > 0)
			{
				this.Storages.push('all');
				this.Storages.push('group');
			}
			this.ImportExportFormats = Types.pArray(oAppDataSection.ImportExportFormats, this.ImportExportFormats);
			this.SaveVcfServerModuleName = Types.pString(oAppDataSection.SaveVcfServerModuleName, this.SaveVcfServerModuleName);
			
			this.EContactsPrimaryEmail = Types.pObject(oAppDataSection.PrimaryEmail);
			this.EContactsPrimaryPhone = Types.pObject(oAppDataSection.PrimaryPhone);
			this.EContactsPrimaryAddress = Types.pObject(oAppDataSection.PrimaryAddress);
			this.EContactSortField = Types.pObject(oAppDataSection.SortField);
		}
	},
	
	/**
	 * Updates contacts per page after saving to server.
	 * 
	 * @param {number} iContactsPerPage
	 */
	update: function (iContactsPerPage)
	{
		this.ContactsPerPage = iContactsPerPage;
	}
};


/***/ }),

/***/ "/tOA":
/*!*****************************************************!*\
  !*** ./modules/ContactsWebclient/js/utils/Links.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	Settings = __webpack_require__(/*! modules/ContactsWebclient/js/Settings.js */ "+JH/"),
	
	LinksUtils = {}
;

/**
 * @param {string} sTemp
 * 
 * @return {boolean}
 */
function IsPageParam(sTemp)
{
	return ('p' === sTemp.substr(0, 1) && (/^[1-9][\d]*$/).test(sTemp.substr(1)));
};

/**
 * @param {string} sTemp
 * 
 * @return {boolean}
 */
function IsContactParam(sTemp)
{
	return 'cnt' === sTemp.substr(0, 3);
};

/**
 * @param {number=} sStorage
 * @param {string=} sGroupUUID
 * @param {string=} sSearch
 * @param {number=} iPage
 * @param {string=} sContactUUID
 * @param {string=} sAction
 * @returns {Array}
 */
LinksUtils.getContacts = function (sStorage, sGroupUUID, sSearch, iPage, sContactUUID, sAction)
{
	var aParams = [Settings.HashModuleName];
	
	if (sStorage && sStorage !== '')
	{
		aParams.push(sStorage);
	}
	
	if (sGroupUUID && sGroupUUID !== '')
	{
		aParams.push(sGroupUUID);
	}
	
	if (sSearch && sSearch !== '')
	{
		aParams.push(sSearch);
	}
	
	if (Types.isNumber(iPage))
	{
		aParams.push('p' + iPage);
	}
	
	if (sContactUUID && sContactUUID !== '')
	{
		aParams.push('cnt' + sContactUUID);
	}
	
	if (sAction && sAction !== '')
	{
		aParams.push(sAction);
	}
	
	return aParams;
};

/**
 * @param {Array} aParam
 * 
 * @return {Object}
 */
LinksUtils.parseContacts = function (aParam)
{
	var
		iIndex = 0,
		sStorage = Settings.DefaultStorage,
		sGroupUUID = '',
		sSearch = '',
		iPage = 1,
		sContactUUID = '',
		sAction = ''
	;

	if (Types.isNonEmptyArray(aParam))
	{
		sStorage = Types.pString(aParam[iIndex]);
		iIndex++;
		if (-1 === $.inArray(sStorage, Settings.Storages))
		{
			sStorage = Settings.DefaultStorage;
		}
		
		if (sStorage === 'group')
		{
			if (aParam.length > iIndex)
			{
				sGroupUUID = Types.pString(aParam[iIndex]);
				iIndex++;
			}
			else
			{
				sStorage = Settings.DefaultStorage;
			}
		}
		
		if (aParam.length > iIndex && !IsPageParam(aParam[iIndex]) && !IsContactParam(aParam[iIndex]))
		{
			sSearch = Types.pString(aParam[iIndex]);
			iIndex++;
		}
		
		if (aParam.length > iIndex && IsPageParam(aParam[iIndex]))
		{
			iPage = Types.pInt(aParam[iIndex].substr(1));
			iIndex++;
			if (iPage <= 0)
			{
				iPage = 1;
			}
		}
		
		if (aParam.length > iIndex)
		{
			if (IsContactParam(aParam[iIndex]))
			{
				sContactUUID = Types.pString(aParam[iIndex].substr(3));
			}
			else
			{
				sAction = Types.pString(aParam[iIndex]);
			}
			iIndex++;
		}
	}
	
	return {
		'Storage': sStorage,
		'GroupUUID': sGroupUUID,
		'Search': sSearch,
		'Page': iPage,
		'ContactUUID': sContactUUID,
		'Action': sAction
	};
};

module.exports = LinksUtils;


/***/ }),

/***/ "4UCw":
/*!*******************************************************************!*\
  !*** ./modules/ContactsWebclient/js/views/VcardAttachmentView.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	ContactsCache = __webpack_require__(/*! modules/ContactsWebclient/js/Cache.js */ "v6sP"),
	CVcardModel = __webpack_require__(/*! modules/ContactsWebclient/js/models/VcardModel.js */ "wudd")
;

function CVcardAttachmentView()
{
	this.vcard = ko.observable(null);
}

CVcardAttachmentView.prototype.ViewTemplate = 'ContactsWebclient_VcardAttachmentView';

/**
 * Receives properties of the message that is displaying in the message pane. 
 * It is called every time the message is changing in the message pane.
 * Receives null if there is no message in the pane.
 * 
 * @param {Object|null} oMessageProps Information about message in message pane.
 * @param {Object} oMessageProps.oVcard
 */
CVcardAttachmentView.prototype.doAfterPopulatingMessage = function (oMessageProps)
{
	var
		aExtend = (oMessageProps && Types.isNonEmptyArray(oMessageProps.aExtend)) ? oMessageProps.aExtend : [],
		oFoundRawVcard = _.find(aExtend, function (oRawVcard) {
			return oRawVcard['@Object'] === 'Object/Aurora\\Modules\\Mail\\Classes\\Vcard';
		})
	;
	if (oFoundRawVcard)
	{
		var oVcard = ContactsCache.getVcard(oFoundRawVcard.File);
		if (!oVcard)
		{
			oVcard = new CVcardModel();
			oVcard.parse(oFoundRawVcard);
		}
		this.vcard(oVcard);
	}
	else
	{
		this.vcard(null);
	}
};

module.exports = new CVcardAttachmentView();


/***/ }),

/***/ "5hOJ":
/*!*******************************************************!*\
  !*** ./modules/CoreWebclient/js/models/CDateModel.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	moment = __webpack_require__(/*! moment */ "wd/R"),
			
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
	
	UserSettings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ "hPb3")
;

/**
 * @constructor
 */
function CDateModel()
{
	this.iTimeStampInUTC = 0;
	this.oMoment = null;
}

/**
 * @param {number} iTimeStampInUTC
 */
CDateModel.prototype.parse = function (iTimeStampInUTC)
{
	this.iTimeStampInUTC = iTimeStampInUTC;
	this.oMoment = moment.unix(this.iTimeStampInUTC);
};

/**
 * @param {number} iYear
 * @param {number} iMonth
 * @param {number} iDay
 */
CDateModel.prototype.setDate = function (iYear, iMonth, iDay)
{
	this.oMoment = moment([iYear, iMonth, iDay]);
};

/**
 * @return {string}
 */
CDateModel.prototype.getTimeFormat = function ()
{
	return (UserSettings.timeFormat() === window.Enums.TimeFormat.F24) ? 'HH:mm' : 'hh:mm A';
};

/**
 * @return {string}
 */
CDateModel.prototype.getFullDate = function ()
{
	return this.getDate() + ' ' + this.getTime();	
};

/**
 * @return {string}
 */
CDateModel.prototype.getMidDate = function ()
{
	return this.getShortDate(true);
};

/**
 * @param {boolean=} bTime = false
 * 
 * @return {string}
 */
CDateModel.prototype.getShortDate = function (bTime)
{
	var
		sResult = '',
		oMomentNow = null
	;

	if (this.oMoment)
	{
		oMomentNow = moment();

		if (oMomentNow.format('L') === this.oMoment.format('L'))
		{
			sResult = this.oMoment.format(this.getTimeFormat());
		}
		else
		{
			if (oMomentNow.clone().subtract(1, 'days').format('L') === this.oMoment.format('L'))
			{
				sResult = TextUtils.i18n('COREWEBCLIENT/LABEL_YESTERDAY');
			}
			else
			{
				if (UserSettings.UserSelectsDateFormat)
				{
					sResult = this.oMoment.format(Utils.getDateFormatForMoment(UserSettings.dateFormat()));
				}
				else
				{
					if (oMomentNow.year() === this.oMoment.year())
					{
						sResult = this.oMoment.format('MMM D');
					}
					else
					{
						sResult = this.oMoment.format('MMM D, YYYY');
					}
				}
			}

			if (!!bTime)
			{
				sResult += ', ' + this.oMoment.format(this.getTimeFormat());
			}
		}
	}

	return sResult;
};

/**
 * @return {string}
 */
CDateModel.prototype.getDate = function ()
{
	var sFormat = 'ddd, MMM D, YYYY';
	
	if (UserSettings.UserSelectsDateFormat)
	{
		sFormat = 'ddd, ' + Utils.getDateFormatForMoment(UserSettings.dateFormat());
	}
	
	return (this.oMoment) ? this.oMoment.format(sFormat) : '';
};

/**
 * @return {string}
 */
CDateModel.prototype.getTime = function ()
{
	return (this.oMoment) ? this.oMoment.format(this.getTimeFormat()): '';
};

/**
 * @return {number}
 */
CDateModel.prototype.getTimeStampInUTC = function ()
{
	return this.iTimeStampInUTC;
};

module.exports = CDateModel;


/***/ }),

/***/ "5lSi":
/*!*************************************************!*\
  !*** ./modules/ContactsWebclient/js/manager.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (oAppData) {
	var
		_ = __webpack_require__(/*! underscore */ "F/us"),
		
		TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
		
		App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
		ModulesManager = __webpack_require__(/*! modules/CoreWebclient/js/ModulesManager.js */ "OgeD"),
		
		ContactsCache = __webpack_require__(/*! modules/ContactsWebclient/js/Cache.js */ "v6sP"),
		Settings = __webpack_require__(/*! modules/ContactsWebclient/js/Settings.js */ "+JH/"),
		
		SuggestionsAutocomplete = __webpack_require__(/*! modules/ContactsWebclient/js/SuggestionsAutocomplete.js */ "duUI"),
		SuggestionsMethods = {
			getSuggestionsAutocompleteCallback: function (sStorage, sExceptEmail, bWithGroups) {
				var
					fSuggestionsAutocompleteCallback = function (oRequest, fResponse) {
						SuggestionsAutocomplete.callback(oRequest, fResponse, sExceptEmail, sStorage, bWithGroups);
					},
					//TODO: Remove this wrapper after adding PGP-keys to team storage
					fSuggestionsAutocompleteFilteredCallback = ModulesManager.run(
						'OpenPgpWebclient',
						'getSuggestionsAutocompleteFilteredCallback',
						[fSuggestionsAutocompleteCallback]
					)
				;
				return fSuggestionsAutocompleteFilteredCallback ?
					fSuggestionsAutocompleteFilteredCallback
					:
					fSuggestionsAutocompleteCallback;
			},
			getSuggestionsAutocompletePhoneCallback: function () {
				return SuggestionsAutocomplete.phoneCallback;
			},
			getSuggestionsAutocompleteDeleteHandler: function () {
				return SuggestionsAutocomplete.deleteHandler;
			},
			requestUserByPhone: function (sNumber, fCallBack, oContext) {
				SuggestionsAutocomplete.requestUserByPhone(sNumber, fCallBack, oContext);
			},
			getContactsByEmails: function (aEmails, fCallBack) {
				ContactsCache.getContactsByEmails(aEmails, fCallBack);
			}
		},
				
		fRegisterMessagePaneControllerOnStart = function () {
			App.subscribeEvent('MailWebclient::RegisterMessagePaneController', function (fRegisterMessagePaneController) {
				fRegisterMessagePaneController(__webpack_require__(/*! modules/ContactsWebclient/js/views/VcardAttachmentView.js */ "4UCw"), 'BeforeMessageBody');
			});
		},

		ContactsCardsMethods = {
			applyContactsCards: function ($Addresses) {
				var ContactCard = __webpack_require__(/*! modules/ContactsWebclient/js/ContactCard.js */ "RpeT");
				ContactCard.applyTo($Addresses);
			}
		}
	;

	Settings.init(oAppData);
	
	if (!ModulesManager.isModuleAvailable(Settings.ServerModuleName))
	{
		return null;
	}
	
	__webpack_require__(/*! modules/ContactsWebclient/js/enums.js */ "FRY1");
	
	if (App.isUserNormalOrTenant())
	{
		if (App.isMobile())
		{
			return _.extend({
				start: fRegisterMessagePaneControllerOnStart,
				getSettings: function () {
					return Settings;
				},
				getHeaderItemView: function () {
					return __webpack_require__(/*! modules/ContactsWebclient/js/views/HeaderItemView.js */ "fG7T");
				}
			}, SuggestionsMethods);
		}
		else if (App.isNewTab())
		{
			return _.extend({
				start: fRegisterMessagePaneControllerOnStart
			}, SuggestionsMethods, ContactsCardsMethods);
		}
		else
		{
			__webpack_require__(/*! modules/ContactsWebclient/js/MainTabExtMethods.js */ "hhaf");
			
			return _.extend({
				start: function (ModulesManager) {
					ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [
						function () { return __webpack_require__(/*! modules/ContactsWebclient/js/views/ContactsSettingsFormView.js */ "vLmA"); }, 
						Settings.HashModuleName, 
						TextUtils.i18n('CONTACTSWEBCLIENT/LABEL_SETTINGS_TAB')
					]);
					fRegisterMessagePaneControllerOnStart();
				},
				getScreens: function () {
					var oScreens = {};
					oScreens[Settings.HashModuleName] = function () {
						var CContactsView = __webpack_require__(/*! modules/ContactsWebclient/js/views/CContactsView.js */ "wSTV");
						return new CContactsView();
					};
					return oScreens;
				},
				getHeaderItem: function () {
					return {
						item: __webpack_require__(/*! modules/ContactsWebclient/js/views/HeaderItemView.js */ "fG7T"),
						name: Settings.HashModuleName
					};
				},
				isTeamContactsAllowed: function () {
					return _.indexOf(Settings.Storages, 'team') !== -1;
				},
				getMobileSyncSettingsView: function () {
					return __webpack_require__(/*! modules/ContactsWebclient/js/views/MobileSyncSettingsView.js */ "kQb/");
				}
			}, SuggestionsMethods, ContactsCardsMethods);
		}
	}
	
	return null;
};


/***/ }),

/***/ "B9Yq":
/*!***************************************!*\
  !*** (webpack)/buildin/amd-define.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function() {
	throw new Error("define cannot be used indirect");
};


/***/ }),

/***/ "FRY1":
/*!***********************************************!*\
  !*** ./modules/ContactsWebclient/js/enums.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	
	UserSettings = __webpack_require__(/*! modules/ContactsWebclient/js/Settings.js */ "+JH/"),
	
	Enums = {}
;

Enums.ContactsPrimaryEmail = UserSettings.EContactsPrimaryEmail;
Enums.ContactsPrimaryPhone = UserSettings.EContactsPrimaryPhone;
Enums.ContactsPrimaryAddress = UserSettings.EContactsPrimaryAddress;
Enums.ContactSortField = UserSettings.EContactSortField;

if (typeof window.Enums === 'undefined')
{
	window.Enums = {};
}

_.extendOwn(window.Enums, Enums);


/***/ }),

/***/ "Ig+v":
/*!***********************************************************!*\
  !*** ./modules/CoreWebclient/js/views/CHeaderItemView.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {


var
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	Routing = __webpack_require__(/*! modules/CoreWebclient/js/Routing.js */ "QaF5")
;

function CHeaderItemView(sLinkText)
{
	this.sName = '';
	
	this.visible = ko.observable(true);
	this.baseHash = ko.observable('');
	this.hash = ko.observable('');
	this.linkText = ko.observable(sLinkText);
	this.isCurrent = ko.observable(false);
	
	this.recivedAnim = ko.observable(false).extend({'autoResetToFalse': 500});
	this.unseenCount = ko.observable(0);
	
	this.allowChangeTitle = ko.observable(false); // allows to change favicon and browser title when browser is inactive
	this.inactiveTitle = ko.observable('');
	
	this.excludedHashes = ko.observableArray([]);
}

CHeaderItemView.prototype.ViewTemplate = 'CoreWebclient_HeaderItemView';

CHeaderItemView.prototype.setName = function (sName)
{
	this.sName = sName.toLowerCase();
	if (this.baseHash() === '')
	{
		this.hash(Routing.buildHashFromArray([sName.toLowerCase()]));
		this.baseHash(this.hash());
	}
	else
	{
		this.hash(this.baseHash());
	}
};

module.exports = CHeaderItemView;


/***/ }),

/***/ "Is5a":
/*!**********************************************************************!*\
  !*** ./modules/ContactsWebclient/js/models/CContactListItemModel.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	AddressUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Address.js */ "Ol7c"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	Settings = __webpack_require__(/*! modules/ContactsWebclient/js/Settings.js */ "+JH/"),

	ModulesManager = __webpack_require__(/*! modules/CoreWebclient/js/ModulesManager.js */ "OgeD")	
;

/**
 * @constructor
 */
function CContactListItemModel()
{
	this.bIsGroup = false;
	this.bIsOrganization = false;
	this.bReadOnly = false;
	this.bItsMe = false;
	this.bTeam = false;
	this.sUUID = '';
	this.sName = '';
	this.sEmail = '';
	this.bSharedToAll = false;
	this.aEmails = [];

	this.deleted = ko.observable(false);
	this.checked = ko.observable(false);
	this.selected = ko.observable(false);
	this.recivedAnim = ko.observable(false).extend({'autoResetToFalse': 500});
	this.sStorage = Settings.DefaultStorage;

	this.isOpenPgpEnabled = ModulesManager.run('OpenPgpWebclient', 'isOpenPgpEnabled') || ko.observable(false);	
	this.HasPgpPublicKey = ko.observable(false);
}

/**
 *
 * @param {Object} oData
 */
CContactListItemModel.prototype.parse = function (oData)
{
	this.sUUID = Types.pString(oData.UUID);
	this.sName = Types.pString(oData.FullName || oData.Name);
	this.sEmail = Types.pString(oData.ViewEmail);
	
	if (Types.isNonEmptyArray(oData.Emails))
	{
		this.aEmails = oData.Emails;
	}

	this.bIsGroup = !!oData.IsGroup;
	this.bIsOrganization = !!oData.IsOrganization;
	this.bReadOnly = !!oData.ReadOnly;
	this.bItsMe = !!oData.ItsMe;
	this.bTeam = oData.Storage === 'team';
	this.bSharedToAll =  oData.Storage === 'shared';
	this.sStorage = oData.Storage;

	this.HasPgpPublicKey(!!oData.HasPgpPublicKey);
};


/**
 * @return {boolean}
 */
CContactListItemModel.prototype.IsGroup = function ()
{
	return this.bIsGroup;
};

/**
 * @return {boolean}
 */
CContactListItemModel.prototype.Team = function ()
{
	return this.bTeam;
};

/**
 * @return {boolean}
 */
CContactListItemModel.prototype.ReadOnly = function ()
{
	return this.bReadOnly;
};

/**
 * @return {boolean}
 */
CContactListItemModel.prototype.ItsMe = function ()
{
	return this.bItsMe;
};

/**
 * @return {string}
 */
CContactListItemModel.prototype.UUID = function ()
{
	return this.sUUID;
};

/**
 * @return {string}
 */
CContactListItemModel.prototype.Name = function ()
{
	return this.sName;
};

/**
 * @return {string}
 */
CContactListItemModel.prototype.Email = function ()
{
	return this.sEmail;
};

/**
 * @return {string}
 */
CContactListItemModel.prototype.getFullEmail = function ()
{
	return AddressUtils.getFullEmail(this.sName, this.sEmail);
};

/**
 * @return {boolean}
 */
CContactListItemModel.prototype.IsSharedToAll = function ()
{
	return this.bSharedToAll;
};

/**
 * @return {boolean}
 */
CContactListItemModel.prototype.IsOrganization = function ()
{
	return this.bIsOrganization;
};

module.exports = CContactListItemModel;


/***/ }),

/***/ "Mqix":
/*!************************************************************!*\
  !*** ./modules/ContactsWebclient/js/models/CGroupModel.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	AddressUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Address.js */ "Ol7c"),
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5")
;

/**
 * @constructor
 */
function CGroupModel()
{
	this.isNew = ko.observable(false);
	this.readOnly = ko.observable(false);

	this.uuid = ko.observable('');
	this.idUser = ko.observable(0);

	this.name = ko.observable('');

	this.isOrganization = ko.observable(false);
	this.email = ko.observable('');
	this.country = ko.observable('');
	this.city = ko.observable('');
	this.company = ko.observable('');
	this.fax = ko.observable('');
	this.phone = ko.observable('');
	this.state = ko.observable('');
	this.street = ko.observable('');
	this.web = ko.observable('');
	this.zip = ko.observable('');
	
	this.edited = ko.observable(false);

	this.nameFocused = ko.observable(false);

	this.canBeSave = ko.computed(function () {
		return '' !== this.name();
	}, this);

	this.newContactsInGroupCount = ko.observable(0);

	this.newContactsInGroupHint = ko.computed(function () {
		var iCount = this.newContactsInGroupCount();
		return this.isNew() && 0 < iCount ? TextUtils.i18n('CONTACTSWEBCLIENT/INFO_NEW_GROUP_CONTACTS_PLURAL', {
			'COUNT' : iCount
		}, null, iCount) : '';
	}, this);
	
	this.events = ko.observableArray([]);
}

CGroupModel.prototype.getFullEmail = function ()
{
	return AddressUtils.getFullEmail(this.name(), this.email());
};

CGroupModel.prototype.clear = function ()
{
	this.isNew(false);

	this.uuid('');
	this.idUser(0);

	this.name('');
	this.nameFocused(false);
	this.edited(false);
	
	this.isOrganization(false);
	this.email('');
	this.country('');
	this.city('');
	this.company('');
	this.fax('');
	this.phone('');
	this.state('');
	this.street('');
	this.web('');
	this.zip('');	
	this.events([]);
};

CGroupModel.prototype.populate = function (oGroup)
{
	this.isNew(oGroup.isNew());

	this.uuid(oGroup.uuid());
	this.idUser(oGroup.idUser());

	this.name(oGroup.name());
	this.nameFocused(oGroup.nameFocused());
	this.edited(oGroup.edited());
	
	this.isOrganization(oGroup.isOrganization());
	this.email(oGroup.email());
	this.country(oGroup.country());
	this.city(oGroup.city());
	this.company(oGroup.company());
	this.fax(oGroup.fax());
	this.phone(oGroup.phone());
	this.state(oGroup.state());
	this.street(oGroup.street());
	this.web(oGroup.web());
	this.zip(oGroup.zip());	
};

CGroupModel.prototype.switchToNew = function ()
{
	this.clear();
	this.edited(true);
	this.isNew(true);
	if (!App.isMobile())
	{
		this.nameFocused(true);
	}
};

CGroupModel.prototype.switchToView = function ()
{
	this.edited(false);
};

/**
 * @param {array} aContactUUIDs
 * @return {Object}
 */
CGroupModel.prototype.toObject = function (aContactUUIDs)
{
	return {
		'UUID': this.uuid(),
		'Name': this.name(),
		'IsOrganization': this.isOrganization() ? '1' : '0',
		'Email': this.email(),
		'Country': this.country(),
		'City': this.city(),
		'Company': this.company(),
		'Fax': this.fax(),
		'Phone': this.phone(),
		'State': this.state(),
		'Street': this.street(),
		'Web': this.web(),
		'Zip': this.zip(),
		'Contacts': aContactUUIDs
	};
};

module.exports = CGroupModel;


/***/ }),

/***/ "PDX0":
/*!****************************************!*\
  !*** (webpack)/buildin/amd-options.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {/* globals __webpack_amd_options__ */
module.exports = __webpack_amd_options__;

/* WEBPACK VAR INJECTION */}.call(this, {}))

/***/ }),

/***/ "RpeT":
/*!*****************************************************!*\
  !*** ./modules/ContactsWebclient/js/ContactCard.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	CustomTooltip = __webpack_require__(/*! modules/CoreWebclient/js/CustomTooltip.js */ "Do20"),
	ModulesManager = __webpack_require__(/*! modules/CoreWebclient/js/ModulesManager.js */ "OgeD"),
	Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ "SQrT"),
	
	ComposeMessageToAddressesFunc = ModulesManager.run('MailWebclient', 'getComposeMessageToAddresses'),
	SearchMessagesInCurrentFolderFunc = ModulesManager.run('MailWebclient', 'getSearchMessagesInCurrentFolder'),
	
	Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
	CreateContactPopup = __webpack_require__(/*! modules/ContactsWebclient/js/popups/CreateContactPopup.js */ "be0C"),
	
	ContactsCache = __webpack_require__(/*! modules/ContactsWebclient/js/Cache.js */ "v6sP"),
	
	oContactCardsView = {
		contacts: ko.observableArray([]),
		ViewTemplate: 'ContactsWebclient_ContactCardsView',
		bAllowComposeMessageToAddresses: _.isFunction(ComposeMessageToAddressesFunc),
		searchMessagesInCurrentFolder: SearchMessagesInCurrentFolderFunc || function () {},
		bAllowSearchMessagesInCurrentFolder: _.isFunction(SearchMessagesInCurrentFolderFunc),
		add: function (aContacts) {
			var aDiffContacts = _.filter(this.contacts(), function (oContact) {
				return -1 === $.inArray(oContact.email(), _.keys(aContacts));
			});
			this.contacts(aDiffContacts.concat(_.compact(_.values(aContacts))));
		}
	}
;

Screens.showAnyView(oContactCardsView);

/**
 * @param {Object} $Element
 * @param {String} sAddress
 */
function BindContactCard($Element, sAddress)
{
	var
		$Popup = $('div.item_viewer[data-email=\'' + sAddress + '\']'),
		bPopupOpened = false,
		iCloseTimeoutId = 0,
		fOpenPopup = function () {
			if ($Popup && $Element)
			{
				bPopupOpened = true;
				clearTimeout(iCloseTimeoutId);
				setTimeout(function () {
					var
						oOffset = $Element.offset(),
						iLeft, iTop, iFitToScreenOffset
					;
					if (bPopupOpened && oOffset.left + oOffset.top !== 0)
					{
						iLeft = oOffset.left + 10;
						iTop = oOffset.top + $Element.height() + 6;
						iFitToScreenOffset = $(window).width() - (iLeft + 396); //396 - popup outer width

						if (iFitToScreenOffset > 0)
						{
							iFitToScreenOffset = 0;
						}
						$Popup.addClass('expand').offset({'top': iTop, 'left': iLeft + iFitToScreenOffset});
					}
				}, 180);
			}
		},
		fClosePopup = function () {
			if (bPopupOpened && $Popup && $Element)
			{
				bPopupOpened = false;
				iCloseTimeoutId = setTimeout(function () {
					if (!bPopupOpened)
					{
						$Popup.removeClass('expand');
					}
				}, 200);
			}
		}
	;

	if ($Popup.length > 0)
	{
		$Element
			.off()
			.on('mouseover', function () {
				$Popup
					.off()
					.on('mouseenter', fOpenPopup)
					.on('mouseleave', fClosePopup)
					.find('.link, .button')
					.off('.links')
					.on('click.links', function () {
						bPopupOpened = false;
						$Popup.removeClass('expand');
					})
				;

				setTimeout(function () {
					$Popup
						.find('.link, .button')
						.off('click.links')
						.on('click.links', function () {
							bPopupOpened = false;
							$Popup.removeClass('expand');
						});
				}.bind(this), 100);

				fOpenPopup();
			})
			.on('mouseout', fClosePopup)
		;

		bPopupOpened = false;
		$Popup.removeClass('expand');
	}
	else
	{
		$Element.off();
	}
}

function ClearElement($Element)
{
	if ($Element.next().hasClass('add_contact'))
	{
		$Element.next().remove();
	}
	$Element.removeClass('found');
	$Element.parent().removeClass('found_contact');
	$Element.off();
}

/**
 * @param {Array} aElements
 * @param {Array} aContacts
 */
function OnContactResponse(aElements, aContacts)
{
	_.each(aElements, function ($Element) {
		var
			sEmail = $Element.attr('data-email'), // $Element.data('email') returns wrong values if data-email was changed by knockoutjs
			oContact = aContacts[sEmail]
		;
		
		if (oContact !== undefined)
		{
			ClearElement($Element);
			
			if (oContact === null)
			{
				var $add = $('<span class="add_contact"></span>');
				$Element.after($add);
				CustomTooltip.init($add, 'CONTACTSWEBCLIENT/ACTION_ADD_TO_CONTACTS');
				$add.on('click', function () {
					Popups.showPopup(CreateContactPopup, [$Element.attr('data-name'), sEmail, function (aContacts) {
						_.each(aElements, function ($El) {
							if ($El.attr('data-email') === sEmail)
							{
								ClearElement($El);
								$El.addClass('found');
								$El.parent().addClass('found_contact');
								oContactCardsView.add(aContacts);
								BindContactCard($El, sEmail);
							}
						});
					}]);
				});
			}
			else
			{
				$Element.addClass('found');
				$Element.parent().addClass('found_contact');
				oContactCardsView.add(aContacts);
				BindContactCard($Element, sEmail);
			}
		}
	});
}

module.exports = {
	applyTo: function ($Addresses) {
		var
			aElements = _.map($Addresses, function (oElement) {
				return $(oElement);
			}),
			iMaxEmailCount = 100, // interface freezes if message in preview pane has too many highlighted recipients
			aEmails = _.uniq(_.map(aElements, function ($Element) {
				return $Element && $Element.attr('data-email');
			})).slice(0, iMaxEmailCount)
		;
		
		ContactsCache.getContactsByEmails(aEmails, _.bind(OnContactResponse, {}, aElements));
	}
};


/***/ }),

/***/ "YAzK":
/*!***********************************************************!*\
  !*** ./modules/ContactsWebclient/js/views/CImportView.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	CJua = __webpack_require__(/*! modules/CoreWebclient/js/CJua.js */ "mjrp"),
	UserSettings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ "hPb3"),
	
	Settings = __webpack_require__(/*! modules/ContactsWebclient/js/Settings.js */ "+JH/")
;

/**
 * @param {CContactsViewModel} oParent
 * @constructor
 */
function CImportView(oParent)
{
	this.oJua = null;
	this.oParent = oParent;

	this.visibility = ko.observable(false);
	this.importing = ko.observable(false);
	
	this.importButtonDom = ko.observable(null);
	
	this.bVisibleCloseButton = App.isMobile();
	
	this.extensionInfo = oParent.getFormatDependentText('INFO_IMPORT_CONTACTS');
}

CImportView.prototype.ViewTemplate = 'ContactsWebclient_ImportView';

CImportView.prototype.onBind = function ()
{
	var aFormats = _.map(Settings.ImportExportFormats, function (sFormat) {
		return '.' + sFormat;
	});
	this.oJua = new CJua({
		'action': '?/Api/',
		'name': 'jua-uploader',
		'queueSize': 1,
		'clickElement': this.importButtonDom(),
		'hiddenElementsPosition': UserSettings.IsRTL ? 'right' : 'left',
		'disableAjaxUpload': false,
		'disableDragAndDrop': true,
		'disableMultiple': true,
		'hidden': _.extendOwn({
			'Module': Settings.ServerModuleName,
			'Method': 'Import',
			'Parameters':  _.bind(function () {
				return JSON.stringify({
					'GroupUUID': this.oParent.currentGroupUUID(),
					'Storage': 'personal'
				});
			}, this)
		}, App.getCommonRequestParameters()),
		accept: aFormats.join(',')
	});

	this.oJua
		.on('onSelect', _.bind(this.oParent.onImportSelect, this.oParent))
		.on('onStart', _.bind(this.onFileUploadStart, this))
		.on('onComplete', _.bind(this.onFileUploadComplete, this))
	;
};

CImportView.prototype.onFileUploadStart = function ()
{
	this.importing(true);
};

/**
 * @param {string} sFileUid
 * @param {boolean} bResponseReceived
 * @param {Object} oResponse
 */
CImportView.prototype.onFileUploadComplete = function (sFileUid, bResponseReceived, oResponse)
{
	this.importing(false);
	this.oParent.onImportComplete(sFileUid, bResponseReceived, oResponse);
};

module.exports = CImportView;


/***/ }),

/***/ "be0C":
/*!*******************************************************************!*\
  !*** ./modules/ContactsWebclient/js/popups/CreateContactPopup.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	
	Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
	Routing = __webpack_require__(/*! modules/CoreWebclient/js/Routing.js */ "QaF5"),
	Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ "SQrT"),
	
	CAbstractPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/CAbstractPopup.js */ "czxF"),
	
	LinksUtils = __webpack_require__(/*! modules/ContactsWebclient/js/utils/Links.js */ "/tOA"),
	
	Ajax = __webpack_require__(/*! modules/ContactsWebclient/js/Ajax.js */ "tYdA"),
	ContactsCache = __webpack_require__(/*! modules/ContactsWebclient/js/Cache.js */ "v6sP"),
	
	HeaderItemView = __webpack_require__(/*! modules/ContactsWebclient/js/views/HeaderItemView.js */ "fG7T")
;

/**
 * @constructor
 */
function CCreateContactPopup()
{
	CAbstractPopup.call(this);
	
	this.displayName = ko.observable('');
	this.email = ko.observable('');
	this.phone = ko.observable('');
	this.address = ko.observable('');
	this.skype = ko.observable('');
	this.facebook = ko.observable('');

	this.focusDisplayName = ko.observable(false);

	this.loading = ko.observable(false);

	this.fCallback = function () {};
}

_.extendOwn(CCreateContactPopup.prototype, CAbstractPopup.prototype);

CCreateContactPopup.prototype.PopupTemplate = 'ContactsWebclient_CreateContactPopup';

/**
 * @param {string} sName
 * @param {string} sEmail
 * @param {Function} fCallback
 */
CCreateContactPopup.prototype.onOpen = function (sName, sEmail, fCallback)
{
	if (this.displayName() !== sName || this.email() !== sEmail)
	{
		this.displayName(sName);
		this.email(sEmail);
		this.phone('');
		this.address('');
		this.skype('');
		this.facebook('');
	}

	this.fCallback = $.isFunction(fCallback) ? fCallback : function () {};
};

CCreateContactPopup.prototype.onSaveClick = function ()
{
	if (!this.canBeSave())
	{
		Screens.showError(TextUtils.i18n('CONTACTSWEBCLIENT/ERROR_EMAIL_OR_NAME_BLANK'));
	}
	else if (!this.loading())
	{
		var
			oParameters = {
				'PrimaryEmail': Enums.ContactsPrimaryEmail.Personal,
				'FullName': this.displayName(),
				'PersonalEmail': this.email(),
				'PersonalPhone': this.phone(),
				'PersonalAddress': this.address(),
				'Skype': this.skype(),
				'Facebook': this.facebook(),
				'Storage': 'personal'
			}
		;

		this.loading(true);
		Ajax.send('CreateContact', { 'Contact': oParameters }, this.onCreateContactResponse, this);
	}
};


CCreateContactPopup.prototype.cancelPopup = function ()
{
	this.loading(false);
	this.closePopup();
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CCreateContactPopup.prototype.onCreateContactResponse = function (oResponse, oRequest)
{
	var oParameters = oRequest.Parameters;
	
	this.loading(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('CONTACTSWEBCLIENT/ERROR_CREATE_CONTACT'));
	}
	else
	{
		Screens.showReport(TextUtils.i18n('CONTACTSWEBCLIENT/REPORT_CONTACT_SUCCESSFULLY_ADDED'));
		ContactsCache.clearInfoAboutEmail(oParameters.Contact.PersonalEmail);
		ContactsCache.getContactsByEmails([oParameters.Contact.PersonalEmail], this.fCallback);
		this.closePopup();
		
		if (!HeaderItemView.isCurrent())
		{
			HeaderItemView.recivedAnim(true);
		}
	}
};

CCreateContactPopup.prototype.canBeSave = function ()
{
	return this.displayName() !== '' || this.email() !== '';
};

CCreateContactPopup.prototype.goToContacts = function ()
{
	ContactsCache.saveNewContactParams({
		displayName: this.displayName(),
		email: this.email(),
		phone: this.phone(),
		address: this.address(),
		skype: this.skype(),
		facebook: this.facebook()
	});
	this.closePopup();
	Routing.replaceHash(LinksUtils.getContacts('personal', '', '', 1, '', 'create-contact'));
};

module.exports = new CCreateContactPopup();


/***/ }),

/***/ "duUI":
/*!*****************************************************************!*\
  !*** ./modules/ContactsWebclient/js/SuggestionsAutocomplete.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	
	AddressUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Address.js */ "Ol7c"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	Ajax = __webpack_require__(/*! modules/ContactsWebclient/js/Ajax.js */ "tYdA")
;

/**
 * @param {object} oRequest
 * @param {function} fResponse
 * @param {string} sExceptEmail
 * @param {string} sStorage
 */
function Callback(oRequest, fResponse, sExceptEmail, sStorage, bWithGroups)
{
	var
		sTerm = oRequest.term,
		oParameters = {
			'Search': sTerm,
			'Storage': sStorage,
			'SortField': Enums.ContactSortField.Frequency,
			'SortOrder': 1,
			'WithGroups': bWithGroups ? bWithGroups : false,
			'WithoutTeamContactsDuplicates': true
		}
	;

	Ajax.send('GetContactSuggestions', oParameters, function (oResponse) {
		var aList = [];
		if (oResponse && oResponse.Result && oResponse.Result.List)
		{
			aList = _.map(oResponse.Result.List, function (oItem) {
				var
					sValue = oItem.ViewEmail,
					sLable = ""
				;
				if (oItem.FullName && 0 < $.trim(oItem.FullName).length)
				{
					if (oItem.ForSharedToAll)
					{
						sValue = oItem.FullName;
					}
					else if (oItem.IsGroup)
					{
						sLable = ('"' + oItem.FullName + '" (' + oItem.ViewEmail + ')');
						sValue = oItem.ViewEmail;
					}
					else
					{
						sValue = ('"' + oItem.FullName + '" <' + oItem.ViewEmail + '>');
					}
				}
				return oItem && oItem.ViewEmail && oItem.ViewEmail !== sExceptEmail ?
				{
					label: sLable ? sLable : sValue,
					value: sValue,
					name: oItem.FullName,
					email: oItem.ViewEmail,
					frequency: oItem.Frequency,
					id: oItem.UUID,
					storage: oItem.Storage,
					team: oItem.Storage === 'team',
					sharedToAll: oItem.Storage === 'shared',
					hasKey: oItem.HasPgpPublicKey,
					encryptMessage: oItem.PgpEncryptMessages,
					signMessage: oItem.PgpSignMessages
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
	Ajax.send('UpdateContact', { 'Contact': { 'UUID': oContact.id, 'Frequency': -1, 'Storage': oContact.storage } });
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


/***/ }),

/***/ "fG7T":
/*!**************************************************************!*\
  !*** ./modules/ContactsWebclient/js/views/HeaderItemView.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	
	CHeaderItemView = __webpack_require__(/*! modules/CoreWebclient/js/views/CHeaderItemView.js */ "Ig+v")
;

module.exports = new CHeaderItemView(TextUtils.i18n('CONTACTSWEBCLIENT/ACTION_SHOW_CONTACTS'));


/***/ }),

/***/ "fIp0":
/*!*************************************************************!*\
  !*** ./modules/CoreWebclient/js/views/CPageSwitcherView.js ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
	
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5")
;

/**
 * @constructor
 * @param {number} iCount
 * @param {number} iPerPage
 */
function CPageSwitcherView(iCount, iPerPage)
{
	this.bShown = false;
	
	this.currentPage = ko.observable(1);
	this.count = ko.observable(iCount);
	this.perPage = ko.observable(iPerPage);
	this.firstPage = ko.observable(1);
	this.lastPage = ko.observable(1);

	this.pagesCount = ko.computed(function () {
		var iCount = this.perPage() > 0 ? Math.ceil(this.count() / this.perPage()) : 0;
		return (iCount > 0) ? iCount : 1;
	}, this);

	ko.computed(function () {

		var
			iAllLimit = 20,
			iLimit = 4,
			iPagesCount = this.pagesCount(),
			iCurrentPage = this.currentPage(),
			iStart = iCurrentPage,
			iEnd = iCurrentPage
		;

		if (iPagesCount > 1)
		{
			while (true)
			{
				iAllLimit--;
				
				if (1 < iStart)
				{
					iStart--;
					iLimit--;
				}

				if (0 === iLimit)
				{
					break;
				}

				if (iPagesCount > iEnd)
				{
					iEnd++;
					iLimit--;
				}

				if (0 === iLimit)
				{
					break;
				}

				if (0 === iAllLimit)
				{
					break;
				}
			}
		}

		this.firstPage(iStart);
		this.lastPage(iEnd);
		
	}, this);

	this.visibleFirst = ko.computed(function () {
		return (this.firstPage() > 1);
	}, this);

	this.visibleLast = ko.computed(function () {
		return (this.lastPage() < this.pagesCount());
	}, this);

	this.clickPage = _.bind(this.clickPage, this);

	this.pages = ko.computed(function () {
		var
			iIndex = this.firstPage(),
			aPages = []
		;

		if (this.firstPage() < this.lastPage())
		{
			for (; iIndex <= this.lastPage(); iIndex++)
			{
				aPages.push({
					number: iIndex,
					current: (iIndex === this.currentPage()),
					clickFunc: this.clickPage
				});
			}
		}

		return aPages;
	}, this);
	
	if (!App.isMobile())
	{
		this.hotKeysBind();
	}
}

CPageSwitcherView.prototype.ViewTemplate = 'CoreWebclient_PageSwitcherView';

CPageSwitcherView.prototype.hotKeysBind = function ()
{
	$(document).on('keydown', $.proxy(function(ev) {
		if (this.bShown && !Utils.isTextFieldFocused())
		{
			var sKey = ev.keyCode;
			if (ev.ctrlKey && sKey === Enums.Key.Left)
			{
				this.clickPreviousPage();
			}
			else if (ev.ctrlKey && sKey === Enums.Key.Right)
			{
				this.clickNextPage();
			}
		}
	},this));
};

CPageSwitcherView.prototype.hide = function ()
{
	this.bShown = false;
};

CPageSwitcherView.prototype.show = function ()
{
	this.bShown = true;
};

CPageSwitcherView.prototype.clear = function ()
{
	this.currentPage(1);
	this.count(0);
};

/**
 * @param {number} iCount
 */
CPageSwitcherView.prototype.setCount = function (iCount)
{
	this.count(iCount);
	if (this.currentPage() > this.pagesCount())
	{
		this.currentPage(this.pagesCount());
	}
};

/**
 * @param {number} iPage
 * @param {number} iPerPage
 */
CPageSwitcherView.prototype.setPage = function (iPage, iPerPage)
{
	this.perPage(iPerPage);
	if (iPage > this.pagesCount())
	{
		this.currentPage(this.pagesCount());
	}
	else
	{
		this.currentPage(iPage);
	}
};

/**
 * @param {Object} oPage
 */
CPageSwitcherView.prototype.clickPage = function (oPage)
{
	var iPage = oPage.number;
	if (iPage < 1)
	{
		iPage = 1;
	}
	if (iPage > this.pagesCount())
	{
		iPage = this.pagesCount();
	}
	this.currentPage(iPage);
};

CPageSwitcherView.prototype.clickFirstPage = function ()
{
	this.currentPage(1);
};

CPageSwitcherView.prototype.clickPreviousPage = function ()
{
	var iPrevPage = this.currentPage() - 1;
	if (iPrevPage < 1)
	{
		iPrevPage = 1;
	}
	this.currentPage(iPrevPage);
};

CPageSwitcherView.prototype.clickNextPage = function ()
{
	var iNextPage = this.currentPage() + 1;
	if (iNextPage > this.pagesCount())
	{
		iNextPage = this.pagesCount();
	}
	this.currentPage(iNextPage);
};

CPageSwitcherView.prototype.clickLastPage = function ()
{
	this.currentPage(this.pagesCount());
};

module.exports = CPageSwitcherView;


/***/ }),

/***/ "hhaf":
/*!***********************************************************!*\
  !*** ./modules/ContactsWebclient/js/MainTabExtMethods.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	ContactsCache = __webpack_require__(/*! modules/ContactsWebclient/js/Cache.js */ "v6sP"),
	MainTabContactsMethods = {
		markVcardsExistentByFile: function (sFile) {
			ContactsCache.markVcardsExistentByFile(sFile);
		},
		updateVcardUid: function (sFile, sUid) {
			ContactsCache.updateVcardUid(sFile, sUid);
		}
	}
;

window.MainTabContactsMethods = MainTabContactsMethods;

module.exports = {};

/***/ }),

/***/ "kQb/":
/*!**********************************************************************!*\
  !*** ./modules/ContactsWebclient/js/views/MobileSyncSettingsView.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	Settings = __webpack_require__(/*! modules/ContactsWebclient/js/Settings.js */ "+JH/")
;

/**
 * @constructor
 */
function CMobileSyncSettingsView()
{
	this.bVisiblePersonalContacts = -1 !== $.inArray('personal', Settings.Storages);
	this.bVisibleSharedWithAllContacts = -1 !== $.inArray('shared', Settings.Storages);
	this.bVisibleTeamContacts = -1 !== $.inArray('team', Settings.Storages);

	this.davPersonalContactsUrl = ko.observable('');
	this.davCollectedAddressesUrl = ko.observable('');
	this.davSharedWithAllUrl = ko.observable('');
	this.davTeamAddressBookUrl = ko.observable('');
}

CMobileSyncSettingsView.prototype.ViewTemplate = 'ContactsWebclient_MobileSyncSettingsView';

/**
 * @param {Object} oDav
 */
CMobileSyncSettingsView.prototype.populate = function (oDav)
{
	if (oDav.Contacts)
	{
		this.davPersonalContactsUrl(oDav.Contacts.PersonalContactsUrl);
		this.davCollectedAddressesUrl(oDav.Contacts.CollectedAddressesUrl);
		this.davSharedWithAllUrl(oDav.Contacts.SharedWithAllUrl);
		this.davTeamAddressBookUrl(oDav.Contacts.TeamAddressBookUrl);
	}
};

module.exports = new CMobileSyncSettingsView();


/***/ }),

/***/ "kwPS":
/*!***********************************************!*\
  !*** ./modules/CoreWebclient/js/CSelector.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
	
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	Browser = __webpack_require__(/*! modules/CoreWebclient/js/Browser.js */ "HLSX"),
	Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh")
;

/**
 * @param {Function} list (knockout)
 * @param {Function=} fSelectCallback
 * @param {Function=} fDeleteCallback
 * @param {Function=} fDblClickCallback
 * @param {Function=} fEnterCallback
 * @param {Function=} multiplyLineFactor (knockout)
 * @param {boolean=} bResetCheckedOnClick = false
 * @param {boolean=} bCheckOnSelect = false
 * @param {boolean=} bUnselectOnCtrl = false
 * @param {boolean=} bDisableMultiplySelection = false
 * @param {boolean=} bChangeOnSelect = true
 * @constructor
 */
function CSelector(list, fSelectCallback, fDeleteCallback, fDblClickCallback, fEnterCallback, multiplyLineFactor,
	bResetCheckedOnClick, bCheckOnSelect, bUnselectOnCtrl, bDisableMultiplySelection, bChangeOnSelect)
{
	this.fSelectCallback = fSelectCallback || function() {};
	this.fDeleteCallback = fDeleteCallback || function() {};
	this.fDblClickCallback = (!App.isMobile() && fDblClickCallback) ? fDblClickCallback : function() {};
	this.fEnterCallback = fEnterCallback || function() {};
	this.bResetCheckedOnClick = !!bResetCheckedOnClick;
	this.bCheckOnSelect = !!bCheckOnSelect;
	this.bUnselectOnCtrl = !!bUnselectOnCtrl;
	this.bDisableMultiplySelection = !!bDisableMultiplySelection;
	this.bChangeOnSelect = (typeof bChangeOnSelect === 'undefined') ? true : !!bChangeOnSelect;
	
	this.useKeyboardKeys = ko.observable(false);

	this.list = ko.observableArray([]);

	if (list && list['subscribe'])
	{
		list['subscribe'](function (mValue) {
			this.list(mValue);
		}, this);
	}
	
	this.multiplyLineFactor = multiplyLineFactor;
	
	this.oLast = null;
	this.oListScope = null;
	this.oScrollScope = null;

	this.iTimer = 0;
	this.iFactor = 1;

	this.KeyUp = Enums.Key.Up;
	this.KeyDown = Enums.Key.Down;
	this.KeyLeft = Enums.Key.Up;
	this.KeyRight = Enums.Key.Down;

	if (this.multiplyLineFactor)
	{
		if (this.multiplyLineFactor.subscribe)
		{
			this.multiplyLineFactor.subscribe(function (iValue) {
				this.iFactor = 0 < iValue ? iValue : 1;
			}, this);
		}
		else
		{
			this.iFactor = Types.pInt(this.multiplyLineFactor);
		}

		this.KeyUp = Enums.Key.Up;
		this.KeyDown = Enums.Key.Down;
		this.KeyLeft = Enums.Key.Left;
		this.KeyRight = Enums.Key.Right;

		if ($('html').hasClass('rtl'))
		{
			this.KeyLeft = Enums.Key.Right;
			this.KeyRight = Enums.Key.Left;
		}
	}

	this.sActionSelector = '';
	this.sSelectabelSelector = '';
	this.sCheckboxSelector = '';

	var self = this;

	// reading returns a list of checked items.
	// recording (bool) puts all checked, or unchecked.
	this.listChecked = ko.computed({
		'read': function () {
			var aList = _.filter(this.list(), function (oItem) {
				var
					bC = oItem && oItem.checked && oItem.checked(),
					bS = oItem && oItem.selected && oItem.selected()
				;

				return bC || (self.bCheckOnSelect && bS);
			});

			return aList;
		},
		'write': function (bValue) {
			bValue = !!bValue;
			_.each(this.list(), function (oItem) {
				oItem.checked(bValue);
			});
			this.list.valueHasMutated();
		},
		'owner': this
	});

	this.checkAll = ko.computed({
		'read': function () {
			return 0 < this.listChecked().length;
		},

		'write': function (bValue) {
			this.listChecked(!!bValue);
		},
		'owner': this
	});

	this.selectorHook = ko.observable(null);

	this.selectorHook.subscribe(function () {
		var oPrev = this.selectorHook();
		if (oPrev && _.isFunction(oPrev.selected))
		{
			oPrev.selected(false);
		}
	}, this, 'beforeChange');

	this.selectorHook.subscribe(function (oGroup) {
		if (oGroup)
		{
			oGroup.selected(true);
		}
	}, this);

	this.itemSelected = ko.computed({

		'read': this.selectorHook,

		'write': function (oItemToSelect) {

			this.selectorHook(oItemToSelect);

			if (oItemToSelect)
			{
				self.scrollToSelected();
				this.oLast = oItemToSelect;
			}
		},
		'owner': this
	});

	this.list.subscribe(function (aList) {
		if (_.isArray(aList))
		{
			var	oSelected = this.itemSelected();
			if (oSelected)
			{
				if (!_.find(aList, function (oItem) {
					return oSelected === oItem;
				}))
				{
					this.itemSelected(null);
				}
			}
		}
		else
		{
			this.itemSelected(null);
		}
	}, this);

	this.listCheckedOrSelected = ko.computed({
		'read': function () {
			var
				oSelected = this.itemSelected(),
				aChecked = this.listChecked()
			;
			return 0 < aChecked.length ? aChecked : (oSelected ? [oSelected] : []);
		},
		'write': function (bValue) {
			if (!bValue)
			{
				this.itemSelected(null);
				this.listChecked(false);
			}
			else
			{
				this.listChecked(true);
			}
		},
		'owner': this
	});

	this.listCheckedAndSelected = ko.computed({
		'read': function () {
			var
				aResult = [],
				oSelected = this.itemSelected(),
				aChecked = this.listChecked()
			;

			if (aChecked)
			{
				aResult = aChecked.slice(0);
			}

			if (oSelected && _.indexOf(aChecked, oSelected) === -1)
			{
				aResult.push(oSelected);
			}

			return aResult;
		},
		'write': function (bValue) {
			if (!bValue)
			{
				this.itemSelected(null);
				this.listChecked(false);
			}
			else
			{
				this.listChecked(true);
			}
		},
		'owner': this
	});

	this.isIncompleteChecked = ko.computed(function () {
		var
			iM = this.list().length,
			iC = this.listChecked().length
		;
		return 0 < iM && 0 < iC && iM > iC;
	}, this);

	this.onKeydownBound = _.bind(this.onKeydown, this);
}

CSelector.prototype.iTimer = 0;
CSelector.prototype.bResetCheckedOnClick = false;
CSelector.prototype.bCheckOnSelect = false;
CSelector.prototype.bUnselectOnCtrl = false;
CSelector.prototype.bDisableMultiplySelection = false;

CSelector.prototype.getLastOrSelected = function ()
{
	var
		iCheckedCount = 0,
		oLastSelected = null
	;
	
	_.each(this.list(), function (oItem) {
		if (oItem.checked())
		{
			iCheckedCount++;
		}

		if (oItem.selected())
		{
			oLastSelected = oItem;
		}
	});

	return 0 === iCheckedCount && oLastSelected ? oLastSelected : this.oLast;
};

/**
 * @param {string} sActionSelector css-selector for the active for pressing regions of the list
 * @param {string} sSelectabelSelector css-selector to the item that was selected
 * @param {string} sCheckboxSelector css-selector to the element that checkbox in the list
 * @param {*} oListScope
 * @param {*} oScrollScope
 */
CSelector.prototype.initOnApplyBindings = function (sActionSelector, sSelectabelSelector, sCheckboxSelector, oListScope, oScrollScope)
{
	$(document).on('keydown', this.onKeydownBound);

	this.oListScope = oListScope;
	this.oScrollScope = oScrollScope;
	this.sActionSelector = sActionSelector;
	this.sSelectabelSelector = sSelectabelSelector;
	this.sCheckboxSelector = sCheckboxSelector;

	var
		self = this,

		fEventClickFunction = function (oLast, oItem, oEvent) {

			var
				iIndex = 0,
				iLength = 0,
				oListItem = null,
				bChangeRange = false,
				bIsInRange = false,
				aList = [],
				bChecked = false
			;

			oItem = oItem ? oItem : null;
			if (oEvent && oEvent.shiftKey)
			{
				if (null !== oItem && null !== oLast && oItem !== oLast)
				{
					aList = self.list();
					bChecked = oItem.checked();

					for (iIndex = 0, iLength = aList.length; iIndex < iLength; iIndex++)
					{
						oListItem = aList[iIndex];

						bChangeRange = false;
						if (oListItem === oLast || oListItem === oItem)
						{
							bChangeRange = true;
						}

						if (bChangeRange)
						{
							bIsInRange = !bIsInRange;
						}

						if (bIsInRange || bChangeRange)
						{
							oListItem.checked(bChecked);
						}
					}
				}
			}

			if (oItem)
			{
				self.oLast = oItem;
			}
		}
	;

	$(this.oListScope).on('dblclick', sActionSelector, function (oEvent) {
		var oItem = ko.dataFor(this);
		if (oItem && oEvent && !oEvent.ctrlKey && !oEvent.altKey && !oEvent.shiftKey)
		{
			self.onDblClick(oItem);
		}
	});

	if (Browser.mobileDevice)
	{
		$(this.oListScope).on('touchstart', sActionSelector, function (e) {

			if (!e)
			{
				return;
			}

			var
				t2 = e.timeStamp,
				t1 = $(this).data('lastTouch') || t2,
				dt = t2 - t1,
				fingers = e.originalEvent && e.originalEvent.touches ? e.originalEvent.touches.length : 0
			;

			$(this).data('lastTouch', t2);
			if (!dt || dt > 250 || fingers > 1)
			{
				return;
			}

			e.preventDefault();
			$(this).trigger('dblclick');
		});
	}

	$(this.oListScope).on('click', sActionSelector, function (oEvent) {

		var
			bClick = true,
			oSelected = null,
			oLast = self.getLastOrSelected(),
			oItem = ko.dataFor(this)
		;

		if (oItem && oEvent)
		{
			if (oEvent.shiftKey)
			{
				bClick = false;
				if (!self.bDisableMultiplySelection)
				{
					if (null === self.oLast)
					{
						self.oLast = oItem;
					}


					oItem.checked(!oItem.checked());
					fEventClickFunction(oLast, oItem, oEvent);
				}
			}
			else if (oEvent.ctrlKey)
			{
				bClick = false;
				if (!self.bDisableMultiplySelection)
				{
					self.oLast = oItem;
					oSelected = self.itemSelected();
					if (oSelected && !oSelected.checked() && !oItem.checked())
					{
						oSelected.checked(true);
					}

					if (self.bUnselectOnCtrl && oItem === self.itemSelected())
					{
						oItem.checked(!oItem.selected());
						self.itemSelected(null);
					}
					else
					{
						oItem.checked(!oItem.checked());
					}
				}
			}

			if (bClick)
			{
				self.selectionFunc(oItem);
			}
		}
	});

	$(this.oListScope).on('click', sCheckboxSelector, function (oEvent) {

		var oItem = ko.dataFor(this);
		if (oItem && oEvent && !self.bDisableMultiplySelection)
		{
			if (oEvent.shiftKey)
			{
				if (null === self.oLast)
				{
					self.oLast = oItem;
				}

				fEventClickFunction(self.getLastOrSelected(), oItem, oEvent);
			}
			else
			{
				self.oLast = oItem;
			}
		}

		if (oEvent && oEvent.stopPropagation)
		{
			oEvent.stopPropagation();
		}
	});

	$(this.oListScope).on('dblclick', sCheckboxSelector, function (oEvent) {
		if (oEvent && oEvent.stopPropagation)
		{
			oEvent.stopPropagation();
		}
	});
};

/**
 * @param {Object} oSelected
 * @param {number} iEventKeyCode
 * 
 * @return {Object}
 */
CSelector.prototype.getResultSelection = function (oSelected, iEventKeyCode)
{
	var
		self = this,
		bStop = false,
		bNext = false,
		oResult = null,
		iPageStep = this.iFactor,
		bMultiply = !!this.multiplyLineFactor,
		iIndex = 0,
		iLen = 0,
		aList = []
	;

	if (!oSelected && -1 < $.inArray(iEventKeyCode, [this.KeyUp, this.KeyDown, this.KeyLeft, this.KeyRight,
		Enums.Key.PageUp, Enums.Key.PageDown, Enums.Key.Home, Enums.Key.End]))
	{
		aList = this.list();
		if (aList && 0 < aList.length)
		{
			if (-1 < $.inArray(iEventKeyCode, [this.KeyDown, this.KeyRight, Enums.Key.PageUp, Enums.Key.Home]))
			{
				oResult = aList[0];
			}
			else if (-1 < $.inArray(iEventKeyCode, [this.KeyUp, this.KeyLeft, Enums.Key.PageDown, Enums.Key.End]))
			{
				oResult = aList[aList.length - 1];
			}
		}
	}
	else if (oSelected)
	{
		aList = this.list();
		iLen = aList ? aList.length : 0;

		if (0 < iLen)
		{
			if (
				Enums.Key.Home === iEventKeyCode || Enums.Key.PageUp === iEventKeyCode ||
				Enums.Key.End === iEventKeyCode || Enums.Key.PageDown === iEventKeyCode ||
				(bMultiply && (Enums.Key.Left === iEventKeyCode || Enums.Key.Right === iEventKeyCode)) ||
				(!bMultiply && (Enums.Key.Up === iEventKeyCode || Enums.Key.Down === iEventKeyCode))
			)
			{
				_.each(aList, function (oItem) {
					if (!bStop)
					{
						switch (iEventKeyCode) {
							case self.KeyUp:
							case self.KeyLeft:
								if (oSelected === oItem)
								{
									bStop = true;
								}
								else
								{
									oResult = oItem;
								}
								break;
							case Enums.Key.Home:
							case Enums.Key.PageUp:
								oResult = oItem;
								bStop = true;
								break;
							case self.KeyDown:
							case self.KeyRight:
								if (bNext)
								{
									oResult = oItem;
									bStop = true;
								}
								else if (oSelected === oItem)
								{
									bNext = true;
								}
								break;
							case Enums.Key.End:
							case Enums.Key.PageDown:
								oResult = oItem;
								break;
						}
					}
				});
			}
			else if (bMultiply && this.KeyDown === iEventKeyCode)
			{
				for (; iIndex < iLen; iIndex++)
				{
					if (oSelected === aList[iIndex])
					{
						iIndex += iPageStep;
						if (iLen - 1 < iIndex)
						{
							iIndex -= iPageStep;
						}

						oResult = aList[iIndex];
						break;
					}
				}
			}
			else if (bMultiply && this.KeyUp === iEventKeyCode)
			{
				for (iIndex = iLen; iIndex >= 0; iIndex--)
				{
					if (oSelected === aList[iIndex])
					{
						iIndex -= iPageStep;
						if (0 > iIndex)
						{
							iIndex += iPageStep;
						}

						oResult = aList[iIndex];
						break;
					}
				}
			}
		}
	}

	return oResult;
};

/**
 * @param {Object} oResult
 * @param {Object} oSelected
 * @param {number} iEventKeyCode
 */
CSelector.prototype.shiftClickResult = function (oResult, oSelected, iEventKeyCode)
{
	if (oSelected)
	{
		var
			bMultiply = !!this.multiplyLineFactor,
			bInRange = false,
			bSelected = false
		;

		if (-1 < $.inArray(iEventKeyCode,
			bMultiply ? [Enums.Key.Left, Enums.Key.Right] : [Enums.Key.Up, Enums.Key.Down]))
		{
			oSelected.checked(!oSelected.checked());
		}
		else if (-1 < $.inArray(iEventKeyCode, bMultiply ?
			[Enums.Key.Up, Enums.Key.Down, Enums.Key.PageUp, Enums.Key.PageDown, Enums.Key.Home, Enums.Key.End] :
			[Enums.Key.Left, Enums.Key.Right, Enums.Key.PageUp, Enums.Key.PageDown, Enums.Key.Home, Enums.Key.End]
		))
		{
			bSelected = !oSelected.checked();

			_.each(this.list(), function (oItem) {
				var Add = false;
				if (oItem === oResult || oSelected === oItem)
				{
					bInRange = !bInRange;
					Add = true;
				}

				if (bInRange || Add)
				{
					oItem.checked(bSelected);
					Add = false;
				}
			});
			
			if (bMultiply && oResult && (iEventKeyCode === Enums.Key.Up || iEventKeyCode === Enums.Key.Down))
			{
				oResult.checked(!oResult.checked());
			}
		}
	}	
};

/**
 * @param {number} iEventKeyCode
 * @param {boolean} bShiftKey
 */
CSelector.prototype.clickNewSelectPosition = function (iEventKeyCode, bShiftKey)
{
	var
		oSelected = this.itemSelected(),
		oResult = this.getResultSelection(oSelected, iEventKeyCode)
	;

	if (oResult)
	{
		if (bShiftKey)
		{
			this.shiftClickResult(oResult, oSelected, iEventKeyCode);
		}
		this.selectionFunc(oResult);
	}
};

/**
 * @param {Object} oEvent
 * 
 * @return {boolean}
 */
CSelector.prototype.onKeydown = function (oEvent)
{
	var
		bResult = true,
		iCode = 0
	;

	if (this.useKeyboardKeys() && oEvent && !Utils.isTextFieldFocused() && !Popups.hasOpenedMaximizedPopups())
	{
		iCode = oEvent.keyCode;
		if (!oEvent.ctrlKey &&
			(
				this.KeyUp === iCode || this.KeyDown === iCode ||
				this.KeyLeft === iCode || this.KeyRight === iCode ||
				Enums.Key.PageUp === iCode || Enums.Key.PageDown === iCode ||
				Enums.Key.Home === iCode || Enums.Key.End === iCode
			)
		)
		{
			this.clickNewSelectPosition(iCode, oEvent.shiftKey);
			bResult = false;
		}
		else if (Enums.Key.Del === iCode && !oEvent.ctrlKey && !oEvent.shiftKey)
		{
			if (0 < this.list().length)
			{
				this.onDelete();
				bResult = false;
			}
		}
		else if (Enums.Key.Enter === iCode)
		{
			if (0 < this.list().length && !oEvent.ctrlKey)
			{
				this.onEnter(this.itemSelected());
				bResult = false;
			}
		}
		else if (oEvent.ctrlKey && !oEvent.altKey && !oEvent.shiftKey && Enums.Key.a === iCode)
		{
			this.checkAll(!(this.checkAll() && !this.isIncompleteChecked()));
			bResult = false;
		}
	}

	return bResult;
};

CSelector.prototype.onDelete = function ()
{
	this.fDeleteCallback.call(this, this.listCheckedOrSelected());
};

/**
 * @param {Object} oItem
 */
CSelector.prototype.onEnter = function (oItem)
{
	if (oItem)
	{
		this.fEnterCallback.call(this, oItem);
	}
};

/**
 * @param {Object} oItem
 */
CSelector.prototype.selectionFunc = function (oItem)
{
	if (this.bChangeOnSelect)
	{
		this.itemSelected(null);
	}
	if (this.bResetCheckedOnClick)
	{
		this.listChecked(false);
	}
	if (this.bChangeOnSelect)
	{
		this.itemSelected(oItem);
	}
	this.fSelectCallback.call(this, oItem);
};

/**
 * @param {Object} oItem
 */
CSelector.prototype.onDblClick = function (oItem)
{
	this.fDblClickCallback.call(this, oItem);
};

CSelector.prototype.koCheckAll = function ()
{
	return ko.computed({
		'read': this.checkAll,
		'write': this.checkAll,
		'owner': this
	});
};

CSelector.prototype.koCheckAllIncomplete = function ()
{
	return ko.computed({
		'read': this.isIncompleteChecked,
		'write': this.isIncompleteChecked,
		'owner': this
	});
};

/**
 * @return {boolean}
 */
CSelector.prototype.scrollToSelected = function ()
{
	if (!this.oListScope || !this.oScrollScope)
	{
		return false;
	}

	var
		iOffset = 20,
		oSelected = $(this.sSelectabelSelector, this.oScrollScope),
		oPos = oSelected.position(),
		iVisibleHeight = this.oScrollScope.height(),
		iSelectedHeight = oSelected.outerHeight()
	;

	if (oPos && (oPos.top < 0 || oPos.top + iSelectedHeight > iVisibleHeight))
	{
		if (oPos.top < 0)
		{
			this.oScrollScope.scrollTop(this.oScrollScope.scrollTop() + oPos.top - iOffset);
		}
		else
		{
			this.oScrollScope.scrollTop(this.oScrollScope.scrollTop() + oPos.top - iVisibleHeight + iSelectedHeight + iOffset);
		}

		return true;
	}

	return false;
};

module.exports = CSelector;


/***/ }),

/***/ "mjrp":
/*!******************************************!*\
  !*** ./modules/CoreWebclient/js/CJua.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	_ = __webpack_require__(/*! underscore */ "F/us"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),

	queue = __webpack_require__(/*! modules/CoreWebclient/js/vendors/queue.js */ "w+bY"),
	
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	UserSettings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ "hPb3"),
	
	Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
	AlertPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/AlertPopup.js */ "1grR"),
	
	iDefLimit = UserSettings.MultipleFilesUploadLimit;
;
/**
 * @param {*} mValue
 * @return {boolean}
 */
function isUndefined(mValue)
{
	return 'undefined' === typeof mValue;
}

/**
 * @param {*} oParent
 * @param {*} oDescendant
 *
 * @return {boolean}
 */
function contains(oParent, oDescendant)
{
	var bResult = false;
	if (oParent && oDescendant)
	{
		if (oParent === oDescendant)
		{
			bResult = true;
		}
		else if (oParent.contains)
		{
			bResult = oParent.contains(oDescendant);
		}
		else
		{
			/*jshint bitwise: false*/
			bResult = oDescendant.compareDocumentPosition ?
				!!(oDescendant.compareDocumentPosition(oParent) & 8) : false;
			/*jshint bitwise: true*/
		}
	}

	return bResult;
}

function mainClearTimeout(iTimer)
{
	if (0 < iTimer)
	{
		clearTimeout(iTimer);
	}

	iTimer = 0;
}

/**
 * @param {Event} oEvent
 * @return {?Event}
 */
function getEvent(oEvent)
{
	oEvent = (oEvent && (oEvent.originalEvent ?
		oEvent.originalEvent : oEvent)) || window.event;

	return oEvent.dataTransfer ? oEvent : null;
}

/**
 * @param {Object} oValues
 * @param {string} sKey
 * @param {?} mDefault
 * @return {?}
 */
function getValue(oValues, sKey, mDefault)
{
	return (!oValues || !sKey || isUndefined(oValues[sKey])) ? mDefault : oValues[sKey];
}

/**
 * @param {Object} oOwner
 * @param {string} sPublicName
 * @param {*} mObject
 */
function setValue(oOwner, sPublicName, mObject)
{
	oOwner[sPublicName] = mObject;
}

/**
 * @param {Function} fFunction
 * @param {Object=} oScope
 * @return {Function}
 */
function scopeBind(fFunction, oScope)
{
	return function () {
		return fFunction.apply(isUndefined(oScope) ? null : oScope,
			Array.prototype.slice.call(arguments));
	};
}

/**
 * @param {number=} iLen
 * @return {string}
 */
function fakeMd5(iLen)
{
	var
		sResult = '',
		sLine = '0123456789abcdefghijklmnopqrstuvwxyz'
	;

	iLen = isUndefined(iLen) ? 32 : Types.pInt(iLen);

	while (sResult.length < iLen)
	{
		sResult += sLine.substr(Math.round(Math.random() * sLine.length), 1);
	}

	return sResult;
}

/**
 * @return {string}
 */
function getNewUid()
{
	return 'jua-uid-' + fakeMd5(16) + '-' + (new Date()).getTime().toString();
}

/**
 * @param {*} oFile
 * @param {string=} sPath
 * @return {Object}
 */
function getDataFromFile(oFile, sPath)
{
	var
		sFileName = isUndefined(oFile.fileName) ? (isUndefined(oFile.name) ? null : oFile.name) : oFile.fileName,
		iSize = isUndefined(oFile.fileSize) ? (isUndefined(oFile.size) ? null : oFile.size) : oFile.fileSize,
		sType = isUndefined(oFile.type) ? null : oFile.type
	;

	return {
		'FileName': sFileName,
		'Size': iSize,
		'Type': sType,
		'Folder': isUndefined(sPath) ? '' : sPath,
		'File' : oFile
	};
}

/**
 * @param {*} aItems
 * @param {Function} fFileCallback
 * @param {boolean=} bEntry = false
 * @param {boolean=} bAllowFolderDragAndDrop = true
 * @param {number=} iLimit = 20
 * @param {Function=} fLimitCallback
 */
function getDataFromFiles(aItems, fFileCallback, bEntry, bAllowFolderDragAndDrop, iLimit, fLimitCallback)
{
	var
		iInputLimit = 0,
		iLen = 0,
		iIndex = 0,
		oItem = null,
		oEntry = null,
		bUseLimit = false,
		bCallLimit = false,
		fTraverseFileTree = function (oItem, sPath, fCallback, fLimitCallbackProxy) {

			if (oItem && !isUndefined(oItem['name']))
			{
				sPath = sPath || '';
				if (oItem['isFile'])
				{
					oItem.file(function (oFile) {
						if (!bUseLimit || 0 <= --iLimit)
						{
							fCallback(getDataFromFile(oFile, sPath));
						}
						else if (bUseLimit && !bCallLimit)
						{
							if (0 > iLimit && fLimitCallback)
							{
								bCallLimit = true;
								fLimitCallback(iInputLimit);
							}
						}
					});
				}
				else if (bAllowFolderDragAndDrop && oItem['isDirectory'] && oItem['createReader'])
				{
					var
						oDirReader = oItem['createReader'](),
						iIndex = 0,
						iLen = 0
					;

					if (oDirReader && oDirReader['readEntries'])
					{
						oDirReader['readEntries'](function (aEntries) {
							if (aEntries && Types.isNonEmptyArray(aEntries))
							{
								for (iIndex = 0, iLen = aEntries.length; iIndex < iLen; iIndex++)
								{
									fTraverseFileTree(aEntries[iIndex], sPath + oItem['name'] + '/', fCallback, fLimitCallbackProxy);
								}
							}
						});
					}
				}
			}
		}
	;

	bAllowFolderDragAndDrop = isUndefined(bAllowFolderDragAndDrop) ? true : !!bAllowFolderDragAndDrop;

	bEntry = isUndefined(bEntry) ? false : !!bEntry;
	iLimit = isUndefined(iLimit) ? iDefLimit : Types.pInt(iLimit);
	iInputLimit = iLimit;
	bUseLimit = 0 < iLimit;

	aItems = aItems && 0 < aItems.length ? aItems : null;
	if (aItems)
	{
		for (iIndex = 0, iLen = aItems.length; iIndex < iLen; iIndex++)
		{
			oItem = aItems[iIndex];
			if (oItem)
			{
				if (bEntry)
				{
					if ('file' === oItem['kind'] && oItem['webkitGetAsEntry'])
					{
						oEntry = oItem['webkitGetAsEntry']();
						if (oEntry)
						{
							fTraverseFileTree(oEntry, '', fFileCallback, fLimitCallback);
						}
					}
				}
				else
				{
					if (!bUseLimit || 0 <= --iLimit)
					{
						fFileCallback(getDataFromFile(oItem));
					}
					else if (bUseLimit && !bCallLimit)
					{
						if (0 > iLimit && fLimitCallback)
						{
							bCallLimit = true;
							fLimitCallback(iInputLimit);
						}
					}
				}
			}
		}
	}
}

/**
 * @param {*} oInput
 * @param {Function} fFileCallback
 * @param {number=} iLimit = 20
 * @param {Function=} fLimitCallback
 */
function getDataFromInput(oInput, fFileCallback, iLimit, fLimitCallback)
{
	var aFiles = oInput && oInput.files && 0 < oInput.files.length ? oInput.files : null;
	if (aFiles)
	{
		getDataFromFiles(aFiles, fFileCallback, false, false, iLimit, fLimitCallback);
	}
	else
	{
		fFileCallback({
			'FileName': oInput.value.split('\\').pop().split('/').pop(),
			'Size': null,
			'Type': null,
			'Folder': '',
			'File' : null
		});
	}
}

function eventContainsFiles(oEvent)
{
	var bResult = false;
	if (oEvent && oEvent.dataTransfer && oEvent.dataTransfer.types && oEvent.dataTransfer.types.length)
	{
		var
			iIindex = 0,
			iLen = oEvent.dataTransfer.types.length
		;

		for (; iIindex < iLen; iIindex++)
		{
			if (oEvent.dataTransfer.types[iIindex].toLowerCase() === 'files')
			{
				bResult = true;
				break;
			}
		}
	}

	return bResult;
}

/**
 * @param {Event} oEvent
 * @param {Function} fFileCallback
 * @param {number=} iLimit = 20
 * @param {Function=} fLimitCallback
 * @param {boolean=} bAllowFolderDragAndDrop = true
 */
function getDataFromDragEvent(oEvent, fFileCallback, iLimit, fLimitCallback, bAllowFolderDragAndDrop)
{
	var
		aItems = null,
		aFiles = null
	;

	oEvent = getEvent(oEvent);
	if (oEvent)
	{
		aItems = (oEvent.dataTransfer ? getValue(oEvent.dataTransfer, 'items', null) : null) || getValue(oEvent, 'items', null);
		if (aItems && 0 < aItems.length && aItems[0] && aItems[0]['webkitGetAsEntry'])
		{
			getDataFromFiles(aItems, fFileCallback, true, bAllowFolderDragAndDrop, iLimit, fLimitCallback);
		}
		else if (eventContainsFiles(oEvent))
		{
			aFiles = (getValue(oEvent, 'files', null) || (oEvent.dataTransfer ?
				getValue(oEvent.dataTransfer, 'files', null) : null));

			if (aFiles && 0 < aFiles.length)
			{
				getDataFromFiles(aFiles, fFileCallback, false, false, iLimit, fLimitCallback);
			}
		}
	}
}

function createNextLabel()
{
	return $('<label style="' +
'position: absolute; background-color:#fff; right: 0px; top: 0px; left: 0px; bottom: 0px; margin: 0px; padding: 0px; cursor: pointer;' +
	'"></label>').css({
		'opacity': 0
	});
}

/**
 * @param {string} sInputPos
 * @param {string=} sAccept = ''
 * @return {?Object}
 */
function createNextInput(sInputPos, sAccept)
{
	if (sAccept !== '')
	{
		sAccept = ' accept="' + sAccept + '"';
	}
	return $('<input type="file" tabindex="-1" hidefocus="hidefocus" style="position: absolute; ' + sInputPos + ': -9999px;"' + sAccept + ' />');
}

/**
 * @param {string=} sName
 * @param {boolean=} bMultiple = true
 * @param {string=} sInputPos = 'left'
 * @param {string=} sAccept = ''
 * @return {?Object}
 */
function getNewInput(sName, bMultiple, sInputPos, sAccept)
{
	sName = isUndefined(sName) ? '' : sName.toString();
	sInputPos = isUndefined(sInputPos) ? 'left' : sInputPos.toString();
	sAccept = isUndefined(sAccept) ? '' : sAccept.toString();

	var oLocal = createNextInput(sInputPos, sAccept);
	if (0 < sName.length)
	{
		oLocal.attr('name', sName);
	}

	if (isUndefined(bMultiple) ? true : bMultiple)
	{
		oLocal.prop('multiple', true);
	}

	return oLocal;
}

/**
 * @param {?} mStringOrFunction
 * @param {Array=} aFunctionParams
 * @return {string}
 */
function getStringOrCallFunction(mStringOrFunction, aFunctionParams)
{
	return Types.pString(_.isFunction(mStringOrFunction) ? 
		mStringOrFunction.apply(null, _.isArray(aFunctionParams) ? aFunctionParams : []) :
		mStringOrFunction);
}

/**
 * @constructor
 * @param {CJua} oJua
 * @param {Object} oOptions
 */
function AjaxDriver(oJua, oOptions)
{
	this.oXhrs = {};
	this.oUids = {};
	this.oJua = oJua;
	this.oOptions = oOptions;
}

/**
 * @type {Object}
 */
AjaxDriver.prototype.oXhrs = {};

/**
 * @type {Object}
 */
AjaxDriver.prototype.oUids = {};

/**
 * @type {?CJua}
 */
AjaxDriver.prototype.oJua = null;

/**
 * @type {Object}
 */
AjaxDriver.prototype.oOptions = {};

/**
 * @return {boolean}
 */
AjaxDriver.prototype.isDragAndDropSupported = function ()
{
	return true;
};

/**
 * @param {string} sUid
 */
AjaxDriver.prototype.regTaskUid = function (sUid)
{
	this.oUids[sUid] = true;
};

/**
 * @param {string} sUid
 * @param {object} oFileInfo
 * @param {object} oParsedHiddenParameters
 * @param {function} fCallback
 * @param {boolean} bSkipCompleteFunction
 * @param {boolean} bUseResponce
 * @param {number} iProgressOffset
 * @returns {Boolean}
 */
AjaxDriver.prototype.uploadTask = function (sUid, oFileInfo, oParsedHiddenParameters, fCallback, bSkipCompleteFunction, bUseResponce, iProgressOffset)
{
	if (false === this.oUids[sUid] || !oFileInfo || !oFileInfo['File'])
	{
		fCallback(null, sUid);
		return false;
	}

	try
	{
		var
			self = this,
			oXhr = new XMLHttpRequest(),
			oFormData = new FormData(),
			sAction = getValue(this.oOptions, 'action', ''),
			aHidden = _.clone(getValue(this.oOptions, 'hidden', {})),
			fStartFunction = this.oJua.getEvent('onStart'),
			fCompleteFunction = this.oJua.getEvent('onComplete'),
			fProgressFunction = this.oJua.getEvent('onProgress')
		;

		oXhr.open('POST', sAction, true);
		oXhr.setRequestHeader('Authorization', 'Bearer ' + $.cookie('AuthToken'));
		oXhr.setRequestHeader('X-Client', 'WebClient');
		
		if (fProgressFunction && oXhr.upload)
		{
			oXhr.upload.onprogress = function (oEvent) {
				if (oEvent && oEvent.lengthComputable && !isUndefined(oEvent.loaded) && !isUndefined(oEvent.total))
				{
					if (typeof iProgressOffset === 'undefined')
					{
						fProgressFunction(sUid, oEvent.loaded, oEvent.total);
					}
					else
					{
						fProgressFunction(sUid, (iProgressOffset + oEvent.loaded) > oFileInfo.Size ? oFileInfo.Size : iProgressOffset + oEvent.loaded, oFileInfo.Size);
					}
				}
			};
		}

		oXhr.onreadystatechange = function () {
			if (4 === oXhr.readyState && 200 === oXhr.status)
			{
				if (fCompleteFunction && !bSkipCompleteFunction)
				{
					var
						bResult = false,
						oResult = null
					;

					try
					{
						oResult = $.parseJSON(oXhr.responseText);
						bResult = true;
					}
					catch (oException)
					{
						oResult = null;
					}

					fCompleteFunction(sUid, bResult, oResult);
				}

				if (!isUndefined(self.oXhrs[sUid]))
				{
					self.oXhrs[sUid] = null;
				}

				if (bUseResponce)
				{
					fCallback(oXhr.responseText, sUid);
				}
				else
				{
					fCallback(null, sUid);
				}
			}
			else
			{
				if (4 === oXhr.readyState)
				{
					fCompleteFunction(sUid, false, null);
					fCallback(null, sUid);
				}
			}
		};

		if (fStartFunction)
		{
			fStartFunction(sUid);
		}

		oFormData.append('jua-post-type', 'ajax');
		oFormData.append(getValue(this.oOptions, 'name', 'juaFile'), oFileInfo['File'], oFileInfo['FileName']);
		
		//extending jua hidden parameters with file hidden parameters
		oParsedHiddenParameters =  _.extend(oParsedHiddenParameters, oFileInfo.Hidden || {});
		aHidden.Parameters = JSON.stringify(oParsedHiddenParameters);
		$.each(aHidden, function (sKey, mValue) {
			oFormData.append(sKey, getStringOrCallFunction(mValue, [oFileInfo]));
		});

		oXhr.send(oFormData);

		this.oXhrs[sUid] = oXhr;
		return true;
	}
	catch (oError)
	{
		if (window.console)
		{
			window.console.error(oError);
		}
	}

	fCallback(null, sUid);
	return false;
};

AjaxDriver.prototype.generateNewInput = function (oClickElement)
{
	var
		self = this,
		oLabel = null,
		oInput = null
	;

	if (oClickElement)
	{
		oInput = getNewInput('', !getValue(this.oOptions, 'disableMultiple', false), getValue(this.oOptions, 'hiddenElementsPosition', 'left'), getValue(this.oOptions, 'accept', ''));
		oLabel = createNextLabel();
		oLabel.append(oInput);

		$(oClickElement).append(oLabel);

		oInput
			.on('click', function (event) {

				if (!self.oJua.bEnableButton)
				{
					event.preventDefault();
					return;
				}
				var fOn = self.oJua.getEvent('onDialog');
				if (fOn)
				{
					fOn();
				}
			})
			.on('change', function () {
				getDataFromInput(this, function (oFile) {
						self.oJua.addNewFile(oFile);
						self.generateNewInput(oClickElement);

						setTimeout(function () {
							oLabel.remove();
						}, 10);
					},
					getValue(self.oOptions, 'multipleSizeLimit', iDefLimit),
					self.oJua.getEvent('onLimitReached')
				);
			})
		;
	}
};

AjaxDriver.prototype.cancel = function (sUid)
{
	this.oUids[sUid] = false;
	if (this.oXhrs[sUid])
	{
		try
		{
			if (this.oXhrs[sUid].abort)
			{
				this.oXhrs[sUid].abort();
			}
		}
		catch (oError)
		{
		}

		this.oXhrs[sUid] = null;
	}
};

/**
 * @constructor
 * @param {CJua} oJua
 * @param {Object} oOptions
 */
function IframeDriver(oJua, oOptions)
{
	this.oUids = {};
	this.oForms = {};
	this.oJua = oJua;
	this.oOptions = oOptions;
}

/**
 * @type {Object}
 */
IframeDriver.prototype.oUids = {};

/**
 * @type {Object}
 */
IframeDriver.prototype.oForms = {};

/**
 * @type {?CJua}
 */
IframeDriver.prototype.oJua = null;

/**
 * @type {Object}
 */
IframeDriver.prototype.oOptions = {};

/**
 * @return {boolean}
 */
IframeDriver.prototype.isDragAndDropSupported = function ()
{
	return false;
};

/**
 * @param {string} sUid
 */
IframeDriver.prototype.regTaskUid = function (sUid)
{
	this.oUids[sUid] = true;
};

/**
 * @param {string} sUid
 * @param {object} oFileInfo
 * @param {object} oParsedHiddenParameters
 * @param {function} fCallback
 * @param {boolean} bSkipCompleteFunction
 * @param {boolean} bUseResponce
 * @param {number} iProgressOffset
 * @returns {Boolean}
 */
IframeDriver.prototype.uploadTask = function (sUid, oFileInfo, oParsedHiddenParameters, fCallback, bSkipCompleteFunction, bUseResponce, iProgressOffset)
{
	if (false === this.oUids[sUid])
	{
		fCallback(null, sUid);
		return false;
	}

	var
		oForm = this.oForms[sUid],
		aHidden = _.clone(getValue(this.oOptions, 'hidden', {})),
		fStartFunction = this.oJua.getEvent('onStart'),
		fCompleteFunction = this.oJua.getEvent('onComplete')
	;

	if (oForm)
	{
		oForm.append($('<input type="hidden" />').attr('name', 'jua-post-type').val('iframe'));
		
		//extending jua hidden parameters with file hidden parameters
		oParsedHiddenParameters =  _.extend(oParsedHiddenParameters, oFileInfo.Hidden || {});
		aHidden.Parameters = JSON.stringify(oParsedHiddenParameters);
		$.each(aHidden, function (sKey, sValue) {
			oForm.append($('<input type="hidden" />').attr('name', sKey).val(getStringOrCallFunction(sValue, [oFileInfo])));
		});

		oForm.trigger('submit');
		if (fStartFunction)
		{
			fStartFunction(sUid);
		}

		oForm.find('iframe').on('load', function (oEvent) {

			var
				bResult = false,
				oIframeDoc = null,
				oResult = {}
			;

			if (fCompleteFunction)
			{
				try
				{
					oIframeDoc = this.contentDocument ? this.contentDocument: this.contentWindow.document;
					oResult = $.parseJSON(oIframeDoc.body.innerHTML);
					bResult = true;
				}
				catch (oErr)
				{
					oResult = {};
				}

				fCompleteFunction(sUid, bResult, oResult);
			}

			fCallback(null, sUid);

			window.setTimeout(function () {
				oForm.remove();
			}, 100);
		});
	}
	else
	{
		fCallback(null, sUid);
	}

	return true;
};

IframeDriver.prototype.generateNewInput = function (oClickElement)
{
	var
		self = this,
		sUid = '',
		oInput = null,
		oIframe = null,
		sAction = getValue(this.oOptions, 'action', ''),
		oForm = null,
		sPos = getValue(this.oOptions, 'hiddenElementsPosition', 'left')
	;

	if (oClickElement)
	{
		sUid = getNewUid();

		oInput = getNewInput(getValue(this.oOptions, 'name', 'juaFile'), !getValue(this.oOptions, 'disableMultiple', false), getValue(this.oOptions, 'hiddenElementsPosition', 'left'), getValue(this.oOptions, 'accept', ''));

		oForm = $('<form action="' + sAction + '" target="iframe-' + sUid + '" ' +
' method="POST" enctype="multipart/form-data" style="display: block; cursor: pointer;"></form>');

		oIframe = $('<iframe name="iframe-' + sUid + '" tabindex="-1" src="javascript:void(0);" ' +
' style="position: absolute; top: -1000px; ' + sPos + ': -1000px; cursor: pointer;" />').css({'opacity': 0});

		oForm.append(createNextLabel().append(oInput)).append(oIframe);

		$(oClickElement).append(oForm);

		this.oForms[sUid] = oForm;

		oInput
			.on('click', function (event) {
				if (!self.oJua.bEnableButton)
				{
					event.preventDefault();
					return;
				}
				var fOn = self.oJua.getEvent('onDialog');
				if (fOn)
				{
					fOn();
				}
			})
			.on('change', function () {
				getDataFromInput(this, function (oFile) {
						if (oFile)
						{
							var sPos = getValue(self.oOptions, 'hiddenElementsPosition', 'left');

							oForm.css({
								'position': 'absolute',
								'top': -1000
							});

							oForm.css(sPos, -1000);

							self.oJua.addFile(sUid, oFile);
							self.generateNewInput(oClickElement);
						}

					},
					getValue(self.oOptions, 'multipleSizeLimit', iDefLimit),
					self.oJua.getEvent('onLimitReached')
				);
			})
		;
	}
};

IframeDriver.prototype.cancel = function (sUid)
{
	this.oUids[sUid] = false;
	if (this.oForms[sUid])
	{
		this.oForms[sUid].remove();
		this.oForms[sUid] = false;
	}
};

/**
 * @constructor
 * @param {Object=} oOptions
 */
function CJua(oOptions)
{
	oOptions = isUndefined(oOptions) ? {} : oOptions;

	var self = this;

	self.bEnableDnD = true;
	self.bEnableButton = true;

	self.oEvents = {
		'onDialog': null,
		'onSelect': null,
		'onStart': null,
		'onComplete': null,
		'onCompleteAll': null,
		'onProgress': null,
		'onDragEnter': null,
		'onDragLeave': null,
		'onDrop': null,
		'onBodyDragEnter': null,
		'onBodyDragLeave': null,
		'onLimitReached': function () {
			Popups.showPopup(AlertPopup, [TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_NUMBER_LIMIT_PLURAL', {
				'NUMBERLIMIT': iDefLimit
			}, null, iDefLimit)]);
		}
	};

	self.oOptions = _.extend({
		'action': '',
		'name': '',
		'hidden': {},
		'queueSize': 10,
		'clickElement': false,
		'dragAndDropElement': false,
		'dragAndDropBodyElement': false,
		'disableAjaxUpload': false,
		'disableFolderDragAndDrop': true,
		'disableDragAndDrop': false,
		'disableMultiple': false,
		'disableDocumentDropPrevent': false,
		'disableAutoUploadOnDrop': false,
		'multipleSizeLimit': iDefLimit,
		'hiddenElementsPosition': 'left'
	}, oOptions);
	
	self.oQueue = queue(Types.pInt(getValue(self.oOptions, 'queueSize', 10)));
	if (self.runEvent('onCompleteAll'))
	{
		self.oQueue.await(function () {
			self.runEvent('onCompleteAll');
		});
	}

	self.oDriver = self.isAjaxUploaderSupported() && !getValue(self.oOptions, 'disableAjaxUpload', false) ?
		new AjaxDriver(self, self.oOptions) : new IframeDriver(self, self.oOptions);

	self.oClickElement = getValue(self.oOptions, 'clickElement', null);

	if (self.oClickElement)
	{
		$(self.oClickElement).css({
			'position': 'relative',
			'overflow': 'hidden'
		});

		if ('inline' === $(this.oClickElement).css('display'))
		{
			$(this.oClickElement).css('display', 'inline-block');
		}

		this.oDriver.generateNewInput(this.oClickElement);
	}

	if (this.oDriver.isDragAndDropSupported() && getValue(this.oOptions, 'dragAndDropElement', false) &&
		!getValue(this.oOptions, 'disableAjaxUpload', false))
	{
		(function (self) {
			var
				$doc = $(document),
				oBigDropZone = $(getValue(self.oOptions, 'dragAndDropBodyElement', false) || $doc),
				oDragAndDropElement = getValue(self.oOptions, 'dragAndDropElement', false),
				fHandleDragOver = function (oEvent) {
					if (self.bEnableDnD && oEvent)
					{
						oEvent = getEvent(oEvent);
						if (oEvent && oEvent.dataTransfer && eventContainsFiles(oEvent))
						{
							try
							{
								var sEffect = oEvent.dataTransfer.effectAllowed;

								mainClearTimeout(self.iDocTimer);

								oEvent.dataTransfer.dropEffect = (sEffect === 'move' || sEffect === 'linkMove') ? 'move' : 'copy';

								oEvent.stopPropagation();
								oEvent.preventDefault();

								oBigDropZone.trigger('dragover', oEvent);
							}
							catch (oExc) {}
						}
					}
				},
				fHandleDrop = function (oEvent) {
					if (self.bEnableDnD && oEvent)
					{
						oEvent = getEvent(oEvent);
						if (oEvent && eventContainsFiles(oEvent))
						{
							oEvent.preventDefault();

							getDataFromDragEvent(
								oEvent,
								function (oFile) {
									if (oFile)
									{
										if (getValue(self.oOptions, 'disableAutoUploadOnDrop', false)) {
											self.runEvent('onDrop', [
												oFile,
												oEvent,
												function () {
													self.addNewFile(oFile);
													mainClearTimeout(self.iDocTimer);
												}
											]);
										}
										else
										{
											self.runEvent('onDrop', [oFile, oEvent]);
											self.addNewFile(oFile);
											mainClearTimeout(self.iDocTimer);
										}
									}
								},
								getValue(self.oOptions, 'multipleSizeLimit', iDefLimit),
								self.getEvent('onLimitReached'),
								!getValue(self.oOptions, 'disableFolderDragAndDrop', true)
							);
						}
					}

					self.runEvent('onDragLeave', [oEvent]);
				},
				fHandleDragEnter = function (oEvent) {
					if (self.bEnableDnD && oEvent)
					{
						oEvent = getEvent(oEvent);
						if (oEvent && eventContainsFiles(oEvent))
						{
							mainClearTimeout(self.iDocTimer);

							oEvent.preventDefault();
							self.runEvent('onDragEnter', [oDragAndDropElement, oEvent]);
						}
					}
				},
				fHandleDragLeave = function (oEvent) {
					if (self.bEnableDnD && oEvent)
					{
						oEvent = getEvent(oEvent);
						if (oEvent)
						{
							var oRelatedTarget = document['elementFromPoint'] ? document['elementFromPoint'](oEvent['clientX'], oEvent['clientY']) : null;
							if (oRelatedTarget && contains(this, oRelatedTarget))
							{
								return;
							}

							mainClearTimeout(self.iDocTimer);
							self.runEvent('onDragLeave', [oDragAndDropElement, oEvent]);
						}

						return;
					}
				}
			;

			if (oDragAndDropElement)
			{
				if (!getValue(self.oOptions, 'disableDocumentDropPrevent', false))
				{
					$doc.on('dragover', function (oEvent) {
						if (self.bEnableDnD && oEvent)
						{
							oEvent = getEvent(oEvent);
							if (oEvent && oEvent.dataTransfer && eventContainsFiles(oEvent))
							{
								try
								{
									oEvent.dataTransfer.dropEffect = 'none';
									oEvent.preventDefault();
								}
								catch (oExc) {}
							}
						}
					});
				}

				if (oBigDropZone && oBigDropZone[0])
				{
					oBigDropZone
						.on('dragover', function (oEvent) {
							if (self.bEnableDnD && oEvent)
							{
								mainClearTimeout(self.iDocTimer);
							}
						})
						.on('dragenter', function (oEvent) {
							if (self.bEnableDnD && oEvent)
							{
								oEvent = getEvent(oEvent);
								if (oEvent && eventContainsFiles(oEvent))
								{
									mainClearTimeout(self.iDocTimer);
									oEvent.preventDefault();

									self.runEvent('onBodyDragEnter', [oEvent]);
								}
							}
						})
						.on('dragleave', function (oEvent) {
							if (self.bEnableDnD && oEvent)
							{
								oEvent = getEvent(oEvent);
								if (oEvent)
								{
									mainClearTimeout(self.iDocTimer);
									self.iDocTimer = setTimeout(function () {
										self.runEvent('onBodyDragLeave', [oEvent]);
									}, 200);
								}
							}
						})
						.on('drop', function (oEvent) {
							if (self.bEnableDnD && oEvent)
							{
								oEvent = getEvent(oEvent);
								if (oEvent)
								{
									var bFiles = eventContainsFiles(oEvent);
									if (bFiles)
									{
										oEvent.preventDefault();
									}

									self.runEvent('onBodyDragLeave', [oEvent]);

									return !bFiles;
								}
							}

							return false;
						})
					;
				}

				$(oDragAndDropElement)
					.bind('dragenter', fHandleDragEnter)
					.bind('dragover', fHandleDragOver)
					.bind('dragleave', fHandleDragLeave)
					.bind('drop', fHandleDrop)
				;
			}

		}(self));
	}
	else
	{
		self.bEnableDnD = false;
	}

	setValue(self, 'on', self.on);
	setValue(self, 'cancel', self.cancel);
	setValue(self, 'isDragAndDropSupported', self.isDragAndDropSupported);
	setValue(self, 'isAjaxUploaderSupported', self.isAjaxUploaderSupported);
	setValue(self, 'setDragAndDropEnabledStatus', self.setDragAndDropEnabledStatus);
}

/**
 * @type {boolean}
 */
CJua.prototype.bEnableDnD = true;

/**
 * @type {number}
 */
CJua.prototype.iDocTimer = 0;

/**
 * @type {Object}
 */
CJua.prototype.oOptions = {};

/**
 * @type {Object}
 */
CJua.prototype.oEvents = {};

/**
 * @type {?Object}
 */
CJua.prototype.oQueue = null;

/**
 * @type {?Object}
 */
CJua.prototype.oDriver = null;

/**
 * @param {string} sName
 * @param {Function} fFunc
 */
CJua.prototype.on = function (sName, fFunc)
{
	this.oEvents[sName] = fFunc;
	return this;
};

/**
 * @param {string} sName
 * @param {string=} aArgs
 */
CJua.prototype.runEvent = function (sName, aArgs)
{
	if (this.oEvents[sName])
	{
		this.oEvents[sName].apply(null, aArgs || []);
	}
};

/**
 * @param {string} sName
 */
CJua.prototype.getEvent = function (sName)
{
	return this.oEvents[sName] || null;
};

/**
 * @param {string} sUid
 */
CJua.prototype.cancel = function (sUid)
{
	this.oDriver.cancel(sUid);
};

/**
 * @return {boolean}
 */
CJua.prototype.isAjaxUploaderSupported = function ()
{
	return (function () {
		var oInput = document.createElement('input');
		oInput.type = 'file';
		return !!('XMLHttpRequest' in window && 'multiple' in oInput && 'FormData' in window && (new XMLHttpRequest()).upload && true);
	}());
};

/**
 * @param {boolean} bEnabled
 */
CJua.prototype.setDragAndDropEnabledStatus = function (bEnabled)
{
	this.bEnableDnD = !!bEnabled;
};

/**
 * @return {boolean}
 */
CJua.prototype.isDragAndDropSupported = function ()
{
	return this.oDriver.isDragAndDropSupported();
};

/**
 * @param {Object} oFileInfo
 */
CJua.prototype.addNewFile = function (oFileInfo)
{
	this.addFile(getNewUid(), oFileInfo);
};

/**
 * @param {string} sUid
 * @param {Object} oFileInfo
 */
CJua.prototype.addFile = function (sUid, oFileInfo)
{
	var
		fOnSelect = this.getEvent('onSelect'),
		fOnChunkReadyCallback = null,
		bBreakUpload = false,
		aHidden = getValue(this.oOptions, 'hidden', {}),
		fCompleteFunction = this.getEvent('onComplete'),
		fRegularUploadFileCallback = _.bind(function (sUid, oFileInfo) {
			var
				aHidden = getValue(this.oOptions, 'hidden', {}),
				oParsedHiddenParameters = JSON.parse(getStringOrCallFunction(aHidden.Parameters, [oFileInfo]))
			;
			this.oDriver.regTaskUid(sUid);
			this.oQueue.defer(scopeBind(this.oDriver.uploadTask, this.oDriver), sUid, oFileInfo, oParsedHiddenParameters);
		}, this),
		fCancelFunction = this.getEvent('onCancel')
	;
	if (oFileInfo && (!fOnSelect || (false !== fOnSelect(sUid, oFileInfo))))
	{
		// fOnChunkReadyCallback runs when chunk ready for uploading
		fOnChunkReadyCallback = _.bind(function (sUid, oFileInfo, fProcessNextChunkCallback, iCurrChunk, iChunkNumber, iProgressOffset) {
			var fOnUploadCallback = null;
			// fOnUploadCallback runs when server have responded for upload
			fOnUploadCallback = function (sResponse, sFileUploadUid)
			{
				var oResponse = null;
				
				try
				{ // Suppress exceptions in the connection failure case 
					oResponse = $.parseJSON(sResponse);
				}
				catch (err)
				{
				}

				if (oResponse && oResponse.Result && !oResponse.Result.Error && !oResponse.ErrorCode)
				{//if response contains result and have no errors
					fProcessNextChunkCallback(sUid, fOnChunkReadyCallback);
				}
				else if (oResponse && oResponse.Result && oResponse.Result.Error)
				{
					App.broadcastEvent('Jua::FileUploadingError');
					fCompleteFunction(sFileUploadUid, false, {ErrorCode: oResponse.Result.Error});
				}
				else if (oResponse && oResponse.ErrorCode)
				{
					App.broadcastEvent('Jua::FileUploadingError');
					fCompleteFunction(sFileUploadUid, false, {ErrorCode: oResponse.ErrorCode});
				}
				else
				{
					App.broadcastEvent('Jua::FileUploadingError');
					fCompleteFunction(sFileUploadUid, false);
				}
			};
			
			var
				aHidden = getValue(this.oOptions, 'hidden', {}),
				oParsedHiddenParameters = JSON.parse(getStringOrCallFunction(aHidden.Parameters, [oFileInfo]))
			;
			this.oDriver.regTaskUid(sUid);
			this.oDriver.uploadTask(sUid, oFileInfo, oParsedHiddenParameters, fOnUploadCallback, iCurrChunk < iChunkNumber, true, iProgressOffset);
		}, this);
		var
			isUploadAvailable = ko.observable(true),
			oParsedHiddenParameters = JSON.parse(getStringOrCallFunction(aHidden.Parameters, [oFileInfo]))
		;
		App.broadcastEvent('Jua::FileUpload::isUploadAvailable', {
			isUploadAvailable: isUploadAvailable,
			sModuleName: aHidden.Module,
			sUid: sUid,
			oFileInfo: oFileInfo
		});
		if (isUploadAvailable())
		{
			bBreakUpload = App.broadcastEvent('Jua::FileUpload::before', {
				sUid: sUid,
				oFileInfo: oFileInfo,
				fOnChunkReadyCallback: fOnChunkReadyCallback,
				sModuleName: aHidden.Module,
				fRegularUploadFileCallback: fRegularUploadFileCallback,
				fCancelFunction: fCancelFunction,
				sStorageType: oParsedHiddenParameters.Type
			});

			if (bBreakUpload === false)
			{
				fRegularUploadFileCallback(sUid, oFileInfo);
			}
		}
		else if(_.isFunction(fCancelFunction))
		{
			fCancelFunction(sUid);
		}
	}
	else
	{
		this.oDriver.cancel(sUid);
	}
};

/**
 * @param {string} sName
 * @param {mixed} mValue
 */
CJua.prototype.setOption = function (sName, mValue)
{
	this.oOptions[sName] = mValue;
};

module.exports = CJua;


/***/ }),

/***/ "nKlx":
/*!************************************************!*\
  !*** ./modules/CoreWebclient/js/utils/Date.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
			
	DateUtils = {}
;

DateUtils.getMonthNamesArray = function ()
{
	var
		aMonthes = TextUtils.i18n('COREWEBCLIENT/LIST_MONTH_NAMES').split(' '),
		iLen = 12,
		iIndex = aMonthes.length
	;
	
	for (; iIndex < iLen; iIndex++)
	{
		aMonthes[iIndex] = '';
	}
	
	return aMonthes;
};

/**
 * @param {number} iMonth
 * @param {number} iYear
 * 
 * @return {number}
 */
DateUtils.daysInMonth = function (iMonth, iYear)
{
	if (0 < iMonth && 13 > iMonth && 0 < iYear)
	{
		return new Date(iYear, iMonth, 0).getDate();
	}

	return 31;
};

module.exports = DateUtils;


/***/ }),

/***/ "tYdA":
/*!**********************************************!*\
  !*** ./modules/ContactsWebclient/js/Ajax.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ "o0Bx"),
	
	Settings = __webpack_require__(/*! modules/ContactsWebclient/js/Settings.js */ "+JH/")
;

Ajax.registerAbortRequestHandler(Settings.ServerModuleName, function (oRequest, oOpenedRequest) {
	switch (oRequest.Method)
	{
		case 'GetContacts':
			return oOpenedRequest.Method === 'GetContacts';
		case 'GetContact':
			return oOpenedRequest.Method === 'GetContact';
	}
	
	return false;
});

module.exports = {
	send: function (sMethod, oParameters, fResponseHandler, oContext, oMainParams) {
		Ajax.send(Settings.ServerModuleName, sMethod, oParameters, fResponseHandler, oContext, undefined, oMainParams);
	}
};


/***/ }),

/***/ "tgQO":
/*!**************************************************************!*\
  !*** ./modules/ContactsWebclient/js/models/CContactModel.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	moment = __webpack_require__(/*! moment */ "wd/R"),
	
	AddressUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Address.js */ "Ol7c"),
	DateUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Date.js */ "nKlx"),
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	Ajax = __webpack_require__(/*! modules/ContactsWebclient/js/Ajax.js */ "tYdA"),
	
	Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	
	CDateModel = __webpack_require__(/*! modules/CoreWebclient/js/models/CDateModel.js */ "5hOJ"),
	
	Settings = __webpack_require__(/*! modules/ContactsWebclient/js/Settings.js */ "+JH/"),

	ModulesManager = __webpack_require__(/*! modules/CoreWebclient/js/ModulesManager.js */ "OgeD")
;

/**
 * @constructor
 */
function CContactModel()
{
	// Important: if new fields are added they should be added to clear method as well. Otherwise create contact functionality might work incorrectly.

	this.sEmailDefaultType = Enums.ContactsPrimaryEmail.Personal;
	this.sPhoneDefaultType = Enums.ContactsPrimaryPhone.Mobile;
	this.sAddressDefaultType = Enums.ContactsPrimaryAddress.Personal;
	
	this.uuid = ko.observable('');
	this.idUser = ko.observable('');
	this.team = ko.observable(false);
	this.itsMe = ko.observable(false);
	this.storage = ko.observable('personal');

	this.isNew = ko.observable(false);
	this.readOnly = ko.observable(false);
	this.edited = ko.observable(false);
	this.extented = ko.observable(false);
	this.personalCollapsed = ko.observable(false);
	this.businessCollapsed = ko.observable(false);
	this.otherCollapsed = ko.observable(false);
	this.pgpSettingsCollapsed = ko.observable(false);
	this.groupsCollapsed = ko.observable(false);

	this.displayName = ko.observable('');
	this.firstName = ko.observable('');
	this.lastName = ko.observable('');
	this.nickName = ko.observable('');

	this.skype = ko.observable('');
	this.facebook = ko.observable('');

	this.displayNameFocused = ko.observable(false);

	this.primaryEmail = ko.observable(this.sEmailDefaultType);
	this.primaryPhone = ko.observable(this.sPhoneDefaultType);
	this.primaryAddress = ko.observable(this.sAddressDefaultType);

	this.mainPrimaryEmail = ko.computed({
		'read': this.primaryEmail,
		'write': function (mValue) {
			if (mValue && 0 <= $.inArray(mValue, [Enums.ContactsPrimaryEmail.Personal, Enums.ContactsPrimaryEmail.Business, Enums.ContactsPrimaryEmail.Other]))
			{
				this.primaryEmail(mValue);
			}
			else
			{
				this.primaryEmail(Enums.ContactsPrimaryEmail.Personal);
			}
		},
		'owner': this
	});

	this.mainPrimaryPhone = ko.computed({
		'read': this.primaryPhone,
		'write': function (mValue) {
			if (mValue && 0 <= $.inArray(mValue, [Enums.ContactsPrimaryPhone.Mobile, Enums.ContactsPrimaryPhone.Personal, Enums.ContactsPrimaryPhone.Business]))
			{
				this.primaryPhone(mValue);
			}
			else
			{
				this.primaryPhone(Enums.ContactsPrimaryPhone.Mobile);
			}
		},
		'owner': this
	});
	
	this.mainPrimaryAddress = ko.computed({
		'read': this.primaryAddress,
		'write': function (mValue) {
			if (mValue && 0 <= $.inArray(mValue, [Enums.ContactsPrimaryAddress.Personal, Enums.ContactsPrimaryAddress.Business]))
			{
				this.primaryAddress(mValue);
			}
			else
			{
				this.primaryAddress(Enums.ContactsPrimaryAddress.Personal);
			}
		},
		'owner': this
	});

	this.personalEmail = ko.observable('');
	this.personalStreetAddress = ko.observable('');
	this.personalCity = ko.observable('');
	this.personalState = ko.observable('');
	this.personalZipCode = ko.observable('');
	this.personalCountry = ko.observable('');
	this.personalWeb = ko.observable('');
	this.personalFax = ko.observable('');
	this.personalPhone = ko.observable('');
	this.personalMobile = ko.observable('');

	this.businessEmail = ko.observable('');
	this.businessCompany = ko.observable('');
	this.businessDepartment = ko.observable('');
	this.businessJob = ko.observable('');
	this.businessOffice = ko.observable('');
	this.businessStreetAddress = ko.observable('');
	this.businessCity = ko.observable('');
	this.businessState = ko.observable('');
	this.businessZipCode = ko.observable('');
	this.businessCountry = ko.observable('');
	this.businessWeb = ko.observable('');
	this.businessFax = ko.observable('');
	this.businessPhone = ko.observable('');

	this.otherEmail = ko.observable('');
	this.otherBirthMonth = ko.observable(0);
	this.otherBirthDay = ko.observable(0);
	this.otherBirthYear = ko.observable(0);
	this.otherNotes = ko.observable('');
	this.etag = ko.observable('');
	
	this.isOpenPgpEnabled = ModulesManager.run('OpenPgpWebclient', 'isOpenPgpEnabled') || ko.observable(false);

	this.publicPgpKeyView = ko.observable('');
	this.publicPgpKey = ko.observable('');
	this.pgpEncryptMessages = ko.observable(false);
	this.pgpSignMessages = ko.observable(false);

	this.publicPgpKey.subscribe(function (sValue) {
		if (sValue !== '')
		{
			ModulesManager.run('OpenPgpWebclient', 'getKeyInfo', [sValue, function (oKey) {
				if (oKey)
				{
					this.publicPgpKeyView(oKey.getUser() + ' (' + oKey.getBitSize() + '-bit)');
				}
				else
				{
					this.publicPgpKeyView('');
				}
			}.bind(this)]);
		}
		else
		{
			this.publicPgpKeyView('');
		}
	}, this);

	this.sharedToAll = ko.observable(false);

	this.birthdayIsEmpty = ko.computed(function () {
		var
			bMonthEmpty = 0 === this.otherBirthMonth(),
			bDayEmpty = 0 === this.otherBirthDay(),
			bYearEmpty = 0 === this.otherBirthYear()
		;

		return (bMonthEmpty || bDayEmpty || bYearEmpty);
	}, this);
	
	this.otherBirthday = ko.computed(function () {
		var
			sBirthday = '',
			iYear = this.otherBirthYear(),
			iMonth = this.otherBirthMonth(),
			iDay = this.otherBirthDay(),
			oDateModel = new CDateModel()
		;
		
		if (!this.birthdayIsEmpty())
		{
			var fullYears = moment().diff(moment(iYear + '/' + iMonth + '/' + iDay, "YYYY/MM/DD"), 'years'),
				text = TextUtils.i18n('CONTACTSWEBCLIENT/LABEL_YEARS_PLURAL', {
					'COUNT': fullYears
				}, null, fullYears)
			;
			oDateModel.setDate(iYear, 0 < iMonth ? iMonth - 1 : 0, iDay);
			sBirthday = oDateModel.getShortDate() + ' (' + text + ')';
		}
		
		return sBirthday;
	}, this);

	this.groups = ko.observableArray([]);

	this.groupsIsEmpty = ko.computed(function () {
		return 0 === this.groups().length;
	}, this);

	this.email = ko.computed({
		'read': function () {
			var sResult = '';
			switch (this.primaryEmail()) {
				case Enums.ContactsPrimaryEmail.Personal:
					sResult = this.personalEmail();
					break;
				case Enums.ContactsPrimaryEmail.Business:
					sResult = this.businessEmail();
					break;
				case Enums.ContactsPrimaryEmail.Other:
					sResult = this.otherEmail();
					break;
			}
			return sResult;
		},
		'write': function (sEmail) {
			switch (this.primaryEmail()) {
				case Enums.ContactsPrimaryEmail.Personal:
					this.personalEmail(sEmail);
					break;
				case Enums.ContactsPrimaryEmail.Business:
					this.businessEmail(sEmail);
					break;
				case Enums.ContactsPrimaryEmail.Other:
					this.otherEmail(sEmail);
					break;
				default:
					this.primaryEmail(this.sEmailDefaultType);
					this.email(sEmail);
					break;
			}
		},
		'owner': this
	});

	this.personalIsEmpty = ko.computed(function () {
		var sPersonalEmail = (this.personalEmail() !== this.email()) ? this.personalEmail() : '';
		return '' === '' + sPersonalEmail +
			this.personalStreetAddress() +
			this.personalCity() +
			this.personalState() +
			this.personalZipCode() +
			this.personalCountry() +
			this.personalWeb() +
			this.personalFax() +
			this.personalPhone() +
			this.personalMobile()
		;
	}, this);

	this.businessIsEmpty = ko.computed(function () {
		var sBusinessEmail = (this.businessEmail() !== this.email()) ? this.businessEmail() : '';
		return '' === '' + sBusinessEmail +
			this.businessCompany() +
			this.businessDepartment() +
			this.businessJob() +
			this.businessOffice() +
			this.businessStreetAddress() +
			this.businessCity() +
			this.businessState() +
			this.businessZipCode() +
			this.businessCountry() +
			this.businessWeb() +
			this.businessFax() +
			this.businessPhone()
		;
	}, this);

	this.otherIsEmpty = ko.computed(function () {
		var sOtherEmail = (this.otherEmail() !== this.email()) ? this.otherEmail() : '';
		return ('' === ('' + sOtherEmail + this.otherNotes())) && this.birthdayIsEmpty();
	}, this);
	
	this.pgpSettingsEmpty = ko.computed(function () {
		return typeof this.publicPgpKey() !== 'string' || this.publicPgpKey() === '';
	}, this);
	
	this.phone = ko.computed({
		'read': function () {
			var sResult = '';
			switch (this.primaryPhone()) {
				case Enums.ContactsPrimaryPhone.Mobile:
					sResult = this.personalMobile();
					break;
				case Enums.ContactsPrimaryPhone.Personal:
					sResult = this.personalPhone();
					break;
				case Enums.ContactsPrimaryPhone.Business:
					sResult = this.businessPhone();
					break;
			}
			return sResult;
		},
		'write': function (sPhone) {
			switch (this.primaryPhone()) {
				case Enums.ContactsPrimaryPhone.Mobile:
					this.personalMobile(sPhone);
					break;
				case Enums.ContactsPrimaryPhone.Personal:
					this.personalPhone(sPhone);
					break;
				case Enums.ContactsPrimaryPhone.Business:
					this.businessPhone(sPhone);
					break;
				default:
					this.primaryPhone(this.sEmailDefaultType);
					this.phone(sPhone);
					break;
			}
		},
		'owner': this
	});
	
	this.address = ko.computed({
		'read': function () {
			var sResult = '';
			switch (this.primaryAddress()) {
				case Enums.ContactsPrimaryAddress.Personal:
					sResult = this.personalStreetAddress();
					break;
				case Enums.ContactsPrimaryAddress.Business:
					sResult = this.businessStreetAddress();
					break;
			}
			return sResult;
		},
		'write': function (sAddress) {
			switch (this.primaryAddress()) {
				case Enums.ContactsPrimaryAddress.Personal:
					this.personalStreetAddress(sAddress);
					break;
				case Enums.ContactsPrimaryAddress.Business:
					this.businessStreetAddress(sAddress);
					break;
				default:
					this.primaryAddress(this.sEmailDefaultType);
					this.address(sAddress);
					break;
			}
		},
		'owner': this
	});

	this.emails = ko.computed(function () {
		var aList = [];
		
		if ('' !== this.personalEmail())
		{
			aList.push({'text': TextUtils.i18n('CONTACTSWEBCLIENT/LABEL_PERSONAL') + ': ' + this.personalEmail(), 'value': Enums.ContactsPrimaryEmail.Personal});
		}
		if ('' !== this.businessEmail())
		{
			aList.push({'text': TextUtils.i18n('CONTACTSWEBCLIENT/LABEL_BUSINESS') + ': ' + this.businessEmail(), 'value': Enums.ContactsPrimaryEmail.Business});
		}
		if ('' !== this.otherEmail())
		{
			aList.push({'text': TextUtils.i18n('CONTACTSWEBCLIENT/LABEL_OTHER') + ': ' + this.otherEmail(), 'value': Enums.ContactsPrimaryEmail.Other});
		}

		return aList;

	}, this);

	this.phones = ko.computed(function () {
		var aList = [];

		if ('' !== this.personalMobile())
		{
			aList.push({'text': TextUtils.i18n('CONTACTSWEBCLIENT/LABEL_MOBILE') + ': ' + this.personalMobile(), 'value': Enums.ContactsPrimaryPhone.Mobile});
		}
		if ('' !== this.personalPhone())
		{
			aList.push({'text': TextUtils.i18n('CONTACTSWEBCLIENT/LABEL_PERSONAL') + ': ' + this.personalPhone(), 'value': Enums.ContactsPrimaryPhone.Personal});
		}
		if ('' !== this.businessPhone())
		{
			aList.push({'text': TextUtils.i18n('CONTACTSWEBCLIENT/LABEL_BUSINESS') + ': ' + this.businessPhone(), 'value': Enums.ContactsPrimaryPhone.Business});
		}
		return aList;

	}, this);
	
	this.addresses = ko.computed(function () {
		var aList = [];

		if ('' !== this.personalStreetAddress())
		{
			aList.push({'text': TextUtils.i18n('CONTACTSWEBCLIENT/LABEL_PERSONAL') + ': ' + this.personalStreetAddress(), 'value': Enums.ContactsPrimaryAddress.Personal});
		}
		if ('' !== this.businessStreetAddress())
		{
			aList.push({'text': TextUtils.i18n('CONTACTSWEBCLIENT/LABEL_BUSINESS') + ': ' + this.businessStreetAddress(), 'value': Enums.ContactsPrimaryAddress.Business});
		}
		return aList;

	}, this);

	this.hasEmails = ko.computed(function () {
		return 0 < this.emails().length;
	}, this);
	
	this.allowSendThisContact = ko.computed(function () {
		return Settings.SaveVcfServerModuleName !== '';
	}, this);

	this.extented.subscribe(function (bValue) {
		if (bValue)
		{
			this.personalCollapsed(!this.personalIsEmpty());
			this.businessCollapsed(!this.businessIsEmpty());
			this.otherCollapsed(!this.otherIsEmpty());
			this.pgpSettingsCollapsed(!this.pgpSettingsEmpty());
			this.groupsCollapsed(!this.groupsIsEmpty());
		}
	}, this);

	this.birthMonthSelect = CContactModel.birthMonthSelect;
	
	this.birthDaySelect = ko.computed(function () {
		var
			iIndex = 1,
			iDaysInMonth = DateUtils.daysInMonth(this.otherBirthMonth(), this.otherBirthYear()),
			aList = [{'text': TextUtils.i18n('COREWEBCLIENT/LABEL_DAY'), 'value': 0}]
		;

		for (; iIndex <= iDaysInMonth; iIndex++)
		{
			aList.push({'text': iIndex.toString(), 'value': iIndex});
		}

		return aList;
	}, this);
	
	this.birthYearSelect = [
		{'text': TextUtils.i18n('CONTACTSWEBCLIENT/LABEL_YEAR'), 'value': 0}
	];
	for (var iCurrYear = (new Date()).getFullYear(), iIndex = iCurrYear, iFirstYear = iCurrYear - 100; iIndex >= iFirstYear; iIndex--)
	{
		this.birthYearSelect.push({ 'text': iIndex.toString(), 'value': iIndex });
	}
	
	this.canBeSave = ko.computed(function () {
		return this.displayName() !== '' || !!this.emails().length;
	}, this);
}

CContactModel.aBirthdayMonths = DateUtils.getMonthNamesArray();

CContactModel.birthMonthSelect = [
	{'text': TextUtils.i18n('COREWEBCLIENT/LABEL_MONTH'), value: 0},
	{'text': CContactModel.aBirthdayMonths[0], value: 1},
	{'text': CContactModel.aBirthdayMonths[1], value: 2},
	{'text': CContactModel.aBirthdayMonths[2], value: 3},
	{'text': CContactModel.aBirthdayMonths[3], value: 4},
	{'text': CContactModel.aBirthdayMonths[4], value: 5},
	{'text': CContactModel.aBirthdayMonths[5], value: 6},
	{'text': CContactModel.aBirthdayMonths[6], value: 7},
	{'text': CContactModel.aBirthdayMonths[7], value: 8},
	{'text': CContactModel.aBirthdayMonths[8], value: 9},
	{'text': CContactModel.aBirthdayMonths[9], value: 10},
	{'text': CContactModel.aBirthdayMonths[10], value: 11},
	{'text': CContactModel.aBirthdayMonths[11], value: 12}
];

CContactModel.prototype.clear = function ()
{
	this.uuid('');
	this.idUser('');
	this.team(false);
	this.itsMe(false);
	this.storage('');

	this.isNew(false);
	this.readOnly(false);
	this.edited(false);
	this.extented(false);
	this.personalCollapsed(false);
	this.businessCollapsed(false);
	this.otherCollapsed(false);
	this.pgpSettingsCollapsed(false);
	this.groupsCollapsed(false);

	this.displayName('');
	this.firstName('');
	this.lastName('');
	this.nickName('');

	this.skype('');
	this.facebook('');

	this.displayNameFocused(false);

	this.primaryEmail(this.sEmailDefaultType);
	this.primaryPhone(this.sPhoneDefaultType);
	this.primaryAddress(this.sAddressDefaultType);

	this.personalEmail('');
	this.personalStreetAddress('');
	this.personalCity('');
	this.personalState('');
	this.personalZipCode('');
	this.personalCountry('');
	this.personalWeb('');
	this.personalFax('');
	this.personalPhone('');
	this.personalMobile('');

	this.businessEmail('');
	this.businessCompany('');
	this.businessDepartment('');
	this.businessJob('');
	this.businessOffice('');
	this.businessStreetAddress('');
	this.businessCity('');
	this.businessState('');
	this.businessZipCode('');
	this.businessCountry('');
	this.businessWeb('');
	this.businessFax('');
	this.businessPhone('');

	this.otherEmail('');
	this.otherBirthMonth(0);
	this.otherBirthDay(0);
	this.otherBirthYear(0);
	this.otherNotes('');
	this.etag('');

	this.publicPgpKeyView('');
	this.publicPgpKey('');
	this.pgpEncryptMessages(false);
	this.pgpSignMessages(false);

	this.sharedToAll(false);

	this.groups([]);
};

CContactModel.prototype.switchToNew = function ()
{
	this.clear();
	this.edited(true);
	this.extented(false);
	this.isNew(true);
	if (!App.isMobile())
	{
		this.displayNameFocused(true);
	}
};

CContactModel.prototype.switchToView = function ()
{
	this.edited(false);
	this.extented(false);
};

/**
 * @return {Object}
 */
CContactModel.prototype.toObject = function ()
{
	var oResult = {
		'UUID': this.uuid(),
		'PrimaryEmail': this.primaryEmail(),
		'PrimaryPhone': this.primaryPhone(),
		'PrimaryAddress': this.primaryAddress(),
		'FullName': this.displayName(),
		'FirstName': this.firstName(),
		'LastName': this.lastName(),
		'NickName': this.nickName(),

		'Storage': this.storage(),

		'Skype': this.skype(),
		'Facebook': this.facebook(),

		'PersonalEmail': this.personalEmail(),
		'PersonalAddress': this.personalStreetAddress(),
		'PersonalCity': this.personalCity(),
		'PersonalState': this.personalState(),
		'PersonalZip': this.personalZipCode(),
		'PersonalCountry': this.personalCountry(),
		'PersonalWeb': this.personalWeb(),
		'PersonalFax': this.personalFax(),
		'PersonalPhone': this.personalPhone(),
		'PersonalMobile': this.personalMobile(),

		'BusinessEmail': this.businessEmail(),
		'BusinessCompany': this.businessCompany(),
		'BusinessJobTitle': this.businessJob(),
		'BusinessDepartment': this.businessDepartment(),
		'BusinessOffice': this.businessOffice(),
		'BusinessAddress': this.businessStreetAddress(),
		'BusinessCity': this.businessCity(),
		'BusinessState': this.businessState(),
		'BusinessZip': this.businessZipCode(),
		'BusinessCountry': this.businessCountry(),
		'BusinessFax': this.businessFax(),
		'BusinessPhone': this.businessPhone(),
		'BusinessWeb': this.businessWeb(),

		'OtherEmail': this.otherEmail(),
		'Notes': this.otherNotes(),
		'ETag': this.etag(),
		'BirthDay': this.otherBirthDay(),
		'BirthMonth': this.otherBirthMonth(),
		'BirthYear': this.otherBirthYear(),
		
		'PublicPgpKey': this.publicPgpKey(),
		'PgpEncryptMessages': this.pgpEncryptMessages(),
		'PgpSignMessages': this.pgpSignMessages(),
	
		'GroupUUIDs': this.groups()
	};

	return oResult;
};

/**
 * @param {Object} oData
 */
CContactModel.prototype.parse = function (oData)
{
	this.uuid(Types.pString(oData.UUID));
	this.idUser(Types.pString(oData.IdUser));

	this.team(oData.Storage === 'team');
	this.storage(Types.pString(oData.Storage));
	this.itsMe(!!oData.ItsMe);
	this.readOnly(!!oData.ReadOnly);

	this.displayName(Types.pString(oData.FullName));
	this.firstName(Types.pString(oData.FirstName));
	this.lastName(Types.pString(oData.LastName));
	this.nickName(Types.pString(oData.NickName));

	this.skype(Types.pString(oData.Skype));
	this.facebook(Types.pString(oData.Facebook));

	this.primaryEmail(Types.pInt(oData.PrimaryEmail));
	this.primaryPhone(Types.pInt(oData.PrimaryPhone));
	this.primaryAddress(Types.pInt(oData.PrimaryAddress));

	this.personalEmail(Types.pString(oData.PersonalEmail));
	this.personalStreetAddress(Types.pString(oData.PersonalAddress));
	this.personalCity(Types.pString(oData.PersonalCity));
	this.personalState(Types.pString(oData.PersonalState));
	this.personalZipCode(Types.pString(oData.PersonalZip));
	this.personalCountry(Types.pString(oData.PersonalCountry));
	this.personalWeb(Types.pString(oData.PersonalWeb));
	this.personalFax(Types.pString(oData.PersonalFax));
	this.personalPhone(Types.pString(oData.PersonalPhone));
	this.personalMobile(Types.pString(oData.PersonalMobile));

	this.businessEmail(Types.pString(oData.BusinessEmail));
	this.businessCompany(Types.pString(oData.BusinessCompany));
	this.businessDepartment(Types.pString(oData.BusinessDepartment));
	this.businessJob(Types.pString(oData.BusinessJobTitle));
	this.businessOffice(Types.pString(oData.BusinessOffice));
	this.businessStreetAddress(Types.pString(oData.BusinessAddress));
	this.businessCity(Types.pString(oData.BusinessCity));
	this.businessState(Types.pString(oData.BusinessState));
	this.businessZipCode(Types.pString(oData.BusinessZip));
	this.businessCountry(Types.pString(oData.BusinessCountry));
	this.businessWeb(Types.pString(oData.BusinessWeb));
	this.businessFax(Types.pString(oData.BusinessFax));
	this.businessPhone(Types.pString(oData.BusinessPhone));

	this.otherEmail(Types.pString(oData.OtherEmail));
	this.otherBirthMonth(Types.pInt(oData.BirthMonth));
	this.otherBirthDay(Types.pInt(oData.BirthDay));
	this.otherBirthYear(Types.pInt(oData.BirthYear));
	this.otherNotes(Types.pString(oData.Notes));

	this.etag(Types.pString(oData.ETag));

	this.publicPgpKey(Types.pString(oData['OpenPgpWebclient::PgpKey']));
	this.pgpEncryptMessages(Types.pBool(oData['OpenPgpWebclient::PgpEncryptMessages']));
	this.pgpSignMessages(Types.pBool(oData['OpenPgpWebclient::PgpSignMessages']));

	this.sharedToAll(oData.Storage === 'shared');

	if (_.isArray(oData.GroupUUIDs))
	{
		this.groups(oData.GroupUUIDs);
	}
};

/**
 * @param {string} sEmail
 * @return {string}
 */
CContactModel.prototype.getFullEmail = function (sEmail)
{
	if (!Types.isNonEmptyString(sEmail))
	{
		sEmail = this.email();
	}
	return AddressUtils.getFullEmail(this.displayName(), sEmail);
};

CContactModel.prototype.getEmailsString = function ()
{
	return _.uniq(_.without([this.email(), this.personalEmail(), this.businessEmail(), this.otherEmail()], '')).join(',');
};

CContactModel.prototype.sendThisContact = function ()
{
	var
		ModulesManager = __webpack_require__(/*! modules/CoreWebclient/js/ModulesManager.js */ "OgeD"),
		fComposeMessageWithAttachments = ModulesManager.run('MailWebclient', 'getComposeMessageWithAttachments'),
		oParameters = {
			'UUID': this.uuid(),
			'FileName': 'contact-' + this.getFullEmail().replace('"', '').replace('<', '').replace('>', '') + '.vcf'
		}
	;

	Ajax.send('SaveContactAsTempFile', oParameters, function (oResponse) {
		if (oResponse.Result)
		{
			if (_.isFunction(fComposeMessageWithAttachments))
			{
				fComposeMessageWithAttachments([oResponse.Result]);
			}
		}
		else
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('CONTACTSWEBCLIENT/ERROR_CONTACT_AS_TEMPFAILE'));
		}
	}, this);
};

/**
 * @param {?} mLink
 * @return {boolean}
 */
CContactModel.prototype.isStrLink = function (mLink)
{
	return (/^http/).test(mLink);
};

module.exports = CContactModel;


/***/ }),

/***/ "uN/E":
/*!*******************************************************!*\
  !*** ./modules/CoreWebclient/js/vendors/FileSaver.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.3.2
 * 2016-06-16 18:25:19
 *
 * By Eli Grey, http://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = new MouseEvent("click");
			node.dispatchEvent(event);
		}
		, is_safari = /constructor/i.test(view.HTMLElement) || view.safari
		, is_chrome_ios =/CriOS\/[\d]+/.test(navigator.userAgent)
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
		, arbitrary_revoke_timeout = 1000 * 40 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			setTimeout(revoker, arbitrary_revoke_timeout);
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, auto_bom = function(blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob([String.fromCharCode(0xFEFF), blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, force = type === force_saveable_type
				, object_url
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
						// Safari doesn't allow downloading of blob urls
						var reader = new FileReader();
						reader.onloadend = function() {
							var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
							var popup = view.open(url, '_blank');
							if(!popup) view.location.href = url;
							url=undefined; // release reference before dispatching
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
						};
						reader.readAsDataURL(blob);
						filesaver.readyState = filesaver.INIT;
						return;
					}
					// don't create more object URLs than needed
					if (!object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (force) {
						view.location.href = object_url;
					} else {
						var opened = view.open(object_url, "_blank");
						if (!opened) {
							// Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
							view.location.href = object_url;
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
			;
			filesaver.readyState = filesaver.INIT;

			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				setTimeout(function() {
					save_link.href = object_url;
					save_link.download = name;
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				});
				return;
			}

			fs_error();
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name, no_auto_bom) {
			return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
		}
	;
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function(blob, name, no_auto_bom) {
			name = name || blob.name || "download";

			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			return navigator.msSaveOrOpenBlob(blob, name);
		};
	}

	FS_proto.abort = function(){};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if ( true && module.exports) {
  module.exports.saveAs = saveAs;
} else if (( true && __webpack_require__(/*! !webpack amd define */ "B9Yq") !== null) && (__webpack_require__(/*! !webpack amd options */ "PDX0") !== null)) {
  !(__WEBPACK_AMD_DEFINE_RESULT__ = (function() {
    return saveAs;
  }).call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
}


/***/ }),

/***/ "v6sP":
/*!***********************************************!*\
  !*** ./modules/ContactsWebclient/js/Cache.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	_ = __webpack_require__(/*! underscore */ "F/us"),
	
	Ajax = __webpack_require__(/*! modules/ContactsWebclient/js/Ajax.js */ "tYdA"),
	CContactModel = __webpack_require__(/*! modules/ContactsWebclient/js/models/CContactModel.js */ "tgQO")
;

/**
 * @constructor
 */
function CContactsCache()
{
	this.oContacts = {};
	this.oResponseHandlers = {};
	this.aRequestedEmails = [];
	
	this.aVcardAttachments = [];
	
	this.oNewContactParams = null;
}

/**
 * @param {string} sEmail
 */
CContactsCache.prototype.clearInfoAboutEmail = function (sEmail)
{
	this.oContacts[sEmail] = undefined;
};

/**
 * Looks for contacts in the cache and returns them by the specified handler.
 * If some of contacts are not found in the cache, requests them from the server by specified emails.
 * 
 * @param {Array} aEmails List of emails.
 * @param {Function} fResponseHandler Function to call when the server response.
 */
CContactsCache.prototype.getContactsByEmails = function (aEmails, fResponseHandler)
{
	var
		aContacts = [],
		aEmailsForRequest = [],
		sHandlerId = Math.random().toString()
	;
	_.each(aEmails, _.bind(function (sEmail) {
		var oContact = this.oContacts[sEmail];
		if (oContact !== undefined)
		{
			aContacts[sEmail] = oContact;
		}
		else if (_.indexOf(this.aRequestedEmails, sEmail) === -1)
		{
			aEmailsForRequest.push(sEmail);
		}
	}, this));
	
	if ($.isFunction(fResponseHandler))
	{
		fResponseHandler(aContacts);
	}

	if (aEmailsForRequest.length > 0)
	{
		this.oResponseHandlers[sHandlerId] = fResponseHandler;
		
		this.aRequestedEmails = _.union(this.aRequestedEmails, aEmailsForRequest);
		
		Ajax.send('GetContactsByEmails', {
			'Storage': 'all',
			'Emails': aEmailsForRequest,
			'HandlerId': sHandlerId
		}, this.onGetContactsByEmailsResponse, this);
	}
};

/**
 * Receives data from the server, parses them and passes on.
 * 
 * @param {Object} oResponse Data obtained from the server.
 * @param {Object} oRequest Data has been transferred to the server.
 */
CContactsCache.prototype.onGetContactsByEmailsResponse = function (oResponse, oRequest)
{
	var
		oParameters = oRequest.Parameters,
		fResponseHandler = this.oResponseHandlers[oParameters.HandlerId],
		oResult = oResponse.Result,
		aEmails = oParameters.Emails,
		oContacts = {}
	;
	
	if (oResult)
	{
		_.each(oResult, _.bind(function (oRawContact) {
			var oContact = new CContactModel();
			
			if (oContact)
			{
				oContact.parse(oRawContact);
				if (!this.oContacts[oContact.email()])
				{
					this.oContacts[oContact.email()] = oContact;
				}
				else if (!oContact.pgpSettingsEmpty())
				{
					this.oContacts[oContact.email()] = oContact;
				}
			}
		}, this));
	}
	
	this.aRequestedEmails = _.difference(this.aRequestedEmails, aEmails);
		
	_.each(aEmails, _.bind(function (sEmail) {
		if (!this.oContacts[sEmail])
		{
			this.oContacts[sEmail] = null;
		}
		oContacts[sEmail] = this.oContacts[sEmail];
	}, this));
	
	if ($.isFunction(fResponseHandler))
	{
		fResponseHandler(oContacts);
	}
	
	delete this.oResponseHandlers[oParameters.HandlerId];
};

/**
 * @param {Object} oVcard
 */
CContactsCache.prototype.addVcard = function (oVcard)
{
	this.aVcardAttachments.push(oVcard);
};

/**
 * @param {string} sFile
 */
CContactsCache.prototype.getVcard = function (sFile)
{
	return _.find(this.aVcardAttachments, function (oVcard) {
		return oVcard.file() === sFile;
	});
};

/**
 * @param {string} sFile
 */
CContactsCache.prototype.markVcardsExistentByFile = function (sFile)
{
	_.each(this.aVcardAttachments, function (oVcard) {
		if (oVcard.file() === sFile)
		{
			oVcard.exists(true);
		}
	});
};

/**
 * @param {string} sFile
 * @param {string} sUid
 */
CContactsCache.prototype.updateVcardUid = function (sFile, sUid)
{
	var oVcard = _.find(this.aVcardAttachments, function (oVcard) {
		return oVcard.file() === sFile;
	});
	if (oVcard)
	{
		oVcard.uid(sUid);
	}
};

/**
 * @param {Array} aUids
 */
CContactsCache.prototype.markVcardsNonexistentByUid = function (aUids)
{
	_.each(this.aVcardAttachments, function (oVcard) {
		if (-1 !== _.indexOf(aUids, oVcard.uid()))
		{
			oVcard.exists(false);
		}
	});
};

/**
 * @param {Object} oNewContactParams
 */
CContactsCache.prototype.saveNewContactParams = function (oNewContactParams)
{
	this.oNewContactParams = oNewContactParams;
};

/**
 * @returns {Object}
 */
CContactsCache.prototype.getNewContactParams = function ()
{
	var oNewContactParams = this.oNewContactParams;
	this.oNewContactParams = null;
	return oNewContactParams;
};

module.exports = new CContactsCache();


/***/ }),

/***/ "vLmA":
/*!************************************************************************!*\
  !*** ./modules/ContactsWebclient/js/views/ContactsSettingsFormView.js ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	ModulesManager = __webpack_require__(/*! modules/CoreWebclient/js/ModulesManager.js */ "OgeD"),
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	Settings = __webpack_require__(/*! modules/ContactsWebclient/js/Settings.js */ "+JH/")
;

/**
 * @constructor
 */
function CContactsSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.contactsPerPageValues = ko.observableArray(Types.getAdaptedPerPageList(Settings.ContactsPerPage));
	
	this.contactsPerPage = ko.observable(Settings.ContactsPerPage);
}

_.extendOwn(CContactsSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CContactsSettingsFormView.prototype.ViewTemplate = 'ContactsWebclient_ContactsSettingsFormView';

CContactsSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.contactsPerPage()
	];
};

CContactsSettingsFormView.prototype.revertTeamValues = function ()
{
	this.contactsPerPage(Settings.ContactsPerPage);
};

CContactsSettingsFormView.prototype.getParametersForSave = function ()
{
	return {
		'ContactsPerPage': this.contactsPerPage()
	};
};

CContactsSettingsFormView.prototype.applySavedValues = function (oParameters)
{
	Settings.update(oParameters.ContactsPerPage);
};

module.exports = new CContactsSettingsFormView();


/***/ }),

/***/ "w+bY":
/*!***************************************************!*\
  !*** ./modules/CoreWebclient/js/vendors/queue.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!function(){function n(n){function e(){for(;i=a<c.length&&n>p;){var u=a++,e=c[u],o=t.call(e,1);o.push(l(u)),++p,e[0].apply(null,o)}}function l(n){return function(u,t){--p,null==s&&(null!=u?(s=u,a=d=0/0,o()):(c[n]=t,--d?i||e():o()))}}function o(){null!=s?m(s):f?m(s,c):m.apply(null,[s].concat(c))}var r,i,f,c=[],a=0,p=0,d=0,s=null,m=u;return n||(n=1/0),r={defer:function(){return s||(c.push(arguments),++d,e()),r},await:function(n){return m=n,f=!1,d||o(),r},awaitAll:function(n){return m=n,f=!0,d||o(),r}}}function u(){}var t=[].slice;n.version="1.0.7", true?!(__WEBPACK_AMD_DEFINE_RESULT__ = (function(){return n}).call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)):undefined}();


/***/ }),

/***/ "wSTV":
/*!*************************************************************!*\
  !*** ./modules/ContactsWebclient/js/views/CContactsView.js ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	FileSaver = __webpack_require__(/*! modules/CoreWebclient/js/vendors/FileSaver.js */ "uN/E"),
	
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
	
	Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	CJua = __webpack_require__(/*! modules/CoreWebclient/js/CJua.js */ "mjrp"),
	CSelector = __webpack_require__(/*! modules/CoreWebclient/js/CSelector.js */ "kwPS"),
	ModulesManager = __webpack_require__(/*! modules/CoreWebclient/js/ModulesManager.js */ "OgeD"),
	Routing = __webpack_require__(/*! modules/CoreWebclient/js/Routing.js */ "QaF5"),
	Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ "SQrT"),
	
	CAbstractScreenView = __webpack_require__(/*! modules/CoreWebclient/js/views/CAbstractScreenView.js */ "xcwT"),
	CPageSwitcherView = __webpack_require__(/*! modules/CoreWebclient/js/views/CPageSwitcherView.js */ "fIp0"),
	
	Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
	ConfirmPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/ConfirmPopup.js */ "20Ah"),
	
	LinksUtils = __webpack_require__(/*! modules/ContactsWebclient/js/utils/Links.js */ "/tOA"),
	
	Ajax = __webpack_require__(/*! modules/ContactsWebclient/js/Ajax.js */ "tYdA"),
	ContactsCache = __webpack_require__(/*! modules/ContactsWebclient/js/Cache.js */ "v6sP"),
	Settings = __webpack_require__(/*! modules/ContactsWebclient/js/Settings.js */ "+JH/"),
	
	CContactListItemModel = __webpack_require__(/*! modules/ContactsWebclient/js/models/CContactListItemModel.js */ "Is5a"),
	CContactModel = __webpack_require__(/*! modules/ContactsWebclient/js/models/CContactModel.js */ "tgQO"),
	CGroupModel = __webpack_require__(/*! modules/ContactsWebclient/js/models/CGroupModel.js */ "Mqix"),
	
	CImportView = __webpack_require__(/*! modules/ContactsWebclient/js/views/CImportView.js */ "YAzK"),
	
	Enums = window.Enums
;

/**
 * @constructor
 */
function CContactsView()
{
	CAbstractScreenView.call(this, 'ContactsWebclient');
	
	this.browserTitle = ko.observable(TextUtils.i18n('CONTACTSWEBCLIENT/HEADING_BROWSER_TAB'));
	
	this.contactCount = ko.observable(0);
	this.uploaderArea = ko.observable(null);
	this.dragActive = ko.observable(false);
	this.bDragActiveComp = ko.computed(function () {
		return this.dragActive();
	}, this);
	
	this.sImportContactsLink = Settings.ImportContactsLink;
	
	this.loadingList = ko.observable(false);
	this.preLoadingList = ko.observable(false);
	this.loadingList.subscribe(function (bLoading) {
		this.preLoadingList(bLoading);
	}, this);
	this.loadingViewPane = ko.observable(false);
	
	this.showPersonalContacts = ko.observable(false);
	this.showTeamContacts = ko.observable(false);
	this.showSharedToAllContacts = ko.observable(false);
	
	this.showAllContacts = ko.computed(function () {
		return 1 < [this.showPersonalContacts() ? '1' : '',
			this.showTeamContacts() ? '1' : '',
			this.showSharedToAllContacts() ? '1' : ''
		].join('').length;
	}, this);
	
	this.recivedAnimPersonal = ko.observable(false).extend({'autoResetToFalse': 500});
	this.recivedAnimShared = ko.observable(false).extend({'autoResetToFalse': 500});
	this.recivedAnimTeam = ko.observable(false).extend({'autoResetToFalse': 500});
	
	this.isTeamStorageSelected = ko.observable(false);
	this.isNotTeamStorageSelected = ko.observable(false);
	this.disableDropToPersonal = ko.observable(false);
	this.selectedStorageValue = ko.observable('');
	this.selectedStorage = ko.computed({
		'read': function () {
			return this.selectedStorageValue();
		},
		'write': function (sValue) {
			if (sValue !== '')
			{
				this.selectedStorageValue(($.inArray(sValue, Settings.Storages) !== -1) ? sValue : Settings.DefaultStorage);
				if (this.selectedStorageValue() !== 'group')
				{
					this.selectedGroupInList(null);
					this.selectedItem(null);
					this.selector.listCheckedOrSelected(false);
					this.currentGroupUUID('');
				}
				this.isTeamStorageSelected(this.selectedStorageValue() === 'team');
				this.isNotTeamStorageSelected(this.selectedStorageValue() !== 'team');
				this.disableDropToPersonal(this.selectedStorageValue() !== 'shared');
			}
		},
		'owner': this
	});
	
	this.selectedGroupInList = ko.observable(null);
	
	this.selectedGroupInList.subscribe(function () {
		var oPrev = this.selectedGroupInList();
		if (oPrev)
		{
			oPrev.selected(false);
		}
	}, this, 'beforeChange');
	
	this.selectedGroupInList.subscribe(function (oGroup) {
		if (oGroup && this.showPersonalContacts())
		{
			oGroup.selected(true);
			this.selectedStorage('group');
			this.requestContactList();
		}
	}, this);
	
	this.selectedGroup = ko.observable(null);
	this.selectedContact = ko.observable(null);
	this.selectedGroupEmails = ko.observableArray([]);
	
	this.currentGroupUUID = ko.observable('');
	
	this.oContactModel = new CContactModel();
	this.oGroupModel = new CGroupModel();
	
	this.oImportView = new CImportView(this);
	
	this.selectedOldItem = ko.observable(null);
	this.selectedItem = ko.computed({
		'read': function () {
			return this.selectedContact() || this.selectedGroup() || null;
		},
		'write': function (oItem) {
			if (oItem instanceof CContactModel)
			{
				this.selectedGroup(null);
				this.selectedContact(oItem);
			}
			else if (oItem instanceof CGroupModel)
			{
				this.selectedContact(null);
				this.selectedGroup(oItem);
				this.currentGroupUUID(oItem.uuid());
			}
			else
			{
				this.selectedGroup(null);
				this.selectedContact(null);
			}
			
			this.loadingViewPane(false);
		},
		'owner': this
	});
	
	this.collection = ko.observableArray([]);
	this.contactUidForRequest = ko.observable('');
	this.collection.subscribe(function () {
		if (this.collection().length > 0 && this.contactUidForRequest() !== '')
		{
			this.requestContact(this.contactUidForRequest());
			this.contactUidForRequest('');
		}
	}, this);
	
	this.isSearchFocused = ko.observable(false);
	this.searchInput = ko.observable('');
	this.search = ko.observable('');
	
	this.groupUidForRequest = ko.observable('');
	this.groupFullCollection = ko.observableArray([]);
	this.groupFullCollection.subscribe(function () {
		if (this.groupUidForRequest())
		{
			this.onViewGroupClick(this.groupUidForRequest());
		}
	}, this);
	
	this.selectedContact.subscribe(function (oContact) {
		if (oContact)
		{
			var aGroupUUIDs = oContact.groups();
			_.each(this.groupFullCollection(), function (oItem) {
				oItem.checked(oItem && 0 <= $.inArray(oItem.UUID(), aGroupUUIDs));
			});
		}
	}, this);
	
	this.pageSwitcherLocked = ko.observable(false);
	this.oPageSwitcher = new CPageSwitcherView(0, Settings.ContactsPerPage);
	this.oPageSwitcher.currentPage.subscribe(function () {
		if (!this.pageSwitcherLocked())
		{
			this.changeRouting();
		}
	}, this);
	this.currentPage = ko.observable(1);
	
	this.search.subscribe(function (sValue) {
		this.searchInput(sValue);
	}, this);
	
	this.searchSubmitCommand = Utils.createCommand(this, function () {
		this.changeRouting({ Search: this.searchInput() });
	});
	
	this.searchMessagesInInbox = ModulesManager.run('MailWebclient', 'getSearchMessagesInInbox');
	this.bAllowSearchMessagesInInbox = _.isFunction(this.searchMessagesInInbox);
	this.composeMessageToAddresses = ModulesManager.run('MailWebclient', 'getComposeMessageToAddresses');
	this.bAllowComposeMessageToAddresses = _.isFunction(this.composeMessageToAddresses);
	this.selector = new CSelector(this.collection, _.bind(this.viewContact, this), _.bind(this.deleteContact, this), this.bAllowComposeMessageToAddresses ? _.bind(this.composeMessageToContact, this) : null);
	
	this.checkAll = this.selector.koCheckAll();
	this.checkAllIncomplite = this.selector.koCheckAllIncomplete();
	
	this.isCheckedOrSelected = ko.computed(function () {
		return 0 < this.selector.listCheckedOrSelected().length;
	}, this);
	this.isEnableAddContacts = this.isCheckedOrSelected;
	this.isEnableRemoveContactsFromGroup = this.isCheckedOrSelected;
	this.isEnableDeleting = this.isCheckedOrSelected;
	this.isEnableSharing = this.isCheckedOrSelected;
	this.visibleShareCommand = ko.computed(function () {
		return this.showPersonalContacts() && this.showSharedToAllContacts() && this.selectedStorage() === 'personal';
	}, this);
	this.visibleUnshareCommand = ko.computed(function () {
		return this.showPersonalContacts() && this.showSharedToAllContacts() && this.selectedStorage() === 'shared';
	}, this);
	
	this.isExactlyOneContactSelected = ko.computed(function () {
		return 1 === this.selector.listCheckedOrSelected().length;
	}, this);
	
	this.isSaving = ko.observable(false);
	
	this.newContactCommand = Utils.createCommand(this, this.executeNewContact, this.isNotTeamStorageSelected);
	this.newGroupCommand = Utils.createCommand(this, this.executeNewGroup);
	this.addContactsCommand = Utils.createCommand(this, function () {}, this.isEnableAddContacts);
	this.deleteCommand = Utils.createCommand(this, this.deleteContact, this.isEnableDeleting);
	this.selectedCount = ko.computed(function () {
		var
			aChecked = _.filter(this.selector.listCheckedOrSelected(), function (oItem) {
				return !oItem.ReadOnly();
			});
		return aChecked.length;
	}, this);
	this.shareCommand = Utils.createCommand(this, this.executeShare, this.isEnableSharing);
	this.removeFromGroupCommand = Utils.createCommand(this, this.executeRemoveFromGroup, this.isEnableRemoveContactsFromGroup);
	this.importCommand = Utils.createCommand(this, this.executeImport);
	this.saveCommand = Utils.createCommand(this, this.executeSave);
	this.updateSharedToAllCommand = Utils.createCommand(this, this.executeUpdateSharedToAll, this.isExactlyOneContactSelected);
	this.composeMessageCommand = Utils.createCommand(this, this.composeMessage, this.isCheckedOrSelected);
	
	this.selector.listCheckedOrSelected.subscribe(function (aList) {
		this.oGroupModel.newContactsInGroupCount(aList.length);
	}, this);
	
	this.isSearch = ko.computed(function () {
		return this.search() !== '';
	}, this);
	this.isEmptyList = ko.computed(function () {
		return 0 === this.collection().length;
	}, this);
	
	this.searchText = ko.computed(function () {
		return TextUtils.i18n('CONTACTSWEBCLIENT/INFO_SEARCH_RESULT', {
			'SEARCH': this.search()
		});
	}, this);
	
	this.visibleDragNDropToGroupText = ko.computed(function () {
		return !App.isMobile() && this.selectedStorage() === 'group';
	}, this);
	this.selectedPanel = ko.observable(Enums.MobilePanel.Items);
	
	this.enableExport = ko.computed(function () {
		return this.contactCount() > 0;
	}, this);
	this.aExportData = [];
	_.each(Settings.ImportExportFormats, function (sFormat) {
		if (Types.isNonEmptyString(sFormat))
		{
			this.aExportData.push({
				'css': sFormat.toLowerCase(),
				'text': TextUtils.i18n('CONTACTSWEBCLIENT/ACTION_EXPORT_AS', {'FORMAT': sFormat.toUpperCase()}),
				'command': Utils.createCommand(this, function () { this.executeExport(sFormat); }, this.enableExport)
			});
		}
	}, this);
	this.isPersonalStorageSelected = ko.computed(function () {
		return this.selectedStorage() === 'personal';
	}, this);
	this.visibleImportExport = ko.computed(function () {
		return this.aExportData.length > 0;
	}, this);
	
	this.infoCreateOrImport = this.getCreateOrImportInfo();
	this.listChanged = ko.computed(function () {
		return [
			this.selectedStorage(),
			this.currentGroupUUID(),
			this.search(),
			this.oPageSwitcher.currentPage(),
			this.oPageSwitcher.perPage()
		];
	}, this);
	
	this.bRefreshContactList = false;
	
	App.broadcastEvent('ContactsWebclient::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

_.extendOwn(CContactsView.prototype, CAbstractScreenView.prototype);

CContactsView.prototype.ViewTemplate = 'ContactsWebclient_ContactsScreenView';
CContactsView.prototype.ViewConstructorName = 'CContactsView';

CContactsView.prototype.getFormatDependentText = function (sLangConstantName)
{
	switch (Settings.ImportExportFormats.length)
	{
		case 0:
			return '';
		case 1:
			return TextUtils.i18n('CONTACTSWEBCLIENT/' + sLangConstantName + '_SINGLE_EXT', {
				'EXTENSION': Settings.ImportExportFormats[0].toUpperCase()
			});
		default:
			return TextUtils.i18n('CONTACTSWEBCLIENT/' + sLangConstantName + '_PLURAL_EXT', {
				'EXTENSIONS': _.initial(Settings.ImportExportFormats).join(', ').toUpperCase(),
				'LASTEXTENSION': _.last(Settings.ImportExportFormats).toUpperCase()
			});
	}
};

CContactsView.prototype.getCreateOrImportInfo = function ()
{
	var sOrImportInfo = this.getFormatDependentText('INFO_OR_IMPORT');
	return TextUtils.i18n('CONTACTSWEBCLIENT/INFO_CREATE') + (sOrImportInfo === '' ? '' : ' ' + sOrImportInfo) + '.';
};

/**
 * @param {Object} oData
 */
CContactsView.prototype.executeSave = function (oData)
{
	var
		oContact = {},
		aList = [],
		oGroup
	;

	if (oData === this.selectedItem() && this.selectedItem().canBeSave())
	{
		if (oData instanceof CContactModel && !oData.readOnly())
		{
			_.each(this.groupFullCollection(), function (oItem) {
				if (oItem && oItem.checked())
				{
					aList.push(oItem.UUID());
				}
			});
			
			oData.groups(aList);
			
			if (this.selectedItem())
			{
				ContactsCache.clearInfoAboutEmail(this.selectedItem().email());
			}

			oContact = oData.toObject();

			if (this.selectedStorage() !== 'personal' && oContact.Storage === 'personal')
			{
				this.recivedAnimPersonal(true);
			}
			if (this.selectedStorage() !== 'team' && oContact.Storage === 'team')
			{
				this.recivedAnimTeam(true);
			}

			if (oData.isNew())
			{
				if (this.selectedStorage() === 'all' || this.selectedStorage() === 'group')
				{
					// there are no real storages with name 'all' or 'group' on server side
					oContact.Storage = 'personal';
				}
				else
				{
					// server subscribers need to know if contact should be in 'personal' or 'shared' storage
					oContact.Storage = this.selectedStorage();
				}
				this.isSaving(true);

				oContact.ViewEmail = oData.email();
				var
					oParams = {
						Contact: oContact,
						Callback: function (result) {
							if (result.Error)
							{
								Screens.showError(result.ErrorMessage);
								this.isSaving(false);
							}
							else
							{
								Ajax.send('CreateContact', { Contact: oContact }, this.onCreateContactResponse, this);
							}
						}.bind(this)
					}
				;
				if (!App.broadcastEvent('ContactsWebclient::beforeCreateContactRequest', oParams))
				{
					Ajax.send('CreateContact', { Contact: oContact }, this.onCreateContactResponse, this);
				}
			}
			else
			{
				this.isSaving(true);

				oContact.ViewEmail = oData.email();
				var
					oParams = {
						Contact: oContact,
						Callback: function (result) {
							if (result.Error)
							{
								Screens.showError(result.ErrorMessage);
								this.isSaving(false);
							}
							else
							{
								Ajax.send('UpdateContact', { Contact: oContact }, this.onUpdateContactResponse, this);
							}
						}.bind(this)
					}
				;
				if (!App.broadcastEvent('ContactsWebclient::beforeUpdateContactRequest', oParams))
				{
					Ajax.send('UpdateContact', { Contact: oContact }, this.onUpdateContactResponse, this);
				}
			}
		}
		else if (oData instanceof CGroupModel && !oData.readOnly())
		{
			var aContactUUIDs = _.map(this.selector.listCheckedOrSelected(), function (oItem) { return oItem.UUID(); });
			this.isSaving(true);

			oGroup =  oData.toObject(aContactUUIDs);
			if (!oData.isNew())
			{
				oGroup.Contacts = null;
			}
			Ajax.send(oData.isNew() ? 'CreateGroup' : 'UpdateGroup', {'Group': oGroup}, this.onCreateGroupResponse, this);
		}
	}
	else
	{
		Screens.showError(TextUtils.i18n('CONTACTSWEBCLIENT/ERROR_EMAIL_OR_NAME_BLANK'));
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onCreateContactResponse = function (oResponse, oRequest)
{
	this.isSaving(false);
	if (oResponse.Result)
	{
		this.requestContactList();
		this.viewContact(oResponse.Result.UUID);
		Screens.showReport(TextUtils.i18n('CONTACTSWEBCLIENT/REPORT_CONTACT_SUCCESSFULLY_ADDED'));
		App.broadcastEvent('ContactsWebclient::createContactResponse', [oResponse.Result]);
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('CONTACTSWEBCLIENT/ERROR_CREATE_CONTACT'));
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onUpdateContactResponse = function (oResponse, oRequest)
{
	this.isSaving(false);
	if (oResponse.Result)
	{
		if (this.selectedContact() && this.selectedContact().edited())
		{
			this.selectedContact().edited(false);
		}
		this.requestContactList();
		Screens.showReport(TextUtils.i18n('CONTACTSWEBCLIENT/REPORT_CONTACT_SUCCESSFULLY_UPDATED'));
		App.broadcastEvent('ContactsWebclient::updateContactResponse', [oResponse.Result]);
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('CONTACTSWEBCLIENT/ERROR_UPDATE_CONTACT'));
	}
};

CContactsView.prototype.changeRouting = function (oParams, bReplace)
{
	oParams = oParams || {};
	var
		sStorage = oParams.Storage === undefined ? this.selectedStorage() : oParams.Storage,
		sGroupUUID = oParams.GroupUUID === undefined ? this.currentGroupUUID() : oParams.GroupUUID,
		sSearch = oParams.Search === undefined ? this.search() : oParams.Search,
		iPage = oParams.Page === undefined ? this.oPageSwitcher.currentPage() : oParams.Page,
		sContactUUID = oParams.ContactUUID === undefined ? '' : oParams.ContactUUID,
		sAction = oParams.Action === undefined ? '' : oParams.Action
	;
	
	if (bReplace)
	{
		Routing.replaceHash(LinksUtils.getContacts(sStorage, sGroupUUID, sSearch, iPage, sContactUUID, sAction));
	}
	else
	{
		Routing.setHash(LinksUtils.getContacts(sStorage, sGroupUUID, sSearch, iPage, sContactUUID, sAction));
	}
};

CContactsView.prototype.executeNewContact = function ()
{
	if (this.showPersonalContacts())
	{
		var sGroupUUID = (this.selectedStorage() === 'group') ? this.currentGroupUUID() : '';
		this.changeRouting({ GroupUUID: sGroupUUID, Action: 'create-contact' });
	}
};

CContactsView.prototype.executeNewGroup = function ()
{
	var sGroupUUID = (this.selectedStorage() === 'group') ? this.currentGroupUUID() : '';
	if (this.selector.itemSelected() instanceof CContactListItemModel)
	{
		this.selector.itemSelected().checked(true);
	}
	this.changeRouting({GroupUUID: sGroupUUID, Action: 'create-group' });
};

CContactsView.prototype.deleteContact = function ()
{
	var sStorage = this.selectedStorage();
	if (sStorage === 'personal' || sStorage === 'shared')
	{
		var
			aChecked = _.filter(this.selector.listCheckedOrSelected(), function (oItem) {
				return !oItem.ReadOnly();
			}),
			iCount = aChecked.length,
			sConfirmText = TextUtils.i18n('CONTACTSWEBCLIENT/CONFIRM_DELETE_CONTACTS_PLURAL', {}, null, iCount),
			fDeleteContacts = _.bind(function (bResult) {
				if (bResult)
				{
					this.deleteContacts(aChecked);
				}
			}, this)
			;

		Popups.showPopup(ConfirmPopup, [sConfirmText, fDeleteContacts, '', TextUtils.i18n('COREWEBCLIENT/ACTION_DELETE')]);
	}
	else if (sStorage === 'group')
	{
		this.removeFromGroupCommand();
	}
};

CContactsView.prototype.deleteContacts = function (aChecked)
{
	var
		self = this,
		oMainContact = this.selectedContact(),
		aContactUUIDs = _.map(aChecked, function (oItem) {
			return oItem.UUID();
		})
	;

	if (0 < aContactUUIDs.length)
	{
		this.preLoadingList(true);

		_.each(aChecked, function (oContact) {
			if (oContact)
			{
				ContactsCache.clearInfoAboutEmail(oContact.Email());

				if (oMainContact && !oContact.IsGroup() && !oContact.ReadOnly() && !oMainContact.readOnly() && oMainContact.uuid() === oContact.UUID())
				{
					oMainContact = null;
					this.selectedContact(null);
				}
			}
		}, this);

		_.each(this.collection(), function (oContact) {
			if (-1 < $.inArray(oContact, aChecked))
			{
				oContact.deleted(true);
			}
		});

		_.delay(function () {
			self.collection.remove(function (oItem) {
				return oItem.deleted();
			});
		}, 500);

		Ajax.send('DeleteContacts', { 'Storage': this.selectedStorage(), 'UUIDs': aContactUUIDs }, function (oResponse) {
			if (!oResponse.Result)
			{
				Api.showErrorByCode(oResponse, TextUtils.i18n('CONTACTSWEBCLIENT/ERROR_DELETE_CONTACTS'));
			}
			App.broadcastEvent('ContactsWebclient::deleteContactsResponse', [oResponse.Result]);			
			this.requestContactList();
		}, this);
		
		ContactsCache.markVcardsNonexistentByUid(aContactUUIDs);
	}
};

CContactsView.prototype.executeRemoveFromGroup = function ()
{
	var
		self = this,
		oGroup = this.selectedGroupInList(),
		aChecked = this.selector.listCheckedOrSelected(),
		aContactUUIDs = _.map(aChecked, function (oItem) {
			return oItem.UUID();
		})
	;

	aContactUUIDs = _.compact(aContactUUIDs);

	if (oGroup && 0 < aContactUUIDs.length)
	{
		this.preLoadingList(true);

		_.each(this.collection(), function (oContact) {
			if (-1 < $.inArray(oContact, aChecked))
			{
				oContact.deleted(true);
			}
		});

		_.delay(function () {
			self.collection.remove(function (oItem) {
				return oItem.deleted();
			});
		}, 500);

		Ajax.send('RemoveContactsFromGroup', {
			'GroupUUID': oGroup.UUID(),
			'ContactUUIDs': aContactUUIDs
		}, function (oResponse) {
			if (!oResponse.Result)
			{
				Api.showErrorByCode(oResponse);
			}
			this.requestContactList();
		}, this);
	}
};

CContactsView.prototype.executeImport = function ()
{
	this.changeRouting({Storage: 'personal', GroupUUID: '', Search: '', Page: 1, Action: 'import'});
};

CContactsView.prototype.executeExport = function (sFormat)
{
	var
		aContactUUIDs = _.map(this.selector.listCheckedOrSelected(), function (oContact) {
			return oContact.sUUID;
		}),
		sStorage = this.selectedStorage()
	;
	if (sStorage === 'group')
	{
		sStorage = 'all';
	}
	Ajax.send('Export', {
		'Format': sFormat,
		'Storage': sStorage,
		'GroupUUID': this.currentGroupUUID(),
		'ContactUUIDs': aContactUUIDs
	}, function (oResponse) {
		var oBlob = new Blob([oResponse.ResponseText], {'type': 'text/plain;charset=utf-8'});
		FileSaver.saveAs(oBlob, 'export.' + sFormat, true);
	}, this, { Format: 'Raw' });
};

CContactsView.prototype.executeCancel = function ()
{
	var oData = this.selectedItem();
	
	if (oData)
	{
		if (oData instanceof CContactModel && !oData.readOnly())
		{
			if (oData.isNew())
			{
				Routing.setPreviousHash();
			}
			else if (oData.edited())
			{
				oData.edited(false);
				this.requestContact(oData.uuid());
			}
			else
			{
				this.changeRouting();
			}
		}
		else if (oData instanceof CGroupModel && !oData.readOnly())
		{
			if (oData.isNew())
			{
				Routing.setPreviousHash();
			}
			else if (oData.edited())
			{
				this.selectedItem(this.selectedOldItem());
				oData.edited(false);
			}
			else
			{
				this.changeRouting();
			}
		}
		else if (this.oImportView.visibility())
		{
			Routing.setPreviousHash();
		}
	}
};

/**
 * @param {Object} oGroup
 * @param {Array} aContactUUIDs
 */
CContactsView.prototype.executeAddContactsToGroup = function (oGroup, aContactUUIDs)
{
	if (oGroup && _.isArray(aContactUUIDs) && 0 < aContactUUIDs.length)
	{
		oGroup.recivedAnim(true);

		this.executeAddContactsToGroupUUID(oGroup.UUID(), aContactUUIDs);
	}
};

/**
 * @param {string} sGroupUUID
 * @param {Array} aContactUUIDs
 */
CContactsView.prototype.executeAddContactsToGroupUUID = function (sGroupUUID, aContactUUIDs)
{
	if (sGroupUUID && _.isArray(aContactUUIDs) && 0 < aContactUUIDs.length)
	{
		Ajax.send('AddContactsToGroup', {
			'GroupUUID': sGroupUUID,
			'ContactUUIDs': aContactUUIDs
		}, this.onAddContactsToGroupResponse, this);
	}
};

CContactsView.prototype.onAddContactsToGroupResponse = function (oResponse)
{
	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse);
	}
	this.requestContactList();
	if (this.selector.itemSelected())
	{
		this.requestContact(this.selector.itemSelected().UUID());
	}
};

/**
 * @param {Object} oGroup
 */
CContactsView.prototype.executeAddSelectedContactsToGroup = function (oGroup)
{
	var
		aList = this.selector.listCheckedOrSelected(),
		aContactUUIDs = []
	;

	if (oGroup && _.isArray(aList) && 0 < aList.length)
	{
		_.each(aList, function (oItem) {
			if (oItem && !oItem.IsGroup())
			{
				aContactUUIDs.push(oItem.UUID());
			}
		}, this);
	}

	this.executeAddContactsToGroup(oGroup, aContactUUIDs);
};

/**
 * @param {Object} oContact
 */
CContactsView.prototype.groupsInContactView = function (oContact)
{
	var
		aResult = [],
		aGroupUUIDs = []
	;
	
	if (oContact && !oContact.groupsIsEmpty())
	{
		aGroupUUIDs = oContact.groups();
		aResult = _.filter(this.groupFullCollection(), function (oItem) {
			return 0 <= $.inArray(oItem.UUID(), aGroupUUIDs);
		});
	}
	
	return aResult;
};

CContactsView.prototype.onShow = function ()
{
	this.selector.useKeyboardKeys(true);
	
	this.oPageSwitcher.show();

	if (this.oJua)
	{
		this.oJua.setDragAndDropEnabledStatus(true);
	}
	
	this.bRefreshContactList = true;
};

CContactsView.prototype.onHide = function ()
{
	this.selector.listCheckedOrSelected(false);
	this.selector.useKeyboardKeys(false);
	this.selectedItem(null);
	
	this.oPageSwitcher.hide();

	if (this.oJua)
	{
		this.oJua.setDragAndDropEnabledStatus(false);
	}
};

CContactsView.prototype.onBind = function ()
{
	this.selector.initOnApplyBindings(
		'.contact_sub_list .item',
		'.contact_sub_list .selected.item',
		'.contact_sub_list .item .custom_checkbox',
		$('.contact_list', this.$viewDom),
		$('.contact_list_scroll.scroll-inner', this.$viewDom)
	);

	var self = this;

	this.$viewDom.on('click', '.content .item.add_to .dropdown_helper .item', function () {

		if ($(this).hasClass('new-group'))
		{
			self.executeNewGroup();
		}
		else
		{
			self.executeAddSelectedContactsToGroup(ko.dataFor(this));
		}
	});

	this.showPersonalContacts(-1 !== $.inArray('personal', Settings.Storages));
	this.showTeamContacts(-1 !== $.inArray('team', Settings.Storages));
	this.showSharedToAllContacts(-1 !== $.inArray('shared', Settings.Storages));
	
	this.selectedStorage(this.selectedStorage());
	
	this.oImportView.onBind();
	this.requestGroupFullList();

	if (!App.isMobile())
	{
		this.hotKeysBind();
	}

	this.initUploader();
};

CContactsView.prototype.hotKeysBind = function ()
{
	var bFirstContactFlag = false;

	$(document).on('keydown', _.bind(function(ev) {
		var
			nKey = ev.keyCode,
			oFirstContact = this.collection()[0],
			bListIsFocused = this.isSearchFocused(),
			bFirstContactSelected = false
		;

		if (this.shown() && !Utils.isTextFieldFocused() && !bListIsFocused && ev && nKey === Enums.Key.s)
		{
			ev.preventDefault();
			this.searchFocus();
		}

		else if (oFirstContact)
		{
			bFirstContactSelected = oFirstContact.selected();

			if (oFirstContact && bListIsFocused && ev && nKey === Enums.Key.Down)
			{
				this.isSearchFocused(false);
				this.selector.itemSelected(oFirstContact);

				bFirstContactFlag = true;
			}
			else if (!bListIsFocused && bFirstContactFlag && bFirstContactSelected && ev && nKey === Enums.Key.Up)
			{
				this.isSearchFocused(true);
				this.selector.itemSelected(false);
				
				bFirstContactFlag = false;
			}
			else if (bFirstContactSelected)
			{
				bFirstContactFlag = true;
			}
			else if (!bFirstContactSelected)
			{
				bFirstContactFlag = false;
			}
		}
	}, this));
};

CContactsView.prototype.refreshContactsAndGroups = function ()
{
	this.requestContactList();
	this.requestGroupFullList();
};

CContactsView.prototype.requestContactList = function ()
{
	var
		sGroupUUID = this.selectedStorage() === 'group' && this.selectedGroupInList() ? this.selectedGroupInList().UUID() : '',
		sStorage = sGroupUUID !== '' ? 'all' : this.selectedStorage()
	;
	
	this.loadingList(true);
	Ajax.send('GetContacts', {
		'Offset': (this.currentPage() - 1) * Settings.ContactsPerPage,
		'Limit': Settings.ContactsPerPage,
		'SortField': Enums.ContactSortField.Name,
		'Search': this.search(),
		'GroupUUID': sGroupUUID,
		'Storage': sStorage
	}, this.onGetContactsResponse, this);
};

CContactsView.prototype.requestGroupFullList = function ()
{
	Ajax.send('GetGroups', null, this.onGetGroupsResponse, this);
};

/**
 * @param {string} sContactUUID
 */
CContactsView.prototype.requestContact = function (sContactUUID)
{
	this.loadingViewPane(true);
	
	var oItem = _.find(this.collection(), function (oItm) {
		return oItm.UUID() === sContactUUID;
	});
	
	if (oItem)
	{
		this.selector.itemSelected(oItem);
		Ajax.send('GetContact', { 'UUID': oItem.UUID() }, this.onGetContactResponse, this);
	}
	else
	{
		this.contactUidForRequest(sContactUUID);
		this.selector.itemSelected(null);
		this.selectedItem(null);
	}
};

/**
 * @param {Object} oData
 */
CContactsView.prototype.editGroup = function (oData)
{
	var oGroup = new CGroupModel();
	oGroup.populate(oData);
	this.selectedOldItem(oGroup);
	oData.edited(true);
};

/**
 * @param {string} sStorage
 */
CContactsView.prototype.changeGroupType = function (sStorage)
{
	this.changeRouting({ Storage: sStorage, GroupUUID: '' });
};

/**
 * @param {Object} mData
 */
CContactsView.prototype.onViewGroupClick = function (mData)
{
	var sUUID = (typeof mData === 'string') ? mData : mData.UUID();
	this.changeRouting({ Storage: 'group', GroupUUID: sUUID });
};

/**
 * @param {Array} aParams
 */
CContactsView.prototype.onRoute = function (aParams)
{
	var
		oParams = LinksUtils.parseContacts(aParams),
		bGroupOrSearchChanged = this.selectedStorage() !== oParams.Storage || this.currentGroupUUID() !== oParams.GroupUUID || this.search() !== oParams.Search,
		bGroupFound = true,
		bRequestContacts = this.bRefreshContactList
	;
	
	this.bRefreshContactList = false;
	
	this.pageSwitcherLocked(true);
	if (this.oPageSwitcher.perPage() !== Settings.ContactsPerPage)
	{
		bRequestContacts = true;
	}
	if (bGroupOrSearchChanged)
	{
		this.oPageSwitcher.clear();
		this.oPageSwitcher.perPage(Settings.ContactsPerPage);
	}
	else
	{
		this.oPageSwitcher.setPage(oParams.Page, Settings.ContactsPerPage);
	}
	this.pageSwitcherLocked(false);
	if (oParams.Page !== this.oPageSwitcher.currentPage())
	{
		Routing.replaceHash(LinksUtils.getContacts(oParams.Storage, oParams.GroupUUID, oParams.Search, this.oPageSwitcher.currentPage()));
	}
	if (this.currentPage() !== oParams.Page)
	{
		this.currentPage(oParams.Page);
		bRequestContacts = true;
	}
	
	if (this.selectedStorage() !== oParams.Storage && -1 !== $.inArray(oParams.Storage, Settings.Storages) && oParams.Storage !== 'group')
	{
		this.selectedStorage(oParams.Storage);
		bRequestContacts = true;
	}
	else if (oParams.Storage === 'group' && oParams.Action !== 'create-group' && (this.currentGroupUUID() !== oParams.GroupUUID || oParams.ContactUUID === ''))
	{
		bGroupFound = this.viewGroup(oParams.GroupUUID);
		if (bGroupFound)
		{
			bRequestContacts = false;
		}
		else
		{
			Routing.replaceHash(LinksUtils.getContacts());
		}
	}
	
	if (this.search() !== oParams.Search)
	{
		this.search(oParams.Search);
		bRequestContacts = true;
	}
	
	this.contactUidForRequest('');
	
	if (oParams.ContactUUID)
	{
		if (this.collection().length === 0)
		{
			this.contactUidForRequest(oParams.ContactUUID);
		}
		else
		{
			this.requestContact(oParams.ContactUUID);
		}
	}
	else if (this.selectedItem() instanceof CContactModel)
	{
		this.selector.itemSelected(null);
		this.selectedItem(null);
	}

	switch (oParams.Action)
	{
		case 'create-contact':
			var
				oGr = this.selectedGroupInList(),
				oNewContactParams = ContactsCache.getNewContactParams()
			;
			
			this.oContactModel.switchToNew();
			this.oContactModel.groups(oGr ? [oGr.UUID()] : []);
			
			if (oNewContactParams)
			{
				_.each(oNewContactParams, function (sValue, sKey) {
					if (_.isFunction(this.oContactModel[sKey]))
					{
						this.oContactModel[sKey](sValue);
					}
				}, this);
				this.oContactModel.extented(true);
			}
			
			this.selectedItem(this.oContactModel);
			this.selector.itemSelected(null);
			this.oImportView.visibility(false);
			break;
		case 'create-group':
			this.oGroupModel.switchToNew();
			this.selectedItem(this.oGroupModel);
			this.selector.itemSelected(null);
			this.oImportView.visibility(false);
			break;
		case 'import':
			this.selectedItem(null);
			this.oImportView.visibility(true);
			this.selector.itemSelected(null);
			break;
		default:
			if (!oParams.ContactUUID && !oParams.GroupUUID)
			{
				this.selectedItem(null);
				this.selector.itemSelected(null);
			}
			this.oImportView.visibility(false);
			break;
	}
	
	if (bRequestContacts)
	{
		this.requestContactList();
	}
	
	this.isSaving(false);
};

/**
 * @param {string} sGroupUUID
 */
CContactsView.prototype.viewGroup = function (sGroupUUID)
{
	var
		oGroup = _.find(this.groupFullCollection(), function (oItem) {
			return oItem && oItem.UUID() === sGroupUUID;
		})
	;
	
	if (oGroup)
	{
		this.groupUidForRequest('');
		
		this.oGroupModel.clear();
		this.oGroupModel
			.uuid(oGroup.UUID())
			.name(oGroup.Name())
		;
		if (oGroup.IsOrganization())
		{
			this.requestGroup(oGroup);
		}

		this.selectedGroupInList(oGroup);
		this.selectedItem(this.oGroupModel);
		this.selector.itemSelected(null);
		this.selector.listCheckedOrSelected(false);
		
		Ajax.send('GetGroupEvents', { 'UUID': sGroupUUID }, this.onGetGroupEventsResponse, this);
	}
	else
	{
		this.groupUidForRequest(sGroupUUID);
	}
	
	return !!oGroup;
};

/**
 * @param {string} sGroupUUID
 */
CContactsView.prototype.deleteGroup = function (sGroupUUID)
{
	if (sGroupUUID)
	{
		this.groupFullCollection.remove(function (oItem) {
			return oItem && oItem.UUID() === sGroupUUID;
		});
		
		Ajax.send('DeleteGroup', { 'UUID': sGroupUUID }, function (oResponse) {
			if (!oResponse.Result)
			{
				Api.showErrorByCode(oResponse);
			}
			this.requestGroupFullList();
		}, this);

		this.changeGroupType(Settings.DefaultStorage);
	}
};

/**
 * @param {Object} oGroup
 */
CContactsView.prototype.mailGroup = function (oGroup)
{
	if (this.bAllowComposeMessageToAddresses && oGroup)
	{
		Ajax.send('GetContacts', {
			'Storage': 'all',
			'Offset': 0,
			'Limit': 200,
			'SortField': Enums.ContactSortField.Name,
			'GroupUUID': oGroup.uuid()
		}, function (oResponse) {
			var
				aList = oResponse && oResponse.Result && oResponse.Result.List,
				aEmails = Types.isNonEmptyArray(aList) ? _.compact(_.map(aList, function (oRawContactItem) {
					var oContactItem = new CContactListItemModel();
					oContactItem.parse(oRawContactItem);
					return oContactItem.Email() !== '' ? oContactItem.getFullEmail() : '';
				})) : [],
				sEmails = aEmails.join(', ')
			;

			if (sEmails !== '')
			{
				this.composeMessageToAddresses(sEmails);
			}
		}, this);
	}
};

/**
 * @param {Object} oContact
 */
CContactsView.prototype.dragAndDropHelper = function (oContact)
{
	if (oContact)
	{
		oContact.checked(true);
	}

	var
		oSelected = this.selector.itemSelected(),
		oHelper = Utils.draggableItems(),
		nCount = this.selector.listCheckedOrSelected().length,
		aUids = 0 < nCount ? _.map(this.selector.listCheckedOrSelected(), function (oItem) {
			return oItem.UUID();
		}) : []
	;

	if (oSelected && !oSelected.checked())
	{
		oSelected.checked(true);
	}

	oHelper.data('drag-contatcs-storage', this.selectedStorage());
	oHelper.data('drag-contatcs-uids', aUids);
	
	$('.count-text', oHelper).text(TextUtils.i18n('CONTACTSWEBCLIENT/LABEL_DRAG_CONTACTS_PLURAL', {
		'COUNT': nCount
	}, null, nCount));

	return oHelper;
};

/**
 * @param {Object} oToGroup
 * @param {Object} oEvent
 * @param {Object} oUi
 */
CContactsView.prototype.contactsDrop = function (oToGroup, oEvent, oUi)
{
	if (oToGroup)
	{
		var
			oHelper = oUi && oUi.helper ? oUi.helper : null,
			aUids = oHelper ? oHelper.data('drag-contatcs-uids') : null
		;

		if (null !== aUids)
		{
			Utils.uiDropHelperAnim(oEvent, oUi);
			this.executeAddContactsToGroup(oToGroup, aUids);
		}
	}
};

CContactsView.prototype.contactsDropToGroupType = function (sDropStorage, oEvent, oUi)
{
	var
		oHelper = oUi && oUi.helper,
		sDragStorage = oHelper && oHelper.data('drag-contatcs-storage') || null,
		aUids = oHelper && oHelper.data('drag-contatcs-uids') || null
	;
	
	if (null !== aUids && null !== sDragStorage && sDropStorage !== sDragStorage)
	{
		Utils.uiDropHelperAnim(oEvent, oUi);
		this.executeShare();
	}
};

CContactsView.prototype.searchFocus = function ()
{
	if (this.selector.useKeyboardKeys() && !Utils.isTextFieldFocused())
	{
		this.isSearchFocused(true);
	}
};

/**
 * @param {mixed} mContact
 */
CContactsView.prototype.viewContact = function (mContact)
{
	if (mContact)
	{
		var
			sGroupUUID = (this.selectedStorage() === 'group') ? this.currentGroupUUID() : '',
			sContactUUID = (typeof mContact === 'string') ? mContact : mContact.UUID()
		;
		this.changeRouting({ GroupUUID: sGroupUUID, ContactUUID: sContactUUID });
	}
};

/**
 * @param {Object} oContact
 */
CContactsView.prototype.composeMessageToContact = function (oContact)
{
	var sEmail = oContact ? oContact.getFullEmail() : '';
	
	if (sEmail !== '')
	{
		this.composeMessageToAddresses(sEmail);
	}
};

CContactsView.prototype.composeMessage = function () {
	var
		aList = this.selector.listCheckedOrSelected(),
		aEmails = Types.isNonEmptyArray(aList) ? _.compact(_.map(aList, function (oItem) {
			return oItem.Email() !== '' ? oItem.getFullEmail() : '';
		})) : [],
		sEmails = aEmails.join(', ')
	;

	if (sEmails !== '')
	{
		this.composeMessageToAddresses(sEmails);
	}
};

CContactsView.prototype.onClearSearchClick = function ()
{
	// initiation empty search
	this.searchInput('');
	this.searchSubmitCommand();
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onGetContactResponse = function (oResponse, oRequest)
{
	var oResult = oResponse.Result;
	if (oResult)
	{
		var
			oObject = new CContactModel(),
			oSelected  = this.selector.itemSelected()
		;

		oObject.parse(oResult);
		
		if (oSelected && oSelected.UUID() === oObject.uuid())
		{
			if (this.selectedContact() instanceof CContactModel && oObject instanceof CContactModel && this.selectedContact().uuid() === oObject.uuid())
			{
				oObject.edited(this.selectedContact().edited());
			}
			this.selectedItem(oObject);
		}
	}
	else
	{
		Api.showErrorByCode(oResponse);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onGetContactsResponse = function (oResponse, oRequest)
{
	var oResult = oResponse.Result;
	
	if (oResult)
	{
		var
			iContactCount = Types.pInt(oResult.ContactCount),
			aNewCollection = Types.isNonEmptyArray(oResult.List) ? _.compact(_.map(oResult.List, function (oRawContactItem) {
				var oContactItem = new CContactListItemModel();
				oContactItem.parse(oRawContactItem);
				return oContactItem;
			})) : [],
			oSelected  = this.selector.itemSelected(),
			oNewSelected  = oSelected ? _.find(aNewCollection, function (oContactItem) {
				return oSelected.UUID() === oContactItem.UUID();
			}) : null,
			aChecked = this.selector.listChecked(),
			aCheckedIds = (aChecked && 0 < aChecked.length) ? _.map(aChecked, function (oItem) {
				return oItem.UUID();
			}) : []
		;

		if (Types.isNonEmptyArray(aCheckedIds))
		{
			_.each(aNewCollection, function (oContactItem) {
				oContactItem.checked(-1 < $.inArray(oContactItem.UUID(), aCheckedIds));
			});
		}

		this.collection(aNewCollection);
		this.oPageSwitcher.setCount(iContactCount);
		this.contactCount(iContactCount);

		if (oNewSelected)
		{
			this.selector.itemSelected(oNewSelected);
			this.requestContact(oNewSelected.UUID());
		}
		else if (oSelected)
		{
			this.changeRouting({}, true);
		}

		this.selectedGroupEmails(this.selectedGroup() ? _.uniq(_.flatten(_.map(this.collection(), function (oContactItem) {
			return oContactItem.aEmails;
		}))) : []);
	}
	else
	{
		Api.showErrorByCode(oResponse);
	}
	
	this.loadingList(false);
};

CContactsView.prototype.viewAllMails = function ()
{
	if (this.selectedGroupEmails().length > 0)
	{
		this.searchMessagesInInbox('email:' + this.selectedGroupEmails().join(','));
	}
};

CContactsView.prototype.viewEvent = function (calendarId, eventId, start)
{
	Routing.goDirectly(['calendar', calendarId, eventId, start]);
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onGetGroupsResponse = function (oResponse, oRequest)
{
	var oResult = oResponse.Result;
	
	if (oResult)
	{
		var
			iIndex = 0,
			iLen = 0,
			aList = [],
			oSelected  = _.find(this.groupFullCollection(), function (oItem) {
				return oItem.selected();
			}) || null,
			oNewSelected = null
		;

		this.groupFullCollection(aList);
		for (iLen = oResult.length; iIndex < iLen; iIndex++)
		{
			if (oResult[iIndex])
			{
				oResult[iIndex].IsGroup = true;
				var oObject = new CContactListItemModel();
				oObject.parse(oResult[iIndex]);
				
				if (oObject.IsGroup())
				{
					if (oSelected && oSelected.UUID() === oObject.UUID())
					{
						oNewSelected = oObject;
					}

					aList.push(oObject);
				}
			}
		}
		
		this.selectedGroupInList(oNewSelected);
		if (oSelected !== null && oNewSelected === null)
		{
			Routing.replaceHash(LinksUtils.getContacts());
		}
		
		this.groupFullCollection(aList);
	}
	else
	{
		Api.showErrorByCode(oResponse);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onCreateGroupResponse = function (oResponse, oRequest)
{
	this.isSaving(false);
	if (oResponse.Result)
	{
		if (typeof oResponse.Result === 'string' && oResponse.Result !== '')
		{
			this.onViewGroupClick(oResponse.Result);
		}
		else
		{
			if (this.selectedGroup() && this.selectedGroup().edited())
			{
				this.selectedGroup().edited(false);
			}
		}
		Screens.showReport(TextUtils.i18n('CONTACTSWEBCLIENT/REPORT_GROUP_SUCCESSFULLY_ADDED'));
		this.requestGroupFullList();
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('CONTACTSWEBCLIENT/ERROR_SAVE_GROUP'));
	}
};

CContactsView.prototype.executeShare = function ()
{
	var
		bSelectedStorageAll = this.selectedStorage() === 'all',
		aChecked = _.filter(this.selector.listCheckedOrSelected(), function (oItem) {
			return oItem.sStorage !== 'team';
		}),
		aCheckedUUIDs = _.map(aChecked, function (oItem) {
			return oItem.UUID();
		})
	;
	
	aCheckedUUIDs = _.compact(aCheckedUUIDs);
	
	if (0 < aCheckedUUIDs.length)
	{
		_.each(aChecked, function (oContact) {
			if (oContact)
			{
				ContactsCache.clearInfoAboutEmail(oContact.Email());
			}
		}, this);
		
		if (!bSelectedStorageAll)
		{
			if (-1 < $.inArray(this.selectedContact(), aChecked))
			{
				this.selectedContact(null);
			}
				
			_.each(this.collection(), function (oContact) {
				if (-1 < $.inArray(oContact, aChecked))
				{
					oContact.deleted(true);
				}
			});

			_.delay(function () {
				this.collection.remove(function (oItem) {
					return oItem.deleted();
				});
			}.bind(this), 500);
		}

		if ('shared' === this.selectedStorage())
		{
			this.recivedAnimPersonal(true);
		}
		else
		{
			this.recivedAnimShared(true);
		}
	
		Ajax.send('UpdateSharedContacts', { 'UUIDs': aCheckedUUIDs }, function () {
			if (bSelectedStorageAll)
			{
				this.selector.listCheckedOrSelected(false);
				this.requestContactList();
			}
		}, this);
	}
};

/**
 * @param {Object} oItem
 */
CContactsView.prototype.requestGroup = function (oItem)
{
	this.loadingViewPane(true);
	
	if (oItem)
	{
		Ajax.send('GetGroup', {
			'UUID': oItem.UUID()
		}, this.onGetGroupResponse, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onGetGroupResponse = function (oResponse, oRequest)
{
	if (oResponse.Result)
	{
		var oGroup = oResponse.Result;
		this.oGroupModel
			.uuid(Types.pString(oGroup.UUID))
			.name(oGroup.Name)
			.isOrganization(oGroup.IsOrganization)
			.company(oGroup.Company)
			.country(oGroup.Country)
			.state(oGroup.State)
			.city(oGroup.City)
			.street(oGroup.Street)
			.zip(oGroup.Zip)
			.phone(oGroup.Phone)
			.fax(oGroup.Fax)
			.email(oGroup.Email)
			.web(oGroup.Web)
		;
	}
	else
	{
		Api.showErrorByCode(oResponse);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onGetGroupEventsResponse = function (oResponse, oRequest)
{
	if (oResponse.Result)
	{
		var Events = oResponse.Result;
		this.oGroupModel.events(Events);
	}
};

CContactsView.prototype.initUploader = function ()
{
	if (this.uploaderArea())
	{
		this.oJua = new CJua({
			'action': '?/Api/',
			'name': 'jua-uploader',
			'queueSize': 2,
			'dragAndDropElement': this.uploaderArea(),
			'disableAjaxUpload': false,
			'disableFolderDragAndDrop': false,
			'disableDragAndDrop': false,
			'hidden': _.extendOwn({
				'Module': Settings.ServerModuleName,
				'Method': 'Import',
				'Parameters':  _.bind(function () {
					return JSON.stringify({
						'GroupUUID': this.currentGroupUUID(),
						'Storage': 'personal'
					});
				}, this)
			}, App.getCommonRequestParameters())
		});
		
		this.oJua
			.on('onSelect', _.bind(this.onImportSelect, this))
			.on('onComplete', _.bind(this.onImportComplete, this))
			.on('onBodyDragEnter', _.bind(this.dragActive, this, true))
			.on('onBodyDragLeave', _.bind(this.dragActive, this, false))
		;
	}
};

CContactsView.prototype.onImportSelect = function (sFileUid, oFileData)
{
	var
		bAllowImport = this.isNotTeamStorageSelected(),
		bAllowFormat = false
	;
	
	if (bAllowImport)
	{
		_.each(Settings.ImportExportFormats, function (sFormat) {
			if (sFormat.toLowerCase() === oFileData.FileName.substr(oFileData.FileName.length - sFormat.length).toLowerCase())
			{
				bAllowFormat = true;
			}
		});
		
		if (!bAllowFormat)
		{
			Screens.showError(this.getFormatDependentText('ERROR_FILE_EXTENSION'));
			bAllowImport = false;
		}
	}
	
	return bAllowImport;
};

CContactsView.prototype.onImportComplete = function (sFileUid, bResponseReceived, oResponse)
{
	var
		bError = !bResponseReceived || !oResponse || !oResponse.Result || false,
		iImportedCount = 0
	;
	
	if (!bError)
	{
		iImportedCount = Types.pInt(oResponse.Result.ImportedCount);
		
		if (0 < iImportedCount)
		{
			Screens.showReport(TextUtils.i18n('CONTACTSWEBCLIENT/REPORT_CONTACTS_IMPORTED_PLURAL', {
				'NUM': iImportedCount
			}, null, iImportedCount));
		}
		else
		{
			Screens.showError(TextUtils.i18n('CONTACTSWEBCLIENT/ERROR_IMPORT_NO_CONTACT'));
		}
	}
	else
	{
		if (oResponse && oResponse.ErrorCode === Enums.Errors.IncorrectFileExtension)
		{
			Screens.showError(this.getFormatDependentText('ERROR_FILE_EXTENSION'));
		}
		else
		{
			Screens.showError(TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_FILE'));
		}
	}
	
	this.requestGroupFullList();
	this.requestContactList();
};

module.exports = CContactsView;


/***/ }),

/***/ "wudd":
/*!***********************************************************!*\
  !*** ./modules/ContactsWebclient/js/models/VcardModel.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	Ajax = __webpack_require__(/*! modules/ContactsWebclient/js/Ajax.js */ "tYdA"),
	
	ContactsCache = __webpack_require__(/*! modules/ContactsWebclient/js/Cache.js */ "v6sP"),
	HeaderItemView = !App.isNewTab() ? __webpack_require__(/*! modules/ContactsWebclient/js/views/HeaderItemView.js */ "fG7T") : null,
	MainTab = (App.isNewTab() && window.opener) ? window.opener.MainTabContactsMethods : null
;

/**
 * @constructor
 */
function CVcardModel()
{
	this.uid = ko.observable('');
	this.file = ko.observable('');
	this.name = ko.observable('');
	this.email = ko.observable('');
	this.exists = ko.observable(false);
	this.isJustSaved = ko.observable(false);
}

/**
 * @param {AjaxVCardResponse} oData
 */
CVcardModel.prototype.parse = function (oData)
{
	if (oData && oData['@Object'] === 'Object/Aurora\\Modules\\Mail\\Classes\\Vcard')
	{
		this.uid(Types.pString(oData.Uid));
		this.file(Types.pString(oData.File));
		this.name(Types.pString(oData.Name));
		this.email(Types.pString(oData.Email));
		this.exists(!!oData.Exists);
		
		ContactsCache.addVcard(this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CVcardModel.prototype.onContactsSaveVcfResponse = function (oResponse, oRequest)
{
	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('CONTACTSWEBCLIENT/ERROR_CREATE_CONTACT'));
		this.exists(false);
	}
	else
	{
		if (_.isArray(oResponse.Result.ImportedUids) && oResponse.Result.ImportedUids.length === 1)
		{
			this.uid(oResponse.Result.ImportedUids[0]);
			if (MainTab)
			{
				MainTab.updateVcardUid(this.file(), this.uid());
			}
		}
	}
};

CVcardModel.prototype.addContact = function ()
{
	Ajax.send('AddContactsFromFile', {'File': this.file()}, this.onContactsSaveVcfResponse, this);
	
	this.isJustSaved(true);
	this.exists(true);
	
	setTimeout(_.bind(function () {
		this.isJustSaved(false);
	}, this), 20000);
	
	if (HeaderItemView)
	{
		HeaderItemView.recivedAnim(true);
	}
	else if (MainTab)
	{
		MainTab.markVcardsExistentByFile(this.file());
	}
};

module.exports = CVcardModel;


/***/ })

}]);
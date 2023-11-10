webpackJsonp([2],{

/***/ 236:
/*!***************************************************!*\
  !*** ./modules/AdminPanelWebclient/js/manager.js ***!
  \***************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = function (oAppData) {
		var 
			App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ 182),
			Promise = __webpack_require__(/*! bluebird */ 3)
		;
		
		if (App.getUserRole() === Enums.UserRole.SuperAdmin)
		{
			var
				_ = __webpack_require__(/*! underscore */ 2),
				
				TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ 185),
				
				Cache = __webpack_require__(/*! modules/AdminPanelWebclient/js/Cache.js */ 237),
				Settings = __webpack_require__(/*! modules/AdminPanelWebclient/js/Settings.js */ 238),
				
				aEntityTypesToRegister = [],
				aEntityDataToChange = [],
					
				aAdminPanelTabsParams = [],
				aAdminPanelTabsSectionsParams = []
			;

			Settings.init(oAppData);
			Cache.init(oAppData);
			
			return {
				start: function () {
					aAdminPanelTabsParams.push({
						GetTabView: function(resolve) {
							__webpack_require__.e/* nsure */(1/*! admin-bundle */, function() {
									resolve(__webpack_require__(/*! modules/AdminPanelWebclient/js/views/DbAdminSettingsView.js */ 247));
								});
						},
						TabName: Settings.HashModuleName + '-db',
						TabTitle: TextUtils.i18n('ADMINPANELWEBCLIENT/LABEL_DB_SETTINGS_TAB')
					});
					aAdminPanelTabsParams.push({
						GetTabView: function(resolve) {
							__webpack_require__.e/* nsure */(1/*! admin-bundle */, function() {
									resolve(__webpack_require__(/*! modules/AdminPanelWebclient/js/views/SecurityAdminSettingsView.js */ 249));
								});
						},
						TabName: Settings.HashModuleName + '-security',
						TabTitle: TextUtils.i18n('ADMINPANELWEBCLIENT/LABEL_SECURITY_SETTINGS_TAB')
					});
					aAdminPanelTabsParams.push({
						GetTabView: function(resolve) {
							__webpack_require__.e/* nsure */(1/*! admin-bundle */, function() {
									resolve(__webpack_require__(/*! modules/AdminPanelWebclient/js/views/CommonSettingsPaneView.js */ 250));
								});
						},
						TabName: 'common',
						TabTitle: TextUtils.i18n('ADMINPANELWEBCLIENT/LABEL_COMMON_SETTINGS_TAB')
					});
					aAdminPanelTabsParams.push({
						GetTabView: function(resolve) {
							__webpack_require__.e/* nsure */(1/*! admin-bundle */, function() {
									resolve(__webpack_require__(/*! modules/AdminPanelWebclient/js/views/AboutAdminSettingsView.js */ 251));
								});
						},
						TabName: 'about',
						TabTitle: TextUtils.i18n('ADMINPANELWEBCLIENT/LABEL_ABOUT_SETTINGS_TAB')
					});
				},
				getScreens: function () {
					var oScreens = {};
					oScreens[Settings.HashModuleName] = function () {
						
						return new Promise(function(resolve, reject) {
							__webpack_require__.e/* nsure */(1/*! admin-bundle */, function(require) {
									// EntitiesTabs shouldn't be required before every module will be initialized.
									// (Requires view. All views should be required after initialization of all modules.)
									var EntitiesTabs = __webpack_require__(/*! modules/AdminPanelWebclient/js/EntitiesTabs.js */ 241);
									_.each(aEntityTypesToRegister, function (oEntityData) {
										EntitiesTabs.registerEntityType(oEntityData);
									});
									_.each(aEntityDataToChange, function (oEntityData) {
										EntitiesTabs.changeEntityData(oEntityData);
									});
									
									var
										oSettingsView = __webpack_require__(/*! modules/AdminPanelWebclient/js/views/SettingsView.js */ 244),
										aPromises = []
									;
									
									_.each(aAdminPanelTabsParams, function (oParams) {
										var oPromise = oSettingsView.registerTab(oParams.GetTabView, oParams.TabName, oParams.TabTitle);
										
										if (oPromise)
										{
											aPromises.push(oPromise);
										}
									});
									
									Promise.all(aPromises).then(function () { 
										oSettingsView.sortRegisterTabs();
										resolve(oSettingsView);
										_.each(aAdminPanelTabsSectionsParams, function (oSectionParams) {
											oSettingsView.registerTabSection(oSectionParams.GetTabView, oSectionParams.TabName, oSectionParams.TabTitle);
										});
									}, function () {
										oSettingsView.sortRegisterTabs();
										resolve(oSettingsView);
										_.each(aAdminPanelTabsSectionsParams, function (oSectionParams) {
											oSettingsView.registerTabSection(oSectionParams.GetTabView, oSectionParams.TabName, oSectionParams.TabTitle);
										});
									});
								});
						});
					};
					return oScreens;
				},
				getAbstractSettingsFormViewClass: function () {
					return __webpack_require__(/*! modules/AdminPanelWebclient/js/views/CAbstractSettingsFormView.js */ 239);
				},
				registerAdminPanelTab: function (fGetTabView, sTabName, sTabTitle) {
					aAdminPanelTabsParams.push({
						GetTabView: fGetTabView,
						TabName: sTabName,
						TabTitle: sTabTitle
					});
				},
				registerAdminPanelTabSection: function (fGetTabView, sTabName) {
					aAdminPanelTabsSectionsParams.push({
						GetTabView: fGetTabView,
						TabName: sTabName
					});
				},
				showEntities: function (sCurrentEntityType, oEntitiesId) {
					var
						Routing = __webpack_require__(/*! modules/CoreWebclient/js/Routing.js */ 195),
						Links = __webpack_require__(/*! modules/AdminPanelWebclient/js/utils/Links.js */ 240)
					;
					Routing.setHash(Links.get(sCurrentEntityType, oEntitiesId, ''));
				},
				setAddHash: function (aAddHash) {
					var SettingsView = __webpack_require__(/*! modules/AdminPanelWebclient/js/views/SettingsView.js */ 244);
					SettingsView.setAddHash(aAddHash);
				},
				registerAdminPanelEntityType: function (oEntityData) {
					aEntityTypesToRegister.push(oEntityData);
				},
				changeAdminPanelEntityData: function (oEntityData) {
					aEntityDataToChange.push(oEntityData);
				},
				getKoSelectedTenantId: function () {
					return Cache.selectedTenantId;
				},
				getTenantsObservable: function () {
					return Cache.tenants;
				}
			};
		}
		
		return null;
	};


/***/ }),

/***/ 237:
/*!*************************************************!*\
  !*** ./modules/AdminPanelWebclient/js/Cache.js ***!
  \*************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		ko = __webpack_require__(/*! knockout */ 44),
		
		Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ 181),
		
		Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ 191),
		App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ 182),
		CoreSettings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ 43),
		
		Settings = __webpack_require__(/*! modules/AdminPanelWebclient/js/Settings.js */ 238);
	;

	function CCache()
	{
		this.tenants = ko.observableArray([]);
		this.selectedTenantId = ko.observable(0);
		this.selectedTenant = ko.computed(function () {
			return _.find(this.tenants(), function (oTenant) {
				return oTenant.Id === this.selectedTenantId();
			}.bind(this)) || { Name: '' };
		}, this);
		CoreSettings.dbSettingsChanged.subscribe(function () {
			if (CoreSettings.dbSettingsChanged())
			{
				Ajax.send(Settings.ServerModuleName, 'GetEntityList', { Type: 'Tenant' });
			}
		});
	}

	CCache.prototype.init = function (oAppData) {
		App.subscribeEvent('ReceiveAjaxResponse::after', this.onAjaxResponse.bind(this));
		
		var oAppDataSection = oAppData[Settings.ServerModuleName];
		this.parseTenants(oAppDataSection ? oAppDataSection.Tenants : []);
	};

	CCache.prototype.onAjaxResponse = function (oParams) {
		if (oParams.Response.Module === Settings.ServerModuleName && oParams.Response.Method === 'GetEntityList' && oParams.Request.Parameters.Type === 'Tenant')
		{
			var
				sSearch = Types.pString(oParams.Request.Parameters.Search),
				iOffset = Types.pInt(oParams.Request.Parameters.Offset)
			;
			if (sSearch === '' && iOffset === 0)
			{
				this.parseTenants(oParams.Response.Result);
			}
		}
	};

	CCache.prototype.setSelectedTenant = function (iId)
	{
		if (_.find(this.tenants(), function (oTenant) { return oTenant.Id === iId; }))
		{
			this.selectedTenantId(iId);
		}
	};

	CCache.prototype.parseTenants = function (oResult)
	{
		var
			iSelectedId = this.selectedTenantId(),
			bHasSelected = false,
			aTenantsData = oResult && _.isArray(oResult.Items) ? oResult.Items : [],
			aTenants = []
		;

		_.each(aTenantsData, function (oTenantData) {
			var oTenant = {
				Name: oTenantData.Name,
				Id: Types.pInt(oTenantData.Id)
			};
			if (oTenant.Id === iSelectedId)
			{
				bHasSelected = true;
			}
			aTenants.push(oTenant);
		});

		if (!bHasSelected)
		{
			this.selectedTenantId(aTenants.length > 0 ? aTenants[0].Id : 0);
		}
		
		this.tenants(aTenants);
	};

	module.exports = new CCache();


/***/ }),

/***/ 238:
/*!****************************************************!*\
  !*** ./modules/AdminPanelWebclient/js/Settings.js ***!
  \****************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		
		Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ 181)
	;

	module.exports = {
		ServerModuleName: 'AdminPanelWebclient',
		HashModuleName: 'admin',
		
		EntitiesPerPage: 20,
		TabsOrder: ['licensing', 'admin-security', 'admin-db', 'logs-viewer', 'system', 'common', 'modules'],
		EntitiesOrder: [],
		EnableMultiTenant: false,
		
		/**
		 * Initializes settings from AppData object sections.
		 * 
		 * @param {Object} oAppData Object contained modules settings.
		 */
		init: function (oAppData)
		{
			var
				oAppDataSection = oAppData[this.ServerModuleName],
				oCoreDataSection = oAppData['Core']
			;

			if (!_.isEmpty(oAppDataSection))
			{
				this.EntitiesPerPage = Types.pPositiveInt(oAppDataSection.EntitiesPerPage, this.EntitiesPerPage);
				this.TabsOrder = Types.pArray(oAppDataSection.TabsOrder, this.TabsOrder);
				this.EntitiesOrder = Types.pArray(oAppDataSection.EntitiesOrder, this.EntitiesOrder);
			}
			
			if (!_.isEmpty(oCoreDataSection))
			{
				this.EnableMultiTenant = Types.pBool(oCoreDataSection.EnableMultiTenant, this.EnableMultiTenant);
			}
		}
	};


/***/ }),

/***/ 239:
/*!***************************************************************************!*\
  !*** ./modules/AdminPanelWebclient/js/views/CAbstractSettingsFormView.js ***!
  \***************************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		ko = __webpack_require__(/*! knockout */ 44),
		
		TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ 185),
		
		Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ 191),
		Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ 186),
		Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ 188),
		
		Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ 192),
		ConfirmPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/ConfirmPopup.js */ 201)
	;

	/**
	 * @constructor
	 * @param {string} sServerModule
	 */
	function CAbstractSettingsFormView(sServerModule)
	{
		this.sServerModule = sServerModule ? sServerModule : 'Core';
		
		this.isSaving = ko.observable(false);
		
		this.visible = ko.observable(true);
		
		this.sSavedState = '';
		
		this.bShown = false;
		
		this.aSettingsSections = [];
	}

	CAbstractSettingsFormView.prototype.ViewTemplate = ''; // should be overriden

	CAbstractSettingsFormView.prototype.addSettingsSection = function (oSection)
	{
		this.aSettingsSections.push(oSection);
	};

	CAbstractSettingsFormView.prototype.onRoute = function (aParams)
	{
		var bWasntShown = !this.bShown;
		this.bShown = true;
		if (bWasntShown && _.isFunction(this.onShow))
		{
			this.onShow();
		}
		this.revert();
		if (_.isFunction(this.onRouteChild))
		{
			this.onRouteChild(aParams);
		}
		_.each(this.aSettingsSections, function (oSection) {
			if (_.isFunction(oSection.onShow))
			{
				oSection.onShow(aParams);
			}
		});
	};

	/**
	 * @param {Function} fAfterHideHandler
	 * @param {Function} fRevertRouting
	 */
	CAbstractSettingsFormView.prototype.hide = function (fAfterHideHandler, fRevertRouting)
	{
		var bStateChanged = this.getCurrentState() !== this.sSavedState;
		_.each(this.aSettingsSections, function (oSection) {
			if (_.isFunction(oSection.getCurrentState))
			{
				bStateChanged = bStateChanged || oSection.getCurrentState() !== oSection.sSavedState;
			}
		});
		if (bStateChanged) // if values have been changed
		{
			Popups.showPopup(ConfirmPopup, [TextUtils.i18n('COREWEBCLIENT/CONFIRM_DISCARD_CHANGES'), _.bind(function (bDiscard) {
				if (bDiscard)
				{
					this.bShown = false;
					fAfterHideHandler();
					this.revert();
				}
				else if (_.isFunction(fRevertRouting))
				{
					fRevertRouting();
				}
			}, this)]);
		}
		else
		{
			this.bShown = false;
			fAfterHideHandler();
		}
	};

	/**
	 * Returns an array with the values of editable fields.
	 * 
	 * Should be overriden.
	 * 
	 * @returns {Array}
	 */
	CAbstractSettingsFormView.prototype.getCurrentValues = function ()
	{
		return [];
	};

	/**
	 * @returns {String}
	 */
	CAbstractSettingsFormView.prototype.getCurrentState = function ()
	{
		var aState = this.getCurrentValues();
		
		return aState.join(':');
	};

	CAbstractSettingsFormView.prototype.updateSavedState = function()
	{
		this.sSavedState = this.getCurrentState();
	};

	/**
	 * Puts values from the global settings object to the editable fields.
	 * 
	 * Should be overriden.
	 */
	CAbstractSettingsFormView.prototype.revertGlobalValues = function ()
	{
		
	};

	CAbstractSettingsFormView.prototype.revert = function ()
	{
		_.each(this.aSettingsSections, function (oSection) {
			if (_.isFunction(oSection.revert))
			{
				oSection.revert();
			}
		});
		
		this.revertGlobalValues();
		
		this.updateSavedState();
	};

	/**
	 * Gets values from the editable fields and prepares object for passing to the server and saving settings therein.
	 * 
	 * Should be overriden.
	 * 
	 * @returns {Object}
	 */
	CAbstractSettingsFormView.prototype.getParametersForSave = function ()
	{
		return {};
	};

	/**
	 * Sends a request to the server to save the settings.
	 */
	CAbstractSettingsFormView.prototype.save = function ()
	{
		if (!_.isFunction(this.validateBeforeSave) || this.validateBeforeSave())
		{
			this.isSaving(true);

			Ajax.send(this.sServerModule, 'UpdateSettings', this.getParametersForSave(), this.onResponse, this);
		}
	};

	/**
	 * Applies saved values of settings to the global settings object.
	 * 
	 * Should be overriden.
	 * 
	 * @param {Object} oParameters Object that have been obtained by getParameters function.
	 */
	CAbstractSettingsFormView.prototype.applySavedValues = function (oParameters)
	{
		
	};

	/**
	 * Parses the response from the server.
	 * If the settings are normally stored, then updates them in the global settings object. 
	 * Otherwise shows an error message.
	 * 
	 * @param {Object} oResponse
	 * @param {Object} oRequest
	 */
	CAbstractSettingsFormView.prototype.onResponse = function (oResponse, oRequest)
	{
		this.isSaving(false);

		if (!oResponse.Result)
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
		}
		else
		{
			var oParameters = oRequest.Parameters;
			
			this.updateSavedState();

			this.applySavedValues(oParameters);
			
			Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
		}
	};

	/**
	 * Should be overriden.
	 * 
	 * @param {string} sEntityType
	 * @param {int} iEntityId
	 */
	CAbstractSettingsFormView.prototype.setAccessLevel = function (sEntityType, iEntityId)
	{
	};

	module.exports = CAbstractSettingsFormView;


/***/ }),

/***/ 240:
/*!*******************************************************!*\
  !*** ./modules/AdminPanelWebclient/js/utils/Links.js ***!
  \*******************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		
		Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ 181),
		
		EntitiesTabs = __webpack_require__(/*! modules/AdminPanelWebclient/js/EntitiesTabs.js */ 241),
		Settings = __webpack_require__(/*! modules/AdminPanelWebclient/js/Settings.js */ 238),
		
		sSrchPref = 's.',
		sPagePref = 'p.',
		
		Links = {}
	;

	/**
	 * Returns true if parameter contains path value.
	 * @param {string} sTemp
	 * @return {boolean}
	 */
	function IsPageParam(sTemp)
	{
		return (sPagePref === sTemp.substr(0, 1) && (/^[1-9][\d]*$/).test(sTemp.substr(sPagePref.length)));
	};

	/**
	 * Returns true if parameter contains search value.
	 * @param {string} sTemp
	 * @return {boolean}
	 */
	function IsSearchParam(sTemp)
	{
		return (sSrchPref === sTemp.substr(0, sSrchPref.length));
	};

	/**
	 * @param {Array=} aEntities
	 * @param {string=} sCurrEntityType = ''
	 * @param {string=} sLast = ''
	 * @param {number=} iPage = 1
	 * @param {string=} sSearch = ''
	 * @return {Array}
	 */
	Links.get = function (sCurrEntityType, aEntities, sLast, iPage, sSearch)
	{
		var
			aResult = [Settings.HashModuleName],
			bContinue = true;
		;
		
		aEntities = aEntities || [];
		
		_.each(EntitiesTabs.getData(), function (oEntityData) {
			if (bContinue)
			{
				if (Types.isPositiveNumber(aEntities[oEntityData.Type]))
				{
					if (oEntityData.Type !== 'User' || sCurrEntityType !== 'MailingList')
					{
						aResult.push(oEntityData.ScreenHash.substr(0,1) + aEntities[oEntityData.Type]);
					}
				}
				else if (sCurrEntityType === oEntityData.Type)
				{
					aResult.push(oEntityData.ScreenHash);
				}
				if (sCurrEntityType === oEntityData.Type)
				{
					bContinue = false;
				}
			}
		});
		
		if (Types.isPositiveNumber(iPage) && iPage > 1)
		{
			aResult.push(sPagePref + iPage);
		}
		
		if (Types.isNonEmptyString(sSearch))
		{
			aResult.push(sSrchPref + sSearch);
		}
		
		if (Types.isNonEmptyString(sLast))
		{
			aResult.push(sLast);
		}
		
		return aResult;
	};

	/**
	 * @param {Array} aParams
	 * 
	 * @return {Object}
	 */
	Links.parse = function (aParams)
	{
		var
			iIndex = 0,
			oEntities = {},
			sCurrEntityType = '',
			iPage = 1,
			sSearch = '',
			sTemp = ''
		;
		
		_.each(EntitiesTabs.getData(), function (oEntityData) {
			if (aParams[iIndex] && oEntityData.ScreenHash === aParams[iIndex])
			{
				sCurrEntityType = oEntityData.Type;
				iIndex++;
			}
			if (aParams[iIndex] && oEntityData.ScreenHash.substr(0, 1) === aParams[iIndex].substr(0, 1) && Types.pInt(aParams[iIndex].substr(1)) > 0)
			{
				oEntities[oEntityData.Type] = Types.pInt(aParams[iIndex].substr(1));
				sCurrEntityType = oEntityData.Type;
				iIndex++;
			}
			if (aParams.length > iIndex)
			{
				sTemp = Types.pString(aParams[iIndex]);
				if (IsPageParam(sTemp))
				{
					iPage = Types.pInt(sTemp.substr(sPagePref.length));
					if (iPage <= 0)
					{
						iPage = 1;
					}
					iIndex++;
				}
			}
			if (aParams.length > iIndex)
			{
				sTemp = Types.pString(aParams[iIndex]);
				if (IsSearchParam(sTemp))
				{
					sSearch = sTemp.substr(sSrchPref.length);
					iIndex++;
				}
			}
		});
		
		return {
			Entities: oEntities,
			CurrentType: sCurrEntityType,
			Last: Types.isNonEmptyString(aParams[iIndex]) ? aParams[iIndex] : '',
			Page: iPage,
			Search: sSearch
		};
	};

	module.exports = Links;


/***/ }),

/***/ 241:
/*!********************************************************!*\
  !*** ./modules/AdminPanelWebclient/js/EntitiesTabs.js ***!
  \********************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		
		TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ 185),
		
		Settings = __webpack_require__(/*! modules/AdminPanelWebclient/js/Settings.js */ 238)
	;

	function CEntitiesTabs()
	{
		this.aData = [];

		if (Settings.EnableMultiTenant)
		{
			this.aData.push(
				{
					Type: 'Tenant',
					ScreenHash: 'tenants',
					LinkTextKey: 'ADMINPANELWEBCLIENT/HEADING_TENANTS_SETTINGS_TABNAME',
					EditView: __webpack_require__(/*! modules/AdminPanelWebclient/js/views/EditTenantView.js */ 242),
					
					ServerModuleName: Settings.ServerModuleName,
					GetListRequest: 'GetEntityList',
					GetRequest: 'GetEntity',
					CreateRequest: 'CreateTenant',
					UpdateRequest: 'UpdateEntity',
					DeleteRequest: 'DeleteEntities',
					
					NoEntitiesFoundText: TextUtils.i18n('ADMINPANELWEBCLIENT/INFO_NO_ENTITIES_FOUND_TENANT'),
					ActionCreateText: TextUtils.i18n('ADMINPANELWEBCLIENT/ACTION_CREATE_ENTITY_TENANT'),
					ReportSuccessCreateText: TextUtils.i18n('ADMINPANELWEBCLIENT/REPORT_CREATE_ENTITY_TENANT'),
					ErrorCreateText: TextUtils.i18n('ADMINPANELWEBCLIENT/ERROR_CREATE_ENTITY_TENANT'),
					CommonSettingsHeadingText: TextUtils.i18n('COREWEBCLIENT/HEADING_COMMON_SETTINGS'),
					ReportSuccessUpdate: TextUtils.i18n('ADMINPANELWEBCLIENT/REPORT_UPDATE_ENTITY_TENANT'),
					ErrorUpdate: TextUtils.i18n('ADMINPANELWEBCLIENT/ERROR_UPDATE_ENTITY_TENANT'),
					ActionDeleteText: TextUtils.i18n('ADMINPANELWEBCLIENT/ACTION_DELETE_TENANT'),
					ConfirmDeleteLangConst: 'ADMINPANELWEBCLIENT/CONFIRM_DELETE_TENANT_PLURAL',
					ReportSuccessDeleteLangConst: 'ADMINPANELWEBCLIENT/REPORT_DELETE_ENTITIES_TENANT_PLURAL',
					ErrorDeleteLangConst: 'ADMINPANELWEBCLIENT/ERROR_DELETE_ENTITIES_TENANT_PLURAL'
				}
			);
		}

		this.aData.push(
			{
				Type: 'User',
				ScreenHash: 'users',
				LinkTextKey: 'ADMINPANELWEBCLIENT/HEADING_USERS_SETTINGS_TABNAME',
				EditView: __webpack_require__(/*! modules/AdminPanelWebclient/js/views/EditUserView.js */ 243),
				
				ServerModuleName: Settings.ServerModuleName,
				GetListRequest: 'GetEntityList',
				GetRequest: 'GetEntity',
				CreateRequest: 'CreateUser',
				UpdateRequest: 'UpdateEntity',
				DeleteRequest: 'DeleteEntities',
				
				NoEntitiesFoundText: TextUtils.i18n('ADMINPANELWEBCLIENT/INFO_NO_ENTITIES_FOUND_USER'),
				ActionCreateText: TextUtils.i18n('ADMINPANELWEBCLIENT/ACTION_CREATE_ENTITY_USER'),
				ReportSuccessCreateText: TextUtils.i18n('ADMINPANELWEBCLIENT/REPORT_CREATE_ENTITY_USER'),
				ErrorCreateText: TextUtils.i18n('ADMINPANELWEBCLIENT/ERROR_CREATE_ENTITY_USER'),
				CommonSettingsHeadingText: TextUtils.i18n('COREWEBCLIENT/HEADING_COMMON_SETTINGS'),
				ReportSuccessUpdate: TextUtils.i18n('ADMINPANELWEBCLIENT/REPORT_UPDATE_ENTITY_USER'),
				ErrorUpdate: TextUtils.i18n('ADMINPANELWEBCLIENT/ERROR_UPDATE_ENTITY_USER'),
				ActionDeleteText: TextUtils.i18n('ADMINPANELWEBCLIENT/ACTION_DELETE_USER'),
				ConfirmDeleteLangConst: 'ADMINPANELWEBCLIENT/CONFIRM_DELETE_USER_PLURAL',
				ReportSuccessDeleteLangConst: 'ADMINPANELWEBCLIENT/REPORT_DELETE_ENTITIES_USER_PLURAL',
				ErrorDeleteLangConst: 'ADMINPANELWEBCLIENT/ERROR_DELETE_ENTITIES_USER_PLURAL'
			}
		);

		this.sortEntitiesData();
	}

	CEntitiesTabs.prototype.getData = function ()
	{
		return this.aData;
	};

	CEntitiesTabs.prototype.getEntityData = function (sType)
	{
		return _.find(this.aData, function (oEntityData) {
			return oEntityData.Type === sType;
		});
	};

	CEntitiesTabs.prototype.getEditView = function (sType)
	{
		var oEntityData = this.getEntityData(sType);
		return oEntityData ? oEntityData.EditView : null;
	};

	CEntitiesTabs.prototype.registerEntityType = function (oEntityData)
	{
		this.aData.push(oEntityData);
		this.sortEntitiesData();
	};

	CEntitiesTabs.prototype.sortEntitiesData = function ()
	{
		this.aData = _.sortBy(this.aData, function (oEntityData) {
			var iIndex = _.indexOf(Settings.EntitiesOrder, oEntityData.Type);
			return iIndex !== -1 ? iIndex : Settings.EntitiesOrder.length;
		});
	};

	CEntitiesTabs.prototype.changeEntityData = function (oEntityData)
	{
		var oData = this.getEntityData(oEntityData.Type);
		if (oData)
		{
			_.each(oEntityData, function (mValue, sKey) {
				oData[sKey] = mValue;
			});
		}
	};

	module.exports = new CEntitiesTabs();


/***/ }),

/***/ 242:
/*!****************************************************************!*\
  !*** ./modules/AdminPanelWebclient/js/views/EditTenantView.js ***!
  \****************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function($) {'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		ko = __webpack_require__(/*! knockout */ 44),
		
		TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ 185),
		Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ 181),
		
		Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ 188)
	;

	function ParseAdditionalFields(sEntityType)
	{
		var aAdditionalFields = Types.pArray(window.auroraAppData && window.auroraAppData.additional_entity_fields_to_edit);
		return _.filter(aAdditionalFields, function (oFieldData) {
			oFieldData.value = ko.observable('');
			return oFieldData.Entity === sEntityType;
		});
	}

	/**
	 * @constructor
	 */
	function CEditTenantView()
	{
		this.id = ko.observable(0);
		this.name = ko.observable('');
		this.description = ko.observable('');
		this.webDomain = ko.observable('');
		this.siteName = ko.observable('');
		
		this.sHeading = TextUtils.i18n('ADMINPANELWEBCLIENT/HEADING_CREATE_TENANT');
		this.sActionCreate = TextUtils.i18n('COREWEBCLIENT/ACTION_CREATE');
		this.sActionCreateInProgress = TextUtils.i18n('COREWEBCLIENT/ACTION_CREATE_IN_PROGRESS');
		
		this.aAdditionalFields = ParseAdditionalFields('Tenant');
	}

	CEditTenantView.prototype.ViewTemplate = 'AdminPanelWebclient_EditTenantView';

	CEditTenantView.prototype.getCurrentValues = function ()
	{
		var aFieldsValues = [
			this.id(),
			this.name(),
			this.description(),
			this.webDomain(),
			this.siteName()
		];
		
		_.each(this.aAdditionalFields, function (oField) {
			aFieldsValues.push(oField.value());
		});
		
		return aFieldsValues;
	};

	CEditTenantView.prototype.clearFields = function ()
	{
		this.id(0);
		this.name('');
		this.description('');
		this.webDomain('');
		this.siteName('');
		
		_.each(this.aAdditionalFields, function (oField) {
			oField.value('');
		});
	};

	CEditTenantView.prototype.parse = function (iEntityId, oResult)
	{
		if (oResult)
		{
			this.id(iEntityId);
			this.name(oResult.Name);
			this.description(oResult.Description);
			this.webDomain(oResult.WebDomain);
			this.siteName(oResult.SiteName);
			
			_.each(this.aAdditionalFields, function (oField) {
				oField.value(Types.pString(oResult[oField.FieldName]));
			});
		}
		else
		{
			this.clearFields();
		}
	};

	CEditTenantView.prototype.isValidSaveData = function ()
	{
		if ($.trim(this.name()) === '')
		{
			Screens.showError(TextUtils.i18n('ADMINPANELWEBCLIENT/ERROR_TENANT_NAME_EMPTY'));
			return false;
		}
		if ((/[\\\/\:\*\?\\\"\<\>\|]/gi).test(this.name()))
		{
			Screens.showError(TextUtils.i18n('ADMINPANELWEBCLIENT/ERROR_TENANT_NAME_INVALID'));
			return false;
		}
		return true;
	};

	CEditTenantView.prototype.getParametersForSave = function ()
	{
		var oParameters = {
			Id: this.id(),
			Name: this.name(),
			Description: this.description(),
			WebDomain: this.webDomain(),
			SiteName: this.siteName()
		};
		
		_.each(this.aAdditionalFields, function (oField) {
			oParameters[oField.FieldName] = oField.value();
		});
		
		return oParameters;
	};

	module.exports = new CEditTenantView();

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(/*! jquery */ 1)))

/***/ }),

/***/ 243:
/*!**************************************************************!*\
  !*** ./modules/AdminPanelWebclient/js/views/EditUserView.js ***!
  \**************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		$ = __webpack_require__(/*! jquery */ 1),
		ko = __webpack_require__(/*! knockout */ 44),
		
		TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ 185),
		
		Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ 188),
		App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ 182)
	;

	/**
	 * @constructor
	 */
	function CEditUserView()
	{
		this.id = ko.observable(0);
		this.publicId = ko.observable('');
		this.aRoles = [
			{text: TextUtils.i18n('ADMINPANELWEBCLIENT/LABEL_ADMINISTRATOR'), value: Enums.UserRole.SuperAdmin},
			{text: TextUtils.i18n('ADMINPANELWEBCLIENT/LABEL_USER'), value: Enums.UserRole.NormalUser},
			{text: TextUtils.i18n('ADMINPANELWEBCLIENT/LABEL_GUEST'), value: Enums.UserRole.Customer}
		];
		this.role = ko.observable(Enums.UserRole.NormalUser);
		this.writeSeparateLog = ko.observable(false);
		
		this.sHeading = TextUtils.i18n('ADMINPANELWEBCLIENT/HEADING_CREATE_USER');
		this.sActionCreate = TextUtils.i18n('COREWEBCLIENT/ACTION_CREATE');
		this.sActionCreateInProgress = TextUtils.i18n('COREWEBCLIENT/ACTION_CREATE_IN_PROGRESS');
		
		App.broadcastEvent('AdminPanelWebclient::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
	}

	CEditUserView.prototype.ViewTemplate = 'AdminPanelWebclient_EditUserView';
	CEditUserView.prototype.ViewConstructorName = 'CEditUserView';

	CEditUserView.prototype.getCurrentValues = function ()
	{
		return [
			this.id(),
			this.publicId(),
			this.role(),
			this.writeSeparateLog()
		];
	};

	CEditUserView.prototype.clearFields = function ()
	{
		this.id(0);
		this.publicId('');
		this.role(Enums.UserRole.NormalUser);
		this.writeSeparateLog(false);
	};

	CEditUserView.prototype.parse = function (iEntityId, oResult)
	{
		if (oResult)
		{
			this.id(iEntityId);
			this.publicId(oResult.PublicId);
			this.role(oResult.Role);
			this.writeSeparateLog(!!oResult.WriteSeparateLog);
		}
		else
		{
			this.clearFields();
		}
	};

	CEditUserView.prototype.isValidSaveData = function ()
	{
		var bValid = $.trim(this.publicId()) !== '';
		if (!bValid)
		{
			Screens.showError(TextUtils.i18n('ADMINPANELWEBCLIENT/ERROR_USER_NAME_EMPTY'));
		}
		return bValid;
	};

	CEditUserView.prototype.getParametersForSave = function ()
	{
		return {
			Id: this.id(),
			PublicId: $.trim(this.publicId()),
			Role: this.role(),
			WriteSeparateLog: this.writeSeparateLog()
		};
	};

	CEditUserView.prototype.saveEntity = function (aParents, oRoot)
	{
		_.each(aParents, function (oParent) {
			if (oParent.constructor.name === 'CEntitiesView' && _.isFunction(oParent.createEntity))
			{
				oParent.createEntity();
			}
			if (oParent.constructor.name === 'CCommonSettingsPaneView' && _.isFunction(oParent.save))
			{
				oParent.save(oRoot);
			}
		});
	};

	module.exports = new CEditUserView();


/***/ }),

/***/ 244:
/*!**************************************************************!*\
  !*** ./modules/AdminPanelWebclient/js/views/SettingsView.js ***!
  \**************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		$ = __webpack_require__(/*! jquery */ 1),
		ko = __webpack_require__(/*! knockout */ 44),
		Promise = __webpack_require__(/*! bluebird */ 3),
		
		Text = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ 185),
		Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ 181),
		
		App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ 182),
		Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ 188),
		Routing = __webpack_require__(/*! modules/CoreWebclient/js/Routing.js */ 195),
		CAbstractScreenView = __webpack_require__(/*! modules/CoreWebclient/js/views/CAbstractScreenView.js */ 198),
		
		Links = __webpack_require__(/*! modules/AdminPanelWebclient/js/utils/Links.js */ 240),
		
		Cache = __webpack_require__(/*! modules/AdminPanelWebclient/js/Cache.js */ 237),
		EntitiesTabs = __webpack_require__(/*! modules/AdminPanelWebclient/js/EntitiesTabs.js */ 241),
		Settings = __webpack_require__(/*! modules/AdminPanelWebclient/js/Settings.js */ 238),
		CEntitiesView = __webpack_require__(/*! modules/AdminPanelWebclient/js/views/CEntitiesView.js */ 245)
	;

	/**
	 * Constructor of admin panel settings view.
	 * 
	 * @constructor
	 */
	function CSettingsView()
	{
		CAbstractScreenView.call(this, 'AdminPanelWebclient');
		
		this.tenants = Cache.tenants;
		this.selectedTenant = Cache.selectedTenant;
		this.currentEntityType = ko.observable('');
		this.currentEntitiesId = ko.observable({});
		this.lastSavedEntitiesId = ko.observable({});
		
		this.showTenantsSelector = ko.computed(function () {
			return Settings.EnableMultiTenant && this.tenants().length > 1;
		}, this);
		
		this.aScreens = [
			{
				linkHash: ko.observable(Routing.buildHashFromArray(Links.get(''))),
				sLinkText: Text.i18n('ADMINPANELWEBCLIENT/HEADING_SYSTEM_SETTINGS_TABNAME'),
				sType: '',
				oView: null
			}
		];
		_.each(EntitiesTabs.getData(), _.bind(function (oEntityData) {
			var
				oView = new CEntitiesView(oEntityData.Type),
				fChangeEntity = _.bind(function (sType, iEntityId, sTabName) {
					if (sTabName === 'create')
					{
						this.createEntity();
					}
					else if (sType === this.currentEntityType())
					{
						this.changeEntity(sType, iEntityId, sTabName || '');
					}
					else
					{
						var oEntitiesId = _.clone(this.currentEntitiesId());
						if (Types.isNumber(iEntityId))
						{
							if (sType)
							{
								oEntitiesId[sType] = iEntityId;
								delete oEntitiesId[this.currentEntityType()];
							}
						}
						else if (oEntitiesId[sType])
						{
							delete oEntitiesId[sType];
						}
						Routing.replaceHash(Links.get(this.currentEntityType(), oEntitiesId, ''));
					}
				}, this)
			;
			
			oView.setChangeEntityHandler(fChangeEntity);
			
			this.aScreens.push({
				linkHash: ko.computed(function () {
					var oEntitiesId = _.clone(this.lastSavedEntitiesId());
					_.extend(oEntitiesId, this.currentEntitiesId());
					return Routing.buildHashFromArray(Links.get(oEntityData.Type, oEntitiesId));
				}, this),
				sLinkText: Text.i18n(oEntityData.LinkTextKey),
				sType: oEntityData.Type,
				oView: oView
			});
		}, this));
		this.currentEntitiesView = ko.computed(function () {
			var
				sCurrType = this.currentEntityType(),
				oCurrEntitiesData = _.find(this.aScreens, function (oData) {
					return oData.sType === sCurrType;
				})
			;
			return oCurrEntitiesData ? oCurrEntitiesData.oView : null;
		}, this);
		this.currentEntitiesView.subscribe(function(){
			if (this.currentEntitiesView())
			{
				this.currentEntitiesView().onHide();
			}
		}, this, 'beforeChange');
		this.currentEntitiesView.subscribe(function () {
			if (this.currentEntitiesView())
			{
				this.currentEntitiesView().onShow();
			}
		}, this);
		this.tabs = ko.observableArray([]);
		
		this.visibleTabsCount = ko.computed(function () {
			var iCount = 0;
			
			_.each(this.tabs(), function (oTab) {
				if (oTab.view && (typeof(oTab.view.visible) === 'undefined' ||  oTab.view.visible()))
				{
					iCount++;
				}
			});
			
			return iCount;
		}, this);
		
		this.showModulesTabs = ko.computed(function () {
			return this.currentEntityType() === '' || this.currentEntitiesView().hasSelectedEntity();
		}, this);
		
		this.currentTab = ko.observable(null);
		
		this.aStartErrors = [];
		
		App.subscribeEvent('SendAjaxRequest::before', this.onAjaxSend.bind(this));
		
		App.broadcastEvent('AdminPanelWebclient::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
	}

	_.extendOwn(CSettingsView.prototype, CAbstractScreenView.prototype);

	CSettingsView.prototype.ViewTemplate = 'AdminPanelWebclient_SettingsView';
	CSettingsView.prototype.ViewConstructorName = 'CSettingsView';

	CSettingsView.prototype.onAjaxSend = function (oParams)
	{
		if (this.currentEntityType() !== '' && !oParams.Parameters.TenantId)
		{
			oParams.Parameters.TenantId = Cache.selectedTenantId();
		}
	};

	CSettingsView.prototype.selectTenant = function (iId)
	{
		var oEntitiesId = _.clone(this.currentEntitiesId());
		oEntitiesId['Tenant'] = iId;
		Routing.setHash(Links.get(this.currentEntityType(), oEntitiesId));
	};

	/**
	 * Registers admin panel tab.
	 * 
	 * @param {Function} fGetTabView Function that returns Promise which resolves into view model of the tab.
	 * @param {Object} oTabName Tab name.
	 * @param {Object} oTabTitle Tab title.
	 */
	CSettingsView.prototype.registerTab = function (fGetTabView, oTabName, oTabTitle)
	{
		if (_.isFunction(fGetTabView))
		{
			var aTabs = this.tabs;
			
			return new Promise(fGetTabView).then(function (oTabView) {
				aTabs.push({
					view: oTabView,
					name: oTabName,
					title: oTabTitle
				});
			}, function (error) {
				console.log('failed to load settings tab', error);
			});
		}
		return false;
	};

	/**
	 * Sorts tabs by some modules order list
	 */
	CSettingsView.prototype.sortRegisterTabs = function ()
	{
		this.tabs(_.sortBy(this.tabs(), function (oTab) {
			var iIndex = _.indexOf(Settings.TabsOrder, oTab.name);
			return iIndex !== -1 ? iIndex : Settings.TabsOrder.length;
		}));
	};

	CSettingsView.prototype.registerTabSection = function (fGetSectionView, sTabName) {
		var
			oTab = _.findWhere(this.tabs(), {'name': sTabName}),
			oSection = fGetSectionView()
		;

		if (oTab)
		{
			oTab.view.addSettingsSection(oSection);
		}
	};

	/**
	 * Sets hash without creating entity.
	 */
	CSettingsView.prototype.cancelCreatingEntity = function ()
	{
		Routing.setHash(Links.get(this.currentEntityType(), this.currentEntitiesId(), ''));
	};

	/**
	 * Sets hash for creating entity.
	 */
	CSettingsView.prototype.createEntity = function ()
	{
		var oEntitiesId = _.clone(this.currentEntitiesId());
		delete oEntitiesId[this.currentEntityType()];
		if (this.currentEntityType() !== 'Tenant' && !oEntitiesId['Tenant'] && Cache.selectedTenantId())
		{
			oEntitiesId['Tenant'] = Cache.selectedTenantId();
		}
		Routing.setHash(Links.get(this.currentEntityType(), oEntitiesId, 'create'));
	};

	/**
	 * Sets hash to route to screen with specified entity type and|or entity identifier and|or settings tab.
	 * 
	 * @param {string} sEntityName Entity type to display.
	 * @param {number} iEntityId Identifier of entity to display.
	 * @param {string} sTabName Name of settings tab to display.
	 */
	CSettingsView.prototype.changeEntity = function (sEntityName, iEntityId, sTabName)
	{
		var
			oEntitiesId = _.clone(this.currentEntitiesId()),
			bHasTab = !!_.find(this.tabs(), function (oTab) {
				return oTab.name === sTabName;
			}),
			sCurrTabName = this.currentTab() ? this.currentTab().name : ''
		;
		if (sEntityName)
		{
			oEntitiesId[sEntityName] = iEntityId;
		}
		if (sEntityName !== 'Tenant' && Cache.selectedTenantId())
		{
			oEntitiesId['Tenant'] = Cache.selectedTenantId();
		}
		Routing.setHash(Links.get(sEntityName, oEntitiesId, bHasTab ? sTabName : sCurrTabName));
	};

	/**
	 * Runs after knockout binding. Checks if settings tab have error to show on start and shows them.
	 */
	CSettingsView.prototype.onBind = function ()
	{
		_.each(this.tabs(), _.bind(function (oTab) {
			if (oTab.view && _.isFunction(oTab.view.getStartError))
			{
				var koError = oTab.view.getStartError();
				if (_.isFunction(koError))
				{
					koError.subscribe(function () {
						this.showStartError();
					}, this);
					this.aStartErrors.push(koError);
				}
			}
		}, this));
		
		this.showStartError();
	};

	CSettingsView.prototype.showStartError = function ()
	{
		var aErrors = [];
		
		_.each(this.aStartErrors, function (koError) {
			var sError = koError();
			if (sError !== '')
			{
				aErrors.push(sError);
			}
		});
		
		Screens.showError(aErrors.join('<br /><br />'), true);
	};

	/**
	 * Parses parameters from url hash, hides current admin panel tab if nessessary and after that finds a new one and shows it.
	 * 
	 * @param {Array} aParams Parameters from url hash.
	 */
	CSettingsView.prototype.onRoute = function (aParams)
	{
		var
			oParams = Links.parse(aParams),
			aTabParams = aParams.slice(1),
			bSameType = this.currentEntityType() === oParams.CurrentType,
			bSameId = this.currentEntitiesId()[oParams.CurrentType] === oParams.Entities[oParams.CurrentType],
			bSameTab = this.currentTab() && this.currentTab().name === oParams.Last,
			bSameEntities = JSON.stringify(this.currentEntitiesId()) === JSON.stringify(oParams.Entities),
			oCurrentTab = this.currentTab(),
			fAfterTabHide = _.bind(function () {
				this.showNewScreenView(oParams);
				this.showNewTabView(oParams.Last, aTabParams); // only after showing new entities view
			}, this),
			fAfterRefuseTabHide = _.bind(function () {
				if (oCurrentTab)
				{
					Routing.replaceHashDirectly(Links.get(this.currentEntityType(), this.currentEntitiesId(), this.currentTab() ? this.currentTab().name : ''));
				}
			}, this)
		;
		
		if (!bSameType || !bSameId || !bSameTab || !bSameEntities)
		{
			if (oCurrentTab && $.isFunction(oCurrentTab.view.hide))
			{
				oCurrentTab.view.hide(fAfterTabHide, fAfterRefuseTabHide);
			}
			else
			{
				fAfterTabHide();
			}
		}
		else if (oCurrentTab)
		{
			oCurrentTab.view.onRoute(aTabParams, this.currentEntitiesId());
		}
	};

	/**
	 * Shows new screen view.
	 * 
	 * @param {Object} oParams Parameters with information about new screen.
	 */
	CSettingsView.prototype.showNewScreenView = function (oParams)
	{
		var
			oCurrentEntityData = _.find(this.aScreens, function (oData) {
				return oData.sType === oParams.CurrentType;
			})
		;
		
		this.currentEntityType(oParams.CurrentType);
		this.currentEntitiesId(oParams.Entities);
		if (!_.isEmpty(oParams.Entities))
		{
			this.lastSavedEntitiesId(oParams.Entities);
		}
		Cache.setSelectedTenant(oParams.Entities['Tenant']);

		if (oCurrentEntityData && oCurrentEntityData.oView)
		{
			if (oParams.Last === 'create')
			{
				oCurrentEntityData.oView.openCreateForm();
			}
			else
			{
				oCurrentEntityData.oView.cancelCreatingEntity();
			}
			oCurrentEntityData.oView.changeEntity(oParams.Entities[oParams.CurrentType], oParams.Entities);
		}
	};

	/**
	 * Shows tab with specified tab name. Should be called only after calling showNewScreenView method.
	 * 
	 * @param {string} sNewTabName New tab name.
	 * @param {array} aTabParams
	 */
	CSettingsView.prototype.showNewTabView = function (sNewTabName, aTabParams)
	{
		// Sets access level to all tabs so they can correct their visibilities
		_.each(this.tabs(), _.bind(function (oTab) {
			if (oTab.view && _.isFunction(oTab.view.setAccessLevel))
			{
				oTab.view.setAccessLevel(this.currentEntityType(), this.currentEntitiesId()[this.currentEntityType()]);
			}
		}, this));
		
		// Finds tab with name from the url hash
		var oNewTab = _.find(this.tabs(), function (oTab) {
			return oTab.name === sNewTabName;
		});
		
		// If the tab wasn't found finds the first available visible tab
		if (!oNewTab || !(oNewTab.view && oNewTab.view.visible()))
		{
			oNewTab = _.find(this.tabs(), function (oTab) {
				return oTab.view && oTab.view.visible();
			});
		}
		
		// If tab was found calls its onRoute function and sets new current tab
		if (oNewTab)
		{
			if ($.isFunction(oNewTab.view.onRoute))
			{
				oNewTab.view.onRoute(aTabParams, this.currentEntitiesId());
			}
			this.currentTab(oNewTab);
		}
	};

	/**
	 * Sets hash for showing another admin panel tab.
	 * 
	 * @param {string} sTabName Tab name.
	 */
	CSettingsView.prototype.changeTab = function (sTabName)
	{
		var oEntitiesId = this.currentEntityType() ? this.currentEntitiesId() : {};
		Routing.setHash(Links.get(this.currentEntityType(), oEntitiesId, sTabName));
	};

	/**
	 * Calls logout function of application.
	 */
	CSettingsView.prototype.logout = function ()
	{
		App.logout();
	};

	/**
	 * Deletes current entity.
	 */
	CSettingsView.prototype.deleteCurrentEntity = function ()
	{
		if (this.currentEntitiesView())
		{
			this.currentEntitiesView().deleteCurrentEntity();
		}
	};

	/**
	 * @param {Array} aAddHash
	 */
	CSettingsView.prototype.setAddHash = function (aAddHash)
	{
		Routing.setHash(_.union([Settings.HashModuleName, this.currentTab() ? this.currentTab().name : ''], aAddHash));
	};

	module.exports = new CSettingsView();


/***/ }),

/***/ 245:
/*!***************************************************************!*\
  !*** ./modules/AdminPanelWebclient/js/views/CEntitiesView.js ***!
  \***************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		ko = __webpack_require__(/*! knockout */ 44),
		
		TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ 185),
		Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ 181),
		Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ 217),
		
		Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ 191),
		Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ 186),
		Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ 188),
		
		CPageSwitcherView = __webpack_require__(/*! modules/CoreWebclient/js/views/CPageSwitcherView.js */ 246),
		
		Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ 192),
		ConfirmPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/ConfirmPopup.js */ 201),
		
		Cache = __webpack_require__(/*! modules/AdminPanelWebclient/js/Cache.js */ 237),
		EntitiesTabs = __webpack_require__(/*! modules/AdminPanelWebclient/js/EntitiesTabs.js */ 241),
		Settings = __webpack_require__(/*! modules/AdminPanelWebclient/js/Settings.js */ 238)
	;

	/**
	 * Constructor of entities view. Creates, edits and deletes entities.
	 * 
	 * @param {string} sEntityType Type of entity processed here.
	 * 
	 * @constructor
	 */
	function CEntitiesView(sEntityType)
	{
		Cache.selectedTenantId.subscribe(function () {
			if (this.sType !== 'Tenant')
			{
				this.requestEntities();
			}
		}, this);
		this.sType = sEntityType;
		this.oEntityCreateView = EntitiesTabs.getEditView(this.sType);
		this.oEntityData = EntitiesTabs.getEntityData(this.sType);
		this.sActionCreateText = this.oEntityData.ActionCreateText;
		this.sNoEntitiesFoundText = this.oEntityData.NoEntitiesFoundText;
		
		this.entities = ko.observableArray([]);
		this.aFilters = [];
		this.initFilters();
		
		this.totalEntitiesCount = ko.observable(0);
		this.current = ko.observable(0);
		this.showCreateForm = ko.observable(false);
		this.isCreating = ko.observable(false);
		this.hasSelectedEntity = ko.computed(function () {
			var aIds = _.map(this.entities(), function (oEntity) {
				return oEntity.Id;
			});
			return _.indexOf(aIds, this.current()) !== -1;
		}, this);
		
		this.justCreatedId = ko.observable(0);
		this.fChangeEntityHandler = function () {};
		
		ko.computed(function () {
			if (this.justCreatedId() === 0 && !this.showCreateForm() && !this.hasSelectedEntity() && this.entities().length > 0)
			{
				this.fChangeEntityHandler(this.sType, this.entities()[0].Id);
			}
		}, this).extend({ throttle: 1 });
		
		this.checkedEntities = ko.computed(function () {
			return _.filter(this.entities(), function (oEntity) {
				return oEntity.checked();
			}, this);
		}, this);
		this.hasCheckedEntities = ko.computed(function () {
			return this.checkedEntities().length > 0;
		}, this);
		this.deleteCommand = Utils.createCommand(this, this.deleteCheckedEntities, this.hasCheckedEntities);
		this.selectedCount = ko.computed(function () {
			return this.checkedEntities().length;
		}, this);
		
		this.searchValue = ko.observable('');
		this.newSearchValue = ko.observable('');
		this.isSearchFocused = ko.observable(false);
		this.loading = ko.observable(false);
		this.searchText = ko.computed(function () {
			return TextUtils.i18n('ADMINPANELWEBCLIENT/INFO_SEARCH_RESULT', {
				'SEARCH': this.searchValue()
			});
		}, this);
		
		this.oPageSwitcher = new CPageSwitcherView(0, Settings.EntitiesPerPage);
		this.oPageSwitcher.currentPage.subscribe(function () {
			this.requestEntities();
		}, this);
		this.totalEntitiesCount.subscribe(function () {
			this.oPageSwitcher.setCount(this.totalEntitiesCount());
		}, this);
		
		this.aIdListDeleteProcess = [];
		
		this.aAdditionalButtons = [];
		this.initAdditionalButtons();
	}

	CEntitiesView.prototype.ViewTemplate = 'AdminPanelWebclient_EntitiesView';
	CEntitiesView.prototype.CreateFormViewTemplate = 'AdminPanelWebclient_EntityCreateFormView';

	/**
	 * Requests entity list after showing.
	 */
	CEntitiesView.prototype.onShow = function ()
	{
		this.bShown = true;
		this.requestEntities();
	};

	CEntitiesView.prototype.onHide = function ()
	{
		this.bShown = false;
	};

	/**
	 * Requests entity list for search string.
	 */
	CEntitiesView.prototype.search = function ()
	{
		this.oPageSwitcher.setPage(1, Settings.EntitiesPerPage);
		this.requestEntities();
	};

	/**
	 * Requests entity list without search string.
	 */
	CEntitiesView.prototype.clearSearch = function ()
	{
		this.newSearchValue('');
		this.requestEntities();
	};

	CEntitiesView.prototype.initFilters = function ()
	{
		_.each(this.oEntityData.Filters, function (oFilterData) {
			var oFilterObservables = {
				list: ko.computed(function () {
					var aFilterList = [];
					if (_.isFunction(oFilterData.mList))
					{
						aFilterList = oFilterData.mList();
						if (!_.isArray(aFilterList))
						{
							aFilterList = [];
						}
					}
					else if (_.isArray(oFilterData.mList))
					{
						aFilterList = oFilterData.mList;
					}
					if (aFilterList.length > 0)
					{
						if (oFilterData.sAllText)
						{
							aFilterList.unshift({
								text: oFilterData.sAllText,
								value: -1
							});
						}
						if (oFilterData.sNotInAnyText)
						{
							aFilterList.push({
								text: oFilterData.sNotInAnyText,
								value: 0
							});
						}
					}
					return aFilterList;
				}, this),
				selectedValue: ko.observable(-1),
				requestValue: ko.observable(-1),
				sAllText: oFilterData.sAllText,
				sFileld: oFilterData.sField,
				sEntity: oFilterData.sEntity
			};
			oFilterObservables.selectedValue.subscribe(function () {
				if (oFilterObservables.sEntity)
				{
					this.fChangeEntityHandler(oFilterObservables.sEntity, oFilterObservables.selectedValue());
				}
				else
				{
					oFilterObservables.requestValue(oFilterObservables.selectedValue());
				}
			}, this);
			oFilterObservables.requestValue.subscribe(function () {
				this.requestEntities();
			}, this);
			this.aFilters.push(oFilterObservables);
		}.bind(this));
	};

	CEntitiesView.prototype.initAdditionalButtons = function ()
	{
		_.each(this.oEntityData.AdditionalButtons, function (oAdditionalButtonData) {
			if (oAdditionalButtonData && oAdditionalButtonData.ButtonView)
			{
				if (_.isFunction(oAdditionalButtonData.ButtonView.init))
				{
					oAdditionalButtonData.ButtonView.init(this.hasCheckedEntities, this.checkedEntities);
				}
				this.aAdditionalButtons.push(oAdditionalButtonData);
			}
		}.bind(this));
	};

	/**
	 * Requests entity list.
	 */
	CEntitiesView.prototype.requestEntities = function ()
	{
		if (this.bShown && (this.sType === 'Tenant' || Types.isPositiveNumber(Cache.selectedTenantId())))
		{
			var oParameters = {
				TenantId: Cache.selectedTenantId(),
				Type: this.sType,
				Offset: (this.oPageSwitcher.currentPage() - 1) * Settings.EntitiesPerPage,
				Limit: Settings.EntitiesPerPage,
				Search: this.newSearchValue()
			};

			_.each(this.aFilters, function (oFilterObservables) {
				oParameters[oFilterObservables.sFileld] = oFilterObservables.requestValue();
			});

			this.searchValue(this.newSearchValue());
			this.loading(true);
			Ajax.send(this.oEntityData.ServerModuleName, this.oEntityData.GetListRequest, oParameters, function (oResponse) {
				this.loading(false);
				if (oResponse.Result)
				{
					var
						aEntities = _.isArray(oResponse.Result.Items) ? oResponse.Result.Items : [],
						aParsedEntities = [],
						iCount = Types.pInt(oResponse.Result.Count)
					;

					_.each(aEntities, function (oEntity) {
						if (oEntity && oEntity.Id)
						{
							oEntity.Id = Types.pInt(oEntity.Id);
							oEntity.checked = ko.observable(false);
							oEntity.trottleChecked = function (oItem, oEvent) {
								oEvent.stopPropagation();
								this.checked(!this.checked());
							};
							aParsedEntities.push(oEntity);
						}
					});
					this.entities(aParsedEntities);
					this.totalEntitiesCount(iCount);
					if (this.entities().length === 0)
					{
						this.fChangeEntityHandler(this.sType, undefined, 'create');
					}
					else if (this.justCreatedId() !== 0)
					{
						this.fChangeEntityHandler(this.sType, this.justCreatedId());
					}
					this.aIdListDeleteProcess = [];
				}
				else
				{
					Api.showErrorByCode(oResponse);
					this.entities([]);
				}
			}, this);
		}
	};

	/**
	 * Sets change entity hanler provided by parent view object.
	 * 
	 * @param {Function} fChangeEntityHandler Change entity handler.
	 */
	CEntitiesView.prototype.setChangeEntityHandler = function (fChangeEntityHandler)
	{
		this.fChangeEntityHandler = fChangeEntityHandler;
	};

	/**
	 * Sets new current entity indentificator.
	 * 
	 * @param {number} iId New current entity indentificator.
	 * @param {object} oEntities
	 */
	CEntitiesView.prototype.changeEntity = function (iId, oEntities)
	{
		_.each(this.aFilters, function (oFilterObservables) {
			if (oEntities[oFilterObservables.sEntity])
			{
				oFilterObservables.selectedValue(oEntities[oFilterObservables.sEntity]);
				oFilterObservables.requestValue(oEntities[oFilterObservables.sEntity]);
			}
			else if (oFilterObservables.requestValue() !== -1 || oFilterObservables.requestValue() !== 0)
			{
				if (oFilterObservables.selectedValue() === -1 || oFilterObservables.selectedValue() === 0)
				{
					oFilterObservables.requestValue(oFilterObservables.selectedValue());
				}
				else
				{
					oFilterObservables.selectedValue(-1);
					oFilterObservables.requestValue(-1);
				}
			}
		}.bind(this));
		this.current(Types.pInt(iId));
		this.justCreatedId(0);
	};

	/**
	 * Opens create entity form.
	 */
	CEntitiesView.prototype.openCreateForm = function ()
	{
		this.showCreateForm(true);
		this.oEntityCreateView.clearFields();
	};

	/**
	 * Hides create entity form.
	 */
	CEntitiesView.prototype.cancelCreatingEntity = function ()
	{
		this.showCreateForm(false);
	};

	/**
	 * Send request to server to create new entity.
	 */
	CEntitiesView.prototype.createEntity = function ()
	{
		if (this.oEntityCreateView && (this.sType === 'Tenant' || Types.isPositiveNumber(Cache.selectedTenantId())) && (!_.isFunction(this.oEntityCreateView.isValidSaveData) || this.oEntityCreateView.isValidSaveData()))
		{
			var oParameters = this.oEntityCreateView.getParametersForSave();
			oParameters['TenantId'] = Cache.selectedTenantId();
			
			this.isCreating(true);
			
			Ajax.send(this.oEntityData.ServerModuleName, this.oEntityData.CreateRequest, oParameters, function (oResponse) {
				if (oResponse.Result)
				{
					Screens.showReport(this.oEntityData.ReportSuccessCreateText);
					this.justCreatedId(Types.pInt(oResponse.Result));
					this.oEntityCreateView.updateSavedState();
					this.cancelCreatingEntity();
				}
				else
				{
					Api.showErrorByCode(oResponse, this.oEntityData.ErrorCreateText);
				}
				this.requestEntities();
				this.isCreating(false);
			}, this);

			this.oEntityCreateView.clearFields();
		}
	};

	/**
	 * Deletes current entity.
	 */
	CEntitiesView.prototype.deleteCurrentEntity = function ()
	{
		this.deleteEntities([this.current()]);
	};

	CEntitiesView.prototype.deleteCheckedEntities = function ()
	{
		var aIdList = _.map(this.checkedEntities(), function (oEntity) {
			return oEntity.Id;
		});
		this.deleteEntities(aIdList);
	};

	CEntitiesView.prototype.deleteEntities = function (aIdList)
	{
		if (Types.isNonEmptyArray(this.aIdListDeleteProcess))
		{
			aIdList = _.difference(aIdList, this.aIdListDeleteProcess);
			this.aIdListDeleteProcess = _.union(aIdList, this.aIdListDeleteProcess);
		}
		else
		{
			this.aIdListDeleteProcess = aIdList;
		}
		if (aIdList.length > 0)
		{
			var
				sTitle = '',
				oEntityToDelete = aIdList.length === 1 ? _.find(this.entities(), function (oEntity) {
					return oEntity.Id === aIdList[0];
				}) : null
			;
			if (oEntityToDelete)
			{
				sTitle = oEntityToDelete.Name;
			}
			Popups.showPopup(ConfirmPopup, [
				TextUtils.i18n(this.oEntityData.ConfirmDeleteLangConst, {}, null, aIdList.length), 
				_.bind(this.confirmedDeleteEntities, this, aIdList), sTitle, TextUtils.i18n('COREWEBCLIENT/ACTION_DELETE')
			]);
		}
	};

	/**
	 * Sends request to the server to delete entity if admin confirmed this action.
	 * 
	 * @param {array} aIdList
	 * @param {boolean} bDelete Indicates if admin confirmed deletion.
	 */
	CEntitiesView.prototype.confirmedDeleteEntities = function (aIdList, bDelete)
	{
		if (bDelete && Types.isPositiveNumber(Cache.selectedTenantId()))
		{
			var oParameters = {
				TenantId: Cache.selectedTenantId(),
				Type: this.sType,
				IdList: aIdList
			};
			
			Ajax.send(this.oEntityData.ServerModuleName, this.oEntityData.DeleteRequest, oParameters, function (oResponse) {
				if (oResponse.Result)
				{
					Screens.showReport(TextUtils.i18n(this.oEntityData.ReportSuccessDeleteLangConst, {}, null, aIdList.length));
				}
				else
				{
					Screens.showError(TextUtils.i18n(this.oEntityData.ErrorDeleteLangConst, {}, null, aIdList.length));
				}
				this.requestEntities();
			}, this);
		}
		else
		{
			this.aIdListDeleteProcess = [];
		}
	};

	CEntitiesView.prototype.groupCheck = function ()
	{
		var bCheckAll = !this.hasCheckedEntities();
		_.each(this.entities(), function (oEntity) {
			oEntity.checked(bCheckAll);
		});
	};

	module.exports = CEntitiesView;


/***/ }),

/***/ 246:
/*!*************************************************************!*\
  !*** ./modules/CoreWebclient/js/views/CPageSwitcherView.js ***!
  \*************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		$ = __webpack_require__(/*! jquery */ 1),
		ko = __webpack_require__(/*! knockout */ 44),
		
		Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ 217),
		
		App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ 182)
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


/***/ })

});
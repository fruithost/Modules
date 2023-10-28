'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	Promise = require("bluebird"),
	
	Text = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	
	Links = require('modules/%ModuleName%/js/utils/Links.js'),
	
	Cache = require('modules/%ModuleName%/js/Cache.js'),
	EntitiesTabs = require('modules/%ModuleName%/js/EntitiesTabs.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	CEntitiesView = require('modules/%ModuleName%/js/views/CEntitiesView.js')
;

/**
 * Constructor of admin panel settings view.
 * 
 * @constructor
 */
function CSettingsView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	this.tenants = Cache.tenants;
	this.selectedTenant = Cache.selectedTenant;
	this.currentEntityType = ko.observable('');
	this.currentEntitiesId = ko.observable({});
	this.lastSavedEntitiesId = ko.observable({});
	
	this.showTenantsSelector = ko.computed(function () {
		return Settings.EnableMultiTenant && this.tenants().length > 1;
	}, this);
	
	this.bShowLogout = App.getUserRole() === Enums.UserRole.SuperAdmin;
	this.aScreens = [];
	if (App.getUserRole() === Enums.UserRole.SuperAdmin)
	{
		this.aScreens.push({
			linkHash: ko.observable(Routing.buildHashFromArray(Links.get(''))),
			sLinkText: Text.i18n('%MODULENAME%/HEADING_SYSTEM_SETTINGS_TABNAME'),
			sType: '',
			oView: null
		});
	}
	
	_.each(EntitiesTabs.getData(), _.bind(function (oEntityData) {
		var
			oView = new CEntitiesView(oEntityData.Type),
			fChangeEntity = _.bind(function (sType, iEntityId, sTabName) {
				if (sTabName === 'create')
				{
					this.openCreateEntity();
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
	
	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

_.extendOwn(CSettingsView.prototype, CAbstractScreenView.prototype);

CSettingsView.prototype.ViewTemplate = '%ModuleName%_SettingsView';
CSettingsView.prototype.ViewConstructorName = 'CSettingsView';

CSettingsView.prototype.onAjaxSend = function (oParams)
{
	if (this.currentEntityType() !== '' && !oParams.Parameters.TenantId)
	{
		oParams.Parameters.TenantId = Cache.selectedTenantId();
	}
};

/**
 * Sets tenant with specified ID as current.
 * If it's not on current page, tries to set required page before setting new current tenant.
 * @param {type} iId
 * @returns {undefined}
 */
CSettingsView.prototype.selectTenant = function (iId)
{
	if (!this.currentEntitiesView() || this.currentEntitiesView().sType !== 'Tenant' || this.currentEntitiesView().hasEntity(iId))
	{
		var oEntitiesId = _.clone(this.currentEntitiesId());
		oEntitiesId['Tenant'] = iId;
		Routing.setHash(Links.get(this.currentEntityType(), oEntitiesId));
	}
	else
	{
		var
			iTenantIndex = _.findIndex(Cache.tenants(), function (oTenant) {
				return oTenant.Id === iId;
			}),
			iPage = Math.ceil((iTenantIndex + 1) / Settings.EntitiesPerPage)
		;
		this.currentEntitiesView().setPageAndEntity(iPage, iId);
	}
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
CSettingsView.prototype.openCreateEntity = function ()
{
	var oEntityData = EntitiesTabs.getEntityData(this.currentEntityType());
	if (oEntityData.CreateRequest)
	{
		var oEntitiesId = _.clone(this.currentEntitiesId());
		delete oEntitiesId[this.currentEntityType()];
		if (this.currentEntityType() !== 'Tenant' && !oEntitiesId['Tenant'] && Cache.selectedTenantId())
		{
			oEntitiesId['Tenant'] = Cache.selectedTenantId();
		}
		Routing.setHash(Links.get(this.currentEntityType(), oEntitiesId, 'create'));
	}
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

	if (Settings && _.isFunction(Settings.getStartError))
	{
		var koError = Settings.getStartError();
		if (_.isFunction(koError))
		{
			koError.subscribe(function () {
				this.showStartError();
			}, this);
			this.aStartErrors.push(koError);
		}
	}
	
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
		oScreenByType = _.find(this.aScreens, function (oScreen) {
			return oScreen.sType === oParams.CurrentType;
		})
	;
	if (!oScreenByType && this.aScreens.length > 0)
	{
		Routing.replaceHash(Links.get(this.aScreens[0].sType, [], ''));
		return;
	}

	var
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
				Routing.stopListening();
				Routing.setPreviousHash();
				Routing.startListening();
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
		var sCreateRequest = oCurrentEntityData.oView.oEntityData ? oCurrentEntityData.oView.oEntityData.CreateRequest : '';
		if (oParams.Last === 'create' && Types.isNonEmptyString(sCreateRequest))
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
			_.each(oTab.view.aSettingsSections, function (oSection) {
				if (_.isFunction(oSection.setAccessLevel))
				{
					oSection.setAccessLevel(this.currentEntityType(), this.currentEntitiesId()[this.currentEntityType()]);
				}
			}, this);
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

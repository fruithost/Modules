'use strict';

module.exports = function (oAppData) {
	var 
		Promise = require('bluebird'),
		
		App = require('%PathToCoreWebclientModule%/js/App.js')
	;
	
	if (App.getUserRole() === Enums.UserRole.SuperAdmin || App.getUserRole() === Enums.UserRole.TenantAdmin)
	{
		var
			_ = require('underscore'),
			
			TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
			
			Cache = require('modules/%ModuleName%/js/Cache.js'),
			Settings = require('modules/%ModuleName%/js/Settings.js'),
			
			aEntityTypesToRegister = [],
			aEntityDataToChange = [],
				
			aAdminPanelTabsParams = [],
			aAdminPanelTabsSectionsParams = []
		;

		Settings.init(oAppData);
		Cache.init(oAppData);
		
		return {
			start: function () {
				if (App.getUserRole() === Enums.UserRole.SuperAdmin)
				{
					aAdminPanelTabsParams.push({
						GetTabView: function(resolve) {
							require.ensure(
								['modules/%ModuleName%/js/views/DbAdminSettingsView.js'],
								function() {
									resolve(require('modules/%ModuleName%/js/views/DbAdminSettingsView.js'));
								},
								'admin-bundle'
							);
						},
						TabName: Settings.HashModuleName + '-db',
						TabTitle: TextUtils.i18n('%MODULENAME%/LABEL_DB_SETTINGS_TAB')
					});
					aAdminPanelTabsParams.push({
						GetTabView: function(resolve) {
							require.ensure(
								['modules/%ModuleName%/js/views/SecurityAdminSettingsView.js'],
								function() {
									resolve(require('modules/%ModuleName%/js/views/SecurityAdminSettingsView.js'));
								},
								'admin-bundle'
							);
						},
						TabName: Settings.HashModuleName + '-security',
						TabTitle: TextUtils.i18n('%MODULENAME%/LABEL_SECURITY_SETTINGS_TAB')
					});
					aAdminPanelTabsParams.push({
						GetTabView: function(resolve) {
							require.ensure(
								['modules/%ModuleName%/js/views/AboutAdminSettingsView.js'],
								function() {
									resolve(require('modules/%ModuleName%/js/views/AboutAdminSettingsView.js'));
								},
								'admin-bundle'
							);
						},
						TabName: 'about',
						TabTitle: TextUtils.i18n('%MODULENAME%/LABEL_ABOUT_SETTINGS_TAB')
					});
				}
				aAdminPanelTabsParams.push({
					GetTabView: function(resolve) {
						require.ensure(
							['modules/%ModuleName%/js/views/CommonSettingsPaneView.js'],
							function() {
								resolve(require('modules/%ModuleName%/js/views/CommonSettingsPaneView.js'));
							},
							'admin-bundle'
						);
					},
					TabName: 'common',
					TabTitle: TextUtils.i18n('%MODULENAME%/LABEL_COMMON_SETTINGS_TAB')
				});
			},
			getScreens: function () {
				var oScreens = {};
				oScreens[Settings.HashModuleName] = function () {
					
					return new Promise(function(resolve, reject) {
						require.ensure(
							['modules/%ModuleName%/js/views/SettingsView.js'],
							function(require) {
								// EntitiesTabs shouldn't be required before every module will be initialized.
								// (Requires view. All views should be required after initialization of all modules.)
								var EntitiesTabs = require('modules/%ModuleName%/js/EntitiesTabs.js');
								_.each(aEntityTypesToRegister, function (oEntityData) {
									EntitiesTabs.registerEntityType(oEntityData);
								});
								_.each(aEntityDataToChange, function (oEntityData) {
									EntitiesTabs.changeEntityData(oEntityData);
								});
								
								var
									oSettingsView = require('modules/%ModuleName%/js/views/SettingsView.js'),
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
							},
							'admin-bundle'
						);
					});
				};
				return oScreens;
			},
			getHeaderItem: function () {
				if (App.getUserRole() === Enums.UserRole.SuperAdmin)
				{
					return null;
				}
				return {
					item: require('modules/%ModuleName%/js/views/HeaderItemView.js'),
					name: Settings.HashModuleName
				};
			},
			getAbstractSettingsFormViewClass: function () {
				return require('modules/%ModuleName%/js/views/CAbstractSettingsFormView.js');
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
					Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
					Links = require('modules/%ModuleName%/js/utils/Links.js')
				;
				Routing.setHash(Links.get(sCurrentEntityType, oEntitiesId, ''));
			},
			setAddHash: function (aAddHash) {
				var SettingsView = require('modules/%ModuleName%/js/views/SettingsView.js');
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

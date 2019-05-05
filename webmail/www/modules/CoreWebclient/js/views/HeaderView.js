'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Browser = require('%PathToCoreWebclientModule%/js/Browser.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	Settings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js')
;

/**
 * @constructor
 */
function CHeaderView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	this.tabs = ModulesManager.getModulesTabs(false);
	ko.computed(function () {
		_.each(this.tabs, function (oTab) {
			if (oTab.isCurrent)
			{
				var
					sCurrHash = '#' + Routing.currentHash(),
					aExcludedHashes = _.isFunction(oTab.excludedHashes) && _.isArray(oTab.excludedHashes()) ? oTab.excludedHashes() : [],
					bExcludedHashFound = !!_.find(aExcludedHashes, function (sExcludedHash) {
						return sCurrHash.indexOf(sExcludedHash) === 0;
					}),
					bProperHash = sCurrHash.indexOf(oTab.baseHash() + '/') === 0 || sCurrHash === oTab.baseHash()
				;
				
				oTab.isCurrent(!bExcludedHashFound && (Screens.currentScreen() === oTab.sName || bProperHash));
				if (oTab.isCurrent() && bProperHash)
				{
					oTab.hash(sCurrHash);
				}
			}
		});
	}, this).extend({ rateLimit: 50 });
	
	this.showLogout = App.getUserRole() !== window.Enums.UserRole.Anonymous && !App.isPublic();

	this.sLogoUrl = Settings.LogoUrl;
	
	this.mobileDevice = Browser.mobileDevice;
	this.bShowMobileSwitcher = Browser.mobileDevice && Settings.AllowMobile;
	
	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
	
	if (!_.isEmpty(this.tabs) || this.showLogout) {
		$('#auroraContent > .screens').addClass('show-header');
	}
}

_.extendOwn(CHeaderView.prototype, CAbstractScreenView.prototype);

CHeaderView.prototype.ViewTemplate = '%ModuleName%_HeaderView';
CHeaderView.prototype.ViewConstructorName = 'CHeaderView';

CHeaderView.prototype.logout = function ()
{
	App.logout();
};

CHeaderView.prototype.switchToFullVersion = function ()
{
	Ajax.send('Core', 'SetMobile', {'Mobile': false}, function (oResponse) {
		if (oResponse.Result)
		{
			window.location.reload();
		}
	}, this);
};

/**
 * "?mobile" link sometimes doesn't work, maybe because of browser cache, so Ajax request is sent and page is reloaded using JS.
 */
CHeaderView.prototype.switchToMobileVersion = function ()
{
	Ajax.send('Core', 'SetMobile', {'Mobile': true}, function (oResponse) {
		if (oResponse.Result)
		{
			window.location.reload();
		}
	}, this);
};

module.exports = new CHeaderView();

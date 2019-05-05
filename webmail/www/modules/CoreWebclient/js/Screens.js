'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Settings = require('%PathToCoreWebclientModule%/js/Settings.js')
;

/**
 * @constructor
 */
function CScreens()
{
	var $win = $(window);
	this.resizeAll = _.debounce(function () {
		$win.resize();
	}, 100);
	
	this.oGetScreenFunctions = {};
	this.screens = ko.observable({});
	this.oModulesNames = {};

	this.currentScreen = ko.observable('');
	this.sDefaultScreen = '';
	
	this.browserTitle = ko.computed(function () {
		var oCurrScreen = this.screens()[this.currentScreen()];
		return oCurrScreen && _.isFunction(oCurrScreen.browserTitle) ? oCurrScreen.browserTitle() : '';
	}, this);

	this.informationScreen = ko.observable(null);
}

CScreens.prototype.init = function (bAnonymUser)
{
	var
		oModulesScreens = ModulesManager.getModulesScreens(),
		oModulesTabs = ModulesManager.getModulesTabs(false),
		aKeys = [],
		sDefaultScreenHash = bAnonymUser ? Settings.DefaultAnonymScreenHash.toLowerCase() : Settings.DefaultUserScreenHash.toLowerCase()
	;
	
	_.each(oModulesScreens, _.bind(function (oScreenList, sModuleName) {
		this.addToScreenList(sModuleName, oScreenList);
	}, this));
	
	this.addToScreenList('', require('%PathToCoreWebclientModule%/js/screenList.js'));
	
	if (this.oGetScreenFunctions[sDefaultScreenHash])
	{
		this.sDefaultScreen = sDefaultScreenHash;
	}
	
	if (this.sDefaultScreen === '')
	{
		aKeys = _.keys(this.oGetScreenFunctions);
		if (Types.isNonEmptyArray(aKeys))
		{
			this.sDefaultScreen = aKeys[0];
		}
	}
	
	if (oModulesTabs.length > 0)
	{
		this.showView('header');
	}
	
	this.initInformation();
};

/**
 * @param {string} sModuleName
 * @param {Object} oScreenList
 */
CScreens.prototype.addToScreenList = function (sModuleName, oScreenList)
{
	_.each(oScreenList, _.bind(function (fGetScreen, sKey) {
		this.oGetScreenFunctions[sKey] = fGetScreen;
		this.oModulesNames[sKey] = sModuleName;
	}, this));
};

/**
 * @param {string} sScreen
 * 
 * @returns {boolean}
 */
CScreens.prototype.hasScreenData = function (sScreen)
{
	return !!(this.screens()[sScreen] || this.oGetScreenFunctions[sScreen]);
};

/**
 * @param {Array} aParams
 */
CScreens.prototype.route = function (aParams)
{
	var
		sCurrentScreen = this.currentScreen(),
		oCurrentScreen = this.screens()[sCurrentScreen],
		sNextScreen = aParams.shift(),
		self = this
	;
	
	if (sNextScreen === '' || sCurrentScreen === '' && !this.oModulesNames[sNextScreen])
	{
		sNextScreen = this.sDefaultScreen;
	}
	
	if (sCurrentScreen === '' && (!ModulesManager.isModuleEnabled(this.oModulesNames[sNextScreen]) || !this.hasScreenData(sNextScreen)))
	{
		sNextScreen = _.find(_.keys(this.oModulesNames), _.bind(function (sScreen) {
			return ModulesManager.isModuleEnabled(this.oModulesNames[sScreen]) && this.hasScreenData(sScreen);
		}, this)) || this.sDefaultScreen;
	}
	
	if (ModulesManager.isModuleEnabled(this.oModulesNames[sNextScreen]) && this.hasScreenData(sNextScreen))
	{
		if (sCurrentScreen !== sNextScreen)
		{
			this.currentScreen(sNextScreen);
			
			if (oCurrentScreen && _.isFunction(oCurrentScreen.hideView))
			{
				oCurrentScreen.hideView();
			}
			
			oCurrentScreen = this.showView(sNextScreen, function (oScreen) {
				self.onRouteCallback(oScreen, aParams);
			});
		}
		else if (oCurrentScreen)
		{
			this.onRouteCallback(oCurrentScreen, aParams);
		}
	}
};

CScreens.prototype.onRouteCallback = function (oScreen, aParams)
{
	if (oScreen && _.isFunction(oScreen.onRoute))
	{
		oScreen.onRoute(aParams);
	}
};


/**
 * @param {string} sScreen
 * @param {function} fCallback
 * 
 * @returns {Object}
 */
CScreens.prototype.showView = function (sScreen, fCallback)
{
	var
		sScreenId = sScreen,
		fGetScreen = this.oGetScreenFunctions[sScreenId],
		oScreen = this.screens()[sScreenId],
		self = this
	;
	
	if (!oScreen && fGetScreen)
	{
		// oScreen = this.initView(sScreenId, fGetScreen);
		this.initView(sScreenId, fGetScreen, function () {
			self.showView(sScreen, fCallback);
		});
		
		return null;
	}
	
	if (oScreen && _.isFunction(oScreen.showView))
	{
		oScreen.showView();
	}
	
	if (_.isFunction(fCallback))
	{
		fCallback(oScreen);
	}
	
	return oScreen;
};

/**
 * @param {string} sScreenId
 * @param {function} fGetScreen
 * @param {function} fCallback
 * 
 * @returns {Object}
 */
CScreens.prototype.initView = function (sScreenId, fGetScreen, fCallback)
{
	var 
		self = this,
		oScreen = fGetScreen()
	;
	
	//TODO better testing for promise is needed
	if (_.isFunction(oScreen.then))
	{
		oScreen.then(function (oScreen) {
			self.initViewCallback.call(self, sScreenId, oScreen);
			
			if (oScreen && _.isFunction(fCallback))
			{
				fCallback(oScreen);
			}
		});
	}
	else
	{
		this.initViewCallback.call(this, sScreenId, oScreen);
		
		if (oScreen && _.isFunction(fCallback))
		{
			fCallback(oScreen);
		}
	}
	
};

CScreens.prototype.initViewCallback = function (sScreenId, oScreen)
{
	if (oScreen.ViewTemplate)
	{
		var $templatePlace = $('<!-- ko template: { name: \'' + oScreen.ViewTemplate + '\' } --><!-- /ko -->').appendTo($('#auroraContent .screens'));
		if ($templatePlace.length > 0)
		{
			ko.applyBindings(oScreen, $templatePlace[0]);
			
			oScreen.$viewDom = $templatePlace.next();

			oScreen.onBind();
		}
	}
	
	this.screens()[sScreenId] = oScreen;
	this.screens.valueHasMutated();
	delete this.oGetScreenFunctions[sScreenId];
};

/**
 * @param {Object} oView
 */
CScreens.prototype.showAnyView = function (oView)
{
	if (oView.ViewTemplate)
	{
		var $templatePlace = $('<!-- ko template: { name: \'' + oView.ViewTemplate + '\' } --><!-- /ko -->').appendTo($('#auroraContent .screens'));
		if ($templatePlace.length > 0)
		{
			ko.applyBindings(oView, $templatePlace[0]);
		}
	}
};

/**
 * @param {string} sMessage
 */
CScreens.prototype.showLoading = function (sMessage)
{
	if (this.informationScreen())
	{
		this.informationScreen().showLoading(sMessage);
	}
};

CScreens.prototype.hideLoading = function ()
{
	if (this.informationScreen())
	{
		this.informationScreen().hideLoading();
	}
};

/**
 * @param {string} sMessage
 * @param {number=} iDelay
 */
CScreens.prototype.showReport = function (sMessage, iDelay)
{
	if (this.informationScreen())
	{
		this.informationScreen().showReport(sMessage, iDelay);
	}
};

CScreens.prototype.hideReport = function ()
{
	if (this.informationScreen())
	{
		this.informationScreen().hideReport();
	}
};

/**
 * @param {string} sMessage
 * @param {boolean=} bNotHide = false
 * @param {boolean=} bGray = false
 */
CScreens.prototype.showError = function (sMessage, bNotHide, bGray)
{
	if (this.informationScreen())
	{
		this.informationScreen().showError(sMessage, bNotHide, bGray);
	}
};

/**
 * @param {boolean=} bGray = false
 */
CScreens.prototype.hideError = function (bGray)
{
	if (this.informationScreen())
	{
		this.informationScreen().hideError(bGray);
	}
};

CScreens.prototype.initInformation = function ()
{
	var self = this;
	
	this.showView('information', function (oScreen) {
		if (oScreen)
		{
			self.informationScreen(oScreen);
		}
	});
	
};

CScreens.prototype.hasUnsavedChanges = function ()
{
	var oCurrentScreen = this.screens()[this.currentScreen()];
	return oCurrentScreen && _.isFunction(oCurrentScreen.hasUnsavedChanges) && oCurrentScreen.hasUnsavedChanges();
};

/**
 * Returns current screen object.
 * @returns {object}
 */
CScreens.prototype.getCurrentScreen = function ()
{
	return this.screens()[this.currentScreen()];
};

var Screens = new CScreens();

module.exports = Screens;

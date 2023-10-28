'use strict';

module.exports = function (oAppData) {
	var
		_ = require('underscore'),
		
		App = require('%PathToCoreWebclientModule%/js/App.js'),
		
		Settings = require('modules/%ModuleName%/js/Settings.js')
	;

	Settings.init(oAppData);

	if (App.getUserRole() === Enums.UserRole.Anonymous)
	{
		return {
			start: function (ModulesManager)
			{
				if (Settings.ShowRecaptcha)
				{
					var CMainView = require('modules/%ModuleName%/js/views/CMainView.js');
					App.subscribeEvent('AnonymousUserForm::PopulateBeforeButtonsControllers', _.bind(function (oParams) {
						if (_.isFunction(oParams.RegisterBeforeButtonsController))
						{
							oParams.RegisterBeforeButtonsController(new CMainView(
								oParams.ModuleName,
								(oParams.ModuleName === 'StandardLoginFormWebclient' || oParams.ModuleName === 'MailLoginFormWebclient')
							));
						}
					}, this));
				}
			}
		};
	}
	return null;
};

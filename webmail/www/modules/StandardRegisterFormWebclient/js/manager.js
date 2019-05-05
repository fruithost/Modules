'use strict';


module.exports = function (oAppData) {
	var
		App = require('%PathToCoreWebclientModule%/js/App.js'),
		
		Settings = require('modules/%ModuleName%/js/Settings.js'),
		
		bAnonimUser = App.getUserRole() === Enums.UserRole.Anonymous
	;
	
	Settings.init(oAppData);
	
	if (!App.isPublic() && bAnonimUser)
	{
		if (App.isMobile())
		{
			return {
				/**
				 * Returns register view screen as is.
				 */
				getRegisterScreenView: function () {
					return require('modules/%ModuleName%/js/views/RegisterView.js');
				},
				
				getHashModuleName: function () {
					return Settings.HashModuleName;
				}
			};
		}
		else
		{
			return {
				/**
				 * Returns login view screen.
				 */
				getScreens: function () {
					var oScreens = {};
					oScreens[Settings.HashModuleName] = function () {
						return require('modules/%ModuleName%/js/views/RegisterView.js');
					};
					return oScreens;
				}
			};
		}
	}
	
	return null;
};

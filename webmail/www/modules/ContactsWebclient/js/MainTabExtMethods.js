'use strict';

var
	ContactsCache = require('modules/%ModuleName%/js/Cache.js'),
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
var
    _ = require('underscore'),
    argv = require('./argv.js'),
	fs = require('fs'),
    gulp = require('gulp'),
	newman = require('newman'),

    crlf = '\n',
    sTenantName = argv.getParameter('--tenant'),
    aModulesNames = argv.getModules(),
	aModulesList = [],
	GetModuleName = function (sFilePath) {
		return sFilePath.replace(/.*modules[\\/](.*?)[\\/]js.*/, "$1");
	},
	RunTask = function (sFileName) {
		return new Promise(function(resolve, reject) {
			newman.run({
				collection: JSON.parse(fs.readFileSync(sFileName, 'utf8')),
				environment: JSON.parse(fs.readFileSync(process.env.INIT_CWD + '/tests/postman_environment.json', 'utf8')),
				//will output results in console
				reporters: 'cli', 
				//Specify whether or not to stop a collection run on encountering the first error.
				bail: true
			}, function (err) {
				// finally, when the collection executes, print the status
				if (!err)
				{
					printInfo(`${sFileName}: PASSED \r\n\r\n\r\n`);
					resolve(true);
				}
				else
				{
					printError(`${sFileName}: FAILED \r\n ${err.name}`);
					reject(err.name);
				}
			});
		});
	},
	printError = function (sText) { console.log('\x1b[1m\x1b[41m%s\x1b[0m', sText); },
	printInfo = function (sText) { console.log('\x1b[1m\x1b[36m%s\x1b[0m', sText); }
;

aModulesNames.forEach(function (sModuleName) {
	var
		sFilePath = './modules/' + sModuleName + '/tests/',
		sTenantFilePath = './tenants/' + sTenantName + '/modules/' + sModuleName + '/tests/',
		sFoundedFilePath = ''
	;
	
	if (fs.existsSync(sTenantFilePath))
	{
		sFoundedFilePath = sTenantFilePath;
	}
	else if (fs.existsSync(sFilePath))
	{
		sFoundedFilePath = sFilePath;
	}
	
	if (sFoundedFilePath)
	{
		aModulesList[sModuleName === "Core" ? 'unshift' : 'push'](sFoundedFilePath);
	}
});

gulp.task('test', function () {
	var aFullTestList = [];
	
	aModulesList.forEach(function (sPath) {
		var aFiles = fs.readdirSync(sPath);

		if (aFiles)
		{
			// we filter all files with JSON file extension
			aFiles = aFiles
						.filter(function (file) {
							return (file.substr(-5) === '.json');
						})
						.map(function (file) {
							return sPath + file;
						});
			
			if (aFiles.length > 0)
			{
				aFullTestList = aFullTestList.concat(aFiles);
			}
		}
	});
	
	//run asynchronous tasks
	(async function (aList) {
		var i = 0, c = aList.length;
		for (; i<c;i++)
		{
			await RunTask(aList[i]);
		}
	})(aFullTestList);
});

module.exports = {};
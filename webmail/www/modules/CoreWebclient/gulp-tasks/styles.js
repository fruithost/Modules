var
	_ = require('underscore'),
	argv = require('./argv.js'),
	gulp = require('gulp'),
	less = require('gulp-less'),
	log = require('fancy-log'),
	concat = require('gulp-concat-util'),
	plumber = require('gulp-plumber'),
	fs = require('fs'),
	ncp = require('ncp').ncp,
	mkdirp = require('mkdirp'),

	aModulesNames = argv.getModules(),
	aModulesWatchPaths = [],
	
	aThemes = argv.getParameter('--themes').split(','),
	
	sTenanthash = argv.getParameter('--tenant'),
	
	sTenantPathPrefix = sTenanthash ? 'tenants/' + sTenanthash + '/' : '',
	
	sPathToCoreWebclient = 'modules/CoreWebclient',
	sPathToCoreMobileWebclient = 'modules/CoreMobileWebclient'
;

aModulesNames.forEach(function (sModuleName) {
	if (fs.existsSync('./modules/' + sModuleName + '/styles/styles.less') || fs.existsSync('./modules/' + sModuleName + '/styles/styles-mobile.less'))
	{
		aModulesWatchPaths.push('./modules/' + sModuleName + '/styles/**/*.less');
	}
});

function BuildLibsCss()
{
	var
		aLibsFiles = [
			sPathToCoreWebclient + '/styles/vendors/normalize.css',
			sPathToCoreWebclient + '/styles/vendors/jquery/jquery-ui-1.10.4.custom.min.css',
			//sPathToCoreWebclient + '/styles/vendors/fullcalendar-2.2.3.min.css',
			sPathToCoreWebclient + '/styles/vendors/inputosaurus.css'
		],
		sDestPath = 'static/styles/libs/',
		fBuild = function () {
			gulp.src(aLibsFiles)
				.pipe(concat('libs.css'))
				.pipe(gulp.dest(sDestPath))
				.on('error', log);
		}
	;
	
	CheckFolderAndCallHandler(sDestPath, fBuild);
}

function BuildThemeCss(sTheme, bMobile)
{
	var
		sCoreModule = bMobile ? 'CoreMobileWebclient' : 'CoreWebclient',
		aModulesFiles = [],
		aThemeSpecyficFiles = [],
		aThemeSpecyficDefaultFiles = [],
		sPostfix = bMobile ? '-mobile' : '',
		iCoreModuleIndex = aModulesNames.indexOf(sCoreModule)
	;

	if (!fs.existsSync('modules/' + sCoreModule + '/styles/themes/' + sTheme + '/styles' + sPostfix + '.less'))
	{
		return;
	}
	
	if (iCoreModuleIndex >= 0)
	{
		aModulesNames.unshift(aModulesNames.splice(iCoreModuleIndex, 1)[0]);
	}
	
	aModulesNames.forEach(function (sModuleName) {
		if (fs.existsSync('modules/' + sModuleName + '/styles/styles' + sPostfix + '.less'))
		{
			//check module override
			if (fs.existsSync('tenants/' + sTenanthash + '/modules/' + sModuleName + '/styles/styles' + sPostfix + '.less'))
			{
				aModulesFiles.push('tenants/' + sTenanthash + '/modules/' + sModuleName + '/styles/styles' + sPostfix + '.less');
			}
			else
			{
				aModulesFiles.push('modules/' + sModuleName + '/styles/styles' + sPostfix + '.less');
			}
		}
		if (sModuleName !== sCoreModule && fs.existsSync('modules/' + sModuleName + '/styles/images' + sPostfix))
		{
			MoveFiles('modules/' + sModuleName + '/styles/images' + sPostfix, 'static/styles/images' + sPostfix + '/modules/' + sModuleName);
		}
	});
	
	//get theme specific files
	aModulesFiles.forEach(function (sFilePath) {
		var sThemePath = sFilePath.replace('styles' + sPostfix + '.less', 'themes/' + sTheme + '/styles' + sPostfix + '.less');
				
		if (fs.existsSync(sThemePath))
		{
			aThemeSpecyficFiles.push(sThemePath);
		
			var sThemeImagesPath = sFilePath.replace('styles' + sPostfix + '.less', 'themes/' + sTheme + '/images' + sPostfix);
			if (fs.existsSync(sThemeImagesPath))
			{
				var aPathParts = sThemeImagesPath.split('styles/themes');
				if (aPathParts.length > 1)
				{
					MoveFiles(sThemeImagesPath, 'static/styles/themes' + aPathParts[1]);
				}
			}
		}
	});
	
	aModulesFiles.forEach(function (sFilePath) {
		var sThemePath = sFilePath.replace('styles' + sPostfix + '.less', 'themes/_default' + sPostfix + '.less');
				
		if (fs.existsSync(sThemePath))
		{
			aThemeSpecyficDefaultFiles.push(sThemePath);
		}
	});
	
	aModulesFiles = aThemeSpecyficDefaultFiles.concat(aThemeSpecyficFiles.concat(aModulesFiles));

	gulp.src(aModulesFiles)
		.pipe(concat('styles' + sPostfix + '.css', {
			process: function(sSrc, sFilePath) {
//				var
//					sThemePath = sFilePath.replace('styles' + sPostfix + '.less', 'themes/' + sTheme.toLowerCase() + '.less')
//				;
//				
//				if ( fs.existsSync(sThemePath)) {
//					aThemeSpecyficFiles.push('@import "' + sThemePath + '";\r\n');
//				}
		
				return '@import "' + sFilePath + '";\r\n'; 
			}
		}))
//		.pipe(concat.header('.' + aModulesNames.join('Screen, .') + 'Screen { \n')) /* wrap styles */
//		.pipe(concat.footer('} \n'))
		.pipe(plumber({
			errorHandler: function (err) {
				console.log(err.toString());
				this.emit('end');
			}
		}))
		.pipe(less())
		.pipe(gulp.dest(sTenantPathPrefix + 'static/styles/themes/' + sTheme))
		.on('error', log);
}

function CheckFolderAndCallHandler(sDir, fHandler)
{
	if (fs.existsSync(sDir))
	{
		fHandler();
	}
	else
	{
		mkdirp(sDir, function (oErr) {
			if (!fs.existsSync(sDir))
			{
				console.log(sDir + ' directory creating was failed: ', oErr);
			}
			else
			{
				fHandler();
			}
		});
	}
}

function MoveFiles(sFromDir, sToDir)
{
	var
		fFilter = function (name) {
			console.log(name);
			return true;
		},
		fCopyDir = function () {
			ncp(sFromDir, sToDir, fFilter, function (oErr) {
				if (oErr)
				{
					console.log(sFromDir + ' directory copying was failed: ', oErr);
				}
			});	
		}
	;
	
	if (fs.existsSync(sFromDir))
	{
		CheckFolderAndCallHandler(sToDir, fCopyDir);
	}
}

function MoveSharingCss()
{
	var
		fCopySharing = function () {
			ncp(sPathToCoreWebclient + '/styles/sharing.css', 'static/styles/sharing.css', function (oErr) {
				if (oErr)
				{
					console.log('static/styles/sharing.css file copying was failed: ', oErr);
				}
			});
		}
	;
	
	CheckFolderAndCallHandler('static/styles', fCopySharing);
}

gulp.task('styles', function (done) {
	if (!sTenanthash)
	{
		BuildLibsCss();
	}
	
	MoveFiles(sPathToCoreWebclient + '/styles/vendors/jquery/images', 'static/styles/libs/images');
	MoveFiles(sPathToCoreWebclient + '/styles/fonts', sTenantPathPrefix + 'static/styles/fonts');
	MoveFiles(sPathToCoreWebclient + '/styles/images', sTenantPathPrefix + 'static/styles/images');
	MoveSharingCss();
	
	_.each(aThemes, function (sTheme) {
		BuildThemeCss(sTheme, false);
		BuildThemeCss(sTheme, true);
	});
	
	done();
});

gulp.task('cssonly', function (done) {
	_.each(aThemes, function (sTheme) {
		BuildThemeCss(sTheme, false);
		BuildThemeCss(sTheme, true);
	});
	done();
});

gulp.task('styles:watch',  gulp.series('styles', function (done) {
	gulp.watch(aModulesWatchPaths, {interval: 500}, function (done) {
		_.each(aThemes, function (sTheme) {
			BuildThemeCss(sTheme, false);
			BuildThemeCss(sTheme, true);
		});
		done();
	});
	done();
}));

module.exports = {};
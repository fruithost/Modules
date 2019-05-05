var
	_ = require('underscore'),
	argv = require('./argv.js'),
	gulp = require('gulp'),
	less = require('gulp-less'),
	gutil = require('gulp-util'),
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
	
	sPathToCoreWebclient = 'modules/CoreWebclient'
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
			sPathToCoreWebclient + '/styles/vendors/fullcalendar-2.2.3.min.css',
			sPathToCoreWebclient + '/styles/vendors/inputosaurus.css'
		],
		sDestPath = 'static/styles/libs/',
		fBuild = function () {
			gulp.src(aLibsFiles)
				.pipe(concat('libs.css'))
				.pipe(gulp.dest(sDestPath))
				.on('error', gutil.log);
		}
	;
	
	CheckFolderAndCallHandler(sDestPath, fBuild);
}

function BuildThemeCss(sTheme, bMobile)
{
	var
		aModulesFiles = [],
		aSkinSpecyficFiles = [],
		aSkinSpecyficDefaultFiles = [],
		sPostfix = bMobile ? '-mobile' : '',
		iCoreModuleIndex = aModulesNames.indexOf('CoreWebclient')
	;

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
		if (sModuleName !== 'CoreWebclient' && fs.existsSync('modules/' + sModuleName + '/styles/images'))
		{
			MoveFiles('modules/' + sModuleName + '/styles/images', 'static/styles/images/modules/' + sModuleName);
		}
	});
	
	//get skin specific files
	aModulesFiles.forEach(function (sFilePath) {
		var sThemePath = sFilePath.replace('styles' + sPostfix + '.less', 'themes/' + sTheme + '/styles.less');
				
		if (fs.existsSync(sThemePath))
		{
			aSkinSpecyficFiles.push(sThemePath);
		}
	});
	
	aModulesFiles.forEach(function (sFilePath) {
		var sThemePath = sFilePath.replace('styles' + sPostfix + '.less', 'themes/_default.less');
				
		if (fs.existsSync(sThemePath))
		{
			aSkinSpecyficDefaultFiles.push(sThemePath);
		}
	});
	
	aModulesFiles = aSkinSpecyficDefaultFiles.concat(aSkinSpecyficFiles.concat(aModulesFiles));

	gulp.src(aModulesFiles)
		.pipe(concat('styles' + sPostfix + '.css', {
			process: function(sSrc, sFilePath) {
//				var
//					sThemePath = sFilePath.replace('styles' + sPostfix + '.less', 'themes/' + sTheme.toLowerCase() + '.less')
//				;
//				
//				if ( fs.existsSync(sThemePath)) {
//					aSkinSpecyficFiles.push('@import "' + sThemePath + '";\r\n');
//				}
		
				return '@import "' + sFilePath + '";\r\n'; 
			}
		}))
//		.pipe(concat.header('.' + aModulesNames.join('Screen, .') + 'Screen { \n')) /* wrap styles */
//		.pipe(concat.footer('} \n'))
		.pipe(plumber({
			errorHandler: function (err) {
				console.log(err.toString());
				gutil.beep();
				this.emit('end');
			}
		}))
		.pipe(less())
		.pipe(gulp.dest(sTenantPathPrefix + 'static/styles/themes/' + sTheme))
		.on('error', gutil.log);
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
//	console.log(sFromDir);
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

gulp.task('styles', function () {
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
		MoveFiles(sPathToCoreWebclient + '/styles/themes/' + sTheme, sTenantPathPrefix + 'static/styles/themes/' + sTheme);
	});
});

gulp.task('cssonly', function () {
	_.each(aThemes, function (sTheme) {
		BuildThemeCss(sTheme, false);
		BuildThemeCss(sTheme, true);
	});
});

gulp.task('styles:watch', ['styles'], function () {
	gulp.watch(aModulesWatchPaths, {interval: 500}, ['cssonly']);
});

module.exports = {};
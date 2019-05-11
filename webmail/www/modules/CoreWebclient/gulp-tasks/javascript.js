var
    _ = require('underscore'),
    argv = require('./argv.js'),
	fs = require('fs'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    concat = require('gulp-concat-util'),
    plumber = require('gulp-plumber'),
	webpack = require('webpack'),
    gulpWebpack = require('webpack-stream'),
    path = require('path'),

    sTenantName = argv.getParameter('--tenant'),
    sOutputName = argv.getParameter('--output'), /* app, app-mobile, app-message-newtab, app-adminpanel, app-files-pub, app-calendar-pub, app-helpdesk*/
    aModulesNames = argv.getModules(),
	sBuild = argv.getParameter('--build'),
    sPath = sTenantName ? './tenants/' + sTenantName + '/static/js/' : './static/js/',
    crlf = '\n'
;

if (sOutputName === '')
{
	sOutputName = 'app';
}

function GetModuleName(sFilePath) {
    return sFilePath.replace(/.*modules[\\/](.*?)[\\/]js.*/, "$1");
}

var 
	aModules = _.compact(_.map(aModulesNames, function (sModuleName) {
		var
			sFilePath = './modules/' + sModuleName + '/js/manager.js',
			sTenantFilePath = './tenants/' + sTenantName + '/modules/' + sModuleName + '/js/manager.js',
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

		return sFoundedFilePath;
	})),
	oWebPackConfig = {
		stats: {
			source: false
		},
		resolveLoader: {
			alias: {
				"replace-module-names-loader": path.join(__dirname, "replace-module-names-loader.js")
			}
		},
		resolve: {
			root: [
				path.resolve('./')
			]
		},
		module: {
			loaders: [
				{
					include: /\.json$/,
					loaders: ["json-loader"]
				},
				{
					test: /[\\\/]modernizr\.js$/,
					loader: "imports?this=>window!exports?window.Modernizr"
				},
				{
					test: /\.js$/,
					loader: 'replace-module-names-loader'
				},
				{
					test: /\.less$/,
					loader: "style-loader!css-loader!less-loader"
				},
				{
					test: /\.css$/,
					loader: "style-loader!css-loader"
				},
				{
					test: /\.(png|jpe?g|gif)$/,
					loader: 'file-loader'
				}
			]
		}
	},
	updateVersion = function () {
		var sVersionFilesName = './VERSION';
		
		if (fs.existsSync(sVersionFilesName))
		{
			var 
				// sBuildPrefix = aParsedVersion[2] ? sRawVersions.replace(/^([\d\.]+)(?:-build-)([a-z]+)(\d+)$/, ''), : 'o',
				sRawVersions = fs.readFileSync(sVersionFilesName, {'encoding':'utf8'}),
				aParsedVersion = sRawVersions.trim().split('-'),
				sVersion = aParsedVersion[0] ? aParsedVersion[0] : '1.0.0',
				sBuildPrefix = aParsedVersion[2] ? aParsedVersion[2].replace(/^([a-z]+)(\d+)$/, '$1') : 'o',
				iBuild = aParsedVersion[2] ? aParsedVersion[2].replace(/^([a-z]+)(\d+)$/, '$2') : 1
			;
			
			if (sBuild !== '')
			{
				sBuildPrefix = sBuild;
			}
			
			iBuild++;
			
			fs.writeFileSync(sVersionFilesName, sVersion+'-build-'+sBuildPrefix+iBuild);
		}
	},
	removeObsoleteChanks = function (stats) {
		const newlyCreatedAssets = stats.compilation.assets;
		const unlinked = [];
		const bMin = stats.compilation.outputOptions.chunkFilename.substr(-6) === 'min.js';

		fs.readdir(path.resolve(stats.compilation.outputOptions.publicPath), function(err, files) {
			files
				.filter(function(file) { return file.substr(0, 1) !== '_'; })
				.filter(function(file) { return bMin ? file.substr(-6) === 'min.js' : file.substr(-6) !== 'min.js'; })
				.forEach(function(file) {
					if (!newlyCreatedAssets[file]) {
						fs.unlinkSync(path.resolve(stats.compilation.outputOptions.publicPath + file));
						unlinked.push(file);
					}
				});
			if (unlinked.length > 0) {
				console.log('Removed old assets: ', unlinked);
			}
		})
	},
	compileCallback = function (err, stats) {
		if (err) {
			throw new gutil.PluginError(err);
		}

		gutil.log(stats.toString({
			colors: true,
			//context: true,
			hash: false,
			version: false,
			timings: true,
			assets: false,
			chunks: false,
			chunkModules: false,
			modules: false,
			children: false,
			cached: false,
			reasons: false,
			source: false,
			errorDetails: false,
			chunkOrigins: false
		}));
		
		updateVersion();
		removeObsoleteChanks(stats);
	}
;

function jsTask(sTaskName, sName, oWebPackConfig) {
	var
		bPublic = sName.indexOf('-pub') !== -1,
		sPublicInit = bPublic ? "\t\t" + "App.setPublic();" + crlf : ''
	;

    gulp.src(aModules)
		.pipe(plumber({
            errorHandler: function (err) {
                console.log(err.toString());
                gutil.beep();
                this.emit('end');
            }
        }))
        .pipe(concat('_' + sName + '-entry.js', {
            sep: crlf,
            process: function (sSrc, sFilePath) {
                var sModuleName = GetModuleName(sFilePath);
			
				return "\t\t"+"if (window.aAvailableModules.indexOf('"+sModuleName+"') >= 0) {" + crlf +
					"\t\t\t"+"oAvailableModules['"+sModuleName+"'] = new Promise(function(resolve, reject) {" + crlf +
						"\t\t\t\t"+"require.ensure([], function(require) {var oModule = require('modules/"+sModuleName+"/js/manager.js'); resolve(oModule); }, '"+sModuleName+"');" + crlf +
					"\t\t\t"+"});" + crlf +
				"\t\t"+"}";
            }
        }))
        .pipe(concat.header("'use strict';" + crlf +
            "var $ = require('jquery'), _ = require('underscore'), Promise = require('bluebird');" + crlf +
            "$('body').ready(function () {" + crlf +
            "\t" + "var oAvailableModules = {};" + crlf +
            "\t" + "if (window.aAvailableModules) {" + crlf
        ))
        .pipe(concat.footer(
			crlf + "\t}" + crlf +
		
			"\t" + "Promise.all(_.values(oAvailableModules)).then(function(aModules){" + crlf +
			"\t" + "var" + crlf +
            "\t\t" + "ModulesManager = require('modules/CoreWebclient/js/ModulesManager.js')," + crlf +
            "\t\t" + "App = require('modules/CoreWebclient/js/App.js')," + crlf +
            "\t\t" + "bSwitchingToMobile = App.checkMobile()" + crlf +
            "\t" + ";" + crlf +
            "\t" + "if (!bSwitchingToMobile)" + crlf +
            "\t" + "{" + crlf +
			"\t\t" + "if (window.isPublic) {" + crlf +
			"\t\t\t" + "App.setPublic();" + crlf +
			"\t\t" + "}" + crlf +
			"\t\t" + "if (window.isNewTab) {" + crlf +
			"\t\t\t" + "App.setNewTab();" + crlf +
			"\t\t" + "}" + crlf +
            "\t\t" + "ModulesManager.init(_.object(_.keys(oAvailableModules), aModules));" + crlf +
            "\t\t" + "App.init();" + crlf +
            "\t" + "}" + crlf +
            "\t});" + crlf +
            "});" + crlf
        ))
		.pipe(gulp.dest(sPath))
		.pipe(gulpWebpack(oWebPackConfig, webpack, compileCallback))
		.pipe(plumber.stop())
        .pipe(gulp.dest(sPath))
	;
}

gulp.task('js:build', function () {
	jsTask('js:build', sOutputName, _.defaults({
		'output':  {
			'filename': sOutputName + '.js',
			'chunkFilename': '[name].' + sOutputName + '.[chunkhash].js',
			'publicPath': sPath,
			'pathinfo': true
		},
		'plugins': [
			new webpack.optimize.DedupePlugin(),
			new webpack.ProvidePlugin({
				$: "jquery",
				jQuery: "jquery",
				"window.jQuery": "jquery"
			})
		]
	}, oWebPackConfig));
});

gulp.task('js:watch', function () {
	jsTask('js:watch', sOutputName, _.defaults({
		'watch': true,
		'aggregateTimeout': 300,
		'poll': true,
		'output':  {
			'filename': sOutputName + '.js',
			'chunkFilename': '[name].' + sOutputName + '.[chunkhash].js',
			'publicPath': sPath
		},
		'plugins': [
			new webpack.ProvidePlugin({
				$: "jquery",
				jQuery: "jquery",
				"window.jQuery": "jquery"
			})
		]
	}, oWebPackConfig));
});

gulp.task('js:min', function () {
	jsTask('js:min', sOutputName, _.defaults({
		'plugins': [
			new webpack.optimize.UglifyJsPlugin({
				compress: {
					warnings: false,
					drop_console: true,
					unsafe: true
				}
			}),
			new webpack.ProvidePlugin({
				$: "jquery",
				jQuery: "jquery",
				"window.jQuery": "jquery"
			})
		],
		'output':  {
			'filename': sOutputName + '.min.js',
			'chunkFilename': '[name].' + sOutputName + '.[chunkhash].min.js',
			'publicPath': sPath
		}
	}, oWebPackConfig));
});

module.exports = {};

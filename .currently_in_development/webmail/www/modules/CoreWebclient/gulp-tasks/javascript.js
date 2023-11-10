'use strict';

var _ = require('underscore'),
	argv = require('./argv.js'),
	fs = require('fs'),
	gulp = require('gulp'),
	log = require('fancy-log'),
	concat = require('gulp-concat-util'),
	plumber = require('gulp-plumber'),
	webpack = require('webpack'),
	gulpWebpack = require('webpack-stream'),
	path = require('path'),
	TerserPlugin = require('terser-webpack-plugin'),

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
		mode: 'none',
		// mode: 'production',
		stats: {
			source: false
		},
		resolveLoader: {
			alias: {
				"replace-module-names-loader": path.join(__dirname, "replace-module-names-loader.js")
			}
		},
		resolve: {
			modules: [
				path.resolve(__dirname, '../../../'),
				"node_modules"
			]
		},
		module: {
			rules: [
				{
					test: /[\\\/]modernizr\.js$/,
					use: [
						'imports-loader?this=>window',
						'exports-loader?window.Modernizr'
					]
				},
				{
					test: /\.js$/,
					use: [
						{
							loader: 'replace-module-names-loader'
						}
					],
				},
				{
					test: /(OpenPgpWebclient|OpenPgpFilesWebclient|CoreParanoidEncryptionWebclientPlugin|ComposeWordCounterPlugin|TwoFactorAuth).*\.js$/,
					exclude: /node_modules/,
					use: [
						{
							loader: 'babel-loader',
							options: {
								presets: [
									[
										'@babel/preset-env',
										{
											useBuiltIns: 'entry',
											corejs: 'core-js@3'
										}
									]
								],
								compact: false
							}
						}
					],
				},
				// {
					// test: /\.less$/,
					// loader: "style-loader!css-loader!less-loader"
				// },
				{
					test: /\.css$/,
					use: [
						'style-loader',
						'css-loader'
					]
				},
				{
					test: /\.(png|jpe?g|gif)$/,
					use: [
						'file-loader'
					]
				}
			]
		},
		optimization: {
			splitChunks: {
				// chunks: 'all',
				cacheGroups: {
					'default': false
				}
			}
		},
		plugins: [
			new webpack.HashedModuleIdsPlugin(), // so that file hashes don't change unexpectedly
			new webpack.ProvidePlugin({
				$: "jquery",
				jQuery: "jquery",
				"window.jQuery": "jquery"
			})
		]
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
			log.error(err);
			log.error(stats);
		}

		log.info(stats.toString({
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
		gulp.src(aModules)
		// gulp.src('static/js/_app-entry.js')
			.pipe(plumber({
				errorHandler: function (err) {
					console.log(err.toString());
					this.emit('end');
				}
			}))
			.pipe(concat('_' + sName + '-entry.js', {
				sep: crlf,
				process: function (sSrc, sFilePath) {
					var sModuleName = GetModuleName(sFilePath);
return `
		if (window.aAvailableModules.indexOf('${sModuleName}') >= 0) {
			oAvailableModules['${sModuleName}'] = import(/* webpackChunkName: "${sModuleName}" */ 'modules/${sModuleName}/js/manager.js').then(function (module) { return module.default});
		}`;
				}
			}))
		.pipe(concat.header(
`'use strict';
import Promise from 'bluebird';
Promise.config({
	warnings: {
		wForgottenReturn: false
	}
});
if (!window.Promise) { window.Promise = Promise; }
import $ from 'jquery';
import _ from 'underscore';
import "core-js";
import "regenerator-runtime/runtime";

$('body').ready(function () {
	var oAvailableModules = {};
	if (window.aAvailableModules) {
`
		))
		.pipe(concat.footer(
	`
	}
	Promise.all(_.values(oAvailableModules)).then(function(aModules){
		var
			ModulesManager = require('modules/CoreWebclient/js/ModulesManager.js'),
			App = require('modules/CoreWebclient/js/App.js'),
			bSwitchingToMobile = App.checkMobile()
		;
		if (!bSwitchingToMobile) {
			if (window.isPublic) {
				App.setPublic();
			}
			if (window.isNewTab) {
				App.setNewTab();
			}
			ModulesManager.init(_.object(_.keys(oAvailableModules), aModules));
			App.init();
		}
	}).catch(function (oError) { console.error('An error occurred while loading the component:'); console.error(oError); });
});

`
				))
		.pipe(gulp.dest(sPath))
		.pipe(gulpWebpack(oWebPackConfig, webpack, compileCallback))
		.pipe(plumber.stop())
		.pipe(gulp.dest(sPath))
	;
}

gulp.task('js:build', function (done) {
	jsTask('js:build', sOutputName, _.defaults({
		'output': {
			'filename': sOutputName + '.js',
			'chunkFilename': '[name].' + sOutputName + '.[chunkhash].js',
			'publicPath': sPath,
			'pathinfo': true,
		}
	}, oWebPackConfig));
	done();
});

gulp.task('js:watch', function (done) {
	jsTask('js:watch', sOutputName, _.defaults({
		'watch': true,
		// 'aggregateTimeout': 300,
		// 'poll': true,
		'output':  {
			'filename': sOutputName + '.js',
			'chunkFilename': '[name].' + sOutputName + '.[chunkhash].js',
			'publicPath': sPath
		}
	}, oWebPackConfig));
	done();
});

gulp.task('js:min', function (done) {
	jsTask('js:min', sOutputName, _.defaults({
		'mode': 'production',
		optimization: {
			splitChunks: {
				// chunks: 'all',
				cacheGroups: {
					'default': false
				}
			},
			minimizer: [
			  new TerserPlugin({
				terserOptions: {
				  output: {
					comments: false,
				  },
				},
			  }),
			],
		  },
		'output':  {
			'filename': sOutputName + '.min.js',
			'chunkFilename': '[name].' + sOutputName + '.[chunkhash].min.js',
			'publicPath': sPath
		}
	}, oWebPackConfig));
	done();
});

module.exports = {};

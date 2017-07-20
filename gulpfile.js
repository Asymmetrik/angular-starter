'use strict';

let
	chalk = require('chalk'),
	del = require('del'),
	glob = require('glob'),
	gulp = require('gulp'),
	gulpLoadPlugins = require('gulp-load-plugins'),
	merge = require('merge2'),
	path = require('path'),
	rollup = require('rollup'),
	runSequence = require('run-sequence'),
	webpack = require('webpack'),
	webpackDevServer = require('webpack-dev-server'),

	plugins = gulpLoadPlugins(),
	pkg = require('./package.json'),
	assets = require('./config/assets');


// Banner to append to generated files
let bannerString = '/*! ' + pkg.name + '-' + pkg.version + ' - ' + pkg.copyright + '*/';

/**
 * ENV Tasks
 */
let BUILD = false;
gulp.task('env:BUILD', () => {
	BUILD = true;
});


/**
 * Validation Tasks
 */

gulp.task('validate-ts', () => {

	return gulp.src(assets.src.allTs)
		// Lint the Typescript
		.pipe(plugins.tslint({
			formatter: 'prose'
		}))
		.pipe(plugins.tslint.report({
			summarizeFailureOutput: true,
			emitError: BUILD
		}));

});


/**
 * Build
 */

gulp.task('build-style', [ 'clean-style' ], () => {

	// Generate a list of the sources in a deterministic manner
	let sourceArr = [];
	assets.src.sass.forEach((f) => {
		sourceArr = sourceArr.concat(glob.sync(f).sort());
	});

	return gulp.src(sourceArr)

		// Lint the Sass
		.pipe(plugins.sassLint({
			formatter: 'stylish',
			rules: require(path.posix.resolve('./config/sasslint.conf.js'))
		}))
		.pipe(plugins.sassLint.format())
		.pipe(plugins.sassLint.failOnError())

		// Compile and concat the sass (w/sourcemaps)
		.pipe(plugins.sourcemaps.init())
			.pipe(plugins.sass())
			.pipe(plugins.concat('application.css'))
		.pipe(plugins.sourcemaps.write('.', { sourceRoot: null }))
		.pipe(gulp.dest('public/dev'))

		// Clean the CSS
		.pipe(plugins.filter('public/dev/application.css'))
		.pipe(plugins.cleanCss())
		.pipe(plugins.insert.prepend(assets.bannerString))
		.pipe(plugins.hash({
			template: 'application.<%= hash %>.min.css',
			hashLength: 16
		}))
		.pipe(gulp.dest('public'));
});

gulp.task('clean-style', () => {
	return del([
		'public/application*.css',
		'public/dev/application.css',
		'public/dev/application.css.map'
	]);
});

// Build JS from the TS source
let tsProject = plugins.typescript.createProject(path.resolve('./tsconfig.json'));
gulp.task('build-ts', () => {

	let tsResult = gulp.src(assets.src.ts, { base: './src' })
		.pipe(plugins.sourcemaps.init())
		.pipe(tsProject());

	return merge([
			tsResult.js
				.pipe(plugins.sourcemaps.write('./'))
				.pipe(gulp.dest(assets.dist.dir)),
			tsResult.dts.pipe(gulp.dest(assets.dist.dir))
		]).on('error', plugins.util.log);

});

// Bundle the generated JS (rollup and then uglify)
gulp.task('build-js', ['rollup-js'], () => {

	// Uglify
	return gulp.src(path.join(assets.dist.bundleDir, (pkg.artifactName + '.js')))
		.pipe(plugins.uglify({ preserveComments: 'license' }))
		.pipe(plugins.rename(pkg.artifactName + '.min.js'))
		.pipe(gulp.dest(assets.dist.bundleDir));

});

// Rollup the generated JS
gulp.task('rollup-js', () => {

	return rollup.rollup({
			entry: path.join(assets.dist.dir, '/main.js'),
			external: [
				'@angular/core'
			],
			onwarn: (warning) => {
				if ('THIS_IS_UNDEFINED' === warning.code) {
					return;
				}
				plugins.util.log(warning.message);
			}
		})
		.then((bundle) => {
			return bundle.write({
				dest: path.join(assets.dist.bundleDir, (pkg.artifactName + '.js')),
				format: 'umd',
				moduleName: 'angular2Template',
				sourceMap: true,
				banner: bannerString,
				globals: {
					'@angular/core': 'ng.core'
				}
			});
		});

});


/**
 * Develop
 */
gulp.task('webpack-dev-server', (done) => {
	// Start a webpack-dev-server
	let webpackConfig = require(path.resolve('./config/webpack.config.js'))();
	let compiler = webpack(webpackConfig);

	new webpackDevServer(compiler, {
		stats: {
			colors: true,
			chunks: false
		},
		watchOptions: {
			aggregateTimeout: 300,
			poll: 1000
		},
	}).listen(9000, 'localhost', (err) => {
		if(err) throw new plugins.util.PluginError('webpack', err);

		// Server listening
		plugins.util.log('[webpack]', 'http://localhost:9000/webpack-dev-server/index.html');
	});
});

gulp.task('watch-ts', () => {
	gulp.watch(assets.src.allTs, ['validate-ts']);
});

/**
 * --------------------------
 * Main Tasks
 * --------------------------
 */

gulp.task('dev', (done) => { runSequence('validate-ts', [ 'webpack-dev-server', 'watch-ts' ], done); } );

gulp.task('build', (done) => { runSequence('env:BUILD', 'validate-ts', 'build-ts', 'build-js', 'build-style', done); } );

// Default task builds
gulp.task('default', [ 'build' ]);

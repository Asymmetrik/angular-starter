'use strict';

module.exports = {
	// Build related items
	build: {
		js: [ 'gulpfile.js', 'config/assets.js' ]
	},

	// Test files
	tests: {
		js: [ 'src/**/*.spec.ts' ]
	},

	// Source files and directories
	src: {
		sass: [ 'src/**/*.scss' ],
		allTs:   [ 'src/**/*.ts' ],
		ts:   [ 'src/**/*!(.spec).ts' ]
	},

	// Distribution related items
	dist: {
		dir: 'public',
		bundleDir: 'public/bundle',

		development: {
			css: [ 'public/dev/application.css' ],
			js: [
				// Don't need references to bundles since they're hardcoded in the index template in dev mode
			]
		},
		production: {
			css: [ 'public/application.+([0-9a-f]).min.css' ],
			js: [
				'public/vendor?(.)*([0-9a-f]).js',
				'public/application?(.)*([0-9a-f]).js'
			]
		}
	}

};

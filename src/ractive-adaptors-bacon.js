/*

	ractive-adaptors-bacon
	======================

	Version <%= pkg.version %>.

	Bacon.js adaptor for Ractive

	==========================

	Troubleshooting: If you're using a module system in your app (AMD or
	something more nodey) then you may need to change the paths below,
	where it says `require( 'ractive' )` or `define([ 'ractive' ]...)`.

	==========================

	Usage: Include this file on your page below Ractive, e.g:

	    <script src='lib/ractive.js'></script>
	    <script src='lib/bacon.js'></script>
	    <script src='lib/ractive-adaptors-bacon.js'></script>

	Or, if you're using a module loader, require this module:

	    // requiring the plugin will 'activate' it - no need to use
	    // the return value
	    require( 'ractive-adaptors-bacon' );

	Then, tell Ractive to use the `Bacon` adaptor:

		ractive = new Ractive({
			el: 'body',
			template: myTemplate,
			adapt: 'Bacon',
			data: {
				foo: someReactiveProperty
			}
		});

*/

(function ( global, factory ) {

	'use strict';

	// Common JS (i.e. browserify) environment
	if ( typeof module !== 'undefined' && module.exports && typeof require === 'function' ) {
		factory( require( 'ractive', 'bacon' ) );
	}

	// AMD?
	else if ( typeof define === 'function' && define.amd ) {
		define([ 'ractive', 'bacon' ], factory );
	}

	// browser global
	else if ( global.Ractive && global.Bacon ) {
		factory( global.Ractive, global.Bacon );
	}

	else {
		throw new Error( 'Could not find Ractive and Bacon! They must be loaded before the ractive-adaptors-bacon plugin' );
	}

}( typeof window !== 'undefined' ? window : this, function ( Ractive, Bacon ) {

	'use strict';

	var BaconWrapper = function ( ractive, observable, keypath ) {
		var self = this;

		this.ractive = ractive;
		this.value = observable;
		this.keypath = keypath;

		this.dispose = observable.subscribe( function ( event ) {
			if (!event.hasValue()) {
				return;
			}
			
			var value;

			if ( self.updating ) {
				return;
			}

			value = event.value();

			self._value = value;

			self.updating = true;
			ractive.set( keypath, value );
			self.updating = false;
		});
	};

	BaconWrapper.prototype = {
		get: function () {
			return this._value;
		},
		teardown: function () {
			this.dispose();
		},
		reset: function ( value ) {
			if ( this.updating ) {
				// do not teardown, we're just synchronizing with upstream.
				return true;
			}

			if ( value instanceof Bacon.Observable ) {
				// getting replaced by another observable.
				return false;
			}

			// two-way binding cannot work with Bacon - we have no
			// access to the original stream. Doesn't mean we want to
			// be torn down either, though.
			return true;
		}
	};

	Ractive.adaptors.Bacon = {
		filter: function ( object ) {
			return object instanceof Bacon.Observable;
		},
		wrap: function ( ractive, observable, keypath ) {
			return new BaconWrapper( ractive, observable, keypath );
		}
	};

}));

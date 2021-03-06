'use strict';

var //---------------
    //    Imports
    //---------------

    glob = require('glob'),
    q = require('rw-mercenary/promises'),
    lang = require('rw-mercenary/lang'),
    noop = lang.noop,
    extend = lang.extend,
    isFunction = lang.is.fn,

    //----------------------
    //    Implementation
    //----------------------

    // Wrap glob() with a promise().
    qglob = function(pattern, options) {
        var finished = q.defer();

        glob(pattern, options, function(error, matches) {
            if (error) {
                finished.reject(error);
            } else {
                finished.resolve(matches);
            }
        });
        return finished.promise;
    },

    // Wrap a glob.Glob instance with a convenient API to listen for matches as
    // they are encountered. Returns a function that can be called to cancel the
    // search. Invokes the handler function with each match or with null when
    // the search has completed.
    on = function(pattern, optionsOrFn, fn) {
        var finish = function() {
                globber.removeListener('end', finish);
                globber.removeListener('error', finish);
                globber.removeListener('match', handler);
                handler(null);
            },
            cancel = function() {
                finish();
                if (!globber.aborted) {
                    globber.abort();
                }
            },
            options,
            handler,
            globber;

        if (isFunction(optionsOrFn)) {
            options = {};
            handler = optionsOrFn;
        } else {
            options = optionsOrFn;
            handler = fn;
        }
        if (!handler) {
            return noop;
        }

        globber = new glob.Glob(pattern, options);
        globber.addListener('end', finish);
        globber.addListener('error', finish);
        globber.addListener('match', handler);
        return cancel;
    };

//------------------
//    Public API
//------------------

module.exports = (
    extend(qglob, {
        on: on
    }));

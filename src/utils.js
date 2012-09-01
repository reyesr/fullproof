/*
 * Copyright 2012 Rodrigo Reyes
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
var fullproof = fullproof || {};

/**
 * An object that associates a value and a numerical score
 * @constructor
 */
fullproof.ScoredElement = function(value, score) {
	if (!(this instanceof fullproof.ScoredElement)) {
		return new fullproof.ScoredElement(value, score);
	}
	this.value = value;
	this.score = score===undefined?1.0:score;
}

fullproof.ScoredElement.prototype.toString = function() {
	return "["+this.value+"|"+this.score+"]";
};

/**
 * Associates a key (typically a word), a value, and a score.
 * @constructor
 * @extends {fullproof.ScoredElement}
 */
fullproof.ScoredEntry = function(key, value, score) {
	if (!(this instanceof fullproof.ScoredEntry)) {
		return new fullproof.ScoredEntry(key, value, score);
	}
	this.key = key;
	this.value = value;
	this.score = score===undefined?1.0:score;
	this.toString = function() {
		return "["+this.key+"="+this.value+"|"+this.score+"]";
	}
}
fullproof.ScoredEntry.prototype = new fullproof.ScoredElement();

fullproof.ScoredEntry.comparatorObject = {
		lower_than: function(a,b) {
			return a.value<b.value;
		},
		equals: function(a,b) {
			return a.value==b.value;
		}
	};

fullproof.ScoredElement.comparatorObject = fullproof.ScoredEntry.comparatorObject;



/**
 * Creates a synchronization point. This function returns a function that collects
 * calls to callback, then calls its callback argument with all the data collected.
 * The synchronization point can trigger the final call to callback when it either
 * receives a fixed number of calls (expected argument >= 1), or when it
 * receives a false boolean value as argument (expected has to be either undefined or false)

 * @param {function} callback the function to call when the synchronization point is reached
 * @param {number} expected defines the synchronization point. If this is a number, the synchronization is 
 * triggered when the function returned is called this number of times. If this is set undefined, the sync is
 * triggered when this function returned is called with a single argument {boolean} false.
 * @param debug if defined, some debugging information are printed to the console, if it exists.
 */
fullproof.make_synchro_point = function(callback, expected, debug) {
	var count = 0;
	var results = [];
	return function(res) {
		if (expected === false || expected === undefined) {
			if (res === false) {
				callback(results);
			} else {
				results.push(res);
			}
		} else {
			
			++count;
			results.push(res);
			if (debug && console.log) {
				console.log("synchro point " + (typeof debug == "string"?debug+": ":": ") + count + " / " + expected);
			}
			if (count == expected) {
				callback(results);
			}
		}
	}
}

/**
 * Creates and returns a function that, when called, calls the callback argument, with any number
 * of arguments.
 * @param {function} callback a function reference to call when the created function is called
 * @param {...*} varargs any number of arguments that will be applied to the callback function, when called.
 */
fullproof.make_callback_caller = function(callback) {
	var args = [];
	for (var i=1; i<arguments.length; ++i) {
		args.push(arguments[i]);
	}
	return function() {
		if (callback) {
			callback.apply(this, args);
		}
	}
};


fullproof.filterObjectProperties = function(array_of_object, property) {
	if (array_of_object instanceof fullproof.ResultSet) {
		array_of_object = array_of_object.getDataUnsafe();
	}
	var result = [];
	for (var i=0,max=array_of_object.length; i<max; ++i) {
		result.push(array_of_object[i][property]);
	}
	return result;
}


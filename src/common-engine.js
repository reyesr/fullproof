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
 * A TextInjector associates an index and an analyzer to provide an
 * object able to inject texts.
 * 
 * @constructor
 * @param index the index to use when injecting
 * @param analyzer the analyzer to use to parse and normalize the text
 * TODO: move this object in its own place or in utils
 */
fullproof.TextInjector = function(index, analyzer) {
	if (!(this instanceof fullproof.TextInjector)) {
		return new fullproof.TextInjector(index,analyzer);
	}
	this.index = index;
	this.analyzer = analyzer;
};

/**
 * Inject a text and associates each of the word it composed with the provided value.
 * @param text some text to inject in the index
 * @param value the value associated to each word from the text
 * @param callback a function to call when the injection is complete
 */
fullproof.TextInjector.prototype.inject = function(text,value,callback) {
	var self = this;
	this.analyzer.getArray(text, function(array_of_words) {
		var synchro = fullproof.make_synchro_point(callback, array_of_words.length);
		for (var i=0; i<array_of_words.length; ++i) {
			var val = array_of_words[i];
			if (val instanceof fullproof.ScoredEntry) {
				val.value = val.value===undefined?value:val.value;
				self.index.inject(val.key, val, synchro); // the line number is the value stored
			} else {
				self.index.inject(array_of_words[i], value, synchro); // the line number is the value stored
			}
		}
	});
};

/**
 * Bulk-inject an array of  text and an array of values. The text injected is associated to the value
 * of the same index from the valueArray array. An optional progress function is called at regular interval
 * to provide a way for the caller to give user feedback on the process.
 * 
 * @param texArray an array of text
 * @param valueArray an array of values. The length of valueArray must equal the length of textArray.
 * @param callback a function to call when the injection is complete
 * @param progressCallback a function called with progress indication. A numeric argument is provided to 
 * the function, which ranges from 0 to 1 (0 meaning not done, 1 meaning complete). Note that due to the
 * floating nature of numeric values in javascript, you should not rely on receiving a 1, rather use
 * the callback function parameter, which will be always called on completion of the injection.
 */
fullproof.TextInjector.prototype.injectBulk = function(textArray, valueArray, callback, progressCallback) {
	var words = [];
	var values = [];
	var self = this;
	for (var i=0, max=Math.min(textArray.length, valueArray.length); i<max; ++i) {
		(function(text,value) {
			self.analyzer.getArray(text, function(array_of_words) {
				for (var w=0; w<array_of_words.length; ++w) {
					var val = array_of_words[w];
					if (val instanceof fullproof.ScoredEntry) {
						val.value = val.value===undefined?value:val.value;
						words.push(val.key);
						values.push(val);
					} else {
						words.push(val);
						values.push(value);
					}
				}
			});
		})(textArray[i], valueArray[i]);
	}
	this.index.injectBulk(words,values, callback, progressCallback);
}; 

/**
 * Represent all the data associated to an index, from the point of view of a search engine.
 * @param name the name of the index, expected to be unique in the search engine
 * @param capabilities a fullproof.Capabilities
 * @param analyzer
 * @param initializer
 * @param index
 * @constructor
 */
fullproof.IndexUnit = function (name, capabilities, analyzer, initializer, index) {
    /**
     * The name of the index
     */
    this.name = name;
    /**
     * The fullproof.Capabilities object originally associated to the index
     */
    this.capabilities = capabilities;
    /**
     * The parser used to inject text in the index
     */
    this.analyzer = analyzer;
    /**
     * The initializer function when the index needs to be built
     * @type {*}
     */
    this.initializer = initializer;
    /**
     * The index itself
     */
    this.index = index;
};

fullproof.AbstractEngine = fullproof.AbstractEngine || (function() {});

fullproof.AbstractEngine.prototype.checkCapabilities = function (capabilities, analyzer) {
    return true;
};

/**
 * Adds an array of index units
 * @param indexes an array of fullproof.IndexUnit instances
 * @param callback the function to call when all the indexes are added
 * @private
 * @static
 */
fullproof.AbstractEngine.addIndexes = function (engine, indexes, callback) {
    var starter = false;
    while (indexes.length > 0) {
        var data = indexes.pop();
        starter = (function (next, data) {
            return function () {
                fullproof.AbstractEngine.addIndex(engine, data.name, data.analyzer, data.capabilities, data.initializer, next !== false ? next : callback);
            };
        })(starter, data);
    }
    if (starter !== false) {
        starter();
    }
    return this;
};

/**
 * Adds un index to the engine. It is not possible to add an index after the engine was opened.
 * @param name the name of the engine
 * @param the analyzer used to parse the text
 * @param capabilities a fullproof.Capabilities instance describing the requirements for the index
 * @param initializer a function called when the index is created. This function can be used to populate the index.
 * @param completionCallback a function on completion, with true if the index was successfully added, false otherwise.
 * @return this instance
 * @private
 * @static
 */
fullproof.AbstractEngine.addIndex = function(engine, name, analyzer, capabilities, initializer, completionCallback) {
	var self = engine;
	var indexData = new fullproof.IndexUnit(name,capabilities,analyzer); 

	if (!engine.checkCapabilities(capabilities, analyzer)) {
		return completionCallback(false);
	}

	var indexRequest = new fullproof.IndexRequest(name, capabilities, function(index, callback) {
		var injector = new fullproof.TextInjector(index, indexData.analyzer);
		initializer(injector, callback);
	});
	
	if (engine.storeManager.addIndex(indexRequest)) {
		if (engine.indexes === undefined) {
            engine.indexes = [];
		}
        engine.indexes.push(indexData);
        engine.indexesByName[name] = indexData;
		if (completionCallback) {
			completionCallback(true);
		}
		return true;
	} else {
		if (completionCallback) {
			completionCallback(false);
		}
		return false;
	}
};

/**
 * Opens the engine: this function opens all the indexes at once, makes the initialization if needed,
 *  and makes this engine ready for use. Do not use any function of an engine, except addIndex, before
 *  having opened it.
 *  @param indexArray an array of index descriptors. Each descriptor is an object that defines the name, analyzer, capabilities, and initializer properties.
 *  @param callback function called when the engine is properly opened
 *  @param errorCallback function called if for some reason the engine cannot open some index
 */
fullproof.AbstractEngine.prototype.open = function (indexArray, callback, errorCallback) {
    var self = this;
    indexArray = (indexArray.constructor !== Array)?[indexArray]:indexArray; // Makes it an Array if it's not
    fullproof.AbstractEngine.addIndexes(self, indexArray);

    this.storeManager.openIndexes(function (storesArray) {
        self.storeManager.forEach(function (name, index) {
            self.indexesByName[name].index = index;
        });
        callback(self);
    }, errorCallback);
    return this;
};

/**
 * Inject a text document into all the indexes managed by the engine.
 * @param text some text to be parsed and indexed
 * @param value the primary value (number or string) associated to this object.
 * @param callback the function called when the text injection is done
 */
fullproof.AbstractEngine.prototype.injectDocument = function(text, value, callback) {
	var synchro = fullproof.make_synchro_point(function(data) {
		callback();
	});

	this.forEach(function(name, index, parser) {
		if (name) {
			parser.parse(text, function(word) {
				if (word) {
					index.inject(word, value, synchro); // the line number is the value stored
				} else {
					synchro(false);
				}
			})
		}
	}, false);
	return this;
};

/**
 * Clears all the indexes managed by this engine. Do not call this function
 * before the engine was open()'ed.
 * @param callback a function called when all the indexes are cleared.
 */
fullproof.AbstractEngine.prototype.clear = function(callback) {
    "use strict";
    if (this.getIndexCount() === 0) {
        return callback();
    }
	var synchro = fullproof.make_synchro_point(callback, this.getIndexCount());
	this.forEach(function(name, index, parser) {
		if (name) {
			index.clear(synchro);
		} else {
			synchro(false);
		}
	});
};

/**
 * Inits the current engine with data used by the AbstractEngine object.
 */
fullproof.AbstractEngine.prototype.initAbstractEngine = function (storeDescriptors) {
    this.storeManager = new fullproof.StoreManager(storeDescriptors);
    this.indexes = [];
    this.indexesByName = {};
    return this;
};

/**
 * Returns an index by its name
 * @param name the index name
 * @return a store index
 */
fullproof.AbstractEngine.prototype.getIndex = function (name) {
    return this.indexesByName[name].index;
};

/**
 * Returns an array with all the fullproof.IndexUnit managed by the engine,
 * in the same order they were added. The returned array is a shallow copy than
 * can be modified.
 * @return an array, possibly empty, of fullproof.IndexUnit objects.
 */
fullproof.AbstractEngine.prototype.getIndexUnits = function () {
    return [].concat(this.indexes);
};

/**
 * Iterates over the indexes, in order, and calls the callback function with 3 parameters:
 * the name of the index, the index instance itself, and the analyzer associated to this index.
 * @param callback the callback function(name,index,analyzer){}
 * @return this engine instance
 */
fullproof.AbstractEngine.prototype.forEach = function (callback) {
    for (var i = 0, max = this.indexes.length; i < max; ++i) {
        callback(this.indexes[i].name, this.indexes[i].index, this.indexes[i].analyzer);
    }
    for (var i = 1; i < arguments.length; ++i) {
        callback(arguments[i]);
    }
    return this;
};

fullproof.AbstractEngine.prototype.getIndexCount = function () {
    return this.indexes.length;
};

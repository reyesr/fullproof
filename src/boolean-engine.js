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

var fullproof = fullproof||{};

/**
 * @const
 */
fullproof.CONST_MODE_INTERSECT = 1;
/**
 * @const
 */
fullproof.CONST_MODE_UNION = 2;
/**
 * @const
 */
fullproof.CONST_MODE_WEIGHTED_UNION = 3;

/**
 * A boolean-set based engine.
 *  
 * @constructor
 */
fullproof.BooleanEngine = function(dbName) {

	if (!(this instanceof fullproof.BooleanEngine)) {
		return new fullproof.BooleanEngine(dbName);
	}

	var stores = [];
	this.storeManager = new fullproof.StoreManager();
	this.booleanMode = fullproof.CONST_MODE_INTERSECT;
	
	this.addIndex = function(name, parser, capabilities, initializer, completionCallback) {
		var self = this;
		var indexData = {
			name: name,
			parser: parser,
			caps: capabilities
		};
		
		this.storeManager.openIndex(name, capabilities, 
				function(index ,callback) {
					var injector = new fullproof.TextInjector(index, parser);
					initializer(injector, callback);
				}, function(index) {
					if (index) {
						indexData.index = index;
						stores.push(indexData);
						completionCallback(index);
					} else {
						completionCallback(false);
					}
				});
	}
	
	this.injectDocument = function(key, text, callback) {
		var synchro = fullproof.make_synchro_point(function(data) {
			callback();
		});
		
		for (var i=0; i<stores.length; ++i) {
			var obj = stores[i];
			obj.parser.parse(text, function(word) {
				if (word) {
					obj.store.inject(word, key, synchro); // the line number is the value stored
				} else {
					synchro(false);
				}
			});
		}
	}

	this.clear = function(callback) {
		if (stores.length == 0) {
			callback();
		} else {
			var synchro = fullproof.make_synchro_point(callback, stores.length);
			for (var i=0; i<stores.length; ++i) {
				stores[i].index.clear(synchro);
			}
		}
	};
	
	this.lookup = function(text, callback, /* private */storeIndex) {
		if (storeIndex === undefined) {
			storeIndex = 0;
		}
		var self = this;
		var store = stores[storeIndex];

		store.parser.parse(text, fullproof.make_synchro_point(function(array_of_words) {
			
			if (!array_of_words || array_of_words.length == 0) {
				if (stores.length > storeIndex+1) {
					return self.lookup(text, callback, storeIndex+1);
				} else {
					return callback(false);
				}
			}
			
			var lookup_synchro = fullproof.make_synchro_point(function(rset_array) {
				
				var curset = rset_array.shift();
				while (rset_array.length > 0) {
					var set = rset_array.shift();
					switch(self.booleanMode) {
					case fullproof.CONST_MODE_INTERSECT:
						curset.intersect(set);
						break;
					case fullproof.CONST_MODE_UNION:
						curset.merge(set);
						break;
					}
				}
				
				if (curset.getSize() ==0) {
					if (stores.length > storeIndex+1) {
						self.lookup(text, callback, storeIndex+1);
					} else {
						callback(false);
					}
				} else {
					callback(curset);
				}
				
			}, array_of_words.length);

			for (var i=0; i<array_of_words.length; ++i) {
				store.index.lookup(array_of_words[i], lookup_synchro);
			}
		}));
		
	}
			
}

var fullproof = (function(NAMESPACE) {
	
	NAMESPACE.CONST_MODE_INTERSECT = 1;
	NAMESPACE.CONST_MODE_UNION = 2;
	NAMESPACE.CONST_MODE_WEIGHTED_UNION = 3;
	
	NAMESPACE.BooleanEngine = function(dbName) {

		if (!(this instanceof NAMESPACE.BooleanEngine)) {
			return new NAMESPACE.BooleanEngine(dbName);
		}

		var stores = [];
		this.storeManager = new fullproof.StoreManager();
		this.booleanMode = NAMESPACE.CONST_MODE_INTERSECT;

		function makeTextInjector(index, parser) {
			var keyArrays = [];
			var valueArrays = [];
			return {
				inject: function(text,value,callback) {

					parser.getArray(text, function(array_of_words) {
						var synchro = fullproof.make_synchro_point(callback, array_of_words.length);
						for (var i=0; i<array_of_words.length; ++i) {
							index.inject(array_of_words[i], value, synchro); // the line number is the value stored
						}
					});
				},
				injectBulk: function(textArray, valueArray, callback, progressCallback) {
					var words = [];
					var values = [];
					for (var i=0, max=Math.min(textArray.length, valueArray.length); i<max; ++i) {
						(function(text,value) {
							parser.getArray(text, function(array_of_words) {
								for (var w=0; w<array_of_words.length; ++w) {
									words.push(array_of_words[w]);
									values.push(value);
								}
							});
						})(textArray[i], valueArray[i]);
					}
					index.injectBulk(words,values, callback, progressCallback);
				}
			};
		};
		
		this.addIndex = function(name, parser, capabilities, initializer, completionCallback) {
			var self = this;
			var indexData = {
				name: name,
				parser: parser,
				caps: capabilities
			};
			
			this.storeManager.openIndex(name, capabilities, 
					function(index ,callback) {
						var injector = makeTextInjector(index, parser);
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
				var synchro = NAMESPACE.make_synchro_point(callback, stores.length);
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

			store.parser.parse(text, NAMESPACE.make_synchro_point(function(array_of_words) {
				
				if (!array_of_words || array_of_words.length == 0) {
					if (stores.length > storeIndex+1) {
						return self.lookup(text, callback, storeIndex+1);
					} else {
						return callback(false);
					}
				}
				
				var lookup_synchro = NAMESPACE.make_synchro_point(function(rset_array) {
					
					var curset = rset_array.shift();
					while (rset_array.length > 0) {
						var set = rset_array.shift();
						switch(self.booleanMode) {
						case NAMESPACE.CONST_MODE_INTERSECT:
							curset.intersect(set);
							break;
						case NAMESPACE.CONST_MODE_UNION:
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
	
	return NAMESPACE;
})(fullproof||{});

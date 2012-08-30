var fullproof = (function(NAMESPACE) {
	
	NAMESPACE.CONST_MODE_INTERSECT = 1;
	NAMESPACE.CONST_MODE_UNION = 2;
	NAMESPACE.CONST_MODE_WEIGHTED_UNION = 3;
	
	NAMESPACE.BooleanEngine = function() {

		if (!(this instanceof NAMESPACE.BooleanEngine)) {
			return new NAMESPACE.BooleanEngine();
		}

		var stores = [];
		this.storeManager = new fullproof.StoreManager();
		this.booleanMode = NAMESPACE.CONST_MODE_INTERSECT;

		function makeTextInjectorFunction(index, parser) {
			return function(text, value, callback) {
				parser.getArray(text, function(array_of_words) {
					var synchro = fullproof.make_synchro_point(callback, array_of_words.length);
					for (var i=0; i<array_of_words.length; ++i) {
						index.inject(array_of_words[i], value, synchro); // the line number is the value stored
					}
				});
			}
		}
		
		this.addIndex = function(name, parser, capabilities, initializer, callback) {
			var self = this;
			var indexData = {
				name: name,
				parser: parser,
				caps: capabilities
			};
			
			this.storeManager.openIndex(name, capabilities, function(index ,callback) {
				var injector = makeTextInjectorFunction(index, parser);
				initializer(injector, callback);
			}, function(index) {
				if (index) {
					indexData.index = index;
					stores.push(indexData);
					callback(index);
				} else {
					callback(false);
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
		
		this.lookup = function(text, callback, storeIndex) {
			if (storeIndex === undefined) {
				storeIndex = 0;
			}
			var self = this;
			var store = stores[storeIndex];

			var parser_synchro = NAMESPACE.make_synchro_point(function(array_of_words) {
				
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
			});
			
			store.parser.parse(text, parser_synchro);
		}
				
	}
	
	return NAMESPACE;
})(fullproof||{});

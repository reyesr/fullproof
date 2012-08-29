var fullproof = (function(NAMESPACE) {
	
	this.CONST_MODE_INTERSECT = 1;
	this.CONST_MODE_UNION = 2;
	this.CONST_MODE_WEIGHTED_UNION = 3;
	
	NAMESPACE.Engine = function() {

		var stores = [];
		var searchMode = CONST_MODE_INTERSECT;
		
		if (!(this instanceof NAMESPACE.Engine)) {
			return new NAMESPACE.Engine();
		}

		this.addIndex = function(parser, store, weight) {
			weight=weight||1.0;
			parser.sendFalseWhenComplete = true;
			stores.push({store:store,weight:weight, parser:parser});
		}
		
		this.injectDocument = function(key, text) {
			for (var i=0; i<stores.length; ++i) {
				var obj = stores[i];
				obj.parser.parse(text, function(word) {
					obj.store.inject(word, key); // the line number is the value stored
				});
			}
		}
		
		this.lookup = function(text, callback) {
			for (var i=0; i<stores.length; ++i) {
				(function(obj) {
					obj.parser.parse(text, NAMESPACE.make_synchro_point(function(word_array) {

						var synchro_resultsets = NAMESPACE.make_synchro_point(function(resultsets) {
							if (resultsets.length == 0) {
								callback(false);
							} else {
								var res = resultsets.shift();
								while (resultsets.length>0) {
									var r = resultsets.shift();
									switch(obj.mode) {
										default:
											res.intersect(r);
											break;
									}
								}
								callback(res);
							}
						},word_array.length);
						
						for (var i=0; i<word_array.length; ++i) {
							obj.store.lookup(word_array[i], synchro_resultsets);
						}
					}));
				})(stores[i]);
			}
		}
		
	}
	
	return NAMESPACE;
})(fullproof||{});

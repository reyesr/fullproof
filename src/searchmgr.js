var fullproof = (function(NAMESPACE) {
	"use strict";
		
	NAMESPACE.manager = function() {
		
		if (!(this instanceof NAMESPACE.manager)) {
		    return new NAMESPACE.manager();
		  }
		
		var parser = net.kornr.searchengine.parsers.parse;
		var normalizers = [];
		var index = [];
		
		this.setParser = function(p) {
			parser=p;
		};
		
		this.setNormalizers = function(n) {
			if (n instanceof Array) {
				normalizers = n;
			} else {
				normalizers = [n];
			}
		};

		this.addIndex = function(name, instance, weight, normalizers, parser) {
			weight = weight||1.0;
			parser = parser||net.kornr.searchengine.parsers.parse;
			normalizers =  normalizers||[NAMESPACE.normalizer.to_lowercase_nomark, NAMESPACE.normalizer.remove_duplicate_letters];
			index.push({name: name,  index: instance, weight: weight, normalizers: normalizers, parser: parser});
		};

		this.inject = function(sentence, value) {
			for (var i=0; i<index.length; ++i) {
				var ind = index[i];
				ind.parser(sentence, function(word) {
					if (word) {
						for (var i=0,max=normalizers.length; i<max; ++i) {
							word = normalizers[i](word);
						}
						ind.index.inject(word,value);
					}
				});
			}
		};
		
		this.search = function(expr) {
			
			var sets = [];
			
			for (var i=0; i<index.length; ++i) {
				var ind = index[i];
				var indexset = [];
				ind.parser(sentence, function(word) {
					
					if (word) {
						
						var searchType = 0;
						if (word[0]=='+') {
							searchType = 1;
							word = word.substring(1);
						} else if (word[0]=='-') {
							searchType = -1;
							word = word.substring(1);
						}
					
						for (var i=0,max=normalizers.length; i<max; ++i) {
							word = normalizers[i](word);
						}
						var res = ind.index.lookup(word,value);
						indexset.push({result: res, searchtype: searchType, weight: ind.weight});
					}
				});
				
				// make sure the negative sets are last
				indexset.sort(function(a,b) {
					if (a.searchType>b.searchType) {
						return 1;
					}
					return a.searchType==b.searchType?0:-1;
				});

				for (var i=0,max=indexset.length; i<max; ++i) {
					
				}
			}
		};
	};
	
})(fullproof||{});

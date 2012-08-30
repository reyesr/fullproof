var fullproof = (function(NAMESPACE) {

	/**
	 * A simple private parser that relies on the unicode letter/number
	 * categories. Word boundaries are whatever is not a letter 
	 * or a number.
	 */
	var simple_parser = function(str, callback, functor) {
		functor = functor||net.kornr.unicode.is_letter_number;
		var current_word = "";
		for (var i=0,max=str.length; i<max; ++i) {
			if (functor(str.charCodeAt(i))) {
				current_word += str[i];
			} else {
				if (current_word.length>0) {
					callback(current_word);
					current_word = "";
				}
			}
		}
		if (current_word.length>0) {
			callback(current_word);
		}
		callback(false);
	};
	
	/**
	 * A Parser object with a parse() method. This
	 */
	NAMESPACE.StandardAnalyzer = function() {
		
		// Stores the normalizers... (don't store arguments, as it contains much more that the array) 
		var normalizers = [];
		for (var i=0; i<arguments.length; ++i) {
			if (arguments[i].constructor == Array) {
				normalizers = normalizers.concat(arguments[i]);
			} else {
				normalizers.push(arguments[i]);
			}
		}

		// Enforces new object
		if (!(this instanceof NAMESPACE.StandardAnalyzer)) {
			return new NAMESPACE.StandardAnalyzer(normalizers);
		}
		
		this.sendFalseWhenComplete = true;
		
		/**
		 * The main method: cuts the text, and calls the normalizers on each word,
		 * than calls the callback with each non empty word.
		 */
		this.parse = function(text, callback) {
			var self = this;
			simple_parser(text, function(word) {
				if (typeof word == "string") {
					word = word.trim();
					if (word != "") {
						for (var i=0; i<normalizers.length; ++i) {
							word = normalizers[i](word);
						}
					}
					if (callback) {
						callback(word);
					}
				} else if (word===false && self.sendFalseWhenComplete && callback) {
					callback(word);
				}
			});
		}
		
		this.getArray = function(text, callback) {
			var parser_synchro = fullproof.make_synchro_point(function(array_of_words) {
				callback(array_of_words);
			});
			this.parse(text, parser_synchro);
		};
	};
	
	
//	NAMESPACE.parser.split_parse = function(str, callback, parserfunc, functor) {
//		parserfunc=parserfunc||NAMESPACE.parser.parse;
//		functor = functor||net.kornr.unicode.is_letter_number;
//
//		var result = [];
//		parserfunc(str, function(w) {
//			if (w) {
//				result.push(w);
//			} else {
//				callback(result);
//			}
//		}, functor);
//	};

	return NAMESPACE;
	
})(fullproof||{});

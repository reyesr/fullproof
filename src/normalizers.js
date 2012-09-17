var fullproof = (function(NAMESPACE) {
    "use strict";
	NAMESPACE.normalizer = NAMESPACE.normalizer||{};

	//
	// Normalizing functions take a word and return another word.
	// If the word is cancelled by a function, it gets replaced 
	// by the boolean value false, otherwise it returns and/or
	// sends forward the callback chain the new normalized form 
	// for the word (or the unchanged form, if the normalizer
	// doesn't perform any transformation).
	//
	
	NAMESPACE.normalizer.to_lowercase_decomp = function(word, callback) {
		word = word?net.kornr.unicode.lowercase(word):word;
		return callback?callback(word):word;
	};

	NAMESPACE.normalizer.to_lowercase_nomark = function(word, callback) {
		word = word?net.kornr.unicode.lowercase_nomark(word):word;
		return callback?callback(word):word;
	};
	
	NAMESPACE.normalizer.remove_duplicate_letters = function(word, callback) {
		var res = word?"":false;
		var last = false;
		if (word) {
			for (var i=0,max=word.length; i<max; ++i) {
				if (last) {
					if (last != word[i]) {
						res +=last;
					}
				}
				last = word[i];
			}
			res += last?last:"";
		}
		return callback?callback(res):res;
	};

	NAMESPACE.normalizer.filter_in_array = function(word, array, callback) {
		if (array[word]) {
			return callback?callback(false):false;
		}
		return callback?callback(word):word;
	};

	return NAMESPACE;
	
})(fullproof||{});

var net = net||{};
net.kornr = net.kornr||{};
net.kornr.unicode= net.kornr.unicode||{}; 

(function(NAMESPACE) {
    "use strict";
	var CONST_GO_LEFT = -1;
	var CONST_GO_RIGHT = -2;

	/**
	 * Creates a searching function that memorizes the last found character index, to make same-codepage
	 * lookups efficient.
	 */
	function make_search_function_in_array(data) {
		
		var lastindex = 0;

		return function(c) {
			var index = lastindex;
			var r = data[index];
			var step = 1;
			var direction = 0;
			
			while (index >= 0 && index<data.length) {

				r = data[index];
				
				if (r instanceof Array) {
					if (c < r[0]) {
						step = -1;
					}  else if (c > r[1]) {
						step = +1
					} else {
						lastindex = index;
						return true;
					}
				} else {
					if (r == c) {
						lastindex = index;
						return true;
					}
					step = c<r?-1:+1;
				}
				
				if (direction == 0) {
					direction = step;
				} else if (direction != step) {
					return false;
				}
				index += step;
				
				if (index > data.length || index<0) {
					return false;
				}
			}
			return false;
		}

	}
		
	function create_category_lookup_function(data, originFile) {

		if (data === undefined) {
			return function() {
				throw "Missing data, you need to include " + originFile;
			}
		}

		var search_codepoint_in_array = make_search_function_in_array(data);
		
		return function(str) {
			switch(typeof str) {
			case "number":
				return search_codepoint_in_array(str);
				break;
			case "string":
				for (var i=0, max=str.length; i<max; ++i) {
					var a = search_codepoint_in_array(str.charCodeAt(i));
					if (a === false) {
						return false;
					}
				}
				return true;
			break;
			}
			return false;
		}
	}
	
	/**
	 * Creates a normalizer function for the given data array. The function memorizes the
	 * last codepoint converted, so that converting string containing characters from the
	 * same codepage is efficient. On the other side, the algorithm is not adapted to
	 * string mixing characters from different languages/codepages (another search function
	 * should be written for this case)
	 */
	function create_normalizer(data, originFile) {

		if (data === undefined) {
			return function() {
				throw "Missing data, you need to include " + originFile;
			}
		}
		
		//
		// Test a codepoint integer value against an index in the data array.
		// Returns:
		// - A positive integer or an array of integers if the codepoint matches
		// - CONST_GO_RIGHT if the index is too low
		// - CONST_GO_LEFT if the index is too high
		function normalizer_element_match(c,index) {
			if (index<0) {
				return CONST_GO_RIGHT;
			} else if (index>=data.length){
				return CONST_GO_LEFT;
			}
			
			var t = data[index];
			if (!t) { return false; }
			if (t.length == 2) {
				if (t[0] == c) {
					return t[1];
				}
			} else {
				if (t[0] <= c && t[1]>=c) {
					if (t[2] == 'R') {
						return c + t[3];
					} else {
						return t[3];
					}
				}
			}
			return t[0] > c?CONST_GO_LEFT : CONST_GO_RIGHT;
		}

		var normalize_char_last_index = 0;

		function normalize_char(c) {
			var index = normalize_char_last_index;
			var r = normalizer_element_match(c,index);
			if (r < 0) {
				// Need to search more...
				var direction = r;
				var step = direction==CONST_GO_RIGHT?+1:-1;
				while ( r === direction) {
					index += step;
					r = normalizer_element_match(c,index);
					if (!(r < 0)) { // a positive integer or an array
						normalize_char_last_index = index; // remember the last successful index for performance
						return r;
					}
				}
				normalize_char_last_index = index; // remember the last successful index for performance
				return c; // if not found, the codepoint is not in the array, so keep the same value
			} else {
				return r;
			}
		}
		
		return function(str) {
			var res = "";
			for (var i=0, max=str.length; i<max; ++i) {
				var a = normalize_char(str.charCodeAt(i));
				if (a instanceof Array) {
					for (var j=0; j<a.length; ++j) {
						res += String.fromCharCode(a[j]);
					}
				} else {
					res += String.fromCharCode(a);
				}
			}
			return res;
		};
	}	
	//
	// Converts a string to lowercase, then decompose it, and remove all diacritical marks
	NAMESPACE.lowercase_nomark = create_normalizer(NAMESPACE.norm_lowercase_nomark_data, "normalizer_lowercase_nomark.js");

	// Converts a string to lowercase, then decompose it (this is different from the String.toLowerCase, as the latter does not decompose the string)
	NAMESPACE.lowercase = create_normalizer(NAMESPACE.norm_lowercase_data, "normalizer_lowercase.js");

	// Converts a string to lowercase, then decompose it, and remove all diacritical marks
	NAMESPACE.uppercase_nomark = create_normalizer(NAMESPACE.norm_uppercase_nomark_data, "normalizer_uppercase_nomark.js");

	// Converts a string to lowercase, then decompose it (this is different from the String.toLowerCase, as the latter does not decompose the string)
	NAMESPACE.uppercase = create_normalizer(NAMESPACE.norm_uppercase_data, "normalizer_uppercase.js");

	NAMESPACE.is_letter = create_category_lookup_function(NAMESPACE.categ_letters_data, "categ_letters.js");
	NAMESPACE.is_letter_number = create_category_lookup_function(NAMESPACE.categ_letters_numbers_data, "categ_letters_numbers.js");
	NAMESPACE.is_number = create_category_lookup_function(NAMESPACE.categ_numbers_data, "categ_numbers.js");

	NAMESPACE.is_punct = create_category_lookup_function(NAMESPACE.categ_punct_data, "categ_puncts.js");
	NAMESPACE.is_separator = create_category_lookup_function(NAMESPACE.categ_separators_data, "categ_separators.js");
	NAMESPACE.is_punct_separator = create_category_lookup_function(NAMESPACE.categ_puncts_separators_data, "categ_puncts_separators_controls.js");
	NAMESPACE.is_punct_separator_control = create_category_lookup_function(NAMESPACE.categ_puncts_separators_controls_data, "categ_puncts_separators.js");
	
	
	NAMESPACE.is_control = create_category_lookup_function(NAMESPACE.categ_controls_data, "categ_controls.js");
	NAMESPACE.is_math = create_category_lookup_function(NAMESPACE.categ_maths_data, "categ_maths.js");
	NAMESPACE.is_currency = create_category_lookup_function(NAMESPACE.categ_currencies_data, "categ_currencies.js");
	
	return NAMESPACE;
})(net.kornr.unicode);

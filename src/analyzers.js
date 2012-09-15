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
(function() {
"use strict";

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
	
	function arguments_to_array(args) {
		var result = [];
		for (var i=0; i<args.length; ++i) {
			if (args[i].constructor == Array) {
				result = result.concat(args[i]);
			} else {
				result.push(args[i]);
			}
		}
		return result;
	}
	
	/**
	 * An analyzer with a parse() method. An analyzer does more than
	 * just parse, as it normalizes each word calling the sequence
	 * of normalizers specified when calling the constructor.
	 * 
	 * @constructor
	 * @param normalizers... the constructor can take normalizers as parameters. Each 
	 * normalizer is applied sequentially in the same order as they are
	 * passed in the constructor.
	 */
	fullproof.StandardAnalyzer = function() {
		
		// Enforces new object
		if (!(this instanceof fullproof.StandardAnalyzer)) {
			return new fullproof.StandardAnalyzer(normalizers);
		}

		// Stores the normalizers... (don't store arguments, as it contains more than an array) 
		var normalizers = arguments_to_array(arguments);
		this.provideScore = false;
		/**
		 * When true, the parser calls its callback function with 
		 * the parameter {boolean}false when complete. This allows
		 * the callback to know when the parsing is complete. When
		 * this property is set to false, the parser never triggers
		 * the last call to callback(false).
		 * 
		 * @expose
		 */
		this.sendFalseWhenComplete = true;
		
		/**
         * The main method: cuts the text in words, calls the normalizers on each word,
         * then calls the callback with each non empty word.
         * @param text the text to analyze
         * @param callback a function called with each word found in the text.
         */
        this.parse = function (text, callback) {
            var self = this;
            simple_parser(text, function (word) {
                if (typeof word == "string") {
                    word = word.trim();
                    if (word != "") {
                        for (var i = 0; i < normalizers.length; ++i) {
                            word = normalizers[i](word);
                        }
                    }

                    if (callback && word && word != "") {
                        callback(word);
                    }
                } else if (word === false && self.sendFalseWhenComplete && callback) {
                    callback(word);
                }
            });
        };
		
		/**
		 * Sometimes it's convenient to receive the whole set of words cut and normalized by the
		 * analyzer. This method calls the callback parameter only once, with as single parameter
		 * an array of normalized words.
		 * @param text some text to analyze
		 * @param callback a function called with an array (possibly empty) of string
		 */
		this.getArray = function(text, callback) {
			var parser_synchro = fullproof.make_synchro_point(function(array_of_words) {
				callback(array_of_words);
			});
			this.parse(text, parser_synchro);
		};
	};

	fullproof.ScoringAnalyzer = function() {
		// Stores the normalizers... (don't store arguments, as it contains more than an array) 
		var normalizers = arguments_to_array(arguments);
		var analyzer = new fullproof.StandardAnalyzer(normalizers);
		this.sendFalseWhenComplete = analyzer.sendFalseWhenComplete = true;
		this.provideScore = true;
		
		this.parse = function (text, callback) {
            var words = {};
            var wordcount = 0;
            var totalwc = 0;
            var self = this;
            analyzer.parse(text, function (word) {
                if (word !== false) {
                    if (words[word] === undefined || words[word].constructor !== Array) {
                        words[word] = [];
                    }
                    if (!words[word].push) {
                        console.log("eRROR");
                    }
                    words[word].push(wordcount);
                    totalwc += ++wordcount;
                } else {
                    // Evaluate the score for each word
                    for (var w in words) {
                        var res = words[w];
                        var offsetcount = 1;
                        var occboost = 0;
                        for (var i = 0; i < res.length; ++i) {
                            occboost += (3.1415 - Math.log(1 + res[i])) / 10;
                        }
                        var countboost = Math.abs(Math.log(1 + res.length)) / 10;
                        var score = 1 + occboost * 1.5 + countboost * 3;
                        // console.log(w + ": " + words[w].join(",") + ", countboost: " + countboost + ", occboost: " + occboost);
                        callback(new fullproof.ScoredEntry(w, undefined, score));
                    }

                    if (self.sendFalseWhenComplete == true) {
                        callback(false);
                    }

                }
            });
        };
		
		/**
		 * Sometimes it's convenient to receive the whole set of words cut and normalized by the
		 * analyzer. This method calls the callback parameter only once, with as single parameter
		 * an array of normalized words.
		 * @param text some text to analyze
		 * @param callback a function called with an array (possibly empty) of string
		 */
		this.getArray = function(text, callback) {
			var parser_synchro = fullproof.make_synchro_point(function(array_of_words) {
				callback(array_of_words);
			});
			this.parse(text, parser_synchro);
		};

	};
	
	
})();

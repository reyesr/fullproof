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
			self.index.inject(array_of_words[i], value, synchro); // the line number is the value stored
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
					words.push(array_of_words[w]);
					values.push(value);
				}
			});
		})(textArray[i], valueArray[i]);
	}
	this.index.injectBulk(words,values, callback, progressCallback);
}; 

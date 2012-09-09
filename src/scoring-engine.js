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
 * This engine is based on scoring. During the injection of document, the parser must provide {fullproof.ScoredElement} 
 * instances instead of primary values. The score is used to sort the results.
 * 
 * @constructor
 */
fullproof.ScoringEngine = function() {
	if (!(this instanceof fullproof.ScoringEngine)) {
		return new fullproof.ScoringEngine();
	}
	
	this.initAbstractEngine();
}

fullproof.AbstractEngine = fullproof.AbstractEngine || (function() {});
fullproof.ScoringEngine.prototype = new fullproof.AbstractEngine;

fullproof.ScoringEngine.prototype.checkCapabilities = function(capabilities, analyzer) {
	if (capabilities.getUseScores() !== true) {
		throw "capabilities.getUseScore() must be true";
	}
	if (analyzer.provideScore !== true) {
		throw "analyzer.provideScore must be true";
	}
	if (!capabilities.getComparatorObject()) {
		throw "capabilities.getComparatorObject() must return a valid comparator";
	}
	
	return true;
}

fullproof.ScoringEngine.prototype.lookup = function(text, callback) {
	
	var units = this.getIndexUnits();
	
	function merge_resultsets(rset_array, storeDesc) {
		if (rset_array.length == 0) {
			return new fullproof.ResultSet(storeDesc.caps.getComparatorObject());
		} else {
			var set = rset_array.shift();
			while (rset_array.length > 0) {
				set.merge(rset_array.shift(), fullproof.ScoredElement.mergeFn);
			}
			return set;
		}
	}
	
	var synchro_all_indexes = fullproof.make_synchro_point(function(array_of_resultset) {
		var merged = merge_resultsets(array_of_resultset);
		callback(merged);
	}, units.length);
	
	for (var i=0; i<units.length; ++i) {
		var unit = units[i];
		unit.analyzer.parse(text, fullproof.make_synchro_point(function(array_of_words) {
			if (array_of_words) {
					if (array_of_words.length == 0) {
						callback(new fullproof.ResultSet(store.caps.getComparatorObject()));
					} else {
						var lookup_synchro = fullproof.make_synchro_point(function(rset_array) {
							var merged = merge_resultsets(rset_array, unit.capabilities.getComparatorObject());
							synchro_all_indexes(merged);
						}, array_of_words.length);
		
						for (var i=0; i<array_of_words.length; ++i) {
							unit.index.lookup(array_of_words[i].key, lookup_synchro);
						}
					}
				}
		}));
	}
};

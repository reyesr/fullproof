var fullproof = fullproof || {};
fullproof = (function(NAMESPACE) {
"use strict";

	NAMESPACE.ScoredEntry.prototype.mkRandom = function(maxValue) {
		var word = 'xxx'.replace(/./g, function(c) {return String.fromCharCode(65+parseInt(Math.random()*26));});
		var value = parseInt(Math.random() * maxValue);
		var result = new NAMESPACE.ScoredEntry(word,value,Math.random()*2);
		return result;
	};

	NAMESPACE.ResultSet.prototype.testEquals = function(otherResultSet) {
		otherResultSet = (otherResultSet instanceof fullproof.ResultSet)?otherResultSet.getDataUnsafe():otherResultSet;
		
		deepEqual(this.getDataUnsafe(),otherResultSet);
	};

	NAMESPACE.tests = NAMESPACE.tests || {};

	NAMESPACE.tests.mkRandomString = function(size) {
		result = "";
		for (var i=0;i<size; ++i) {
			result += String.fromCharCode(65+parseInt(Math.random()*26));
		}
		return result;
	}
	
	NAMESPACE.tests.genericComparator = {
			lower_than: function(a,b) {
				var vala = a.value?a.value:a;
				var valb = b.value?b.value:b;
				return vala < valb;
			},
			equals: function(a,b) {
				var vala = a.value?a.value:a;
				var valb = b.value?b.value:b;
				return vala == valb;
			}
		};

	NAMESPACE.tests.makeResultSetOfScoredEntries = function(count, maxValue) {
		var result = new fullproof.ResultSet(NAMESPACE.tests.genericComparator);
		for (var i=0; i<count; ++i) {
			result.insert(NAMESPACE.ScoredEntry.prototype.mkRandom(maxValue));
		}
		return result;
	};

	NAMESPACE.tests.makeResultSetOfScoredEntriesObjects = function(count) {
		var result = new fullproof.ResultSet(NAMESPACE.tests.genericComparator);
		var curValue = parseInt(Math.random()*100);
		for (var i=0; i<count; ++i) {
			var obh = {
					param1: NAMESPACE.tests.mkRandomString(8),
					param2: NAMESPACE.tests.mkRandomString(8),
					intvalue: parseInt(Math.random()*1000)
//					value: parseInt(Math.random()*100)
			};
			
			result.insert(new NAMESPACE.ScoredEntry(NAMESPACE.tests.mkRandomString(10), obh, Math.random()*20));
		}
		return result;
	};

	
	NAMESPACE.tests.testScoredElement = function(se1,se2) {
		deepEqual(se1.value, se2.value);
		equal(se1.score, se2.score);
		return result;
	};

	
	return NAMESPACE;

})(fullproof);

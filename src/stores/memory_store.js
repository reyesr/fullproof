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
fullproof.store = fullproof.store||{};

(function() {
"use strict";

	function MemoryStoreIndex() {
		this.data= {};
		this.comparatorObject = null;
		this.useScore= false;
	}
	
	fullproof.store.MemoryStore = function() {
		
		if (!(this instanceof fullproof.store.MemoryStore)) {
			return new fullproof.store.MemoryStore(comparatorObject);
		}		
		
		this.indexes = {};
		return this;
	};

	fullproof.store.MemoryStore.getCapabilities = function () {
        return new fullproof.Capabilities().setStoreObjects([true, false]).setVolatile(true).setAvailable(true).setUseScores([true, false]);
    };
	fullproof.store.MemoryStore.storeName = "MemoryStore";

	function openStore(parameters, callback) {
        parameters=parameters;
		// ignore parameters
		if (callback) {
			callback(this);
		}
	}

	function openIndex(store, name, parameters, initializer, callback) {
		var index = new MemoryStoreIndex();
		var useScore = parameters.getUseScores()!==undefined?(parameters.getUseScores()):false;
		index.comparatorObject = parameters.getComparatorObject()?parameters.getComparatorObject():(useScore?fullproof.ScoredElement.comparatorObject:undefined);
		index.useScore = useScore;
        index.name = name;
		store.indexes[name] = index;
		if (initializer) {
			initializer(index, function() {
				callback(index);
			});
		} else {
			callback(index);
		}
		return index;
	}

	fullproof.store.MemoryStore.prototype.open = function(caps, reqIndexArray, callback, errorCallback) {
		var self = this;
		openStore(caps, function() {
			var synchro = fullproof.make_synchro_point(function(result) {
				callback(result);
			}, reqIndexArray.length);
			for (var i=0, max=reqIndexArray.length; i<max; ++i) {
				var requestIndex = reqIndexArray[i];
				openIndex(self, requestIndex.name, requestIndex.capabilities, requestIndex.initializer, synchro);
			}
		});
	};
	
	fullproof.store.MemoryStore.prototype.getIndex = function(name) {
		return this.indexes[name];
	};

	
	fullproof.store.MemoryStore.prototype.close = function(callback) {
		this.indexes = {};
		callback(this);
	};
	
	MemoryStoreIndex.prototype.clear = function (callback) {
        this.data = {};
        if (callback) {
            callback(true);
        }
        return this;
    };
	
	/**
	 * Inject data. Can be called as follows:
	 * memstoreInstance.inject("someword", 31321321, callbackWhenDone);
	 * memstoreInstance.inject("someword", new fullproof.ScoredElement(31321321, 1.0), callbackWhenDone);
	 * 
	 * When score is not set, and store is configured to store a score, then it is saved as undefined.
	 * When the score is set, and the store is configured not to store a score, it raises an exception
	 */

	MemoryStoreIndex.prototype.inject = function(key, value, callback) {
		if (!this.data[key]) {
			this.data[key] = new fullproof.ResultSet(this.comparatorObject);
		}
		if (this.useScore === false && value instanceof fullproof.ScoredElement) {
			this.data[key].insert(value.value);
		} else {
			this.data[key].insert(value);
		}

		if (callback) {
			callback(key,value);
		}
		
		return this;
	};

	MemoryStoreIndex.prototype.injectBulk = function(keyArray, valueArray, callback, progress) {
		for (var i=0; i<keyArray.length && i<valueArray.length; ++i) {
            if (i%1000 === 0 && progress) {
                progress(i / keyArray.length);

            }
			this.inject(keyArray[i], valueArray[i]);
		}
		if (callback) {
			callback(keyArray,valueArray);
		}
		return this;
	};

	
	MemoryStoreIndex.prototype.lookup = function(word, callback) {
		callback(this.data[word]?this.data[word].clone():new fullproof.ResultSet);
		return this;
	};


})();

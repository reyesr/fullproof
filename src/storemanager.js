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
 * A descriptor for a store.
 * @constructor
 */
fullproof.StoreDescriptor = function(name, ref) {
	if (!(this instanceof fullproof.StoreDescriptor)) {
		return new fullproof.StoreDescriptor(name, ref);
	}
	this.name = name;
	this.ref = ref;
};

/**
 * A StoreManager finds and instanciates stores
 * @constructor
 * @param {Array.fullproof.StoreDescriptor} storeDescriptors an array of {fullproof.StoreDescriptor} instances.
 */
fullproof.StoreManager = function(storeDescriptors) {

	this.available = [];
	
	if (fullproof.store) {
		storeDescriptors = storeDescriptors || [ new fullproof.StoreDescriptor("websqlstore", fullproof.store.WebSQLStore),
		                             new fullproof.StoreDescriptor("memorystore", fullproof.store.MemoryStore) ];
		for (var i=0;i<storeDescriptors.length; ++i) {
			if (storeDescriptors[i].ref) { // only push the store if it exists (.ref != undefined)
				this.available.push(storeDescriptors[i]);
			}
		}
	}

	this.indexes = {};
	this.storeCache= {};
	
	var self = this;
	
	function findSuitableStore(name, parameters, callback, queue) {
		if (queue.constructor != Array || queue.length == 0) {
			return callback(false);
		}
		var candidate = queue.shift();

		// Caching the store
		var store = self.storeCache[candidate.name];
		if (!store) {
			store = new candidate.ref();
			self.storeCache[candidate.name] = store;
		}
		
		var caps = store.capabilities;
		if (caps.isCompatibleWith(parameters)) {
			return store.openStore(parameters, function(store) {
				if (store) {
					callback(store, candidate);
				} else {
					findSuitableStore(name, parameters, callback, queue);
				}
			});
		}
		
		findSuitableStore(name, parameters, callback, queue);
	}
	
	/**
	 * Finds a suitable store and opens an index ready for read/write use.
	 * @param {string} name the name of the index. This must be unique for the application.
	 * @param {fullproof.Capabilities} parameters an instance of {fullproof.Capabilities} describing the requirements for the index
	 * @param {function(fullproof.TextInjector)} initializer a function to call when the index is either newly created or empty
	 * @param {function(Object)} callback a function called when the index is created. The index is provided as argument of the function, or false if the index could not be created. 
	 */
	this.openIndex = function(name, parameters, initializer, callback) {
		var self = this;
		
		if (!(parameters instanceof fullproof.Capabilities)) {
			throw "Parameter for " + name + " is not a fullproof.Capabilities object";
		}

		if (parameters.getStoreObjects() === true && parameters.getComparatorObject()===undefined) {
			throw "Index " + name + " stores objects, but does not define comparatorObject";
		}
		
		var storeDescriptors = [].concat(this.available);
		findSuitableStore(name, parameters, function(store, obj) {
			if (store) {
				store.openIndex(name, parameters, initializer, function(index) {
					self.indexes[name] = {name: name, store: store, index: index, descriptor: obj}
					callback(index, obj);
				});
			} else {
				callback(false);
			}
		}, storeDescriptors);
	};

	/**
	 * Returns information relative to the index
	 * @param indexName the index name
	 */
	this.getInfoFor = function(indexName) {
		return this.indexes[indexName];
	}

};

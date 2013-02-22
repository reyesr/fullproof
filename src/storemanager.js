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
 * @param name the public name for the store. Just needs to be different from others.
 * @param ref a reference to a fullproof.store.X function
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
 * @param {Array.fullproof.StoreDescriptor} storeDescriptors an array of {fullproof.StoreDescriptor} instances. Just leave undefined to use the default stores.
 */
fullproof.StoreManager = function(storeDescriptors) {
	
	this.available = [];

	if (fullproof.store) {
		storeDescriptors = storeDescriptors || [ new fullproof.StoreDescriptor("websqlstore", fullproof.store.WebSQLStore),
            new fullproof.StoreDescriptor("indexeddbstore", fullproof.store.IndexedDBStore),
            new fullproof.StoreDescriptor("memorystore", fullproof.store.MemoryStore) ];
	}
    if (storeDescriptors && storeDescriptors.length) {
        for (var i=0;i<storeDescriptors.length; ++i) {
            if (storeDescriptors[i].ref) { // only push the store if it exists (.ref != undefined)
                this.available.push(storeDescriptors[i]);
            }
        }
    }

    this.indexes = {};
	this.indexesByStore = {};
	this.storeCount = 0;
	this.storeCache= {};
	this.selectedStorePool = [];
	var self = this;

	function selectSuitableStore(requiredCaps, pool) {
		if (pool.constructor != Array || pool.length==0) {
			return false;
		}
		for (var i=0; i<pool.length; ++i) {
			if (pool[i].ref.getCapabilities().isCompatibleWith(requiredCaps)) {
				return pool[i];
			}
		}
		return false;
	}

	/**
	 * Adds an index to the list of index managed by the StoreManager.
	 * @param indexRequest an instance of fullproof.IndexRequest that describes the index to add
	 * @return true if an appropriate store was found, false otherwise
	 */
	this.addIndex = function(indexRequest) {
		var candidateStore = selectSuitableStore(indexRequest.capabilities, [].concat(this.available));
		this.indexes[indexRequest.name] = {req: indexRequest, storeRef: candidateStore };
		if (candidateStore) {
			if (this.indexesByStore[candidateStore.name] === undefined) {
				this.indexesByStore[candidateStore.name] = [];
				this.indexesByStore[candidateStore.name].ref = candidateStore.ref;
				++(this.storeCount);
			}
			
			this.indexesByStore[candidateStore.name].push(indexRequest.name);
		}
		return !!candidateStore;
	};

	/**
	 * Open all the indexes added to the StoreManager.
	 * Once all the indexes were opened, the callback function is called.
	 * @param callback the function to call when everything is opened (called with false if some index fails to open)
	 */
	this.openIndexes = function(callback, errorCallback) {
		if (this.storeCount === 0) {
			return callback();
		}
        errorCallback = errorCallback || function(){};
		var synchro = fullproof.make_synchro_point(callback, this.storeCount);
		
		for (var k in this.indexesByStore) {
			var store = new this.indexesByStore[k].ref();

            var arr = this.indexesByStore[k];
			var reqIndexes = [];
			var storeCapabilities = new fullproof.Capabilities(); // .setDbName(this.dbName);
			var size = 0;
			for (var i=0; i<arr.length; ++i) {
				var index = this.indexes[arr[i]];
				reqIndexes.push(index.req);
                if (index.req.capabilities &&  index.req.capabilities.getDbSize()) {
				    size += Math.max(index.req.capabilities.getDbSize(),0);
                }
				if (index.req.capabilities && index.req.capabilities.getDbName()) {
					storeCapabilities.setDbName(index.req.capabilities.getDbName());
				}
			}
            if (size != 0) {
                storeCapabilities.setDbSize(size);
            }

			var self = this;
            store.open(storeCapabilities, reqIndexes, function(indexArray) {
                if (indexArray && indexArray.length>0) {
					for (var i=0; i<indexArray.length; ++i) {
						var index = indexArray[i];
						index.parentStore = store;
						index.storeName = k;
						self.indexes[index.name].index = index;
					}
					synchro(store);
				} else {
					errorCallback();
				}
			}, errorCallback);
		}
	};
	
	/**
	 * Returns information relative to the index
	 * @param indexName the index name
	 */
	this.getInfoFor = function(indexName) {
		return this.indexes[indexName];
	};

	this.getIndex = function(name) {
		return this.indexes[name].index;
	};
	
	this.forEach = function(callback) {
		for (var k in this.indexes) {
			callback(k, this.indexes[k].index);
		}
	}
	
};

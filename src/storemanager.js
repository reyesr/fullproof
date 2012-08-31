var fullproof = (function(NAMESPACE) {
	"use strict";
	
	NAMESPACE.StoreDescriptor = function(name, ref) {
		if (!(this instanceof NAMESPACE.StoreDescriptor)) {
			return new NAMESPACE.StoreDescriptor(name, ref);
		}
		this.name = name;
		this.ref = ref;
	};
	
	NAMESPACE.StoreManager = function(storeDescriptors, dbName) {
	
		this.available = [];
		
		if (fullproof.store) {
			storeDescriptors = storeDescriptors || [ new NAMESPACE.StoreDescriptor("websqlstore", fullproof.store.WebSQLStore),
			                             new NAMESPACE.StoreDescriptor("memorystore", fullproof.store.MemoryStore) ];
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
						self.indexes[name] = {name: name, store: store, index: index}
						callback(index, obj);
					});
				} else {
					callback(false);
				}
			}, storeDescriptors);
		};

	};


	
	return NAMESPACE;
	
})(fullproof||{});

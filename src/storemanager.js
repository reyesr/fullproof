var fullproof = (function(NAMESPACE) {
	"use strict";
	
	NAMESPACE.StoreDescriptor = function(name, ref) {
		if (!(this instanceof NAMESPACE.StoreDescriptor)) {
			return new NAMESPACE.StoreDescriptor(name, ref);
		}
		this.name = name;
		this.ref = ref;
	};
	
	NAMESPACE.StoreManager = function(storeDescriptors) {
	
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
		
		function findSuitableStore(name, parameters, initializer, callback, queue) {
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
				return store.openStore(function(store) {
					if (store) {
						callback(store, candidate);
					} else {
						findSuitableStore(name, parameters, initializer, callback, queue);
					}
				});
			}
			
			findSuitableStore(name, parameters, initializer, callback, queue);
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
			findSuitableStore(name, parameters, initializer, function(store, obj) {
				if (store) {
					self.indexes[name] = {name: name, store: store}
				}
				callback(store, obj);
			}, storeDescriptors);
		};

	};


	
	return NAMESPACE;
	
})(fullproof||{});

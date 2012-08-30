var fullproof = fullproof || {};
fullproof.store = (function(NAMESPACE) {

	function MemoryStoreIndex() {
		this.data= {};
		this.comparatorObject = null;
		this.storeScores = false;
	};
	
	NAMESPACE.MemoryStore = function() {
		
		if (!(this instanceof NAMESPACE.MemoryStore)) {
			return new NAMESPACE.MemoryStore(comparatorObject);
		}

//		this.capabilities = {
//			can_store_object: true,
//			memory_based: true,
//			disk_based: false,
//			available : true,
//			support_scores: true
//		};		
		this.capabilities = new fullproof.Capabilities();
		this.capabilities.setStoreObjects([true,false]).setVolatile(true).setAvailable(true).setUseScores([true,false]);
		
		this.indexes = {
		};
		
		return this;
	};

	NAMESPACE.MemoryStore.prototype.openStore = function(callback) {
		callback(this);
	};
	NAMESPACE.MemoryStore.prototype.closeStore = function(callback) {
		this.indexes = {};
		callback(this);
	};
	
	NAMESPACE.MemoryStore.prototype.openIndex = function(name, parameters, initializer, callback) {
		var index = new MemoryStoreIndex();
		var useScore = parameters.getUseScores()!==undefined?(parameters.getUseScores()):false;
		index.comparatorObject = parameters.getComparatorObject()?parameters.getComparatorObject():(useScore?fullproof.ScoredElement.comparatorObject:undefined);
		index.useScore = useScore;
		
		this.indexes[name] = index;
		if (initializer) {
			initializer(index, function() {
				callback(index);
			});
		} else {
			callback(index);
		}
	};
	
	NAMESPACE.MemoryStore.prototype.closeIndex = function(name, callback) {
		delete this.indexes[name];
		callback(this);
	};
	
	MemoryStoreIndex.prototype.clear = function(callback) {
		this.data = {};
		if (callback) {
			callback();
		}
		return this;
	}
	
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
		this.data[key].insert(value);

		if (callback) {
			callback(key,value);
		}
		
		return this;
	};

	MemoryStoreIndex.prototype.lookup = function(word, callback, retrieveScoredElements) {
		callback(this.data[word]?this.data[word].clone():new fullproof.ResultSet);
		return this;
	};

	
	return NAMESPACE;

})(fullproof.store||{});

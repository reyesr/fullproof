var fullproof = fullproof || {};
fullproof.store = (function(NAMESPACE) {

	NAMESPACE.MemoryStore = function(comparatorObject) {
		
		if (!(this instanceof NAMESPACE.MemoryStore)) {
			return new NAMESPACE.MemoryStore();
		}
		
		this.data= {};
		
		this.capabilities = {
			can_store_object: true,
			memory_based: true,
			disk_based: false,
			available : true
		};
		
		this.clear = function(callback) {
			this.data = {};
			if (callback) {
				callback();
			}
			return this;
		}
		
		this.inject = function(key, value, callback) {
			if (key && key != "") {
				if (!this.data[key]) {
					this.data[key] = new fullproof.ResultSet(comparatorObject);
				}
				this.data[key].insert(value);
			}
			if (callback) {
				callback(key,value);
			}
			return this;
		};
		
		this.lookup = function(word, callback) {
			callback(this.data[word]?this.data[word]:new fullproof.ResultSet);
			return this;
		};
		
		return this;
	};

	return NAMESPACE;

})(fullproof.store||{});

var fullproof = fullproof || {};
fullproof.store = (function(NAMESPACE) {

	function WebSQLStoreIndex() {
		this.db = null;
		this.tableName = null;
		this.comparatorObject = null;
		this.storeScores = false;
		this.opened = false;
	}

	function MetaData(store, callback, errorCallback) {
		this.tablename = "fullproofmetadata";
		var meta = this;
		
		this.createIndex = function(name, successCallback, errorCallback) {
			var error = fullproof.make_callback_caller(errorCallback);
			error = function() {
				console.log("ERROR sql", arguments);
			};
			var tablename = this.tablename;
			store.db.transaction(function(tx) {
				tx.executeSql("CREATE TABLE IF NOT EXISTS "+ name +" (id NCHAR(48), value, score)", [], 
						function() {
							tx.executeSql("CREATE INDEX IF NOT EXISTS "+ name +"_indx ON " + name + " (id)", [],
									function() {
										tx.executeSql("INSERT OR REPLACE INTO " + tablename + " (name) VALUES (?)", [name], 
												fullproof.make_callback_caller(successCallback, true), 
												error);
									}, error);
						}, error);
			});
		};

		this.getIndexSize = function(name, callback) {
			store.db.transaction(function(tx) {
				console.log("tx",tx);
				tx.executeSql("SELECT count(*) AS cnt FROM " + name, [], function(tx,res) {
					if (res.rows.length == 1) {
						var line = res.rows.item(0);
						if (line.cnt !== undefined) {
							return callback(line.cnt);
						}
					}
					callback(false);
				}, function() {
					console.log("ERROR", arguments);
					callback(false);
				});
//				}, fullproof.make_callback_caller(callback, false));
			});
		};

		store.db.transaction(function(tx) {
			tx.executeSql("CREATE TABLE IF NOT EXISTS "+ meta.tablename +" (id VARCHAR(52), ctime)", [], 
				function() {
					callback(store);
				}, fullproof.make_callback_caller(errorCallback,false))});
	}
	
	NAMESPACE.WebSQLStore = function(){
		if (!(this instanceof NAMESPACE.WebSQLStore)) {
			return new NAMESPACE.WebSQLStore();
		}
		
		this.capabilities = new fullproof.Capabilities().setStoreObjects(false).setVolatile(false).setAvailable(window.openDatabase).setUseScores([true,false]);
		
		this.db = null;
		this.meta = null;
		this.tables = {};
		this.opened= false;
		this.dbName = "fullproof";
		this.dbSize = 1024*1024*5;
	};
	
	NAMESPACE.WebSQLStore.prototype.setOptions = function(params) {
		this.dbSize = params.dbSize||this.dbSize;
		this.dbName = params.dbName||this.dbName;
		return this;
	};

	NAMESPACE.WebSQLStore.prototype.openStore = function(callback) {
		this.opened = false;
		this.tableName = name;
		var errorCallback = fullproof.make_callback_caller(callback, false);
		this.db = openDatabase(this.dbName, '1.0', 'javascript search engine', this.dbSize);
		this.opened = true;
		var sef = this;
		this.meta = new MetaData(this, function(store) {
				callback(store);
			}, fullproof.make_callback_caller(callback,false));
	};

	NAMESPACE.WebSQLStore.prototype.closeStore = function(callback) {
		this.indexes = {};
		this.opened = false;
		callback(this);
	};
	
	NAMESPACE.WebSQLStore.prototype.openIndex = function(name, parameters, initializer, callback) {
		if (this.opened == false || !this.meta) {
			return callback(false);
		}
		
		parameters = parameters||{};
		var index = new WebSQLStoreIndex();
		var useScore = parameters.getUseScores()!==undefined?(parameters.getUseScores()):false;
		
		index.db = this.db;
		index.tableName = name;
		index.comparatorObject = parameters.getComparatorObject()?parameters.getComparatorObject():(useScore?fullproof.ScoredElement.comparatorObject:undefined);
		index.useScore = useScore;
		
		var self = this;
		this.meta.getIndexSize(name, function(tsize) {
			console.log("GOT SIZE", tsize);
			if (tsize === false) {
				self.meta.createIndex(name, function() {
					self.indexes[name] = index;
					if (initializer) {
						initializer(index, function() {
							index.opened = true;
							callback(index);
						});
					} else {
						callback(index);
					}
				}, fullproof.make_callback_caller(callback, false));
			} else if (tsize == 0) {
				if (initializer) {
					return initializer(index, fullproof.make_callback_caller(callback, index));
				} else {
					callback(index);
				}
			} else {
				callback(index);
			}
		});
	}; 
	
	NAMESPACE.WebSQLStore.prototype.closeIndex = function(name, callback) {
		delete this.tables[name];
		callback(this);
	};
	
	
	WebSQLStoreIndex.prototype.clear = function(callback) {
		var self = this;
		this.db.transaction(function(tx) {
			tx.executeSql("DELETE FROM "+ self.tableName, [], fullproof.make_callback_caller(callback, true), fullproof.make_callback_caller(callback, false));
		});
	};

	WebSQLStoreIndex.prototype.inject = function(word, value, callback) {
		var self = this;
		this.db.transaction(function(tx) {
			if (value instanceof fullproof.ScoredElement) {
				tx.executeSql("INSERT OR REPLACE INTO " + self.tableName + " (id,value, score) VALUES (?,?,?)", [word, value.value, value.score], fullproof.make_callback_caller(callback, true), fullproof.make_callback_caller(callback, false));
			} else {
				tx.executeSql("INSERT OR REPLACE INTO " + self.tableName + " (id,value) VALUES (?,?)", [word, value], fullproof.make_callback_caller(callback, true), fullproof.make_callback_caller(callback, false));
			}
		});
	};
	
	/**
	 * WebSQLStore does not support object storage, only primary values, so we rely
	 * on the sql engine sorting functions. ORDER BY should provide fine results as long as
	 * the datatype of values is consistant.
	 */
	WebSQLStoreIndex.prototype.lookup = function(word, callback) {
		var self = this;
		this.db.transaction(function(tx) {
			tx.executeSql("SELECT * FROM " + self.tableName + " WHERE id=? ORDER BY value ASC", [word],
					function(tx,res) {
						var result = [];
						for (var i=0; i<res.rows.length; ++i) {
							var item = res.rows.item(i);
							if (item) {
								if (item.score === null || item.score === undefined || item.score === false) {
									result.push(item.value);
								} else {
									result.push(new fullproof.ScoredElement(item.value, item.score));
								}
							}
						}
						callback(new fullproof.ResultSet(self.comparatorObject).setDataUnsafe(result));
					}, 
					function() {
						console.log(arguments);
						callback(false);
					});
		});
	};
	
	return NAMESPACE;

})(fullproof.store||{});

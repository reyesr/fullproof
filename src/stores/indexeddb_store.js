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

	//
	// A few methods for dealing with indexedDB stores
	//
	function install_on_request(req, success, error) {
		req.onsuccess = success;
		req.onerror = error;
		return req;
	}
	
	function getOrCreateObjectStore(tx, name, parameter) {
		if (tx.db.objectStoreNames.contains(name)) {
			return tx.objectStore(name);
		} else {
			return tx.db.createObjectStore(name, parameter);
		}
	}

	function setObject(store, object, callback, error) {
		var req = store.put(object);
		install_on_request(req, fullproof.make_callback_caller(callback, object), error);
	}
	
	function getOrCreateObject(store, keyValue, defaultValue, callback, error) {
		
		function create() {
			if (fullproof.isFunction(defaultValue)) {
				defaultValue = defaultValue();
			}
			setObject(store, defaultValue, callback, error);
		}
		
		var req = store.get(keyValue);
		req.onsuccess = function(ev) {
			if (ev.target.result === undefined) {
				if (defaultValue !== undefined) {
					create();
				} else {
					error();
				}
			} else {
				callback(req.result);
			}
		};
		req.onerror = create;
	};

	/**
	 * An IndexedDBIndex object manages an inverted index in an IndexedDB store.
	 * 
	 * @param database the database associated to this index
	 * @param storeName the name of the object store
	 * @constructor
	 */
	
	function IndexedDBIndex(parent, database, storeName, comparatorObject, useScore) {
		this.parent = parent;
		this.database = database;
		this.storeName = storeName;
		this.comparatorObject = comparatorObject;
		this.useScore = useScore;
		this.internalComparator = useScore?function(a,b) {
			return this.comparatorObject(a.value,b.value);
		}:function(a,b) {
			return this.comparatorObject(a,b);
		};
	}
	
	IndexedDBIndex.prototype.clear = function(callback) {
		var tx = this.database.transaction([this.storeName], this.parent.READWRITEMODE);
		var store = tx.objectStore(this.storeName);
		var req = store.clear();
		var cb = callback || function(){};
		install_on_request(req, fullproof.make_callback_caller(cb, true), fullproof.make_callback_caller(cb, false));
	}
	
	IndexedDBIndex.prototype.inject = function(word, value, callback) {
		var tx = this.database.transaction([this.storeName], this.parent.READWRITEMODE);
		var store = tx.objectStore(this.storeName);
		var self = this;
		getOrCreateObject(store, word, function() { return {key:word,v:[]} }, function(obj) {
			var rs = new fullproof.ResultSet(self.comparatorObject).setDataUnsafe(obj.v);
			if (value instanceof fullproof.ScoredElement) {
				if (self.useScore) {
					rs.insert({v:value.value, s:value.score});
				} else {
					rs.insert(value.value);
				}
			} else {
				rs.insert(value);
			}
			obj.v = rs.getDataUnsafe();
			setObject(store, obj, callback, fullproof.make_callback_caller(callback, false));
		}, fullproof.make_callback_caller(callback,false));
	};
	
	function createMapOfWordsToResultSet(self, wordArray, valuesArray, offset, count, resultPropertiesAsArray) {
		var result = {};
		for (; offset < count; ++offset) {
			var word = wordArray[offset];
			var value = valuesArray[offset];
			resultPropertiesAsArray.push(word);
			if (result[word] === undefined) {
				result[word] = new fullproof.ResultSet(self.comparatorObject);
			}
			if (value instanceof fullproof.ScoredElement) {
				if (self.useScore) {
					result[word].insert({v:value.value, s:value.score});
				} else {
					result[word].insert(value.value);
				}
			} else {
				result[word].insert(value);
			}
		}
		return result;
	}

	function storeMapOfWords(self, store, words, data, callback, offset, max) {
		if (words.length>0 && offset < max) {
			var word = words[offset]
			var value = data[word];
			getOrCreateObject(store, word, function() { return {key:word,v:[]} }, function(obj) {
				var rs = new fullproof.ResultSet(self.comparatorObject).setDataUnsafe(obj.v);
				rs.merge(value);
				obj.v = rs.getDataUnsafe();
				setObject(store, obj, function() {
					storeMapOfWords(self, store, words, data, callback, offset+1, max);
				}, function() { callback(false); });
			});
		} else {
			callback(true);
		}
	}

	IndexedDBIndex.prototype.injectBulk = function(wordArray, valuesArray, callback, progress) {
		var self = this;
		if (wordArray.length != valuesArray.length) {
			throw "Can't injectBulk, arrays length mismatch";
		}

		var self = this;
		var batchSize = 100;
		
		var words = [];
		var data = createMapOfWordsToResultSet(this, wordArray, valuesArray, 0, wordArray.length, words);

		var synchronizer = fullproof.make_synchro_point(function(res) {
			
		});
		
		function storeData(self, words, data, callback, progress, offset) {
			if (progress) {
				progress(offset / words.length);
			}
			var tx = self.database.transaction([self.storeName], self.parent.READWRITEMODE);
			var store = tx.objectStore(self.storeName);
			storeMapOfWords(self, store, words, data, function(res) {
				if (offset < words.length) {
					fullproof.call_new_thread(storeData, self, words, data, callback, progress, offset + batchSize)
				} else {
					callback(res);
				}
			}, offset, Math.min(offset + batchSize, words.length));
		}

		if (words.length>0) {
			storeData(this, words, data, callback, progress, 0)
		} else {
			callback(true);
		}
	}

	IndexedDBIndex.prototype.injectBulk2 = function(wordArray, valuesArray, callback, progress) {
		var self = this;
		if (wordArray.length != valuesArray.length) {
			throw "Can't injectBulk, arrays length mismatch";
		}

		var self = this;
		var batchSize = 300;
		
		var tx = self.database.transaction([self.storeName], self.parent.READWRITEMODE);
		var store = tx.objectStore(self.storeName);
		var words = [];
		var data = createMapOfWordsToResultSet(this, wordArray, valuesArray, 0, wordArray.length, words);
		storeMapOfWords(this, store, words, data, function(res) {
			callback(res);
		});
	}
	
	IndexedDBIndex.prototype.lookup = function(word, callback) {
		var tx = this.database.transaction([this.storeName]);
		var store = tx.objectStore(this.storeName);
		var self = this;
		getOrCreateObject(store, word, undefined, function(obj) {
			if (obj && obj.v) {
				var rs = new fullproof.ResultSet(self.comparatorObject);
				for (var i=0,max=obj.v.length; i<max; ++i) {
					var o = obj.v[i];
					if (self.useScore) {
						rs.insert(new fullproof.ScoredEntry(word, o.v, o.s));
					} else {
						rs.insert(o);
					}
				}
				callback(rs);
			} else {
				callback(new fullproof.ResultSet(self.comparatorObject));
			}
		}, function() { callback(new fullproof.ResultSet(self.comparatorObject)); });
	};
	
	/**
	 * IndexedDBStore stores the inverted indexes in a local IndexedDB database.
	 * @constructor
	 */
	fullproof.store.IndexedDBStore = function(version) {
		this.indexedDB =  window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
		this.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.mozIDBTransaction || window.msIDBTransaction;
		this.READWRITEMODE  = this.IDBTransaction.readwrite || this.IDBTransaction.READ_WRITE || "readwrite";
		
		this.capabilities = new fullproof.Capabilities().setStoreObjects(false).setVolatile(false).setAvailable(this.indexedDB != null).setUseScores([true,false]);
		
		this.database = null;
		this.meta = null;
		this.metaStoreName = "fullproof_metatable";
		this.stores = {};
		this.opened= false;
		this.dbName = "fullproof";
		this.dbSize = 1024*1024*5;
		this.dbVersion = version||"1.0";
	}
	fullproof.store.MemoryStore.storeName = "MemoryStore";

	fullproof.store.IndexedDBStore.prototype.setOptions = function(params) {
		this.dbSize = params.dbSize||this.dbSize;
		this.dbName = params.dbName||this.dbName;
		return this;
	};
	
	/**
	 * Creates the missing indexes (object stores) in the database
	 * @param database a valid IDBDatabase object
	 * @param indexRequestArray an array of fullproof.IndexRequest objects
	 * @param metaStoreName the name of the index that stores the metadata 
	 * @private
	 */
	function createStores(database, indexRequestArray, metaStoreName) {
		if (!database.objectStoreNames.contains(metaStoreName)) {
			database.createObjectStore(metaStoreName, {keyPath: "id"});
		}
		for (var i=0; i<indexRequestArray.length; ++i) {
			if (!database.objectStoreNames.contains(indexRequestArray[i].name)) {
				database.createObjectStore(indexRequestArray[i].name, {keyPath: "key"});
			}
		}
	}
	
	fullproof.store.IndexedDBStore.prototype.open = function(caps, reqIndexArray, callback, errorCallback) {
		if (caps.getDbName() !== undefined) {
			this.dbName = caps.getDbName();
		}
		if (caps.getDbSize() !== undefined) {
			this.dbSize = caps.getDbSize();
		}

		var updated = false;
		var self = this;
		var useScore = caps.getUseScores()!==undefined?(caps.getUseScores()):false;
		
		function setupIndexes(self) {
			for (var i=0; i<self.indexRequests.length; ++i) {
				var ireq =self.indexRequests[i];
				var compObj = ireq.capabilities.getComparatorObject()?ireq.capabilities.getComparatorObject():(self.useScore?fullproof.ScoredElement.comparatorObject:undefined);
				var index = new IndexedDBIndex(self, self.database, ireq.name, compObj);
				index.useScore = useScore;
				self.stores[ireq.name] = index;
			}					
		}
		
		function callInitializerIfNeeded(metastore, self, indexRequestArray, callback, errorCallback) {
			if (indexRequestArray.length == 0) {
				return callback(true);
			}
			
			var ireq = indexRequestArray.shift();
			getOrCreateObject(metastore, ireq.name, {id: ireq.name, init: false}, 
					function(obj) {
						if (obj.init == false && ireq.initializer) {
							ireq.initializer(self.getIndex(ireq.name), function() {
								callInitializerIfNeeded(metastore, self, indexRequestArray, callback, errorCallback);
							});
						} else {
							callInitializerIfNeeded(metastore, self, indexRequestArray, callback, errorCallback);
						}
					}, errorCallback);
		}
		
		function checkInit(self, database, indexRequestArray, callback, errorCallback) {
			createStores(database, indexRequestArray, self.metaStoreName);
			setupIndexes(self);
			var tx = database.transaction([self.metaStoreName], self.READWRITEMODE);
			var metastore = tx.objectStore(self.metaStoreName);
			callInitializerIfNeeded(metastore, self, [].concat(indexRequestArray), callback, errorCallback);
		}
		
		this.indexRequests = reqIndexArray;
		var self = this;
		
		var openRequest = this.indexedDB.open(this.dbName, this.dbVersion);
		openRequest.onerror = function() { 
			errorCallback() 
		};
		openRequest.onsuccess = function(ev) {
			self.database = ev.result || ev.target.result;
					
			if (self.database.version !== undefined && self.database.setVersion && self.database.version != self.dbVersion) {
				var versionreq = self.database.setVersion(self.dbVersion);
				versionreq.onerror = fullproof.make_callback_caller(errorCallback, "Can't change version with setVersion(" +self.dbVersion+")");
				versionreq.onsuccess = function(ev) {
					createStores(self.database, reqIndexArray, self.metaStoreName);
					checkInit(self, self.database, self.indexRequests, callback, errorCallback);
				}
			} else {
				checkInit(self, self.database, self.indexRequests, callback, errorCallback);
			}	
		};
		openRequest.onupgradeneeded = function(ev) {
			createStores(ev.target.result, reqIndexArray, self.metaStoreName);
			updated = true;
		};
		
	};

	
	fullproof.store.IndexedDBStore.prototype.close = function(callback) {
		callback();
	}

	fullproof.store.IndexedDBStore.prototype.getIndex = function(name) {
		return this.stores[name];
	}
	
})();

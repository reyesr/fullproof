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
	
	function IndexedDBMeta(database, success, error) {
		this.tablename = "fullproofmetadata";
		this.database = database;
		var self = this;
		this.initDone = false;
		if (!database.version) {
			
			var versionRequest = database.setVersion("1");
			versionRequest.onsuccess = function() {
				self.metaStore = self.database.createObjectStore(self.tablename, "id", false);
				if (success) {
					success();
				}
			};
			if (error) {
				versionRequest.onerror = error;
			}
		} else {
			if (success) {
				success();
			}
		}

		this.init = function() {
			var objectStore = this.database.createObjectStore(this.tablename, { keyPath: "id" });
			this.initDone = true;
		}
	}
	
	IndexedDBMeta.prototype.createIndex = function(name, success, error) {
		
	};
	
	/**
	 * IndexedDBStore stores the inverted indexes in a local IndexedDB database.
	 */
	fullproof.store.IndexedDBStore = function() {
		this.indexedDB =  window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
		this.capabilities = new fullproof.Capabilities().setStoreObjects(false).setVolatile(false).setAvailable(this.indexedDB != null).setUseScores([true,false]);
		
		this.database = null;
		this.meta = null;
		this.tables = {};
		this.opened= false;
		this.dbName = "fullproof";
		this.dbSize = 1024*1024*5;
	}
	
	fullproof.store.IndexedDBStore.prototype.setOptions = function(params) {
		this.dbSize = params.dbSize||this.dbSize;
		this.dbName = params.dbName||this.dbName;
		return this;
	};

	fullproof.store.WebSQLStore.prototype.openStore = function(parameters, callback) {
		this.opened = false;
		var self = this;
		
		if (parameters.getDbName() !== undefined) {
			this.dbName = parameters.getDbName();
		}
		if (parameters.getDbSize() !== undefined) {
			this.dbSize = parameters.getDbSize();
		}

		var openRequest = this.indexedDB.open(this.dbName, 1);
		openRequest.onerror = function() {
			callback(false);
		};
		openRequest.onsuccess = function(ev) {
			this.database = ev.result || ev.target.result;
			this.meta = this.meta || new IndexedDBMeta(this.database, fullproof.make_callback_caller(callback, self), fullproof.make_callback_caller(callback, false));
		};
		openRequest.onupgradeneeded = function(ev) {
			var db = event.target.result;
			this.meta = new IndexedDBMeta(db, fullproof.make_callback_caller(callback, self), fullproof.make_callback_caller(callback, false));
			meta.init();
		};
	};

})();

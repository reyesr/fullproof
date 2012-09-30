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
fullproof.store = fullproof.store || {};
(function(window) {
    "use strict";

    try {
        fullproof.store.indexedDB =  window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
        fullproof.store.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.mozIDBTransaction || window.msIDBTransaction || {};
        fullproof.store.READWRITEMODE  = fullproof.store.IDBTransaction.readwrite || fullproof.store.IDBTransaction.READ_WRITE || "readwrite";
    } catch(e) {
        fullproof.store.indexedDB = window.indexedDB;
        fullproof.store.IDBTransaction = window.IDBTransaction;
        fullproof.store.READWRITEMODE = "readwrite";
    }

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
        install_on_request(req, fullproof.make_callback(callback, object), error);
    }

    function getOrCreateObject(store, keyValue, defaultValue, callback, error) {

        function create() {
            if (fullproof.isFunction(defaultValue)) {
                defaultValue = defaultValue();
            }
            setObject(store, defaultValue, callback, error);
        }
        try {
            var req = store.get(keyValue);
        } catch (e) {
            console && console.log && console.log(e);
            error(e);
        }

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
    }

    /**
     * An IndexedDBIndex object manages an inverted index in an IndexedDB store.
     *
     * @param database the database associated to this index
     * @param storeName the name of the object store
     * @constructor
     */
    function IndexedDBIndex(parent, database, indexName, comparatorObject, useScore) {
        this.parent = parent;
        this.database = database;
        this.name = indexName;
        this.comparatorObject = comparatorObject;
        this.useScore = useScore;
        this.internalComparator = useScore?function(a,b) {
            return this.comparatorObject(a.value,b.value);
        }:function(a,b) {
            return this.comparatorObject(a,b);
        };
    }

    IndexedDBIndex.prototype.clear = function (callback) {
        callback = callback || function(){};
        var self = this;
        var wrongfunc = fullproof.make_callback(callback, false);
        var tx = this.database.transaction([this.name, this.parent.metaStoreName], fullproof.store.READWRITEMODE);
        var metastore = tx.objectStore(this.parent.metaStoreName);
        install_on_request(metastore.put({id:this.name, init:false}), function () {
            fullproof.call_new_thread(function () {
                var tx = self.database.transaction([self.name], fullproof.store.READWRITEMODE);
                var store = tx.objectStore(self.name);
                var req = store.clear();
                install_on_request(req, fullproof.make_callback(callback, true), wrongfunc);
            });
        }, wrongfunc);
    };

    IndexedDBIndex.prototype.inject = function(word, value, callback) {
        var tx = this.database.transaction([this.name], fullproof.store.READWRITEMODE);
        var store = tx.objectStore(this.name);
        var self = this;
        var result = false;
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
            setObject(store, obj, callback, fullproof.make_callback(callback, false));
        }, fullproof.make_callback(callback,false));
    };

    var storedObjectComparator_score = {
        lower_than: function(a, b) {
            return (a.v?a.v:a)<(b.v? b.v:b);
        },
        equals: function(a,b) {
            return (a.v?a.v:a)===(b.v? b.v:b);
        }
    };

    function createMapOfWordsToResultSet(self, wordArray, valuesArray, offset, count, resultPropertiesAsArray) {
        var result = new fullproof.HMap();
        for (; offset < count; ++offset) {
            var word = wordArray[offset];
            var value = valuesArray[offset];

            if (result.get(word) === undefined) {
                result.put(word, new fullproof.ResultSet(storedObjectComparator_score));
                resultPropertiesAsArray.push(word);
            }
            if (value instanceof fullproof.ScoredElement) {
                if (self.useScore) {
                    var rs = result.get(word);
                    rs.insert({v:value.value, s:value.score});
                } else {
                    result.get(word).insert(value.value);
                }
            } else {
                result.get(word).insert(value);
            }
        }
        return result;
    }

    function storeMapOfWords(self, store, words, data, callback, offset, max) {
        if (words.length>0 && offset < max) {
            var word = words[offset];
            var value = data.get(word);
            getOrCreateObject(store, word, function() { return {key:word,v:[]};}, function(obj) {
                var rs = new fullproof.ResultSet(self.comparatorObject).setDataUnsafe(obj.v);
                rs.merge(value);
                obj.v = rs.getDataUnsafe();
                setObject(store, obj, function() {
                    storeMapOfWords(self, store, words, data, callback, offset+1, max);
                }, function() { /// callback(false);
                });
            });
        } else {
            // callback(true);
        }
    }

    IndexedDBIndex.prototype.injectBulk = function (wordArray, valuesArray, callback, progress) {
        var self = this;
        if (wordArray.length !== valuesArray.length) {
            throw "Can't injectBulk, arrays length mismatch";
        }

        var batchSize = 100;

        var words = [];
        var data = createMapOfWordsToResultSet(this, wordArray, valuesArray, 0, wordArray.length, words);

        function storeData(self, words, data, callback, progress, offset) {
            if (progress) {
                progress(offset / words.length);
            }
            var tx = self.database.transaction([self.name], fullproof.store.READWRITEMODE);
            var inError = false;
            tx.oncomplete = function() {
                if (offset+batchSize < words.length) {
                    fullproof.call_new_thread(storeData, self, words, data, callback, progress, offset + batchSize);
                } else {
                    fullproof.call_new_thread(callback, true);
                }
            };
            tx.onerror = function() { callback(false);};
            var store = tx.objectStore(self.name);

            for (var i=offset, max=Math.min(words.length,offset+batchSize); i<max; ++i) {
                var word = words[i];
                (function(word,value) {
                    getOrCreateObject(store, word, function() { return {key:word,v:[]};}, function(obj) {
                        var rs = new fullproof.ResultSet(self.comparatorObject).setDataUnsafe(obj.v);
                        rs.merge(value);
                        obj.v = rs.getDataUnsafe();
                        setObject(store, obj, function() { }, function() { inError = true; });
                    });
                })(word,data.get(word));
            }
        }

        if (words.length > 0) {
            storeData(this, words, data, callback, progress, 0);
        } else {
            callback(true);
        }
    };


    IndexedDBIndex.prototype.lookup = function(word, callback) {
        var tx = this.database.transaction([this.name]);
        var store = tx.objectStore(this.name);
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
    fullproof.store.IndexedDBStore = function (version) {

        this.database = null;
        this.meta = null;
        this.metaStoreName = "fullproof_metatable";
        this.stores = {};
        this.opened = false;
        this.dbName = "fullproof";
        this.dbSize = 1024 * 1024 * 5;
        this.dbVersion = version || "1.0";
    };
    fullproof.store.IndexedDBStore.storeName = "MemoryStore";
    fullproof.store.IndexedDBStore.getCapabilities = function () {
        return new fullproof.Capabilities().setStoreObjects(false).setVolatile(false).setAvailable(fullproof.store.indexedDB != null).setUseScores([true, false]);
    };

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

        var indexArrayResult = [];

        function setupIndexes(self) {
            for (var i=0; i<self.indexRequests.length; ++i) {
                var ireq =self.indexRequests[i];
                var compObj = ireq.capabilities.getComparatorObject()?ireq.capabilities.getComparatorObject():(self.useScore?fullproof.ScoredElement.comparatorObject:undefined);
                var index = new IndexedDBIndex(self, self.database, ireq.name, compObj, ireq.capabilities.getUseScores());
                self.stores[ireq.name] = index;
                indexArrayResult.push(index);
            }
        }

        function callInitializerIfNeeded(database, self, indexRequestArray, callback, errorCallback) {
            if (indexRequestArray.length == 0) {
                return callback(true);
            }

            var tx = database.transaction([self.metaStoreName], fullproof.store.READWRITEMODE);
            var metastore = tx.objectStore(self.metaStoreName);
            var ireq = indexRequestArray.shift();
            getOrCreateObject(metastore, ireq.name, {id: ireq.name, init: false},
                function(obj) {
                    if (obj.init == false && ireq.initializer) {
                        var initIndex = self.getIndex(ireq.name);
                        fullproof.call_new_thread(function() {
                            initIndex.clear(function() {
                                ireq.initializer(self.getIndex(ireq.name), function() {
                                    fullproof.call_new_thread(callInitializerIfNeeded, database, self, indexRequestArray, callback, errorCallback);
                                    fullproof.call_new_thread(function() {
                                        var tx = database.transaction([self.metaStoreName], fullproof.store.READWRITEMODE);
                                        var metastore = tx.objectStore(self.metaStoreName);
                                        obj.init = true;
                                        install_on_request(metastore.put(obj), function(){}, function(){});;
                                    });
                                });
                            });
                        });
                    } else {
                        fullproof.call_new_thread(callInitializerIfNeeded, database, self, indexRequestArray, callback, errorCallback);
                    }
                }, errorCallback);
        }

        function checkInit(self, database, indexRequestArray, callback, errorCallback) {
            createStores(database, indexRequestArray, self.metaStoreName);
            setupIndexes(self);
            // callInitializerIfNeeded(database, self, [].concat(indexRequestArray), callback, errorCallback);
            fullproof.call_new_thread(callInitializerIfNeeded, database, self, [].concat(indexRequestArray), callback, errorCallback);
        }

        this.indexRequests = reqIndexArray;

        var openRequest = fullproof.store.indexedDB.open(this.dbName, this.dbVersion);
        openRequest.onerror = function() {
            errorCallback();
        };
        openRequest.onsuccess = function(ev) {
            self.database = ev.result || ev.target.result;

            if (self.database.version !== undefined && self.database.setVersion && self.database.version != self.dbVersion) {
                var versionreq = self.database.setVersion(self.dbVersion);
                versionreq.onerror = fullproof.make_callback(errorCallback, "Can't change version with setVersion(" +self.dbVersion+")");
                versionreq.onsuccess = function(ev) {
                    createStores(self.database, reqIndexArray, self.metaStoreName);
                    checkInit(self, self.database, self.indexRequests,
                        function() {
                            callback(indexArrayResult);
                        }, errorCallback);
                }
            } else {
                checkInit(self, self.database, self.indexRequests, fullproof.make_callback(callback, indexArrayResult), errorCallback);
            }
        };
        openRequest.onupgradeneeded = function(ev) {
            createStores(ev.target.result, reqIndexArray, self.metaStoreName);
            updated = true;
        };

    };


    fullproof.store.IndexedDBStore.prototype.close = function (callback) {
        callback();
    };

    fullproof.store.IndexedDBStore.prototype.getIndex = function(name) {
        return this.stores[name];
    };

})(window || {});

module("Stores");

function init_store(store, capabilities, indexReqArray, indexName, injectScoredEntryResultSet, callback) {
	store.close(function() {
		store.open(capabilities, indexReqArray, function() {
			if (indexName) {
				var index = store.getIndex(indexName);
				index.clear(function() {
					if (injectScoredEntryResultSet) {
						var synchro_inject = fullproof.make_synchro_point(fullproof.make_callback(callback, index), injectScoredEntryResultSet.getSize());
						injectScoredEntryResultSet.forEach(function(el) {
							index.inject(el.key, injectScoredEntryResultSet.useScore?new fullproof.ScoredElement(el.value, el.score):el.value, synchro_inject);
						});
					} else {
						callback(index);
					}
				});
			} else {
				callback();
			}
		}, fullproof.thrower("Can't open store"));
	});
}

function build_store_test(name, store, dataGenerator, useScore) {

	var caps = new fullproof.Capabilities().setUseScores(useScore);
	
	test(name+"_clear", function() {
		expect(2);
		QUnit.stop();
		var indexReq = new fullproof.IndexRequest("test", caps);
		init_store(store, caps, [indexReq], indexReq.name, undefined, function(index) {
			ok(!!index);
			index.lookup("key", function(val) {
				//deepEqual(val, []);
				val.testEquals([]);
				QUnit.start();
			});
		});
	});

	test(name+"_clear_invalid_callback", function() {
		expect(1);
		QUnit.stop();
		try {
			
			var indexReq = new fullproof.IndexRequest("test", caps);
			
			init_store(store, caps, [indexReq], indexReq.name, undefined, function(index) {
				var index = store.getIndex("test");
				index.clear();
				index.clear(undefined);
				index.clear(false);
				ok(true);
				QUnit.start();
			});
		} catch(e) {
			ok(false);
		}
	});

	test(name+"_data_injection", function() {
		var dataset = fullproof.tests.makeResultSetOfScoredEntries(10,100);
		dataset.useScore = useScore;

		var results = {}; 
		dataset.forEach(function(e) {
			results[e.key] = [new fullproof.ScoredElement(e.value,e.score)];
		});
		
		expect(1 + dataset.getSize()* (useScore?2:1));
		QUnit.stop();
		var indexReq = new fullproof.IndexRequest("test", caps);
		init_store(store, caps, [indexReq], indexReq.name, dataset, function(index) {
			var rset = new fullproof.ResultSet().merge(dataset);
			var verifier = function(res) {
				console.log("VERIFIER",res);
				equal(dataset.getSize(), res.length);
				for (var i=0; i<res.length; ++i) {
					if (useScore) {
						equal(res[i].getDataUnsafe()[0].value, dataset.getDataUnsafe()[i].value);
						equal(res[i].getDataUnsafe()[0].score, dataset.getDataUnsafe()[i].score);
					} else {
						equal(res[i].getDataUnsafe()[0], dataset.getDataUnsafe()[i].value);
					}
				}
				QUnit.start();
			};
			
			var verif_synchro = fullproof.make_synchro_point(verifier, dataset.getSize());
			
			dataset.forEach(function(o) {
				index.lookup(o.key?o.key:o, verif_synchro);
				
			});
		});
		
	});
	
	if (useScore) {
		function mktest_score(value) {
			test(name+"_test_score_"+value, function() {
				expect(4);
				QUnit.stop();
				var result = false;
				
				var indexReq = new fullproof.IndexRequest("test", caps);
				
				store.close(function() {
					store.open(caps, [indexReq], function() {
						var index = store.getIndex("test");
						index.clear(function() {
							index.inject("key", new fullproof.ScoredElement("value", value), function() {
								index.lookup("key", function(val) {
									//deepEqual(val, []);
									var arr = val.getDataUnsafe();
									equal(val.getSize(),1);
									equal(arr.length,1);
									equal(arr[0].value, "value");
									equal(arr[0].score, value);
									QUnit.start();
								});
							});
						});
					});
				});
			});
		}
		mktest_score(0);
		mktest_score(1);
		mktest_score(123.456);
	}

	
	test(name+"_data_bulk_injection", function() {
		var dataset = fullproof.tests.makeResultSetOfScoredEntries(1000,100000);
		var keys = [];
		dataset.useScore = useScore;

		var results = {}; 
		dataset.forEach(function(e) {
			keys.push(e.key);
			results[e.key] = [new fullproof.ScoredElement(e.value,e.score)];
		});
		
		expect(1 + dataset.getSize()* (useScore?2:1));
		QUnit.stop();
		var indexReq = new fullproof.IndexRequest("test", caps);
		init_store(store, caps, [indexReq], indexReq.name, false, function(index) {
			
			index.injectBulk(keys, [].concat(dataset.getDataUnsafe()), function() {
				setTimeout(function() {
					var lookup_synchro = fullproof.make_synchro_point(function(res) {
						equal(dataset.getSize(), res.length);
						for (var i=0; i<res.length; ++i) {
							if (useScore) {
								equal(res[i].getDataUnsafe()[0].value, dataset.getDataUnsafe()[i].value);
								equal(res[i].getDataUnsafe()[0].score, dataset.getDataUnsafe()[i].score);
							} else {
								equal(res[i].getDataUnsafe()[0], dataset.getDataUnsafe()[i].value);
							}
						}
						QUnit.start();
					}, dataset.getSize());
					
					dataset.forEach(function(o) {
						index.lookup(o.key?o.key:o, lookup_synchro);
					});
				}, 1);

			});
			
		});
		
	});

	
}

function mkDataGenerator(integerValueOnly) {
	return function(count, overlap) {
		var set1 = integerValueOnly?fullproof.tests.makeResultSetOfScoredEntries(count,100*count):fullproof.tests.makeResultSetOfScoredEntriesObjects(count);
		var set2 = integerValueOnly?fullproof.tests.makeResultSetOfScoredEntries(overlap?count/2:count,100*count):fullproof.tests.makeResultSetOfScoredEntriesObjects(overlap?count/2:count);
		var set3 = new ResultSet;
		if (overlap) {
			set3 = integerValueOnly?fullproof.tests.makeResultSetOfScoredEntries(overlap?count/2:count,100*count):fullproof.tests.makeResultSetOfScoredEntriesObjects(overlap?count/2:count);
			set2.merge(set3);
		}
		var merged = new fullproof.ResultSet().merge(set1,set2);
		var expected = [];
		merged.forEach(function(e) {expected.push([e]);});
		return {
			set1: set1, 
			set2: set2,
			expected: expected
		}
	}	
}

build_store_test("memory_noscore_integers", new fullproof.store.MemoryStore, mkDataGenerator(true), false);
build_store_test("memory_score_integers", new fullproof.store.MemoryStore, mkDataGenerator(true), true);
build_store_test("memory_score_objects", new fullproof.store.MemoryStore, mkDataGenerator(false), true);
build_store_test("memory_noscore_objects", new fullproof.store.MemoryStore, mkDataGenerator(false), true);

var params = new fullproof.Capabilities().setDbName("fullprooftest").setDbSize(1024*1024*1);
var sqlstore = new fullproof.store.WebSQLStore();
build_store_test("websql_noscore_integers", sqlstore, mkDataGenerator(true), false);
build_store_test("websql_score_integers", sqlstore, mkDataGenerator(true), true);
build_store_test("websql_noscore_objects", sqlstore, mkDataGenerator(true), false);
build_store_test("websql_score_objects", sqlstore, mkDataGenerator(true), true);


var idbstore = new fullproof.store.IndexedDBStore();
idbstore.dbName = "test1";
build_store_test("indexedDB_noscore_integers", idbstore, mkDataGenerator(true), false);
build_store_test("indexedDB_score_integers", idbstore, mkDataGenerator(true), true);
build_store_test("indexedDB_noscore_objects", idbstore, mkDataGenerator(true), false);
build_store_test("indexedDB_score_objects", idbstore, mkDataGenerator(true), true);

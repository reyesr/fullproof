module("Stores");

test("noop", function() {
	ok(true);
});

function build_store_test(name, store, dataGenerator, useScore) {

	var caps = new fullproof.Capabilities().setUseScores(useScore);
	
	test(name+"_clear", function() {
		expect(1);
		QUnit.stop();
		var result = false;
		
		store.openIndex("test", caps, false, function(index) {
			index.clear(function() {
				index.inject("key", "value", function() {
					index.clear(function() {
						index.lookup("key", function(val) {
							//deepEqual(val, []);
							val.testEquals([]);
							QUnit.start();
						});
					});
				});
			});	
		});
	});

	test(name+"_clear_invalid_callback", function() {
		expect(1);
		QUnit.stop();
		try {
			store.openIndex("test_clear", caps, false, function(index) {
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
		console.log("DATASET", dataset);
		var results = {}; 
		dataset.forEach(function(e) {
			results[e.key] = [new fullproof.ScoredElement(e.value,e.score)];
		});
		
		expect(1 + dataset.getSize()* (useScore?2:1));
		QUnit.stop();
		
		store.openIndex("test_clear", caps, false, function(index) {
			index.clear(function() {
				
				var synchro_inject = fullproof.make_synchro_point(function(args) {
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
					
				}, dataset.getSize());
				
				dataset.forEach(function(el) {
					index.inject(el.key, useScore?new fullproof.ScoredElement(el.value, el.score):el.value, synchro_inject);
				});
//				console.log(dataset.toString());
			});
		});		
	});
	
	if (useScore) {
		
		test(name+"_test_score_zero", function() {
			expect(4);
			QUnit.stop();
			var result = false;
			store.openIndex("test_clear", caps, false, function(index) {
				index.clear(function() {
					index.inject("key", new fullproof.ScoredElement("value", 0), function() {
						index.lookup("key", function(val) {
							//deepEqual(val, []);
							var arr = val.getDataUnsafe();
							equal(val.getSize(),1);
							equal(arr.length,1);
							equal(arr[0].value, "value");
							equal(arr[0].score, 0);
							QUnit.start();
						});
					});
				});
			});
		});
	}

	
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

//build_store_test("memory_noscore_integers", new fullproof.store.MemoryStore, mkDataGenerator(true), false);
//build_store_test("memory_score_integers", new fullproof.store.MemoryStore, mkDataGenerator(true), true);
//build_store_test("memory_score_objects", new fullproof.store.MemoryStore, mkDataGenerator(false), true);
//build_store_test("memory_noscore_objects", new fullproof.store.MemoryStore, mkDataGenerator(false), true);

var params = new fullproof.Capabilities().setDbName("fullprooftest").setDbSize(1024*1024*1);
var sqldb = (new fullproof.store.WebSQLStore());
sqldb.openStore(params, function(store) {
	build_store_test("websql_noscore_integers", store, mkDataGenerator(true), false);
	build_store_test("websql_score_integers", store, mkDataGenerator(true), true);
	build_store_test("websql_noscore_objects", store, mkDataGenerator(true), false);
	build_store_test("websql_score_objects", store, mkDataGenerator(true), true);
});

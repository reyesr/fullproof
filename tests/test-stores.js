module("Stores");

function resultSetEqual(a,b) {
	a = (a instanceof fullproof.ResultSet)?a.getDataUnsafe():a;
	b = (b instanceof fullproof.ResultSet)?b.getDataUnsafe():b;
	deepEqual(a,b);
}

var genericComparator = {
	lower_than: function(a,b) {
		if (typeof a == "object") {
			return a.id < b.id;
		} else {
			return parseInt(a.id) < parseInt(b.id);
		}
	},
	equals: function(a,b) {
		if (typeof a == "object") {
			return a.id == b.id;
		} else {
			return a.id == b.id;
		}
	}
};

function test_specific_key(store, key, expectedValue) {
	QUnit.stop();
	store.lookup(key, function(val) {
		equal(val, expectedValue);
		QUnit.start();
	});
}

function inject_object_data(store, obj, callback) {
	for (var k in obj) {
		if (obj[k]) {
			var val = obj[k];
			delete obj[k];
			console.log("injecting " + k + " / " + val);
			return store.inject(k,val, function() {
				inject_object_data(store,obj,callback);
			});
		}
	}
	return callback();
}

function check_object_data_lookup(store, obj, callback) {
	for (var k in obj) {
		if (obj[k]) {
			var key = k;
			var val = obj[key];
			delete obj[key];
			return store.lookup(key, function(res) {
				console.log("checking " + k + " / " + val + " / " + res);
				resultSetEqual(val,res);
				
				check_object_data_lookup(store,obj,callback);
			});
		}
	}
	console.log("check object ended, now callback()")
	return callback();
}


function build_store_test(name, store, primaryValuesOnly) {
	
	test(name+"_clear", function() {
		QUnit.stop();
		var result = false;
		store.clear(function() {
			store.inject("key", "value", function() {
				store.clear();
				var value = store.lookup("key", function(val) {
					//deepEqual(val, []);
					resultSetEqual(val,[]);
					QUnit.start();
				});
			});
		});	
	});

	test(name+"_clear_invalid_callback", function() {
		try {
			store.clear(); // Call without callback
			ok(true);
		} catch(e) {
			ok(false);
		}
	});

	function test_data(subname, dataset1, dataset2, resultdataset) {
		var count = 0;
		for (var k in resultdataset) {
			++count;
		}
		test(name+"_inject_"+subname, function() {
			expect(1 + count);
			QUnit.stop();
			store.clear(function() {
				inject_object_data(store, dataset1, function() {
					inject_object_data(store, dataset2, function() {
						check_object_data_lookup(store, resultdataset, function() {
							ok(true);
							QUnit.start();
						});
					});
				});
			});
		});
	}
	
	test_data("integer_nooverlap", {one:1,two:2}, {three:3}, {one:[1], two:[2], three:[3]})
//	test_data("integer_overlap", {one:1,two:2,three:3,four:4}, {two:22,three:33,five:5}, {one:[1], two:[2,22], three:[3,33], four:[4], five:[5]})
	if (!primaryValuesOnly) {
		test_data("objects", {one:{id:1},two:{id:2},three:{id:3},four:{id:4}}, {two:{id:22},three:{id:33},five:{id:5}}, 
				 {one:[{id:1}], two:[{id:2},{id:22}], three:[{id:3},{id:33}], four:[{id:4}], five:[{id:5}]})
	}
	
	
}


build_store_test("memory", new fullproof.store.MemoryStore(genericComparator));

test("creating websql store", function() {
	var websql = new fullproof.store.WebSQLStore();
	expect(2);
	QUnit.stop();
	ok(websql);
	websql.open("testdb", "testtable", 1024*1024, function(res) {
		ok(res);
		if (res) {
			build_store_test("websql", websql, true);	
		}
		QUnit.start();
	});
});


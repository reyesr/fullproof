module("StoreManager");

function makeFakeStore(caps) {

    function Index(name) {
        "use strict";
        this.name = name;
    }

	if (!(this instanceof makeFakeStore)) {
		return new makeFakeStore(caps);
	}
	caps.setAvailable(true);
	var result = function() {
        this.indexes = {};
		this.open = function(caps, reqIndexArray, callback, errorCallback) {
            var ia = [];
            for (var i=0; i<reqIndexArray.length; ++i) {
                var index = new Index(reqIndexArray[i].name);
                ia.push(index);
                this.indexes[index.name] = index;
            }
			callback(ia);
		};
		this.close = function(callback) {
			callback();
		};
        this.getIndex = function(name) {
            return this.indexes[name];
        }
    };
	result.getCapabilities = function() {
		return caps;
	}
	return result;
}

function create_findstore_test(name, sequence, capabilities, expectedOffset) {

	test("find_a_store_" + name, function() {
		var manager = new fullproof.StoreManager(sequence);
		expect(4);
		QUnit.stop();
		manager.addIndex(new fullproof.IndexRequest(name, capabilities, function(index,cb) {console.log("initializer"); cb(); }));
		manager.openIndexes(function(stores) {
			console.log("indexes", stores);
			ok(stores !== false);
			ok(stores.length == 1);
            var index = stores[0].getIndex(name);
            ok(index);
            equal(index.storeName, sequence[expectedOffset].name);
			QUnit.start();
		});
	});
	
}

var fakeStore_empty = makeFakeStore(new fullproof.Capabilities() );
var fakeStore_score_object_volatile = makeFakeStore(new fullproof.Capabilities().setVolatile(true).setUseScores([false,true]).setStoreObjects([false,true]));
var fakeStore_noscore_noobject_novolatile = makeFakeStore(new fullproof.Capabilities().setUseScores([true, false]).setStoreObjects(false).setVolatile(false));
var fakeStore_score_object = makeFakeStore(new fullproof.Capabilities().setUseScores(true).setStoreObjects(true));
var fakeStore_score_noobject_novolatile = makeFakeStore(new fullproof.Capabilities().setUseScores([true,false]).setStoreObjects(false).setVolatile(false));
var fakeStore_score_object_novolatile = makeFakeStore(new fullproof.Capabilities().setUseScores([true,false]).setStoreObjects([true,false]).setVolatile(false));

var fakestore_seq1 = [
                      new fullproof.StoreDescriptor("fakeStore_score_object_novolatile", fakeStore_score_object_novolatile),
                      new fullproof.StoreDescriptor("fakeStore_score_object_volatile", fakeStore_score_object_novolatile),
                      new fullproof.StoreDescriptor("fakeStore_noscore_noobject_novolatile", fakeStore_noscore_noobject_novolatile),
                      new fullproof.StoreDescriptor("fakeStore_score_noobject_novolatile", fakeStore_score_noobject_novolatile),
                      
                      new fullproof.StoreDescriptor("fakeStore_score_object", fakeStore_score_object),
                      new fullproof.StoreDescriptor("fakeStore_empty", fakeStore_empty)
                      ];

var fakestore_seq2 = [
                      new fullproof.StoreDescriptor("fakeStore_empty", fakeStore_empty),
                      new fullproof.StoreDescriptor("fakeStore_score_object_volatile", fakeStore_score_object_novolatile),
                      new fullproof.StoreDescriptor("fakeStore_noscore_noobject_novolatile", fakeStore_noscore_noobject_novolatile),
                      new fullproof.StoreDescriptor("fakeStore_score_object_novolatile", fakeStore_score_object_novolatile),
                      new fullproof.StoreDescriptor("fakeStore_score_noobject_novolatile", fakeStore_score_noobject_novolatile),
                      new fullproof.StoreDescriptor("fakeStore_score_object", fakeStore_score_object)
                      ];

var fakestore_seq3 = [
                      new fullproof.StoreDescriptor("fakeStore_score_object_volatile", fakeStore_score_object_novolatile),
                      new fullproof.StoreDescriptor("fakeStore_empty", fakeStore_empty),
                      new fullproof.StoreDescriptor("fakeStore_noscore_noobject_novolatile", fakeStore_noscore_noobject_novolatile),
                      new fullproof.StoreDescriptor("fakeStore_score_object_novolatile", fakeStore_score_object_novolatile),
                      new fullproof.StoreDescriptor("fakeStore_score_noobject_novolatile", fakeStore_score_noobject_novolatile),
                      new fullproof.StoreDescriptor("fakeStore_score_object", fakeStore_score_object)
                      ];

var caps_empty = new fullproof.Capabilities();
create_findstore_test("empty1", fakestore_seq1, caps_empty, 0);
create_findstore_test("empty2", fakestore_seq2, caps_empty, 0);

var caps_score_objects =  new fullproof.Capabilities().setUseScores(true).setStoreObjects(true).setComparatorObject({});
create_findstore_test("object and score 1", fakestore_seq1, caps_score_objects, 0);
create_findstore_test("object and score 2", fakestore_seq2, caps_score_objects, 1);
create_findstore_test("object and score 3", fakestore_seq3, caps_score_objects, 0);

var caps_noscore_objects =  new fullproof.Capabilities().setUseScores(false).setStoreObjects(true).setComparatorObject({});
create_findstore_test("object no score 1", fakestore_seq1, caps_score_objects, 0);
create_findstore_test("object no score 2", fakestore_seq2, caps_score_objects, 1);
create_findstore_test("object no score 3", fakestore_seq3, caps_score_objects, 0);

var caps_noscore_noobjects_novolatile =  new fullproof.Capabilities().setUseScores(false).setStoreObjects(false).setVolatile(false).setComparatorObject({});
create_findstore_test("no score no object no volatile 1", fakestore_seq1, caps_noscore_noobjects_novolatile, 0);
create_findstore_test("no score no object no volatile 2", fakestore_seq2, caps_noscore_noobjects_novolatile, 1);
create_findstore_test("no score no object no volatile 3", fakestore_seq3, caps_noscore_noobjects_novolatile, 0);

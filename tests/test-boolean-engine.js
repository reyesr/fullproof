
var corpus = {
		1: "first line of data",
		2: "second line",
		3: "third line of data",
		4: "four in a row of data",
		5: "high five"
};

function initializerFunc(injector, callback) {
	var synchro = fullproof.make_synchro_point(callback, 5);
	for (var k in corpus) {
		injector.inject(corpus[k], k, synchro);
	}
} 

test("create boolean engine no index", function() {
	var engine = new fullproof.BooleanEngine();
	expect(1);
	QUnit.stop();
	engine.open(fullproof.tests.success_restart, fullproof.tests.error_restart);
});

test("clear index", function() {
	var engine = new fullproof.BooleanEngine();
	expect(1);
	QUnit.stop();
	engine.addIndex("myindex", new fullproof.StandardAnalyzer, new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), initializerFunc);
	engine.open(function() {
		var index = engine.getIndex("myindex");
		index.clear(function() {
			index.lookup("third", function(resultset) {
				equal(resultset, false);
				QUnit.start();
			});
		});
	}, fullproof.tests.error_restart);
});

test("create one index", function() {
	var engine = new fullproof.BooleanEngine();
	QUnit.stop();
	engine.addIndex("myindex", new fullproof.StandardAnalyzer, new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), initializerFunc);
	engine.open(function() {
		var index = engine.getIndex("myindex");
		ok(!!index);
		engine.clear(function() {
			engine.injectDocument("third", 45, function() {
				engine.lookup("third", function(resultset) {
					ok(!!resultset);
					equal(resultset.getSize(), 1);
					equal(parseInt(resultset.getItem(0)), 45);
					ok(!!resultset);
					QUnit.start();
				});
			});
		});
	});
});

test("create index intersect 1", function() {
	var engine = new fullproof.BooleanEngine();
	QUnit.stop();
	engine.addIndex("myindex", 
			new fullproof.StandardAnalyzer, 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
			initializerFunc);
	engine.open(function() {
		var index = engine.getIndex("myindex");
		ok(!!index);
		engine.lookup("line", function(resultset) {
			ok(!!resultset);
			equal(resultset.getSize(), 3);
			equal(parseInt(resultset.getItem(0)), 1);
			equal(parseInt(resultset.getItem(1)), 2);
			equal(parseInt(resultset.getItem(2)), 3);
			ok(!!resultset);
			QUnit.start();
		});
	});
});

test("create index intersect 2", function() {
	var engine = new fullproof.BooleanEngine();
	QUnit.stop();
	engine.addIndex("myindex", 
			new fullproof.StandardAnalyzer, 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
			initializerFunc); 
	engine.open(function(index) {
		ok(!!index);
		
		engine.lookup("data line", function(resultset) {
			ok(!!resultset);
			equal(resultset.getSize(), 2);
			equal(parseInt(resultset.getItem(0)), 1);
			equal(parseInt(resultset.getItem(1)), 3);
			ok(!!resultset);
			QUnit.start();
		});
	});
});

test("create index union 1", function() {
	var engine = new fullproof.BooleanEngine();
	engine.booleanMode = fullproof.BooleanEngine.CONST_MODE_UNION;
	QUnit.stop();
	engine.addIndex("myindex", 
			new fullproof.StandardAnalyzer, 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
			initializerFunc); 
	engine.open(function(index) {
		ok(!!index);
		
		engine.lookup("data line", function(resultset) {
			ok(!!resultset);
			equal(resultset.getSize(), 4);
			equal(parseInt(resultset.getItem(0)), 1);
			equal(parseInt(resultset.getItem(1)), 2);
			equal(parseInt(resultset.getItem(2)), 3);
			equal(parseInt(resultset.getItem(3)), 4);
			ok(!!resultset);
			QUnit.start();
		});
	});
});
//
test("create index union 2", function() {
	var engine = new fullproof.BooleanEngine();
	engine.booleanMode = fullproof.BooleanEngine.CONST_MODE_UNION;
	QUnit.stop();
	engine.addIndex("myindex", 
			new fullproof.StandardAnalyzer, 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
			initializerFunc); 
	engine.open(function(index) {
		ok(!!index);
		
		engine.lookup("high row", function(resultset) {
			ok(!!resultset);
			equal(resultset.getSize(), 2);
			equal(parseInt(resultset.getItem(0)), 4);
			equal(parseInt(resultset.getItem(1)), 5);
			ok(!!resultset);
			QUnit.start();
		});
	});
});

function normalizer_firstletteronly(word, callback) {
	word = word.substring(0,1);
	return callback?callback(word):word;
};

test("create two index", function() {
	var engine = new fullproof.BooleanEngine();
	QUnit.stop();
	engine.addIndex("myindex", 
			new fullproof.StandardAnalyzer, 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
			initializerFunc);
	engine.addIndex("myindex2", 
			new fullproof.StandardAnalyzer(normalizer_firstletteronly),
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
			initializerFunc);
	engine.open(function(index) {
		ok(!!index);
		engine.lookup("thaaa", function(resultset) {
			ok(!!resultset);
			equal(resultset.getSize(), 1);
			equal(parseInt(resultset.getItem(0)), 3);
			ok(!!resultset);
			QUnit.start();
		});
	});
});

test("create two index", function() {
	var engine = new fullproof.BooleanEngine();
	engine.booleanMode = fullproof.BooleanEngine.CONST_MODE_UNION;
	QUnit.stop();
	engine.addIndex("myindex", 
			new fullproof.StandardAnalyzer, 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
			initializerFunc);
	engine.addIndex("myindex2", 
			new fullproof.StandardAnalyzer(normalizer_firstletteronly), 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
			initializerFunc);
	engine.open(function(index) {
		ok(!!index);
		engine.lookup("thaaa duck", function(resultset) {
			ok(!!resultset);
			equal(resultset.getSize(), 3);
			equal(parseInt(resultset.getItem(0)), 1);
			equal(parseInt(resultset.getItem(1)), 3);
			equal(parseInt(resultset.getItem(2)), 4);
			ok(!!resultset);
			QUnit.start();
		});
	});
});

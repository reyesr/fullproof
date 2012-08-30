
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
		injector(corpus[k], k, synchro);
	}
} 

test("create boolean engine", function() {
	var engine = new fullproof.BooleanEngine();
	expect(1);
	QUnit.stop();
	engine.clear(function() {
		ok(!!engine);
		QUnit.start();
	});
});

test("clear index", function() {
	var engine = new fullproof.BooleanEngine();
	expect(1);
	QUnit.stop();
	engine.addIndex("myindex", 
			new fullproof.StandardAnalyzer, 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
			initializerFunc, 
			function(index) {
		engine.clear(function() {
			engine.lookup("third", function(resultset) {
				equal(resultset, false);
				QUnit.start();
			});
		});
	});
});

test("create one index", function() {
	var engine = new fullproof.BooleanEngine();
	QUnit.stop();
	engine.addIndex("myindex", 
			new fullproof.StandardAnalyzer, 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
			initializerFunc, 
			function(index) {
		ok(!!index);
		
		engine.lookup("third", function(resultset) {
			ok(!!resultset);
			equal(resultset.getSize(), 1);
			equal(parseInt(resultset.getItem(0)), 3);
			ok(!!resultset);
			QUnit.start();
		});
	});
});

test("create index intersect 1", function() {
	var engine = new fullproof.BooleanEngine();
	QUnit.stop();
	engine.addIndex("myindex", 
			new fullproof.StandardAnalyzer, 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
			initializerFunc, 
			function(index) {
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
			initializerFunc, 
			function(index) {
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
	engine.booleanMode = fullproof.CONST_MODE_UNION;
	QUnit.stop();
	engine.addIndex("myindex", 
			new fullproof.StandardAnalyzer, 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
			initializerFunc, 
			function(index) {
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

test("create index union 2", function() {
	var engine = new fullproof.BooleanEngine();
	engine.booleanMode = fullproof.CONST_MODE_UNION;
	QUnit.stop();
	engine.addIndex("myindex", 
			new fullproof.StandardAnalyzer, 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
			initializerFunc, 
			function(index) {
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

function normalizer_firstletter(word, callback) {
	word = word.substring(0,1);
	return callback?callback(word):word;
};

test("create two index", function() {
	var engine = new fullproof.BooleanEngine();
	QUnit.stop();
	engine.addIndex("myindex", 
			new fullproof.StandardAnalyzer, 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
			initializerFunc, 
			function(index) {
		ok(!!index);

		engine.addIndex("myindex2", 
				new fullproof.StandardAnalyzer(normalizer_firstletter), 
				new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
				initializerFunc, 
				function(index) {

			engine.lookup("thaaa", function(resultset) {
				ok(!!resultset);
				equal(resultset.getSize(), 1);
				equal(parseInt(resultset.getItem(0)), 3);
				ok(!!resultset);
				QUnit.start();
			});

		});
		
	});
});

test("create two index", function() {
	var engine = new fullproof.BooleanEngine();
	engine.booleanMode = fullproof.CONST_MODE_UNION;
	QUnit.stop();
	engine.addIndex("myindex", 
			new fullproof.StandardAnalyzer, 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
			initializerFunc, 
			function(index) {
		ok(!!index);

		engine.addIndex("myindex2", 
				new fullproof.StandardAnalyzer(normalizer_firstletter), 
				new fullproof.Capabilities().setStoreObjects(false).setUseScores(false), 
				initializerFunc, 
				function(index) {

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
});

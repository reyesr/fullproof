
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

test("create scoring engine clear empty", function() {
	var engine = new fullproof.ScoringEngine();
	expect(1);
	QUnit.stop();
	engine.clear(function() {
		ok(!!engine);
		QUnit.start();
	});
});

test("clear index", function() {
	var engine = new fullproof.ScoringEngine();
	expect(1);
	QUnit.stop();
	engine.addIndex("myindex", 
			new fullproof.ScoringAnalyzer, 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(true).setComparatorObject(fullproof.ScoredElement.comparatorObject), 
			initializerFunc);
	engine.open(function(index) {
		engine.clear(function() {
			engine.lookup("third", function(resultset) {
				equal(resultset, false);
				QUnit.start();
			});
		});
	});
});

test("create one index", function() {
	var engine = new fullproof.ScoringEngine();
	QUnit.stop();
	engine.addIndex("myindex", 
			new fullproof.ScoringAnalyzer, 
			new fullproof.Capabilities().setStoreObjects(false).setUseScores(true).setComparatorObject(fullproof.ScoredElement.comparatorObject), 
			initializerFunc);
	engine.open(function(index) {
		ok(!!index);
		
		engine.lookup("third", function(resultset) {
			ok(!!resultset);
			equal(resultset.getSize(), 1);
			equal(parseInt(resultset.getItem(0).value), 3);
			ok(!!resultset);
			QUnit.start();
		});
	});
});

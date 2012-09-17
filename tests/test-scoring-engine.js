var corpus = {
		1: "first line of data",
		2: "second line",
		3: "third line of data",
		4: "four in a row of data",
		5: "high five"
};

var ScoreTestAnalyzer = function() {
    // Stores the normalizers... (don't store arguments, as it contains more than an array)
    var analyzer = new fullproof.StandardAnalyzer([]);
    this.provideScore = true;

    this.parse = function (text, callback) {
        var words = {};
        var wordcount = 1;
        var self = this;
        analyzer.parse(text, function (word) {
            if (word !== false) {
                if (words[word] === undefined || words[word].constructor !== Array) {
                    words[word] = [];
                }
                words[word].push(wordcount++);
            } else {
                // Evaluate the score for each word
                for (var w in words) {
                    var res = words[w];
                    var score = 0;
                    for (var i = 0; i < res.length; ++i) {
                        score += res[i];
                    }
                    callback(new fullproof.ScoredEntry(w, undefined, score));
                }
                callback(false);
            }
        });
    };
}
ScoreTestAnalyzer.prototype = new fullproof.AbstractAnalyzer();

function initializerFunc(injector, callback) {
	var synchro = fullproof.make_synchro_point(callback, 5);
	for (var k in corpus) {
		injector.inject(corpus[k], k, synchro);
	}
} 

function init_engine(indexes, callback) {
    var engine = new fullproof.ScoringEngine([new fullproof.StoreDescriptor("memorystore", fullproof.store.MemoryStore)]);
    engine.open(indexes, function() {
       callback(engine);
    });
}

test("create scoring engine clear empty", function() {
	expect(1);
	QUnit.stop();
    init_engine([], function(engine) {
        ok(!!engine);
        QUnit.start();
    });
});

test("check initializer", function() {
    var engine = new fullproof.ScoringEngine();
    expect(1);
    QUnit.stop();

    var index1 = new fullproof.IndexUnit("myindex",
        new fullproof.Capabilities().setStoreObjects(false).setUseScores(true).setComparatorObject(fullproof.ScoredElement.comparatorObject),
        new fullproof.ScoringAnalyzer(),
        initializerFunc);

    init_engine(index1, function(engine) {
        engine.lookup("third", function(resultset) {
            equal(resultset.getSize(), 1);
            QUnit.start();
        });
    });
});


test("clear index", function() {
	var engine = new fullproof.ScoringEngine();
	expect(1);
	QUnit.stop();

    var index1 = new fullproof.IndexUnit("myindex",
        new fullproof.Capabilities().setStoreObjects(false).setUseScores(true).setComparatorObject(fullproof.ScoredElement.comparatorObject),
        new fullproof.ScoringAnalyzer(),
        initializerFunc);

    init_engine(index1, function(engine) {
        engine.clear(function() {
            "use strict";
            engine.lookup("third", function(resultset) {
                equal(resultset, false);
                QUnit.start();
            });
        });
    });
});

test("create one index", function() {
    QUnit.stop();

    var index1 = new fullproof.IndexUnit("myindex",
        new fullproof.Capabilities().setStoreObjects(false).setUseScores(true).setComparatorObject(fullproof.ScoredElement.comparatorObject),
        new fullproof.ScoringAnalyzer(),
        initializerFunc);

    init_engine(index1, function(engine) {
        var i = engine;
        engine.lookup("third", function(resultset) {
            console.log(i);
            ok(!!resultset);
            equal(resultset.getSize(), 1);
            equal(parseInt(resultset.getItem(0).value), 3);
            QUnit.start();
        });
    });
});

test("test score modifier default", function() {
    QUnit.stop();

    var index1 = new fullproof.IndexUnit("myindex",
        new fullproof.Capabilities().setStoreObjects(false).setUseScores(true).setComparatorObject(fullproof.ScoredElement.comparatorObject),
        new ScoreTestAnalyzer(),
        initializerFunc);

    init_engine(index1, function(engine) {
        var i = engine;
        engine.lookup("third", function(resultset) {
            console.log(i);
            ok(!!resultset);
            equal(resultset.getSize(), 1);
            equal(parseInt(resultset.getItem(0).value), 3);
            equal(parseInt(resultset.getItem(0).score), 1);

            engine.lookup("line", function(resultset) {
                ok(!!resultset);
                equal(resultset.getSize(), 3);
                // need to make more tests on the scores here
                QUnit.start();
            });
        });
    });
});

test("test score modifier double", function() {
    QUnit.stop();

    var index1 = new fullproof.IndexUnit("myindex",
        new fullproof.Capabilities().setStoreObjects(false).setUseScores(true).setComparatorObject(fullproof.ScoredElement.comparatorObject).setScoreModifier(2),
        new ScoreTestAnalyzer(),
        initializerFunc);

    init_engine(index1, function(engine) {
        var i = engine;
        engine.lookup("third", function(resultset) {
            console.log(i);
            ok(!!resultset);
            equal(resultset.getSize(), 1);
            equal(parseInt(resultset.getItem(0).value), 3);
            equal(parseInt(resultset.getItem(0).score), 2);
            QUnit.start();
        });
    });
});

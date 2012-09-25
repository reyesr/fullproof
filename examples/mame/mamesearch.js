var MameSearch = (function(){
	
	var engine = new fullproof.ScoringEngine();
	var data = [];
	var dbName = "mamelist";
	
	function makeInitializer(progressCallback) {
		return function(injector, callback) {
			var synchro = fullproof.make_synchro_point(callback, data.length-1);
			var values = [];
			for (var i=0;i<data.length; ++i) {
				values.push(i);
			}
            injector.injectBulk(data, values, callback, progressCallback);
		}
	}


    /**
     * Starts the MameSearch search engine
     * @param callback called when the search engine is ready
     * @param progress if the indexes need to be initialized, this function is called with the progress value, ranging from 0 to 1.
     */
    this.start = function(callback, progress) {

        var loader = new fullproof.DataLoader();
		loader.setQueue("mamegames.txt");
		loader.start(function() {

            var index1 = new fullproof.IndexUnit("normalindex",
                new fullproof.Capabilities().setStoreObjects(false).setUseScores(true).setDbName(dbName).setComparatorObject(fullproof.ScoredEntry.comparatorObject).setDbSize(8*1024*1024),
                new fullproof.ScoringAnalyzer(fullproof.normalizer.to_lowercase_nomark, fullproof.normalizer.remove_duplicate_letters),
                makeInitializer(function(val) { progress(val/2); }));

            var index2 = new fullproof.IndexUnit("stemmedindex",
                new fullproof.Capabilities().setStoreObjects(false).setUseScores(true).setDbName(dbName).setComparatorObject(fullproof.ScoredEntry.comparatorObject).setDbSize(8*1024*1024),
                new fullproof.ScoringAnalyzer(fullproof.normalizer.to_lowercase_nomark, fullproof.english.metaphone),
                makeInitializer(function(val){progress(val/2 + 0.5);}));

            engine.open([index1, index2], fullproof.make_callback(callback, true), fullproof.make_callback(callback, false));

		}, function(txt, file) { data = txt.split("\n"); }, 
		 function() { console && console.log && console.log("ERROR");});
		
	}

	this.lookup = function(txt, callback) {
		engine.lookup(txt, function(resultset) {

			if (!resultset) {
				return "no match.";
			}
			
			resultset.setComparatorObject({
				lower_than: function(a,b) {
					return a.score > b.score;
				},
				equals: function(a,b) {
					return a.score === b.score;
				}
			});
			
			var result = "";
			if (resultset.getSize() == 0) {
				result += "<div style='font-weight:bold;'>No result found for query '" + txt + '"</div>';
			} else {
				result += "<div>" + resultset.getSize() + " entr" + (resultset.getSize()>1?"ies were":"y was") + " found</div>";
			}
			result += "<table><tr><th>ROM</th><th>Name</th><th>Search score</th></tr>";
			resultset.forEach(function(entry) {
				if (entry instanceof fullproof.ScoredElement) {
					var line = data[entry.value];
					var split = line.split(";");
					result += "<tr><td>" + (split[0]?split[0]:"-") +"</td><td>" + (split[1]?split[1]:"-") + "</td><td>"+entry.score.toFixed(3)+"</td></tr>";
				} else {
					var split = data[line].split(";");
					result += "<tr><td>" + (split[0]?split[0]:"-") +"</td><td>" + (split[1]?split[1]:"-") + "</td></tr>"; 
				}
			});
			result += "</table>";
			
			callback(result);
		});
	};
	
	this.reloadDatabase = function(callback) {
		engine.clear(callback);
	};
	
	
	return this;
	
})();
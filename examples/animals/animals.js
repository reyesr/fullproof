var Animals = (function(){
	
	var engine = new fullproof.Engine();
	engine.addIndex(
			new fullproof.StandardAnalyzer([fullproof.normalizer.to_lowercase_nomark, fullproof.normalizer.remove_duplicate_letters]),
			new fullproof.store.MemoryStore()
			);
	
	var data = [];
	
	function readData(txt, file) {
		data = txt.split("\n");
		for (var i=0;i<data.length; ++i) {
			engine.injectDocument(i, data[i]);
		}
	}
	
	this.start = function(callback) {
		var loader = new fullproof.DataLoader();
		loader.setQueue("data.csv");
		loader.start(function() {callback(1);}, readData, function() { console.log("ERROR??");});
	}

	this.lookup = function(txt, callback) {
		engine.lookup(txt, function(resultset) {
			
			var result = "";
			if (resultset.getSize() == 0) {
				result += "<div style='font-weight:bold;'>No result found for query '" + txt + '"</div>';
			} else {
				result += "<div>" + resultset.getSize() + " entr" + (resultset.getSize()>1?"ies were":"y was") + " found</div>";
			}
			result += "<table><tr><th>Common Name</th><th>Scientific Name</th></tr>";
			resultset.forEach(function(line) {
				var split = data[line].split(";");
				result += "<tr><td>" + (split[0]?split[0]:"-") +"</td><td>" + (split[1]?split[1]:"-") + "</td></tr>"; 
			});
			result += "</table>";
			
			callback(result);
		});
	};
	
	return this;
	
})();
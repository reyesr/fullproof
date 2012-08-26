var net = net||{};
net.kornr = net.kornr||{};
net.kornr.searchengine=net.kornr.searchengine||{}; 
net.kornr.searchengine.storage=net.kornr.searchengine.storage||{}; 
(function(NAMESPACE) {
	
	NAMESPACE.indexeddb_indexer = function() {
	
		if (!(this instanceof NAMESPACE.indexeddb_indexer)) {
			return new NAMESPACE.indexeddb_indexer();
		}

		var indexedDB = window.indexedDB||window.moz_indexedDB||window.mozIndexedDB||webkitIndexedDB;
		
		return {
			
		};
	};
	
})(net.kornr.searchengine.storage);

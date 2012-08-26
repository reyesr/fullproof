var fullproof = (function(NAMESPACE) {
	"use strict";
	
	function getNewXmlHttpRequest()  {
		if (typeof window.XMLHttpRequest !== "undefined") {
			return new window.XMLHttpRequest;
		} else {
			
		} if (typeof window.ActiveXObject === 'function') {
		        try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
		        try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
		        try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
			}
		throw "Error, can't find a suitable XMLHttpRequest object";
	}
	
	NAMESPACE.DataLoader = function() {
		
		if (!(this instanceof NAMESPACE.DataLoader)) {
			return new NAMESPACE.DataLoader();
		}
		
		var loadQueue = [];
		var currentQueue = [];
		
		this.setQueue = function() {
			for (var i=0; i<arguments.length; ++i) {
				if (arguments[i].constructor == Array) {
					loadQueue = loadQueue.concat(arguments[i]);
				} else {
					loadQueue.push(arguments[i]);
				}
			}
			console.log("loadQueue set to " + loadQueue.join(", "));
			return this;
		}
		
		var processQueue = function(completeCallback, fileLoadedCallback, fileFailedCallback) {
			
			if (currentQueue.length == 0) {
				completeCallback();
				return;
			}
			
			var element = currentQueue.shift();
			
			var request = getNewXmlHttpRequest();
			request.onreadystatechange = function() {
			   if (request.readyState == 4)  { 
				   if (request.status != 200)  {
				     // Handle error, e.g. Display error message on page
				     if (fileFailedCallback) {
				    	 fileFailedCallback(element);
						 processQueue(completeCallback, fileLoadedCallback, fileFailedCallback);
				     }
				   } else {
					   var serverResponse = request.responseText;
					   if (fileLoadedCallback) {
						   fileLoadedCallback(serverResponse, element);
						   processQueue(completeCallback, fileLoadedCallback, fileFailedCallback);
					   }
				   }
			   }
			};
			request.open("GET", element, true);
			request.send(null);
		}
		
		this.start = function(completeCallback, fileLoadedCallback, fileFailedCallback) {
			currentQueue = [].concat(loadQueue);
			processQueue(completeCallback, fileLoadedCallback, fileFailedCallback);
		};
	}
	
	return NAMESPACE;

})(fullproof);

var fullproof = (function(NAMESPACE) {
	"use strict";
	
	NAMESPACE.ScoredElement = function(value, score) {
		if (!(this instanceof NAMESPACE.ScoredElement)) {
			return new NAMESPACE.ScoredElement(value, score);
		}
		this.value = value;
		this.score = score===undefined?1.0:score;
	}

	NAMESPACE.ScoredElement.prototype.toString = function() {
		return "["+this.value+"|"+this.score+"]";
	};
	
	NAMESPACE.ScoredEntry = function(key, value, score) {
		if (!(this instanceof NAMESPACE.ScoredEntry)) {
			return new NAMESPACE.ScoredEntry(key, value, score);
		}
		this.key = key;
		this.value = value;
		this.score = score===undefined?1.0:score;
		this.toString = function() {
			return "["+this.key+"="+this.value+"|"+this.score+"]";
		}
	}
	NAMESPACE.ScoredEntry.prototype = new NAMESPACE.ScoredElement();
	
	NAMESPACE.ScoredEntry.comparatorObject = {
			lower_than: function(a,b) {
				return a.value<b.value;
			},
			equals: function(a,b) {
				return a.value==b.value;
			}
		};

	NAMESPACE.ScoredElement.comparatorObject = NAMESPACE.ScoredEntry.comparatorObject;

	NAMESPACE.Capabilities = function() {
		if (!(this instanceof NAMESPACE.Capabilities)) {
			return new NAMESPACE.Capabilities();
		}
	};
	NAMESPACE.Capabilities.prototype.matchValue = function(property, value) {
		if (value === undefined) {
			return true;
		} else if (typeof property == "object" && property.constructor == Array) {
			for (var i=0; i<property.length; ++i) {
				if (property[i] === value) {
					return true;
				}
			}
			return false;
		} else {
			return property === value;
		}
	}

	NAMESPACE.Capabilities.prototype.setStoreObjects = function(val) {
		this.canStoreObjects = val;
		return this;
	}
	NAMESPACE.Capabilities.prototype.getStoreObjects = function() {
		return this.canStoreObjects;
	}
	NAMESPACE.Capabilities.prototype.setVolatile = function(val) {
		this.isVolatile = val;
		return this;
	}
	NAMESPACE.Capabilities.prototype.setAvailable = function(val) {
		this.isAvailable = !!val;
		return this;
	}
	NAMESPACE.Capabilities.prototype.setUseScores= function(val) {
		this.useScores = val;
		return this;
	}
	NAMESPACE.Capabilities.prototype.getUseScores= function() {
		return this.useScores;
	}
	NAMESPACE.Capabilities.prototype.setComparatorObject= function(obj) {
		this.comparatorObject = obj;
		return this;
	}
	NAMESPACE.Capabilities.prototype.getComparatorObject= function(obj) {
		return this.comparatorObject;
	}
	NAMESPACE.Capabilities.prototype.isCompatibleWith= function(otherCapabilities) {
//		var objstore = otherCapabilities.canStoreObjects!==undefined?(otherCapabilities.canStoreObjects===this.canStoreObjects):true;
//		var isvol = otherCapabilities.isVolatile!==undefined?(otherCapabilities.isVolatile===this.isVolatile):true;
//		var isavail = this.isAvailable===true;
//		var score = otherCapabilities.useScores!==undefined?(otherCapabilities.useScores===this.useScores):true;

		var objstore = this.matchValue(this.canStoreObjects, otherCapabilities.canStoreObjects);
		var isvol = this.matchValue(this.isVolatile, otherCapabilities.isVolatile);
		var score = this.matchValue(this.useScores, otherCapabilities.useScores);
		var isavail = this.isAvailable===true;
		
		return objstore && isvol && isavail && score;
	}
	
	
	/**
	 * Creates a synchronization point. This function returns a function that collects
	 * calls to callback, then calls its callback argument with all the data collected.
	 * The synchronization point can trigger the final call to callback when it either
	 * receives a fixed number of calls (expected argument >= 1), or when it
	 * receives a false boolean value as argument (expected has to be either undefined or false)
	 * 
	 */
	NAMESPACE.make_synchro_point = function(callback, expected) {
		var count = 0;
		var results = [];
		return function(res) {
			if (expected === false || expected === undefined) {
				if (res === false) {
					callback(results);
				} else {
					results.push(res);
				}
			} else {
				++count;
				results.push(res);
				if (count == expected) {
					callback(results);
				}
			}
		}
	}

	NAMESPACE.make_callback_caller = function(callback) {
		var args = [];
		for (var i=1; i<arguments.length; ++i) {
			args.push(arguments[i]);
		}
		return function() {
			if (callback) {
				callback.apply(this, args);
			}
		}
	};

	
	NAMESPACE.filterObjectProperties = function(array_of_object, property) {
		if (array_of_object instanceof NAMESPACE.ResultSet) {
			array_of_object = array_of_object.getDataUnsafe();
		}
		var result = [];
		for (var i=0,max=array_of_object.length; i<max; ++i) {
			result.push(array_of_object[i][property]);
		}
		return result;
	}
	
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

	NAMESPACE.ConfigManager = function(forceCookies) {
		
		if (!(this instanceof NAMESPACE.ConfigManager)) {
			return new NAMESPACE.ConfigManager(forceCookies);
		}
		
		if (localStorage && !forceCookies) {
			return new function(configName) {
				this.set = function(key, value) {
					localStorage.setItem(configName +"_" + key, value); 
				};
				this.get = function(key) {
					return localStorage.getItem(configName + "_" + key);
				};
				this.remove = function(key) {
					localStorage.removeItem(configName + "_" + key); 
				};
				return this;
			};
		} else {
			return new function(configName) {
				this.set = function(key, value) {
					var date = new Date(Date.now()+(365*24*60*60*1000));
					document.cookie = configName+"_"+key+"="+value+"; expires=" + date.toGMTString() +"; path=/";
				};
				this.get = function(key) {
					var fullkey = configName + "_" + key;
					var result;
				    result = (result = new RegExp('(?:^|; )' + encodeURIComponent(fullkey) + '=([^;]*)').exec(document.cookie)) ? (result[1]) : null;
				    return (result == "")?null:result;
				},
				this.remove = function(key) {
					var date = new Date(Date.now()+(24*60*60*1000));
					document.cookie = configName+"_"+key+"= ; expires=" + date.toGMTString() +"; path=/";
				}
				return this;
			};
		}
		
	};
	
	
	
	return NAMESPACE;

})(fullproof||{});

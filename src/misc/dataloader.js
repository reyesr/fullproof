/*
 * Copyright 2012 Rodrigo Reyes
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
var fullproof = fullproof || {};

(function() {
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

	fullproof.DataLoader = function () {

        if (!(this instanceof fullproof.DataLoader)) {
            return new fullproof.DataLoader();
        }

        var loadQueue = [];
        var currentQueue = [];

        this.setQueue = function () {
            for (var i = 0; i < arguments.length; ++i) {
                if (arguments[i].constructor == Array) {
                    loadQueue = loadQueue.concat(arguments[i]);
                } else {
                    loadQueue.push(arguments[i]);
                }
            }
            return this;
        };

        var processQueue = function (completeCallback, fileLoadedCallback, fileFailedCallback) {

            if (currentQueue.length == 0) {
                completeCallback();
                return;
            }

            var element = currentQueue.shift();

            var request = getNewXmlHttpRequest();
            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    if (request.status != 200) {
                        // Handle error, e.g. Display error message on page
                        if (fileFailedCallback) {
                            fileFailedCallback(element);
                            processQueue(completeCallback, fileLoadedCallback, fileFailedCallback);
                        }
                    } else {
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
        };

        this.start = function (completeCallback, fileLoadedCallback, fileFailedCallback) {
            currentQueue = [].concat(loadQueue);
            processQueue(completeCallback, fileLoadedCallback, fileFailedCallback);
        };
    };

//	fullproof.ConfigManager = function(forceCookies) {
//
//		if (!(this instanceof fullproof.ConfigManager)) {
//			return new fullproof.ConfigManager(forceCookies);
//		}
//
//		if (localStorage && !forceCookies) {
//			return new function(configName) {
//				this.set = function(key, value) {
//					localStorage.setItem(configName +"_" + key, value);
//				};
//				this.get = function(key) {
//					return localStorage.getItem(configName + "_" + key);
//				};
//				this.remove = function(key) {
    //					localStorage.removeItem(configName + "_" + key);
//				};
//				return this;
//			};
//		} else {
//			return new function(configName) {
//				this.set = function(key, value) {
//					var date = new Date(Date.now()+(365*24*60*60*1000));
//					document.cookie = configName+"_"+key+"="+value+"; expires=" + date.toGMTString() +"; path=/";
//				};
//				this.get = function (key) {
//                    var fullkey = configName + "_" + key;
//                    var result;
//                    result = (result = new RegExp('(?:^|; )' + encodeURIComponent(fullkey) + '=([^;]*)').exec(document.cookie)) ? (result[1]) : null;
//                    return (result == "") ? null : result;
//                },
//                    this.remove = function (key) {
//                        var date = new Date(Date.now() + (24 * 60 * 60 * 1000));
//                        document.cookie = configName + "_" + key + "= ; expires=" + date.toGMTString() + "; path=/";
//                    };
//				return this;
//			};
//		}
//
//	};

	
})();
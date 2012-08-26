var fullproof = fullproof || {};
fullproof = (function(NAMESPACE) {
"use strict";

	var defaultComparator = {
		lower_than: function(a,b) {
			return a<b;
		},
		equals: function(a,b) {
			return a==b;
		}
	};


	/*
	 * Binary search an array.
	 */
	NAMESPACE.binary_search = function(array, value, min, max, lower_than) {
		lower_than=lower_than||defaultComparator.lower_than;
		if (min===undefined && max===undefined) {
			if (array.length == 0) {
				return 0
			} else {
				return NAMESPACE.binary_search(array,value,0,array.length,lower_than);
			}
		}
		
		while (max>=min) {
			var mid = parseInt((max+min)/2);
			if (mid>=array.length) {
				return array.length;
			} else if (lower_than(array[mid], value)) {
				min = mid+1;
			} else if (lower_than(value, array[mid])) {
				max = mid-1;
			} else {
				// Found
				return mid;
			}
		}
		// Not found
		return min;
	}
	
	/**
	 *  Provides an object containing one sorted array of value, and the elementary
	 *  set operations merge (union), intersect, and substract (complement).
	 *  It maintains internally a sorted array of data. The optional comparator
	 *  must be an object of the form {lower_than: func_lt, equals: func_equal}
	 */
	NAMESPACE.ResultSet = function(comparatorObject) {
		if (!(this instanceof NAMESPACE.ResultSet)) {
			return new NAMESPACE.ResultSet(comparatorObject);
		}
		comparatorObject = comparatorObject||defaultComparator;
		
		var data = [];
		this.EXPOSED_REMOVED = data;

		var last_insert = undefined;

		this.insert = function() {
			for (var i=0; i<arguments.length; ++i) {
				var obj = arguments[i];
				
				if (last_insert && comparatorObject.lower_than(last_insert,obj)) {
					data.push(obj);
					last_insert = obj
				} else {
					var index = NAMESPACE.binary_search(data, obj, undefined, undefined, comparatorObject.lower_than);
					if (index >= data.length) {
						data.push(obj);
						last_insert = obj
					} else if (comparatorObject.equals(obj, data[index]) == false) {
						data.splice(index, 0, arguments[i]);
						last_insert = undefined;
					}
				}
			}
			return this;
		};
		
		this.merge = function(set) {;
			last_insert = undefined;
			var other = false;
			if (set.constructor == Array) {
				other = set;
			} else if (set instanceof NAMESPACE.ResultSet) {
				other = set.getDataUnsafe();
			}
			
			if (other) {
				var result = [];
				var ddd = data;
				var i=0,j=0,maxi=data.length,maxj=other.length;
				var r = -1;
				while (i<maxi || j<maxj) {
					var goi = false;
					if (i<maxi && j<maxj) {
						if (comparatorObject.lower_than(data[i],other[j])) {
							goi = true;
						}
					} else if (i<maxi) {
						goi = true;
					}
					
					if (goi) {
						if (result.length==0 || (!comparatorObject.equals(data[i],result[r]))) {
							result.push(data[i]);
							++r;
						}
						++i;
					} else {
						if (result.length==0 || (!comparatorObject.equals(other[j],result[r]))) {
							result.push(other[j]);
							++r;
						}
						++j;
					}
				}
				data = result;
			}
			return this;
		};

		
		this.intersect = function(set) {
			last_insert = undefined;
			var other = false;
			if (set.constructor == Array) {
				other = set;
			} else if (set instanceof NAMESPACE.ResultSet) {
				other = set.getDataUnsafe();
			}
			
			if (other) {
				var result = [];
				var i=0,j=0,maxi=data.length,maxj=other.length;
				while (i<maxi) {
					while (j<maxj && comparatorObject.lower_than(other[j],data[i])) {
						++j;
					}
					if (j<maxj && comparatorObject.equals(other[j],data[i])) {
						result.push(other[j]);
						++i; 
						++j;
					} else {
						i++;
					}
				}
				data = result;
			} else {
				data = [];
			}
			return this;
		}

		this.substract = function(set) {
			last_insert = undefined;
			var other = false;
			if (set.constructor == Array) {
				other = set;
			} else if (set instanceof NAMESPACE.ResultSet) {
				other = set.getDataUnsafe();
			}
			
			if (other) {
				var result = [];
				var i=0,j=0,maxi=data.length,maxj=other.length;
				while (i<maxi) {
					while (j<maxj && comparatorObject.lower_than(other[j],data[i])) {
						++j;
					}
					if (j<maxj && comparatorObject.equals(other[j],data[i])) {
						++i; 
						++j;
					} else {
						result.push(data[i]);
						i++;
					}
				}
				data = result;
			} else {
				data = [];
			}
			
			return this;
		};
		
		this.getDataUnsafe = function() {
			return data;
		}
		this.setDataUnsafe = function(sorted_array) {
			last_insert = undefined;
			data = sorted_array;
			return this;
		}
		
		this.toString = function() {
			return data.join(",");
		}

		this.forEach = function(callback) {
			for (var i=0,max=data.length; i<max; ++i) {
				callback(data[i]);
			}
		}
		
	};
	
//	this.ResultEntry = function(resultArray, setType, initialWeight) {
//		
//	};
//	
//	function array_indexOf_proxy(arr,el) {
//		return arr.indexOf(el);
//	}

//	function array_indexOf_hm(arr,el) {
//		for (var i=0,max=arr.length; i<max; ++i) {
//			if (arr[i]===el) {
//				return i;
//			}
//		}
//		return -1;
//	}
//
	
//	var array_indexOf = Array.indexOf?array_indexOf_proxy:array_indexOf_hm;
//	
//	NAMESPACE.intersects = function(array1, array2) {
//		var result = [];
//		for (var i=0, max=array1.length; i<max; ++i) {
//			if (array_indexOf(array2, array1[i])>=0) {
//				result.push(array1[i]);
//			};			
//		}
//		return result;
//	};
//
	
	return NAMESPACE;

})(fullproof);

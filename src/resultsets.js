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

	var defaultComparator = {
		lower_than: function(a,b) {
			return a<b;
		},
		equals: function(a,b) {
			return a==b;
		}
	};


	/**
	 * Binary search an array.
	 * @param array an array to search in
	 * @param value the value to search for
	 * @param min the floor index
	 * @param max the ceil index
	 * @param lower_than an optional function that takes two arguments and returns true if 
	 * the first argument is lower than the second one. You have to provide this function
	 * if the values stored in the array cannot be sorted by the default javascript < operator.
	 * 
	 * @return the index of the value, if found, or the index where the value can be inserted if not found.
	 */
	fullproof.binary_search = function(array, value, min, max, lower_than) {
		lower_than=lower_than||defaultComparator.lower_than;
		if (min===undefined && max===undefined) {
			if (array.length == 0) {
				return 0
			} else {
				return fullproof.binary_search(array,value,0,array.length,lower_than);
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
	 *  Provides an object containing a sorted array, and providing elementary
	 *  set operations: merge (union), intersect, and substract (complement).
	 *  It maintains internally a sorted array of data. The optional comparator
	 *  must be an object of the form {lower_than: func_lt, equals: func_equal}
	 *  
	 *  @constructor
	 *  @param comparatorObject a comparator object that provides two functions: lower_than and equals.
	 *  If not defined, a default comparator using the javascript < operator is used. If you're only 
	 *  storing integer values, you can safely omit this argument.
	 */
	fullproof.ResultSet = function(comparatorObject) {
		if (!(this instanceof fullproof.ResultSet)) {
			return new fullproof.ResultSet(comparatorObject);
		}
		comparatorObject = comparatorObject||defaultComparator;
		
		var data = [];
		this.EXPOSED_REMOVED = data;

		var last_insert = undefined;

		/**
		 * Insert values into the array of data managed by this ResultSet. The insertion is optimized 
		 * when the inserted values are greater than the last inserted values (the value is just pushed
		 * to the end of the array). Otherwise, a binary search is done in the array to find the correct
		 * offset where to insert the value. When possible, always insert sorted data.
		 * 
		 * @param values... any number of values to insert in this resultset.
		 */
		this.insert = function() {
			for (var i=0; i<arguments.length; ++i) {
				var obj = arguments[i];
				
				if (last_insert && comparatorObject.lower_than(last_insert,obj)) {
					data.push(obj);
					last_insert = obj
				} else {
					var index = fullproof.binary_search(data, obj, undefined, undefined, comparatorObject.lower_than);
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
		
		/**
		 * Union operation. Merge another ResultSet or a sorted javascript array into this ResultSet.
		 * If the same value exists in both sets, it is not injected in the current set, to avoid duplicate values.
		 * @param set another ResultSet, or an array of sorted values
		 * @return this ResultSet, possibly modified by the merge operation
		 */
		this.merge = function(set) {;
			last_insert = undefined;
			var other = false;
			if (set.constructor == Array) {
				other = set;
			} else if (set instanceof fullproof.ResultSet) {
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
				this.EXPOSED_REMOVED = data;
				
			}
			return this;
		};

		/**
		 * Intersect operation. Modify the current ResultSet so that is only contain values that are also contained by another ResultSet or array.
		 * @param set another ResultSet, or an array of sorted values
		 * @return this ResultSet, possibly modified by the intersect operation
		 */
		this.intersect = function(set) {
			last_insert = undefined;
			var other = false;
			if (set.constructor == Array) {
				other = set;
			} else if (set instanceof fullproof.ResultSet) {
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
				this.EXPOSED_REMOVED = data;
			} else {
				data = [];
				this.EXPOSED_REMOVED = data;
			}
			return this;
		}

		/**
		 * Substraction operation. Modify the current ResultSet so that any value contained in the provided set of values are removed.
		 * @param set another ResultSet, or an array of sorted values
		 * @return this ResultSet, possibly modified by the substract operation
		 */
		this.substract = function(set) {
			last_insert = undefined;
			var other = false;
			if (set.constructor == Array) {
				other = set;
			} else if (set instanceof fullproof.ResultSet) {
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
				this.EXPOSED_REMOVED = data;
			} else {
				data = [];
				this.EXPOSED_REMOVED = data;
			}
			
			return this;
		};

		/**
		 * Returns the value stored at a given offset
		 * @param i the offset of the value
		 * @return a value stored by the resultset 
		 */
		this.getItem = function(i) {
			return data[i];
		}
		
		/**
		 * Returns the sorted javascript array managed by this ResultSet.
		 */
		this.getDataUnsafe = function() {
			return data;
		}
		/**
		 * Sets the sorted array managed by this ResultSet.
		 * @param sorted_array a sorted array
		 * @return this ResultSet instance
		 */
		this.setDataUnsafe = function(sorted_array) {
			last_insert = undefined;
			data = sorted_array;
			this.EXPOSED_REMOVED = data;
			return this;
		}

		/**
		 * Returns a string representation of this object's data.
		 * @return a string
		 */
		this.toString = function() {
			return data.join(",");
		}

		/**
		 * Iterates over all the element of the array, and calls the provided function with each values.
		 * @param callback the function called with each element of the array
		 * @return this ResultSet instance
		 */
		this.forEach = function(callback) {
			for (var i=0,max=data.length; i<max; ++i) {
				callback(data[i]);
			}
			return this;
		}

		/**
		 * Return the size of the managed array.
		 */
		this.getSize = function() {
			return data.length;
		}
		
		/**
		 * Creates a clone of this result set. The managed array is cloned too, but not
		 * the values it contains.
		 * @return a copy of this ResultSet.
		 */
		this.clone = function() {
			var clone = new fullproof.ResultSet;
			clone.setDataUnsafe(data.slice(0));
			return clone;
		}
		
	};

	
})();

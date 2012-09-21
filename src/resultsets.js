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
    fullproof.binary_search = function (array, value, min, max, lower_than) {
        lower_than = lower_than || defaultComparator.lower_than;
        if (min === undefined && max === undefined) {
            if (array.length == 0) {
                return 0
            } else {
                return fullproof.binary_search(array, value, 0, array.length, lower_than);
            }
        }

        while (max >= min) {
            var mid = parseInt((max + min) / 2);
            if (mid >= array.length) {
                return array.length;
            } else if (lower_than(array[mid], value)) {
                min = mid + 1;
            } else if (lower_than(value, array[mid])) {
                max = mid - 1;
            } else {
                // Found
                return mid;
            }
        }
        // Not found
        return min;
    };
	
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
	fullproof.ResultSet = function(comparatorObject, data) {
		if (!(this instanceof fullproof.ResultSet)) {
			return new fullproof.ResultSet(comparatorObject,data);
		}
		this.comparatorObject = comparatorObject||defaultComparator;
		this.data = data||[];
		this.last_insert = undefined;
	};

	/**
	 * Insert values into the array of data managed by this ResultSet. The insertion is optimized 
	 * when the inserted values are greater than the last inserted values (the value is just pushed
	 * to the end of the array). Otherwise, a binary search is done in the array to find the correct
	 * offset where to insert the value. When possible, always insert sorted data.
	 * 
	 * @param values... any number of values to insert in this resultset.
	 */
	fullproof.ResultSet.prototype.insert = function() {
		for (var i=0; i<arguments.length; ++i) {
			var obj = arguments[i];
			
			if (this.last_insert && this.comparatorObject.lower_than(this.last_insert,obj)) {
				this.data.push(obj);
				this.last_insert = obj
			} else {
				var index = fullproof.binary_search(this.data, obj, undefined, undefined, this.comparatorObject.lower_than);
				if (index >= this.data.length) {
					this.data.push(obj);
					this.last_insert = obj
				} else if (this.comparatorObject.equals(obj, this.data[index]) === false) {
					this.data.splice(index, 0, arguments[i]);
					this.last_insert = undefined;
				}
			}
		}
		return this;
	};

	function defaultMergeFn(a,b) {
		return a;
	}
	
	/**
     * Union operation. Merge another ResultSet or a sorted javascript array into this ResultSet.
     * If the same value exists in both sets, it is not injected in the current set, to avoid duplicate values.
     * @param set another ResultSet, or an array of sorted values
     * @return this ResultSet, possibly modified by the merge operation
     */
    fullproof.ResultSet.prototype.merge = function (set, mergeFn) {
        mergeFn = mergeFn || defaultMergeFn;
        this.last_insert = undefined;
        var other = false;

        if (set.constructor == Array) {
            other = set;
        } else if (set instanceof fullproof.ResultSet) {
            other = set.getDataUnsafe();
        }


        var i1 = 0, max1 = this.data.length,
            i2 = 0, max2 = other.length,
            obj1 = null, obj2 = null;
        var comp = this.comparatorObject;

        var result = [];
        while (i1 < max1 && i2 < max2) {
            obj1 = this.data[i1];
            obj2 = other[i2];
            if (comp.equals(obj1, obj2)) {
                result.push(mergeFn(obj1, obj2));
                ++i1;
                ++i2;
            } else if (comp.lower_than(obj1, obj2)) {
                result.push(obj1);
                ++i1;
            } else {
                result.push(obj2);
                ++i2;
            }
        }
        while (i1 < max1) {
            result.push(this.data[i1]);
            ++i1;
        }
        while (i2 < max2) {
            result.push(other[i2]);
            ++i2;
        }
        this.data = result;
        return this;
    };
	

	/**
     * Intersect operation. Modify the current ResultSet so that is only contain values that are also contained by another ResultSet or array.
     * @param set another ResultSet, or an array of sorted values
     * @return this ResultSet, possibly modified by the intersect operation
     */
    fullproof.ResultSet.prototype.intersect = function (set) {
        this.last_insert = undefined;
        var other = false;
        if (set.constructor == Array) {
            other = set;
        } else if (set instanceof fullproof.ResultSet) {
            other = set.getDataUnsafe();
        }

        if (other) {
            var result = [];
            var i = 0, j = 0, maxi = this.data.length, maxj = other.length;
            while (i < maxi) {
                while (j < maxj && this.comparatorObject.lower_than(other[j], this.data[i])) {
                    ++j;
                }
                if (j < maxj && this.comparatorObject.equals(other[j], this.data[i])) {
                    result.push(other[j]);
                    ++i;
                    ++j;
                } else {
                    i++;
                }
            }
            this.data = result;
        } else {
            this.data = [];
        }
        return this;
    };

	
	/**
	 * Substraction operation. Modify the current ResultSet so that any value contained in the provided set of values are removed.
	 * @param set another ResultSet, or an array of sorted values
	 * @return this ResultSet, possibly modified by the substract operation
	 */
	fullproof.ResultSet.prototype.substract = function(set) {
		this.last_insert = undefined;
		var other = false;
		if (set.constructor == Array) {
			other = set;
		} else if (set instanceof fullproof.ResultSet) {
			other = set.getDataUnsafe();
		}
		
		if (other) {
			var result = [];
			var i=0,j=0,maxi=this.data.length,maxj=other.length;
			while (i<maxi) {
				while (j<maxj && this.comparatorObject.lower_than(other[j],this.data[i])) {
					++j;
				}
				if (j<maxj && this.comparatorObject.equals(other[j],this.data[i])) {
					++i; 
					++j;
				} else {
					result.push(this.data[i]);
					i++;
				}
			}
			this.data = result;
		} else {
			this.data = [];
		}
		
		return this;
	};

	/**
     * Returns the value stored at a given offset
     * @param i the offset of the value
     * @return a value stored by the resultset
     */
    fullproof.ResultSet.prototype.getItem = function (i) {
        return this.data[i];
    };

	/**
     * Returns the sorted javascript array managed by this ResultSet.
     */
    fullproof.ResultSet.prototype.getDataUnsafe = function () {
        return this.data;
    };

	/**
     * Sets the sorted array managed by this ResultSet.
     * @param sorted_array a sorted array
     * @return this ResultSet instance
     */
    fullproof.ResultSet.prototype.setDataUnsafe = function (sorted_array) {
        this.last_insert = undefined;
        this.data = sorted_array;
        return this;
    };

	/**
	 * Changes the comparatorObject associated to this set, and sorts the data.
	 * Use this function if you want to sort the data differently at some point.
	 * @param comparatorObject the comparator to use
	 * @return this ResultSet instance
	 */
	fullproof.ResultSet.prototype.setComparatorObject = function(comparatorObject) {
		this.comparatorObject = comparatorObject;
		var self = this;
		this.data.sort(function(a,b) {
			if (self.comparatorObject.lower_than(a,b)) {
				return -1;
			} else if (self.comparatorObject.equals(a,b)) {
				return 0;
			} else {
				return 1;
			}
		});
	};
	
	/**
     * Returns a string representation of this object's data.
     * @return a string
     */
    fullproof.ResultSet.prototype.toString = function () {
        return this.data.join(",");
    };

	/**
     * Iterates over all the element of the array, and calls the provided function with each values.
     * @param callback the function called with each element of the array
     * @return this ResultSet instance
     */
    fullproof.ResultSet.prototype.forEach = function (callback) {
        for (var i = 0, max = this.data.length; i < max; ++i) {
            callback(this.data[i]);
        }
        return this;
    };

	/**
     * Return the size of the managed array.
     */
    fullproof.ResultSet.prototype.getSize = function () {
        return this.data.length;
    };

	/**
	 * Creates a clone of this result set. The managed array is cloned too, but not
	 * the values it contains.
	 * @return a copy of this ResultSet.
	 */
	fullproof.ResultSet.prototype.clone = function() {
		var clone = new fullproof.ResultSet;
		clone.setDataUnsafe(this.data.slice(0));
		return clone;
	};
	
})();

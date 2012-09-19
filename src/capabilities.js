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

/**
 * Represents a set of contraints applied to an index or a store.
 * The way this object is designed, you only have to set the properties that are meaningful for your
 * requirement. Not setting a property means that any value is ok.
 * @constructor
 */
fullproof.Capabilities = function() {
	if (!(this instanceof fullproof.Capabilities)) {
		return new fullproof.Capabilities();
	}
};

/**
 * Compares a value with a property of this Capabilities object.
 * @param property a property name
 * @param value the valued to be compared
 * @protected
 * This should probably be made private or something
 */
fullproof.Capabilities.prototype.matchValue = function (property, value) {
    if (value === undefined) {
        return true;
    } else if (typeof property == "object" && property.constructor == Array) {
        for (var i = 0; i < property.length; ++i) {
            if (property[i] === value) {
                return true;
            }
        }
        return false;
    } else {
        return property === value;
    }
};
/**
 *
 */
fullproof.Capabilities.prototype.setStoreObjects = function (val) {
    this.canStoreObjects = val;
    return this;
};
/**
 *
 */
fullproof.Capabilities.prototype.getStoreObjects = function () {
    return this.canStoreObjects;
};
/**
 *
 */
fullproof.Capabilities.prototype.setVolatile = function (val) {
    this.isVolatile = val;
    return this;
};
/**
 *
 */
fullproof.Capabilities.prototype.setAvailable = function (val) {
    this.isAvailable = !!val;
    return this;
};
/**
 *
 */
fullproof.Capabilities.prototype.setUseScores = function (val) {
    this.useScores = val;
    return this;
};
/**
 *
 */
fullproof.Capabilities.prototype.getUseScores = function () {
    return this.useScores;
};
/**
 *
 */
fullproof.Capabilities.prototype.setComparatorObject = function (obj) {
    this.comparatorObject = obj;
    return this;
};
/**
 *
 */
fullproof.Capabilities.prototype.getComparatorObject = function (obj) {
    return this.comparatorObject;
};
/**
 *
 */
fullproof.Capabilities.prototype.setDbName = function (name) {
    this.dbName = name;
    return this;
};
/**
 *
 */
fullproof.Capabilities.prototype.getDbName = function () {
    return this.dbName;
};
/**
 *
 */
fullproof.Capabilities.prototype.setDbSize = function (size) {
    this.dbSize = size;
    return this;
};
/**
 *
 */
fullproof.Capabilities.prototype.getDbSize = function () {
    return this.dbSize;
};
/**
 *
 */
fullproof.Capabilities.prototype.setScoreModifier = function (modifier) {
    this.scoreModifier = modifier;
    return this;
};
/**
 *
 */
fullproof.Capabilities.prototype.getScoreModifier = function () {
    return this.scoreModifier;
};
/**
 * Returns true if the current Capabilities object subsumes another Capabilities.
 * @param otherCapabilities the Capabilities that must be subsumed by the current instance
 */
fullproof.Capabilities.prototype.isCompatibleWith = function (otherCapabilities) {
    var objstore = this.matchValue(this.canStoreObjects, otherCapabilities.canStoreObjects);
    var isvol = this.matchValue(this.isVolatile, otherCapabilities.isVolatile);
    var score = this.matchValue(this.useScores, otherCapabilities.useScores);
    var isavail = this.isAvailable === true;

    return objstore && isvol && isavail && score;
};

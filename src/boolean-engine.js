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

var fullproof = fullproof||{};

/**
 * A boolean-set based engine.
 *
 * @constructor
 */
fullproof.BooleanEngine = function (storeDescriptors) {

    if (!(this instanceof fullproof.BooleanEngine)) {
        return new fullproof.BooleanEngine(storeDescriptors);
    }

    this.initAbstractEngine(storeDescriptors); // Init from the prototype

    /**
     * The working mode when gathering result sets.
     */
    this.booleanMode = fullproof.BooleanEngine.CONST_MODE_INTERSECT;



    function lookup(self, text, callback, arrayOfIndexUnits, mode) {
        if (arrayOfIndexUnits.length == 0) {
            return callback(false);
        }
        var unit = arrayOfIndexUnits.shift();
        ++(self.lastResultIndex);
        unit.analyzer.parse(text, fullproof.make_synchro_point(function (array_of_words) {



            if (!array_of_words || array_of_words.length == 0) {
                if (arrayOfIndexUnits.length > 0) {
                    return lookup(self, text, callback, arrayOfIndexUnits, mode);
                } else {
                    return callback(false);
                }
            }

            var lookup_synchro = fullproof.make_synchro_point(function (rset_array) {

                var curset = rset_array.shift();
                while (rset_array.length > 0) {
                    var set = rset_array.shift();
                    switch (mode) {
                        case fullproof.BooleanEngine.CONST_MODE_UNION:
                            curset.merge(set);
                            break;
                        default: // default is intersect
                            curset.intersect(set);
                            break;
                    }
                }

                if (curset.getSize() == 0) {
                    if (arrayOfIndexUnits.length > 0) {
                        return lookup(self, text, callback, arrayOfIndexUnits, mode);
                    } else {
                        callback(false);
                    }
                } else {
                    callback(curset);
                }

            }, array_of_words.length);

            for (var i = 0; i < array_of_words.length; ++i) {
                unit.index.lookup(array_of_words[i], lookup_synchro);
            }
        }));
    }

    this.lookup = function (text, callback) {
        this.lastResultIndex = 0;
        lookup(this, text, callback, this.getIndexUnits(), this.booleanMode);
        return this;
    }
};

fullproof.AbstractEngine = fullproof.AbstractEngine || (function() {});
fullproof.BooleanEngine.prototype = new fullproof.AbstractEngine;
/**
 * @const
 */
fullproof.BooleanEngine.CONST_MODE_INTERSECT = 1;
/**
 * @const
 */
fullproof.BooleanEngine.CONST_MODE_UNION = 2;

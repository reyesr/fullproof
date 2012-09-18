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
/**
 * A small object that replaces the console.log and displays the logs in the page dom.
 * This is mainly for debugging on device where there's no console.log available.
 * @constructor
 */
function InlineConsole() {
    "use strict";

    if (!(this instanceof InlineConsole)) {
        return new InlineConsole();
    }

    this.logs = "";
    this.dom = null;
}

InlineConsole.prototype.init = function(id) {
    this.dom = document.getElementById(id);
};

InlineConsole.prototype.update = function() {
    this.dom.innerHTML = "<pre>" + this.logs +"</pre>";
};

InlineConsole.prototype.log = function() {
    "use strict";
    for (var i= 0, count=arguments.length; i<count; ++i) {
        this.logs += arguments[i] + "\n";
    }
    this.update();
}

window.installInlineConsole = function(id) {
    "use strict";
    window.console = new InlineConsole();
    if (window.console && window.console.init) {
        window.console.init(id);
    } else {
        document.getElementById(id).innerHTML = "ERROR";
    }
}

//
// Requires jQuery:
//   <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.8.0/jquery.min.js"></script>
// Requires google charts init:
//       <script type="text/javascript" src="https://www.google.com/jsapi"></script>
//   then     google.load("visualization", "1", {packages:["corechart"]});
//            google.setOnLoadCallback(calledWhenReady);
//
// Usage:
//       var benchmark = new Benchmark($("#result"));
//      then to add some tests:
//       benchmark.addTest("some group", "test-relative name", testFunction, "long description for group");
//      then start the execution:
//       benchmark.start(my_callback);
//
//  testFunction is the function that executes the test, it receives an object that contains the following
//  methods:
//   * startTimer() : to be called when the timer must start
//   * stopTimer() : to be called when the timer must stop
//   * testComplete(true/false) : MUST be called when the test ends. Call with true if the test was successfull, false otherwise.
//
function Benchmark($root) {
    "use strict";
    if (!(this instanceof Benchmark)) {
        return new Benchmark($root);
    }

    this.tests = [];
    this.results = [];
    this.groupToDom = {};
    this.groupDesc = {};

    var now = (function() {
        var perf = window.performance || {};
        var fn = perf.now || perf.mozNow || perf.webkitNow || perf.msNow || perf.oNow;
        return fn ? fn.bind(perf) : function() { return new Date().getTime(); };
    })();

    /**
     * initializes the dom nodes for the test
     * @private
     */
    this.prepareTests = function() {
        $root.html("");
        this.groupToDom = {};
        var self = this;
        var groups = this.getAvailableGroups();
        jQuery.each(groups, function(ig,group) {
            var tests = self.getForGroup(group);
            var html = "<div class='testgroup'>";
            html += "<div class='chart'></div>";
            html += "<div class='groupname'>" + group + " <span class='desc'>"+self.groupDesc[group]+"</span></div>";
            html += "<div class='tests'></div>";
            html += "<div style='clear:both;'></div>";
            html += "</div>";
            var $group = $(html);
            $group.appendTo($root);
            self.groupToDom[group] = $group;

            jQuery.each(tests, function(it, test) {
                var testhtml = "<div class='testunit waiting'><div class='testcontainer'>";
                testhtml += "<div class='status'>Waiting</div>";
                testhtml += "<div class='test'><div class='name'>" + test.name + " <div class='result'></div></div>";
                testhtml += "</div>";
                testhtml += "</div></div>";
                var $domEl = $(testhtml);
                $domEl.appendTo($group.find(".tests"));
                test.dom = $domEl;
            });
        });
    };

    /**
     * The object sent to the test function. This is used to measure the performance of the test.
     * @param callback the function to be called when the test is complete
     * @constructor
     */
    function TestManager(callback) {
        var startTime, endTime;
        var success;
        this.startTimer = function() {
            startTime = now();
        };
        this.stopTimer = function() {
            endTime = now();
       };
        this.testComplete = function(successBool) {
            success = successBool;
            callback(successBool);
        };
        this.getTimeMillis = function() {
            return endTime - startTime;
        };
    }

    /**
     * Starts the tests. Method prepareTests() mmust have been called.
     * @param callback a function called when all the tests are done
     * @private
     */
    this.startTests = function(callback) {
        var remaining = []; // .concat(this.tests);
        var groups = this.getAvailableGroups();
        var self = this;
        jQuery.each(groups, function(ig,group) {
            var tests = self.getForGroup(group);
            jQuery.each(tests, function(it, test) {
                remaining.push(test);
            });
            remaining.push(group);
        });

        var self = this;
        this.results = [];
        function proc() {
            if (remaining.length === 0) {
                return callback();
            }

            var test = remaining.shift();
            if (typeof test === "string") {
                addChart(self.groupToDom[test].find(".chart"), test, self.getForGroup(test));
                setTimeout(proc, 300);
            } else {
                test.dom.addClass("running");
                test.dom.find(".status").html("Running...");
                var tmgr = new TestManager(function(res) {
                    test.dom.removeClass("running");
                    test.dom.addClass(res?"passed":"failed");
                    var timed = tmgr.getTimeMillis();
                    self.results.push(tmgr);
                    test.dom.find(".result").html(timed.toFixed(2) + "ms");
                    test.dom.find(".status").html(res?"Passed":"Failed");
                    test.result = {time: timed};

                    setTimeout(proc, 1);
                });
                setTimeout(function() {
                    test.test(tmgr);
                }, 1);
            }
        }
        proc();
    }

    /**
     * Adds a test to the pool of tests to be executed.
     * @param group a string describing the group to which the test belongs. Should be kept short.
     * @param name The name of the test inside this group.
     * @param requestedTest The function executing the test. This function shall take a TestManager object as only argument.
     * @param longGroupDescription a longer description for the group.
     */
    this.addTest = function(group, name, requestedTest, longGroupDescription) {
        if (longGroupDescription) {
            this.groupDesc[group] = longGroupDescription;
        }
        this.tests.push({group: group, name: name, test: requestedTest});
    }

    function addChart($dom, group, tests) {
        var cdata = [["Test"],["Test"]];
        for (var i=0; i<tests.length; ++i) {
            cdata[0].push(tests[i].name);
            cdata[1].push(tests[i].result.time>=1?tests[i].result.time:1);
        }
        var data = google.visualization.arrayToDataTable(cdata);
        var options = {
            title: "Benchmark: " + group,
            hAxis: {title: 'Tests', titleTextStyle: {color: 'red'}},
            vAxis: {title: "ms" }
        };
        $dom.html("<div></div>");
        var chart = new google.visualization.ColumnChart($dom.children("div").get(0));
        chart.draw(data, options);
    }

    /**
     * Initialize the dom with the tests added, and start the test execution. Needs to be called when all the tests have been added with addTest().
     * @param callback
     */
    this.start = function(callback) {
        this.prepareTests();
        var self = this;
        setTimeout(function() {
            self.startTests(function() {
                callback();
            });
        }, 50);
    };

    /**
     * Returns an array of all the group added to this object.
     * @return {Array} an array of groups. Can be modified.
     */
    this.getAvailableGroups = function() {
        var collected = {}, result = [];
        for (var i=0; i<this.tests.length; ++i) {
            collected[this.tests[i].group] = true;
        }
        for (var k in collected) {
            result.push(k);
        }
        result.sort();
        return result;
    };

    /**
     * Returns all the tests associated to a group
     * @param groupName the group name (as a string)
     * @return {Array} an array containing all the tests for this group, sorted by name.
     */
    this.getForGroup = function(groupName) {
        var result = [];
        for (var i=0; i<this.tests.length; ++i) {
            if (this.tests[i].group === groupName) {
                result.push(this.tests[i]);
            }
        }
        result.sort();
        return result;
    }

}
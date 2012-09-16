### What is `fullproof` ?

Fullproof is a javascript library that provides high-quality full-text search in the browser.

This specially makes sense if your webapp is designed to work offline, using HTML5 offline feature or because your
application runs on a mobile device.

### Features

* Boolean and Scoring search engines available, depending on the kind of search your application needs
* Automatic HTML5 storage detection, and graceful degradation, with a configurable constraint-based capabilities system. Currently manages WebSQL, IndexedDB and Memory data storage.
* Full unicode support and normalization, diacritical marks removal, stemming and phonetical algorithms (currently available for english and french)
* Configurable and very easely extensible parsing and token normalization system
* Easy to integrate, zero external dependency, ~100k minified

Note the fullproof is NOT a document management system, it does only one thing: provide fulltext search to your application, it does not aim at storing documents or data.

### Some Screenshots

<div id="screenshots">
![Color search using metaphone](img/sc-colors.png)
![Animals from the US](img/sc-animals.png)
![Searching in the pool of MAME Roms](img/sc-mame.png)
</div>

### Want more information ?

* Try the samples
    * Colors : [search colors by name](examples/colors/colors.html) using a BooleanEngine hooked on metaphone
    * Animal Species: [search US animal species](examples/animals/animals.html), uses the fullproof BooleanEngine
    * Mame: [search the huuuge MAME ROM list](examples/mame/mamesearch.html) using the fullproof ScoringEngine
    * You may also wish to test how the [basic analyzers](examples/example-analyzers.html) works, or make some simple tests on the [data stores](examples/example-storage.html).
* [Read the tutorial](tutorial.html)
* [Read the documentation](doc.html) or [the generated JSDOC](jsdocs/index.html)
* [Visit the GitHub repository](https://github.com/reyesr/fullproof)


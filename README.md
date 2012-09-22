FullProof
=========

A javascript-based fulltext search engine library.

Fullproof provides a full stack of components for managing a search engine in javascript.

Its main features are:

* Boolean and Scoring search engines available, depending on the kind of search your application needs
* Automatic HTML5 storage detection, and graceful degradation, with a configurable constraint-based capabilities system. Currently manages WebSQL, IndexedDB and Memory data storage.
* Full unicode support and normalization, diacritical marks removal, stemming and phonetical algorithms (currently available for english and french)
* Configurable and very easely extensible parsing and token normalization system
* Easy to integrate, zero external dependency, ~100k minified

Note that fullproof is NOT a document management system, it does only one thing: provide fulltext search to your application, it does not aim at storing documents or data.

##Licence

Fullproof is released under the terms of the Apache License, version 2.0, january 2004

##Useful Links

* The main web site is located at http://reyesr.github.com/fullproof/
* The source code is hosted at GitHub's: https://github.com/reyesr/fullproof
* Information can be found in the wiki: https://github.com/reyesr/fullproof/wiki
* Bug reports and evolution requests can be reported at: https://github.com/reyesr/fullproof/issues

##Contribute !

You can help improve fullproof and fulltext research by creating new algorithms:

- Tokenizers for specific formats and/or languages (html, pdf, epub, etc, or any language where tokenization have special rules)
- New normalizers: Normalizers help improve drastically the quality of the search. The current token normalizers
  for english (porter stemmer, metaphone, etc) are rather naive and can surely be enhanced. If you are a native
  speaker for a non-english language, you can also help by providing normalizers adapted to your language.
- More stores. Think you can optimize the current stores implementation ? Or create a new store ? Go ahead!

You can fork fullproof at https://github.com/reyesr/fullproof

FULLPROOF STORES
================

#What's a store ?
A store is an interface to some form data storage provided by the javascript runtime, and used by fullproof to store an
inverted index. A store is expected to manage the creation and deletion of a set of inverted indexes.

#What's an inverted index ?
Inverted indexes (or simply "indexes" in the context of fullproof) manage tuplets <term, value> or <term, value, score>, where term is a linguistic token (for instance an english word),
and value is an application-specific primary value (typically a number or a string specific to your application, that allows it to retrieve a specific document.
The score is an optional data, used by the ScoringEngine (so don't bother with it if you're using
the BooleanEngine) to sort the final result sets (typically, an higher score means the word is more relevant, while a lower score means
it's less relevant to the document).

#Store functions
A store must implement the following functions:

##open(caps, reqIndexArray, callback, errorCallback)
Opens a store and configure it. Arguments:
- caps: a fullproof.Capabilities object that provides information to the store (dbName and dbSize)
- reqIndexArray: an array of fullproof.IndexRequest objects that describe all the indexes to be created by the store.
- callback: a function called when the engine completes the indexes opening/creation/initialization process.
- errorCallback: if some problem occurs preventing the store to open the indexes, this function is called.

##close(callback)
Closes a store and all its indexes. The callback function is called when everything is closed.

#Index functions
An index must implement the following functions

##clear(callback)
Delete all the data stored by this index (ie. after this call, it's empty). The next time the index is opened,
the initializer will be called, in order to populate the index.
The callback is called with a reference to this index when the action is complete.

##inject(word, value, callback)
if value is a fullproof.ScoredEntry, it is used to store a value and its score
otherwise, the store injects in its database the value as is, associated to the specified term).
The callback is called when the operation is complete, with parameter true for success, or false if the
injection failed. 

##injectBulk(wordArray, valueArray, callback)
like inject, but massively inject an array of entries. 

##lookup(word, callback)
calls the callback with an instance of a fullproof.ResultSet that holds the data associated to the word.
The objects contained in the resultset can be fullproof.ScoredElement if the index was created with the
useScore:true parameter, or just the values (as injected) otherwise.
Callers can modify the result set, but must not modify the objects contained (as they may be referenced by
the index for storage or caching).


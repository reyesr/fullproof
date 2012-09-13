A store is an interface to a data storage provided by the browser. It manages the creation and deletion of the inverted indexes that
are used by the fulltext engine to look documents up.

Stores manage tuplets <term, value> or <term, value, score>, where term is a linguistic token (for instance an english word), 
and value is an application-specific primary value (typically an integer or a string that represent a way to retrieve a
document from your application). The score is an optional data, used by the ScoringEngine (so don't bother with it if you're using
the BooleanEngine) to modify the final result sets (typically, an higher score means the word is more relevant, while a lower score means
it's less relevant to the document).

A store must implement the following functions:

open(caps, reqIndexArray, callback, errorCallback)
Opens a store and configure it. The callback is called with a reference to the store.
parameters are any object, possibly a Capabilities instance, used to configure the store (ie database name, etc)

close(callback)
Closes a store and all its indexes. The callback function is called when everything is closed.


An index must implement the following functions
clear(callback)
Delete all the data stored by this index (ie. after this call, it's empty).
The callback is called with a reference to this index when the action is complete.

inject(word, value, callback)
if value is a fullproof.ScoredEntry, it is used to store a value and its score
otherwise, the store injects in its database the value for the specified word (as key).
The callback is called when the operation is complete, with parameter true for success, or false if the
injection failed. 

injectBulk(wordArray, valueArray, callback)
like inject, but massively inject an array of entries. 

lookup(word, callback)
calls the callback with an instance of a fullproof.ResultSet that holds the data associated to the word.
The objects contained in the resultset can be fullproof.ScoredElement if the index was created with the
useScore:true parameter, or just the values (as injected) otherwise.
Callers can modify the result set, but must not modify the objects contained (as they may be referenced by
the index for storage or caching).


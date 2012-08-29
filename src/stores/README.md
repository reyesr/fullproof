A store is an interface to a data storage provided by the browser. It manages the creation and deletion of the inverted indexes that
are used by the fulltext engine to look documents up.

A store must implement the following functions:

openStore(callback)
Opens a store and configure it. The callback is called with a reference to the store.

closeStore(callback)
Closes a store and all its indexes. The callback is called when everything is closed.

openIndex(name, parameters, initializer, callback)
Open an index accessible in R/W. 
If the index is already opened, or if it does not need any initialization, it simply returns the index reference.
If the index does not exists in the store, the initializer is called, and the method returns when the initializer
as complete. The initializer is called with the index as first argument, and a callback as second argument. The
initializer MUST call the provided callback on completion, or the openIndex will never complete.
The callback argument is called with a reference on the index.
The parameter is an object that must contains the following properties
{
 useScore: true/false,
 comparatorObject: {lower_than: function(){}, equals: function() {} }
}
If useScore is true, then the index expects the injected data to be fullproof.ScoredElement.
The comparator object must provide functions to sort and search through the stored values.
If the index cannot be open, the callback is called with a single parameter false.


closeIndex(name, callback)
Closes an index. This makes it available for garbage collecting (unless the application code holds a reference on it).
The callback is called when the index is closed.

An index must implement the following functions

clear(callback)
Delete all the data stored by this index (ie. after this call, it's empty).
The callback is called with a reference to this index when the action is complete.

inject(word, value, callback)

lookup(word, callback)
calls the callback with an instance of a fullproof.ResultSet that holds the data associated to the word.
The objects contained in the resultset can be fullproof.ScoredElement if the index was created with the
useScore:true parameter, or just the values (as injected) otherwise.
Callers can modify the result set, but must not modify the objects contained (as they may be referenced by
the index for storage or caching).


# Fullproof Tutorial

Fullproof provides a pipeline of components that process text and manages inverted indexes. However, most of the
components are managed by a top-level search engine component.

# Hands on

Let's create a search engine for Nintendo's Mario series characters.

The very first step is of course to make fullproof available to your web application. Just add the *fullproof-all.js*,
which contains everything. If you need to reduce the size of fullproof, you can create your own version by tweaking
the build script and remove whatever feature you don't need. For the meantime, let's just use this one.

~~~~ {#mycode .javascript}
    <script type="text/javascript" src="fullproof-all.js"></script>
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For the sake of the tutorial, we also need some data to index. Fullproof is not a document storage,
so you are responsible for loading and managing your own documents. In a normal application, you'll have them
stored either in memory or in some local storage, the only requirement of fullproof is that you need to have
a unique access key based on a primary type (typically a string or a number) for each of your documents.

~~~~ {#mycode .javascript}
    var marioData= [
        {name: "Mario", type: "Protagonist"},
        {name: "Luigi", type: "Protagonist"},
        {name: "Princess Peach", type: "Protagonist"},
        {name: "Toad", type: "Protagonist"},
        {name: "Yoshi", type: "Protagonist"},
        {name: "Toadsworth", type: "Supporting"},
        {name: "Donkey Kong", type: "Supporting"},
        {name: "Princess Daisy", type: "Supporting"},
        {name: "Professor E. Gadd", type: "Supporting"},
        {name: "Rosalina", type: "Supporting"},
        {name: "Pauline", type: "Supporting"},
        {name: "Birdo", type: "Supporting"},
        {name: "Toadette", type: "Supporting"},
        {name: "Bowser", type: "Antagonist"},
        {name: "Bowser Jr", type: "Antagonist"},
        {name: "Fawful", type: "Antagonist"},
        {name: "Kammy Koopa", type: "Antagonist"},
        {name: "Kamek", type: "Antagonist"},
        {name: "King Boo", type: "Antagonist"},
        {name: "Petey Piranha", type: "Antagonist"},
        {name: "Wario", type: "Antagonist"},
        {name: "Waluigi", type: "Antagonist"},
        {name: "Wart", type: "Antagonist"},
        {name: "Koopa Kid", type: "Antagonist"},
        {name: "Tatanga", type: "Antagonist"}
    ];
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

In this example, we'll just use the index in the array of data as reference key. Therefore, Mario is 0, Luigi is 1, and
Tatanga is `marioData.length-1`.

# Choose your engine!

Two search engines are available in fullproof:

- the *BooleanEngine*: works by intersecting result sets, which means it only shows the results that match all
the tokens from the query.

- the *ScoringEngine*: each result entry is given a score, the list of result sent back to your application is sorted accordingly. If there's more than one term in the
query, it returns all the results that match any of them, but the most relevant (ie. the ones that contains most of the
term) are scored better, so they can appear first.

In this tutorial, we use the BooleanEngine, because it's well suited for a small list of names. For
examples of the ScoringEngine, check the examples (its usage is very similar to the BooleanEngine).

# Crafting your indexes

Wait, why is there several indexes ? Don't we just need one that associates each Mario's character name with its index in the array?
We do. But using several indexes improves drastically the quality of the search. In our example, here is what we can do:

* The first index takes each name and apply very few modifications (we call them normalizations in fullproof): just convert
to lowercase, and remove duplicate letters, as they are rarely useful. For instance `Mario` is turned into `mario`.
Within this index, `mario` will be found whether the user types `MARIO`, `Marrio`, or `marioo`.

* The second index uses a more aggressive normalization, called the metaphone algorithm, that reduces each term to a
simplified phonetic form. For instance, `mario` is converted to `MR`, and `rosalina` is converted into `RSLN`.

The BooleanEngine always prefers the first index for the lookup results, but falls back to subsequent indexes when
no results are found. From the user's point of view, it returns the exact result set when the terms is rightfully
typed, but degrades to approximative results when the terms are erroneously typed, or if the terms is not in the
document base.

Of course, for best quality you have to always make sure the index are added in the right order: light normalization first,
aggressive, stemming, or phonetic normalization after. There's no hard limit on how many indexes can be used by
an engine, but the more you add, the more storage space it uses, and the longer it'll eventually take to return
the search results. Two indexes is usually a good fit, you probably don't want more than 3, but you may have
specific needs that would make you use more, and fullproof can perfectly handle that.

# Starting the search engine

It takes a few step to init the engine.

~~~~ {#mycode .javascript}
    var dbName = "mario";
    var marioSearchEngine = new fullproof.BooleanEngine();
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Then we define the indexes. Each index is represented by an object that defines the name of the index, the analyzer to use,
the capabilities (an object that describes the requirement for the index), and an initializer (a function called when
the index need to be populated, typically at creation time).

~~~~ {#mycode .javascript}
    var index1 = {
        name: "normalindex",
        analyzer: new fullproof.StandardAnalyzer(fullproof.normalizer.to_lowercase_nomark, fullproof.normalizer.remove_duplicate_letters),
        capabilities: new fullproof.Capabilities().setUseScores(false).setDbName(dbName),
        initializer: initializer
    };
    var index2 = {
        name: "stemmedindex",
        analyzer: new fullproof.StandardAnalyzer(fullproof.normalizer.to_lowercase_nomark, fullproof.english.metaphone),
        capabilities: new fullproof.Capabilities().setUseScores(false).setDbName(dbName),
        initializer: initializer
    };
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The analyzer is an important part of the search engine, as it impacts greatly the quality of the results. Notice how
each analyzer specifies an array of normalizers: those are small functions that turn a word (a linguistic token cut
by the parser from the text) into a simplified ("normalized") form of the same word. For instance, the `to_lowercase_nomark`
function takes a word, converts it to lowercase and remove all diacritical mark. MARIO becomes mario, but MÄRÎÔ is also
converted to mario. This may not seem very useful for english, but it defintely is whenever you're indexing any
language that use diacritical marks (and most languages in the world use them).

As a side note, another interesting feature of this `to_lowercase_nomark` is that unicode allows two forms for a single letter
with a diacritical mark: one where the letter and its mark are combined, and another where they are not (they usually appear
as distinct LETTER + MARK in the string. Adds to that that letters can also have more than one diacritical mark, and that
the marks may appear in different orders, and you can see why this is a useful feature: it makes all those forms
identical for the index.

# The  initializer

The initializer is the function called when the index is created. The first argument is a fullproof.TextInjector object
that provide two functions: inject() and injectBulk(). A text injector is an object hooked on the index and the
analyzer associated to the index that you feed with text and documents keys.

~~~~ {#mycode .javascript}
    function initializer(injector, callback) {
        var synchro = fullproof.make_synchro_point(callback, marioData.length);
        for (var i=0;i<marioData.length; ++i) {
            var text = marioData[i].name +" " + marioData[i].type;
            injector.inject(text, i, synchro);
        }
    }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You certainly remember how most functions are asynchronous. `inject()` is no different, and its third argument is a function
that is called when the injection is done. In order to call the main callback function (argument of `initializer`) when all the
injections are done, we use a utility function `fullproof.make_synchro_point` that calls its first argument when the specified
amount of calls are received.

# Starting it up

Now everything is ready, we can just start the engine. This is just a call to `open()`, with three parameters: the array of index descriptors
we defined above, a success callback, and an error callback. In this example, we just use the `fullproof.make_callback()` to reroute
both calls to the `engineReady()` function, which will receive either true or false as argument.

~~~~ {#mycode .javascript}
        marioSearchEngine.open([index1, index2], fullproof.make_callback(engineReady, true), fullproof.make_callback(engineReady, false));
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# Callbacks

Note how the `open()` uses callback functions. Those function are called asynchronously when the action is complete.
The second callback function is called if the engine fails to open its indexes.

There's a lot of callback in fullproof, that's because most of the storage action are asynchronous and are called
once the current javascript thread yields.

# Let's search

Once the search engine is ready, we can start using it. Do not try making lookups before it's ready, you may
just get nothing or raise an exception in the worst case.

To start a query, just use the `lookup()` function, with your query and a callback function that will asynchronously
receive the results when it's ready. The result is an object of type fullproof.ResultSet (which manages a sorted
array and provides basic set operations), possibly empty if the query does not return any result. If there are
one or more result, you can iterate over it to build the text displayed to the user.

So let's create a `search()` function that takes the value of an input field, use it as a query, looks it up in the
search engine, and creates the user response based on the results.

~~~~ {#mycode .javascript}
    function search() {
        var value = $("#typehere").val();

        // Request a search to the mario engine, then displays the results, if any.
        marioSearchEngine.lookup(value, function(resultset) {
            var result ="";
            if (resultset && resultset.getSize()) {
                var rsize = resultset.getSize();
                result = "<h1>Found " + rsize + " character"+(rsize>1?"s":"")+" matching your request.</h1>";
                result += "<table><tr><th>Name</th><th>Role</th></tr>"
                resultset.forEach(function(e) {
                    var c = marioData[e];
                    result += "<tr><td style='font-weight: bold;'>"+ c.name+"</td>";
                    result += "<td>"+ c.type+"</td></tr>";
                });
                result += "</table>";
            } else {
                result = "<h2>No result found :-(</h2>";
            }
            $("#results").html(result);
        });
    }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



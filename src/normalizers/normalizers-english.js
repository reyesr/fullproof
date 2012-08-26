var fullproof = fullproof || {};
fullproof.normalizer = (function(NAMESPACE) {
	
	NAMESPACE.english = NAMESPACE.english|| {};

	/**
	 * Porter stemmer adapted from http://code.google.com/p/yeti-witch/source/browse/trunk/lib/porter-stemmer.js
	 * Original license header below, declared as Apache License V2 on the project site
	 */
	/**
	 * 18 May 2008
	 * Stemming is the process for reducing inflected (or sometimes derived) words to their stem, base or root
	 * form. Porter stemming is designed for the English language.
	 * 
	 * This code has been slighly adapted from Martin Porter's examples.
	 *  - http://tartarus.org/~martin/PorterStemmer/
	 *  
	 * Please assume any errors found in the below code are translation errors
	 * inserted by myself and not those of the original authors.
	 *  
	 * @author Matt Chadburn <matt@commuterjoy.co.uk>
	 */
	NAMESPACE.english.porter_stemmer = (function(){
		"use strict";

		var step2list = new Array();
        step2list["ational"]="ate";
        step2list["tional"]="tion";
        step2list["enci"]="ence";
        step2list["anci"]="ance";
        step2list["izer"]="ize";
        step2list["bli"]="ble";
        step2list["alli"]="al";
        step2list["entli"]="ent";
        step2list["eli"]="e";
        step2list["ousli"]="ous";
        step2list["ization"]="ize";
        step2list["ation"]="ate";
        step2list["ator"]="ate";
        step2list["alism"]="al";
        step2list["iveness"]="ive";
        step2list["fulness"]="ful";
        step2list["ousness"]="ous";
        step2list["aliti"]="al";
        step2list["iviti"]="ive";
        step2list["biliti"]="ble";
        step2list["logi"]="log";
        
        var step3list = new Array();
        step3list["icate"]="ic";
        step3list["ative"]="";
        step3list["alize"]="al";
        step3list["iciti"]="ic";
        step3list["ical"]="ic";
        step3list["ful"]="";
        step3list["ness"]="";

        var c = "[^aeiou]";          // consonant
        var v = "[aeiouy]";          // vowel
        var C = c + "[^aeiouy]*";    // consonant sequence
        var V = v + "[aeiou]*";      // vowel sequence
        
        var mgr0 = "^(" + C + ")?" + V + C;               // [C]VC... is m>0
        var meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$";  // [C]VC[V] is m=1
        var mgr1 = "^(" + C + ")?" + V + C + V + C;       // [C]VCVC... is m>1
        var s_v   = "^(" + C + ")?" + v;                   // vowel in stem

        return function(word) {
	        
	        var stem;
	        var suffix;
	        var firstch;
	        var origword = w;
	        var w = word;
	        
	        if (word.length < 3) { return word; }
	
	        var re;
	        var re2;
	        var re3;
	        var re4;
	
	        firstch = word.substr(0,1);
	        if (firstch == "y") {
	                w = firstch.toUpperCase() + w.substr(1);
	        }
	
	        // Step 1a
	        re = /^(.+?)(ss|i)es$/;
	        re2 = /^(.+?)([^s])s$/;
	
	        if (re.test(w)) { w = w.replace(re,"$1$2"); }
	        else if (re2.test(w)) { w = w.replace(re2,"$1$2"); }
	
	        // Step 1b
	        re = /^(.+?)eed$/;
	        re2 = /^(.+?)(ed|ing)$/;
	        if (re.test(w)) {
	                var fp = re.exec(w);
	                re = new RegExp(mgr0);
	                if (re.test(fp[1])) {
	                        re = /.$/;
	                        w = w.replace(re,"");
	                }
	        } else if (re2.test(w)) {
	                var fp = re2.exec(w);
	                stem = fp[1];
	                re2 = new RegExp(s_v);
	                if (re2.test(stem)) {
	                        w = stem;
	                        re2 = /(at|bl|iz)$/;
	                        re3 = new RegExp("([^aeiouylsz])\\1$");
	                        re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
	                        if (re2.test(w)) {      w = w + "e"; }
	                        else if (re3.test(w)) { re = /.$/; w = w.replace(re,""); }
	                        else if (re4.test(w)) { w = w + "e"; }
	                }
	        }
	
	        // Step 1c
	        re = /^(.+?)y$/;
	        if (re.test(w)) {
	                var fp = re.exec(w);
	                stem = fp[1];
	                re = new RegExp(s_v);
	                if (re.test(stem)) { w = stem + "i"; }
	        }
	
	        // Step 2
	        re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
	        if (re.test(w)) {
	                var fp = re.exec(w);
	                stem = fp[1];
	                suffix = fp[2];
	                re = new RegExp(mgr0);
	                if (re.test(stem)) {
	                        w = stem + step2list[suffix];
	                }
	        }
	
	        // Step 3
	        re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
	        if (re.test(w)) {
	                var fp = re.exec(w);
	                stem = fp[1];
	                suffix = fp[2];
	                re = new RegExp(mgr0);
	                if (re.test(stem)) {
	                        w = stem + step3list[suffix];
	                }
	        }
	
	        // Step 4
	        re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
	        re2 = /^(.+?)(s|t)(ion)$/;
	        if (re.test(w)) {
	                var fp = re.exec(w);
	                stem = fp[1];
	                re = new RegExp(mgr1);
	                if (re.test(stem)) {
	                        w = stem;
	                }
	        } else if (re2.test(w)) {
	                var fp = re2.exec(w);
	                stem = fp[1] + fp[2];
	                re2 = new RegExp(mgr1);
	                if (re2.test(stem)) {
	                        w = stem;
	                }
	        }
	
	        // Step 5
	        re = /^(.+?)e$/;
	        if (re.test(w)) {
	                var fp = re.exec(w);
	                stem = fp[1];
	                re = new RegExp(mgr1);
	                re2 = new RegExp(meq1);
	                re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
	                if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
	                        w = stem;
	                }
	        }
	
	        re = /ll$/;
	        re2 = new RegExp(mgr1);
	        if (re.test(w) && re2.test(w)) {
	                re = /.$/;
	                w = w.replace(re,"");
	        }
	
	        // and turn initial Y back to y
	
	        if (firstch == "y") {
	                w = firstch.toLowerCase() + w.substr(1);
	        }
	
	        return w;
        }
	})();

	
	var stopwords = {
	    "a" : 1, "a's" : 1, "able" : 1, "about" : 1, "above" : 1, "according" : 1, "accordingly" : 1, "across" : 1,
	    "actually" : 1, "after" : 1, "afterwards" : 1, "again" : 1, "against" : 1, "ain't" : 1, "all" : 1, "allow" : 1,
	    "allows" : 1, "almost" : 1, "alone" : 1, "along" : 1, "already" : 1, "also" : 1, "although" : 1, "always" : 1,
	    "am" : 1, "among" : 1, "amongst" : 1, "an" : 1, "and" : 1, "another" : 1, "any" : 1, "anybody" : 1,
	    "anyhow" : 1, "anyone" : 1, "anything" : 1, "anyway" : 1, "anyways" : 1, "anywhere" : 1, "apart" : 1,
	    "appear" : 1, "appreciate" : 1, "appropriate" : 1, "are" : 1, "aren't" : 1, "around" : 1, "as" : 1,
	    "aside" : 1, "ask" : 1, "asking" : 1, "associated" : 1, "at" : 1, "available" : 1, "away" : 1, "awfully" : 1,
	    "b" : 1, "be" : 1, "became" : 1, "because" : 1, "become" : 1, "becomes" : 1, "becoming" : 1, "been" : 1,
	    "before" : 1, "beforehand" : 1, "behind" : 1, "being" : 1, "believe" : 1, "below" : 1, "beside" : 1,
	    "besides" : 1, "best" : 1, "better" : 1, "between" : 1, "beyond" : 1, "both" : 1, "brief" : 1, "but" : 1,
	    "by" : 1, "c" : 1, "c'mon" : 1, "c's" : 1, "came" : 1, "can" : 1, "can't" : 1, "cannot" : 1, "cant" : 1,
	    "cause" : 1, "causes" : 1, "certain" : 1, "certainly" : 1, "changes" : 1, "clearly" : 1, "co" : 1, "com" : 1,
	    "come" : 1, "comes" : 1, "concerning" : 1, "consequently" : 1, "consider" : 1, "considering" : 1,
	    "contain" : 1, "containing" : 1, "contains" : 1, "corresponding" : 1, "could" : 1, "couldn't" : 1,
	    "course" : 1, "currently" : 1, "d" : 1, "definitely" : 1, "described" : 1, "despite" : 1, "did" : 1,
	    "didn't" : 1, "different" : 1, "do" : 1, "does" : 1, "doesn't" : 1, "doing" : 1, "don't" : 1, "done" : 1,
	    "down" : 1, "downwards" : 1, "during" : 1, "e" : 1, "each" : 1, "edu" : 1, "eg" : 1, "eight" : 1, "either" : 1,
	    "else" : 1, "elsewhere" : 1, "enough" : 1, "entirely" : 1, "especially" : 1, "et" : 1, "etc" : 1, "even" : 1,
	    "ever" : 1, "every" : 1, "everybody" : 1, "everyone" : 1, "everything" : 1, "everywhere" : 1, "ex" : 1,
	    "exactly" : 1, "example" : 1, "except" : 1, "f" : 1, "far" : 1, "few" : 1, "fifth" : 1, "first" : 1,
	    "five" : 1, "followed" : 1, "following" : 1, "follows" : 1, "for" : 1, "former" : 1, "formerly" : 1,
	    "forth" : 1, "four" : 1, "from" : 1, "further" : 1, "furthermore" : 1, "g" : 1, "get" : 1, "gets" : 1,
	    "getting" : 1, "given" : 1, "gives" : 1, "go" : 1, "goes" : 1, "going" : 1, "gone" : 1, "got" : 1,
	    "gotten" : 1, "greetings" : 1, "h" : 1, "had" : 1, "hadn't" : 1, "happens" : 1, "hardly" : 1, "has" : 1,
	    "hasn't" : 1, "have" : 1, "haven't" : 1, "having" : 1, "he" : 1, "he's" : 1, "hello" : 1, "help" : 1,
	    "hence" : 1, "her" : 1, "here" : 1, "here's" : 1, "hereafter" : 1, "hereby" : 1, "herein" : 1, "hereupon" : 1,
	    "hers" : 1, "herself" : 1, "hi" : 1, "him" : 1, "himself" : 1, "his" : 1, "hither" : 1, "hopefully" : 1,
	    "how" : 1, "howbeit" : 1, "however" : 1, "i" : 1, "i'd" : 1, "i'll" : 1, "i'm" : 1, "i've" : 1, "ie" : 1,
	    "if" : 1, "ignored" : 1, "immediate" : 1, "in" : 1, "inasmuch" : 1, "inc" : 1, "indeed" : 1, "indicate" : 1,
	    "indicated" : 1, "indicates" : 1, "inner" : 1, "insofar" : 1, "instead" : 1, "into" : 1, "inward" : 1,
	    "is" : 1, "isn't" : 1, "it" : 1, "it'd" : 1, "it'll" : 1, "it's" : 1, "its" : 1, "itself" : 1, "j" : 1,
	    "just" : 1, "k" : 1, "keep" : 1, "keeps" : 1, "kept" : 1, "know" : 1, "knows" : 1, "known" : 1, "l" : 1,
	    "last" : 1, "lately" : 1, "later" : 1, "latter" : 1, "latterly" : 1, "least" : 1, "less" : 1, "lest" : 1,
	    "let" : 1, "let's" : 1, "like" : 1, "liked" : 1, "likely" : 1, "little" : 1, "look" : 1, "looking" : 1,
	    "looks" : 1, "ltd" : 1, "m" : 1, "mainly" : 1, "many" : 1, "may" : 1, "maybe" : 1, "me" : 1, "mean" : 1,
	    "meanwhile" : 1, "merely" : 1, "might" : 1, "more" : 1, "moreover" : 1, "most" : 1, "mostly" : 1, "much" : 1,
	    "must" : 1, "my" : 1, "myself" : 1, "n" : 1, "name" : 1, "namely" : 1, "nd" : 1, "near" : 1, "nearly" : 1,
	    "necessary" : 1, "need" : 1, "needs" : 1, "neither" : 1, "never" : 1, "nevertheless" : 1, "new" : 1,
	    "next" : 1, "nine" : 1, "no" : 1, "nobody" : 1, "non" : 1, "none" : 1, "noone" : 1, "nor" : 1, "normally" : 1,
	    "not" : 1, "nothing" : 1, "novel" : 1, "now" : 1, "nowhere" : 1, "o" : 1, "obviously" : 1, "of" : 1, "off" : 1,
	    "often" : 1, "oh" : 1, "ok" : 1, "okay" : 1, "old" : 1, "on" : 1, "once" : 1, "one" : 1, "ones" : 1,
	    "only" : 1, "onto" : 1, "or" : 1, "other" : 1, "others" : 1, "otherwise" : 1, "ought" : 1, "our" : 1,
	    "ours" : 1, "ourselves" : 1, "out" : 1, "outside" : 1, "over" : 1, "overall" : 1, "own" : 1, "p" : 1,
	    "particular" : 1, "particularly" : 1, "per" : 1, "perhaps" : 1, "placed" : 1, "please" : 1, "plus" : 1,
	    "possible" : 1, "presumably" : 1, "probably" : 1, "provides" : 1, "q" : 1, "que" : 1, "quite" : 1, "qv" : 1,
	    "r" : 1, "rather" : 1, "rd" : 1, "re" : 1, "really" : 1, "reasonably" : 1, "regarding" : 1, "regardless" : 1,
	    "regards" : 1, "relatively" : 1, "respectively" : 1, "right" : 1, "s" : 1, "said" : 1, "same" : 1, "saw" : 1,
	    "say" : 1, "saying" : 1, "says" : 1, "second" : 1, "secondly" : 1, "see" : 1, "seeing" : 1, "seem" : 1,
	    "seemed" : 1, "seeming" : 1, "seems" : 1, "seen" : 1, "self" : 1, "selves" : 1, "sensible" : 1, "sent" : 1,
	    "serious" : 1, "seriously" : 1, "seven" : 1, "several" : 1, "shall" : 1, "she" : 1, "should" : 1,
	    "shouldn't" : 1, "since" : 1, "six" : 1, "so" : 1, "some" : 1, "somebody" : 1, "somehow" : 1, "someone" : 1,
	    "something" : 1, "sometime" : 1, "sometimes" : 1, "somewhat" : 1, "somewhere" : 1, "soon" : 1, "sorry" : 1,
	    "specified" : 1, "specify" : 1, "specifying" : 1, "still" : 1, "sub" : 1, "such" : 1, "sup" : 1, "sure" : 1,
	    "t" : 1, "t's" : 1, "take" : 1, "taken" : 1, "tell" : 1, "tends" : 1, "th" : 1, "than" : 1, "thank" : 1,
	    "thanks" : 1, "thanx" : 1, "that" : 1, "that's" : 1, "thats" : 1, "the" : 1, "their" : 1, "theirs" : 1,
	    "them" : 1, "themselves" : 1, "then" : 1, "thence" : 1, "there" : 1, "there's" : 1, "thereafter" : 1,
	    "thereby" : 1, "therefore" : 1, "therein" : 1, "theres" : 1, "thereupon" : 1, "these" : 1, "they" : 1,
	    "they'd" : 1, "they'll" : 1, "they're" : 1, "they've" : 1, "think" : 1, "third" : 1, "this" : 1,
	    "thorough" : 1, "thoroughly" : 1, "those" : 1, "though" : 1, "three" : 1, "through" : 1, "throughout" : 1,
	    "thru" : 1, "thus" : 1, "to" : 1, "together" : 1, "too" : 1, "took" : 1, "toward" : 1, "towards" : 1,
	    "tried" : 1, "tries" : 1, "truly" : 1, "try" : 1, "trying" : 1, "twice" : 1, "two" : 1, "u" : 1, "un" : 1,
	    "under" : 1, "unfortunately" : 1, "unless" : 1, "unlikely" : 1, "until" : 1, "unto" : 1, "up" : 1, "upon" : 1,
	    "us" : 1, "use" : 1, "used" : 1, "useful" : 1, "uses" : 1, "using" : 1, "usually" : 1, "uucp" : 1, "v" : 1,
	    "value" : 1, "various" : 1, "very" : 1, "via" : 1, "viz" : 1, "vs" : 1, "w" : 1, "want" : 1, "wants" : 1,
	    "was" : 1, "wasn't" : 1, "way" : 1, "we" : 1, "we'd" : 1, "we'll" : 1, "we're" : 1, "we've" : 1, "welcome" : 1,
	    "well" : 1, "went" : 1, "were" : 1, "weren't" : 1, "what" : 1, "what's" : 1, "whatever" : 1, "when" : 1,
	    "whence" : 1, "whenever" : 1, "where" : 1, "where's" : 1, "whereafter" : 1, "whereas" : 1, "whereby" : 1,
	    "wherein" : 1, "whereupon" : 1, "wherever" : 1, "whether" : 1, "which" : 1, "while" : 1, "whither" : 1,
	    "who" : 1, "who's" : 1, "whoever" : 1, "whole" : 1, "whom" : 1, "whose" : 1, "why" : 1, "will" : 1,
	    "willing" : 1, "wish" : 1, "with" : 1, "within" : 1, "without" : 1, "won't" : 1, "wonder" : 1, "would" : 1,
	    "would" : 1, "wouldn't" : 1, "x" : 1, "y" : 1, "yes" : 1, "yet" : 1, "you" : 1, "you'd" : 1, "you'll" : 1,
	    "you're" : 1, "you've" : 1, "your" : 1, "yours" : 1, "yourself" : 1, "yourselves" : 1, "z" : 1, "zero" : 1 };

	NAMESPACE.english.stopword_remover = function(word, callback) {
		return NAMESPACE.filter_in_array(word, stopwords, callback);
	};
	
	return NAMESPACE;
	
})(fullproof.normalizer||{});

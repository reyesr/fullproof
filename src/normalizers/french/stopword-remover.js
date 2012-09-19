var fullproof = (function(NAMESPACE) {

	NAMESPACE.french = NAMESPACE.french||{};
	
	/**
	 * Stopword list, based on http://members.unine.ch/jacques.savoy/clef/
	 * Works for lowercased words, with or without diacritical marks
	 */
	var stopwords = {
	    "a" : 1, "à" : 1, "â" : 1, "abord" : 1, "afin" : 1, "ah" : 1, "ai" : 1, "aie" : 1, "ainsi" : 1, "allaient" : 1,
	    "allo" : 1, "allô" : 1, "allons" : 1, "après" : 1, "apres" : 1, "assez" : 1, "attendu" : 1, "au" : 1,
	    "aucun" : 1, "aucune" : 1, "aujourd" : 1, "aujourd'hui" : 1, "auquel" : 1, "aura" : 1, "auront" : 1,
	    "aussi" : 1, "autre" : 1, "autres" : 1, "aux" : 1, "auxquelles" : 1, "auxquels" : 1, "avaient" : 1,
	    "avais" : 1, "avait" : 1, "avant" : 1, "avec" : 1, "avoir" : 1, "ayant" : 1, "b" : 1, "bah" : 1,
	    "beaucoup" : 1, "bien" : 1, "bigre" : 1, "boum" : 1, "bravo" : 1, "brrr" : 1, "c" : 1, "ça" : 1, "ca" : 1,
	    "car" : 1, "ce" : 1, "ceci" : 1, "cela" : 1, "celle" : 1, "celle-ci" : 1, "celle-là" : 1, "celle-la" : 1,
	    "celles" : 1, "celles-ci" : 1, "celles-là" : 1, "celles-la" : 1, "celui" : 1, "celui-ci" : 1, "celui-là" : 1,
	    "celui-la" : 1, "cent" : 1, "cependant" : 1, "certain" : 1, "certaine" : 1, "certaines" : 1, "certains" : 1,
	    "certes" : 1, "ces" : 1, "cet" : 1, "cette" : 1, "ceux" : 1, "ceux-ci" : 1, "ceux-là" : 1, "ceux-la" : 1,
	    "chacun" : 1, "chaque" : 1, "cher" : 1, "chère" : 1, "chères" : 1, "chere" : 1, "cheres" : 1, "chers" : 1,
	    "chez" : 1, "chiche" : 1, "chut" : 1, "ci" : 1, "cinq" : 1, "cinquantaine" : 1, "cinquante" : 1,
	    "cinquantième" : 1, "cinquieme" : 1, "cinquantieme" : 1, "cinquième" : 1, "clac" : 1, "clic" : 1,
	    "combien" : 1, "comme" : 1, "comment" : 1, "compris" : 1, "concernant" : 1, "contre" : 1, "couic" : 1,
	    "crac" : 1, "d" : 1, "da" : 1, "dans" : 1, "de" : 1, "debout" : 1, "dedans" : 1, "dehors" : 1, "delà" : 1,
	    "dela" : 1, "depuis" : 1, "derrière" : 1, "derriere" : 1, "des" : 1, "dès" : 1, "désormais" : 1,
	    "desormais" : 1, "desquelles" : 1, "desquels" : 1, "dessous" : 1, "dessus" : 1, "deux" : 1, "deuxième" : 1,
	    "deuxièmement" : 1, "deuxieme" : 1, "deuxiemement" : 1, "devant" : 1, "devers" : 1, "devra" : 1,
	    "différent" : 1, "différente" : 1, "différentes" : 1, "différents" : 1, "different" : 1, "differente" : 1,
	    "differentes" : 1, "differents" : 1, "dire" : 1, "divers" : 1, "diverse" : 1, "diverses" : 1, "dix" : 1,
	    "dix-huit" : 1, "dixième" : 1, "dixieme" : 1, "dix-neuf" : 1, "dix-sept" : 1, "doit" : 1, "doivent" : 1,
	    "donc" : 1, "dont" : 1, "douze" : 1, "douzième" : 1, "douzieme" : 1, "dring" : 1, "du" : 1, "duquel" : 1,
	    "durant" : 1, "e" : 1, "effet" : 1, "eh" : 1, "elle" : 1, "elle-même" : 1, "elle-meme" : 1, "elles" : 1,
	    "elles-mêmes" : 1, "elles-memes" : 1, "en" : 1, "encore" : 1, "entre" : 1, "envers" : 1, "environ" : 1,
	    "es" : 1, "ès" : 1, "est" : 1, "et" : 1, "etant" : 1, "étaient" : 1, "étais" : 1, "était" : 1, "étant" : 1,
	    "etaient" : 1, "etais" : 1, "etait" : 1, "etc" : 1, "été" : 1, "ete" : 1, "etre" : 1, "être" : 1,
	    "eu" : 1, "euh" : 1, "eux" : 1, "eux-mêmes" : 1, "eux-memes" : 1, "excepté" : 1, "excepte" : 1, "f" : 1,
	    "façon" : 1, "facon" : 1, "fais" : 1, "faisaient" : 1, "faisant" : 1, "fait" : 1, "feront" : 1, "fi" : 1,
	    "flac" : 1, "floc" : 1, "font" : 1, "g" : 1, "gens" : 1, "h" : 1, "ha" : 1, "hé" : 1, "he" : 1, "hein" : 1,
	    "hélas" : 1, "helas" : 1, "hem" : 1, "hep" : 1, "hi" : 1, "ho" : 1, "holà" : 1, "hola" : 1, "hop" : 1,
	    "hormis" : 1, "hors" : 1, "hou" : 1, "houp" : 1, "hue" : 1, "hui" : 1, "huit" : 1, "huitième" : 1,
	    "huitieme" : 1, "hum" : 1, "hurrah" : 1, "i" : 1, "il" : 1, "ils" : 1, "importe" : 1, "j" : 1, "je" : 1,
	    "jusqu" : 1, "jusque" : 1, "k" : 1, "l" : 1, "la" : 1, "là" : 1, "la" : 1, "laquelle" : 1, "las" : 1, "le" : 1,
	    "lequel" : 1, "les" : 1, "lès" : 1, "lesquelles" : 1, "lesquels" : 1, "leur" : 1, "leurs" : 1, "longtemps" : 1,
	    "lorsque" : 1, "lui" : 1, "lui-même" : 1, "lui-meme" : 1, "m" : 1, "ma" : 1, "maint" : 1, "mais" : 1,
	    "malgré" : 1, "malgre" : 1, "me" : 1, "même" : 1, "mêmes" : 1, "meme" : 1, "memes" : 1, "merci" : 1, "mes" : 1,
	    "mien" : 1, "mienne" : 1, "miennes" : 1, "miens" : 1, "mille" : 1, "mince" : 1, "moi" : 1, "moi-même" : 1,
	    "moi-meme" : 1, "moins" : 1, "mon" : 1, "moyennant" : 1, "n" : 1, "na" : 1, "ne" : 1, "néanmoins" : 1,
	    "neanmoins" : 1, "neuf" : 1, "neuvième" : 1, "neuvieme" : 1, "ni" : 1, "nombreuses" : 1, "nombreux" : 1,
	    "non" : 1, "nos" : 1, "notre" : 1, "nôtre" : 1, "nôtres" : 1, "notres" : 1, "nous" : 1,
	    "nous-mêmes" : 1, "nous-memes" : 1, "nul" : 1, "o" : 1, "o|" : 1, "ô" : 1, "oh" : 1, "ohé" : 1, "olé" : 1,
	    "ollé" : 1, "ohe" : 1, "ole" : 1, "olle" : 1, "on" : 1, "ont" : 1, "onze" : 1, "onzième" : 1, "onzieme" : 1,
	    "ore" : 1, "ou" : 1, "où" : 1, "ouf" : 1, "ouias" : 1, "oust" : 1, "ouste" : 1, "outre" : 1, "p" : 1,
	    "paf" : 1, "pan" : 1, "par" : 1, "parmi" : 1, "partant" : 1, "particulier" : 1, "particulière" : 1,
	    "particulièrement" : 1, "particuliere" : 1, "particulierement" : 1, "pas" : 1, "passé" : 1, "passe" : 1,
	    "pendant" : 1, "personne" : 1, "peu" : 1, "peut" : 1, "peuvent" : 1, "peux" : 1, "pff" : 1, "pfft" : 1,
	    "pfut" : 1, "pif" : 1, "plein" : 1, "plouf" : 1, "plus" : 1, "plusieurs" : 1, "plutôt" : 1, "plutot" : 1,
	    "pouah" : 1, "pour" : 1, "pourquoi" : 1, "premier" : 1, "première" : 1, "premièrement" : 1, "près" : 1,
	    "premiere" : 1, "premierement" : 1, "pres" : 1, "proche" : 1, "psitt" : 1, "puisque" : 1, "q" : 1, "qu" : 1,
	    "quand" : 1, "quant" : 1, "quanta" : 1, "quant-à-soi" : 1, "quant-a-soi" : 1, "quarante" : 1, "quatorze" : 1,
	    "quatre" : 1, "quatre-vingt" : 1, "quatrième" : 1, "quatrièmement" : 1, "quatrieme" : 1, "quatriemement" : 1,
	    "que" : 1, "quel" : 1, "quelconque" : 1, "quelle" : 1, "quelles" : 1, "quelque" : 1, "quelques" : 1,
	    "quelqu'un" : 1, "quels" : 1, "qui" : 1, "quiconque" : 1, "quinze" : 1, "quoi" : 1, "quoique" : 1, "r" : 1,
	    "revoici" : 1, "revoilà" : 1, "revoila" : 1, "rien" : 1, "s" : 1, "sa" : 1, "sacrebleu" : 1, "sans" : 1,
	    "sapristi" : 1, "sauf" : 1, "se" : 1, "seize" : 1, "selon" : 1, "sept" : 1, "septième" : 1, "septieme" : 1,
	    "sera" : 1, "seront" : 1, "ses" : 1, "si" : 1, "sien" : 1, "sienne" : 1, "siennes" : 1, "siens" : 1,
	    "sinon" : 1, "six" : 1, "sixième" : 1, "sixieme" : 1, "soi" : 1, "soi-même" : 1, "soi-meme" : 1, "soit" : 1,
	    "soixante" : 1, "son" : 1, "sont" : 1, "sous" : 1, "stop" : 1, "suis" : 1, "suivant" : 1, "sur" : 1,
	    "surtout" : 1, "t" : 1, "ta" : 1, "tac" : 1, "tant" : 1, "te" : 1, "té" : 1, "te" : 1, "tel" : 1, "telle" : 1,
	    "tellement" : 1, "telles" : 1, "tels" : 1, "tenant" : 1, "tes" : 1, "tic" : 1, "tien" : 1, "tienne" : 1,
	    "tiennes" : 1, "tiens" : 1, "toc" : 1, "toi" : 1, "toi-même" : 1, "toi-meme" : 1, "ton" : 1, "touchant" : 1,
	    "toujours" : 1, "tous" : 1, "tout" : 1, "toute" : 1, "toutes" : 1, "treize" : 1, "trente" : 1, "très" : 1,
	    "tres" : 1, "trois" : 1, "troisième" : 1, "troisièmement" : 1, "troisieme" : 1, "troisiemement" : 1,
	    "trop" : 1, "tsoin" : 1, "tsouin" : 1, "tu" : 1, "u" : 1, "un" : 1, "une" : 1, "unes" : 1, "uns" : 1, "v" : 1,
	    "va" : 1, "vais" : 1, "vas" : 1, "vé" : 1, "ve" : 1, "vers" : 1, "via" : 1, "vif" : 1, "vifs" : 1, "vingt" : 1,
	    "vivat" : 1, "vive" : 1, "vives" : 1, "vlan" : 1, "voici" : 1, "voilà" : 1, "voila" : 1, "vont" : 1, "vos" : 1,
	    "votre" : 1, "vôtre" : 1, "vôtres" : 1, "votre" : 1, "votres" : 1, "vous" : 1, "vous-mêmes" : 1,
	    "vous-memes" : 1, "vu" : 1, "w" : 1, "x" : 1, "y" : 1, "z" : 1, "zut" : 1 };
	
	NAMESPACE.french.stopword_remover = function(word, callback) {
		return NAMESPACE.filter_in_object(word, stopwords, callback);
	};
	
	return NAMESPACE;
})(fullproof||{});

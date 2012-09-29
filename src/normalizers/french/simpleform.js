var fullproof = (function(NAMESPACE) {
    "use strict";

    NAMESPACE.french = NAMESPACE.french||{};

    NAMESPACE.french.simpleform = (function(){

        var suffix_removals_verbs_raw = [
            // Below, common verbs suffix first
            [/.../, /er(ai([st]?|ent)|i?(on[ts]|ez))$/, "e"],
            [/.../, /ass(i?(ez?|ons)|e(nt|s)?)$/, "e"], // asse, asses, assez, assiez, assies*, if root length >= 3
            [/.../, /assions$/, "e"], // assions if root lengh>=3
            [/.../, /assent$/, "e"],   // assent if root lengh>=3

            [/endr(ez?|ai[st]?|on[st])$/, "ã"],		// endrez, endrai, endrais, endrait, endrons, endront

            [/.../, /iss(i?(ons|ez)|ai[st]?|ant(es?)?|es?)$/, "" ], // issions, issiez, issais, issait, issai, issant, issante, issantes, isses

            [/irai(s|(en)?t)?$/, ""], // irai, irait, irais, iraient

            [/.../, /e?oi(re?|t|s|ent)$/, ""],  // eoir, eoire, oir, oire, oit, ois, oient

            [/.../, /aient$/, ""],     // removes aient
            [/.../, /a[mt]es$/, ""], // removes ames, ates
            [/i?ons$/, ""],   // removes ons, ions
            [/ait$/, ""],     // removes ait
            [/ent$/, ""],     // removes ent
            [/i?e[rz]$/, "e"] // removes er, ez, iez

        ];

        var suffix_removals_nouns_raw = [
            [/inages?$/, "1"],	// "copinage" > "cop1"
            [/.../, /ages?$/, ""], // "habillage" > "habill"
            [/.../, /[aoie]tions?$/, ""], // "déclaration" > "déclar", not "nation"
            [/og(ies?|ues?)$/, "og"], // "philologie" -> "philolog", "philologue" -> "philolog"
            [/t(rices?|euses?)$/, "ter"], // "fédératrice" -> "fédérater","flatteuse" -> "flatter" (eur is -> er by another rule)
            [/.../, /e(uses?|ries?|urs?)$/, "er"], // euse, euses, eries, eries, eur (flatteuse, flatterie, flatteur)
            [/utions$/, "u"], // "pollution", "attribution" ! produces a "u", because "uer"$ is not removed (but "er"$ is).
            [/[ae]n[cs]es?$/, "ãS"], // prudence" -> "prudã", "tolérance" -> "tolérã"
            [/..al/, /ites?$/, ""], // // "anormalite" -> "anormal"
            [/[ea]mment/, "ã"], // prudemment -> "prudã"
            //
            //not processed:
            //* usion$ : not an interesting simplification, as there are not
            //  enough nominal cases. i.e. "diffusion", but "illusion",
            // "exclusion", "contusion", etc.
            [/ives?$/, "if"], // // "consécutives" -> con
            [/istes?$/, "isme"], // maybe a bit aggressive ?
            [/ables?$/, ""], // "chiffrable" -> "chiffr". aggressive ?
            [/[^ae]/, /ines?$/, "1"] // "citadine"->"citadin"
        ];

        var phonetic_transforms_raw = [

            [/n/, /t/, /iel/, "S"],
            [false, /t/, /i[oea]/, "S"],

            // the A LETTER
            [false, /ain/, /[^aeiouymn].*|$/, "1" ], // copain->cop1, complainte->compl1te
            [/ai(s$)?/, "e"],
            [false, /am/, /[^aeiouymn].*|$/, "ã" ], //  crampe->crãpe
            [/aux?$/, "al"], // tribunaux->tribunal
            [/e?au(x$)?/, "o"], // beaux->bo, bateau->bato, journaux->journo
            [/an(te?s?|s)$/, "ã"], //
            [false, /an/, /[^aeiouymn].*|$/, "ã" ],
            [/r[dt]s?$/, "r"],
            // Process the e letter
            // The e letter is probably the most complicated of all
            [false, /ein/, /[^aeiouymn].*|$/, "1"], // frein, teint
            [/e[ui]/, "e"],// peine, pleurer, bleu
            [/en[td]$/, "ã"], // client, prend, fend
            [/i/, /en/, /[^aeiouymn].*|$/, "1"], // norvégien, rien
            [false, /en/, /[^aeiouymn].*|$/, "ã"], // tente->tãte
            [/ets?$/, "e"], // violet, triplets
            [false, /e/, /o/, ""], // like surseoir

            // Process the i letter

            [/ier(s|es?)?$/, ""], // ier, iere, iere, ieres
            [false, /i[nm]/, /[^aeiouymn].*|$/, "1"], // malintentionné->mal1tentionné
            [/ill/, "y"], // paille->paye, rouille->rouye

            // Process the o letter
            [false, /on/, /[^aeiouyhnm].*|$/, "ô"],
            [false, /ouin/, /[^aeiouymn].*|$/, "o1"],
            [/oe(u(d$)?)?/, "e"],

            // Process the u letter
            [false, /un/, /[^aeiouymn].*|$/, "1"],
            [/u[st]$/, "u"], // "résidus", "crut" TODO better remove /[st]$/ ?

            // Process the y letter
            [/yer$/, "i"], // "ennuyer"->ennui, "appuyer"->appui
            [/[^aeiouy]/, /ym/, /[^aeiouy].*|$/, "1"], // "symbole", "nymphe", "sympa"
            [/[^aeiouy]/, /yn/, /[^aeiouynm].*|$/, "1"], // "syndicat", "synchro"
            [/[^aeiouy]/, /y/, "i"],  // "dynamite"

            [/[aeiouy]/, /s/, /[aeiouy]/, "z"],
            [/sc?h/, "ch"],

            [/gu/, "g"],
            [false, /g/, /[^aorl].*/, "j"],

            [/ph/, "f"],
            [/[^t]/, /t/, /ion/, "ss"],

            [/qu?/, "k"],
            [false, /c/, /[auorlt]/, "k"],

            [/[aeiou]/, /s/, /[aeiou]/, "z"],
            [/[^c]/, /h/, ""],
            [/^h/, ""],

            [/[oiua]/, /t$/, false, ""],

            [/es?$/, ""], // final e

            //plural
            [/[xs]$/, ""]

        ];

        function post_process_arrays(arr) {
            var result = [];
            for (var i=0; i<arr.length; ++i) {
                var obj = arr[i];
                if (obj) {
                    switch(obj.length) {
                        case 2:
                            result.push([new RegExp("(.*)("+obj[0].source+")(.*)"),obj[1]]);
                            break;
                        case 3:
                            result.push([new RegExp( (obj[0]?"(.*"+obj[0].source+")":"(.*)") + "("+obj[1].source+")" + "(.*)"),obj[2]]);
                            break;
                        case 4:
                            result.push([new RegExp( (obj[0]?"(.*"+obj[0].source+")":"(.*)") + "("+obj[1].source+")" + (obj[2]?"("+obj[2].source+".*)":"(.*)")),obj[3]]);
                            break;
                    }
                }
            }
            return result;
        }

        var suffix_removals_verbs = post_process_arrays(suffix_removals_verbs_raw);
        var suffix_removals_nouns = post_process_arrays(suffix_removals_nouns_raw);
        var phonetic_transforms = post_process_arrays(phonetic_transforms_raw);

        function apply_regexp_array(word, regarray, stopOnFirstMatch) {
//            var org = word;
//			console.log("==== applying rules on " + word + " ========");

            for (var i=0; i<regarray.length; ++i) {

                var res = regarray[i][0].exec(word);
                if (res) {
//					console.log("matched rule " + regarray[i][0].source + " -> " + regarray[i][1] + ", length: " + res.length);
//					console.log("re: " + regarray[i][0].lastIndex + " / " + res.index);
//					console.log(res);

                    var p1 = res[1];
                    var p2 = regarray[i][1];
                    var p3 = res[res.length-1];
                    word = p1 + p2 + p3;

//					console.log("word is now " + word + "  (" + p1 +" + " + p2 + " + " + p3 + "), before: " + org);

                    if (stopOnFirstMatch) {
                        i = regarray.length;
                    }
                }
            }
            return word;
        }


        return function(word, verbs, nouns, phonetic) {
            verbs = verbs===undefined?true:verbs;
            nouns = nouns===undefined?true:nouns;
            phonetic = phonetic===undefined?true:phonetic;

            if (verbs) {
                word = apply_regexp_array(word, suffix_removals_verbs, true);
            }
            if (nouns) {
                word = apply_regexp_array(word, suffix_removals_nouns, true);
            }
            if (phonetic) {
                word = apply_regexp_array(word, phonetic_transforms, false);
            }
            return NAMESPACE.normalizer.remove_duplicate_letters(word.toLowerCase());
        };
    })();

    return NAMESPACE;
})(fullproof||{});

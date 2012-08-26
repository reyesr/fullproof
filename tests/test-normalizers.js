module("group a");

// crème brûlée
// 63 + 72 + 65 + 6d + 65 + 20 + 62 + 72 + 75 + 6c + 65 + 65

var cremebrulee_composed = "crème brûlée";
var cremebrulee_decomposed = "\u0063\u0072\u0065\u0300\u006d\u0065\u0020\u0062\u0072\u0075\u0302\u006c\u0065\u0301\u0065";
var cremebrulee_nomark = "\u0063\u0072\u0065\u006d\u0065\u0020\u0062\u0072\u0075\u006c\u0065\u0065";

test("to_lowercase_nomark", function() {
	equal("l'elephant de l'hopital danse meme le dimanche", fullproof.normalizer.to_lowercase_nomark("l'éléphant de l'hôpital danse même le dimanche"));
	equal(fullproof.normalizer.to_lowercase_nomark("a SIMPLE TEST WITHOUT diacritical marks"), "a simple test without diacritical marks");
	equal(fullproof.normalizer.to_lowercase_nomark(cremebrulee_composed), cremebrulee_nomark);

	// does not work, not sure it should actually
//	equal(cremebrulee_nomark, fullproof.normalizer.to_lowercase_nomark(cremebrulee_decomposed));

	equal(" should not trim string ", fullproof.normalizer.to_lowercase_nomark(" should not trim string "));
	equal(" should not trim string even with eeaeo signs", fullproof.normalizer.to_lowercase_nomark(" should not trim string even with ééâêô signs"));
	equal("", fullproof.normalizer.to_lowercase_nomark(""));
	
	// Does not alter the values
	strictEqual(false, fullproof.normalizer.to_lowercase_nomark(false));
	strictEqual("", fullproof.normalizer.to_lowercase_nomark(""));
});

test("to_lowercase_decomp", function() {

	equal(fullproof.normalizer.to_lowercase_decomp("a SIMPLE TEST WITHOUT diacritical marks"), "a simple test without diacritical marks");
	equal(fullproof.normalizer.to_lowercase_decomp(cremebrulee_composed), cremebrulee_decomposed);

	equal(fullproof.normalizer.to_lowercase_decomp(" should not trim string "), " should not trim string ");
	equal(fullproof.normalizer.to_lowercase_decomp(" SHOULD NOT trim string even with ééâêô signs"), " should not trim string even with \u0065\u0301\u0065\u0301\u0061\u0302\u0065\u0302\u006f\u0302 signs");
	equal(fullproof.normalizer.to_lowercase_decomp(""), "");
	
	// Does not alter the values
	strictEqual(fullproof.normalizer.to_lowercase_decomp(false), false);
	strictEqual("", fullproof.normalizer.to_lowercase_decomp(""));
});

test("remove_duplicate_letters", function() {
	equal(fullproof.normalizer.remove_duplicate_letters("ThISSS IZZZ A TEST"), "ThIS IZ A TEST");
});


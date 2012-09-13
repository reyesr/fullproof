


function createConfigManagerTest(name, configManager) {
	
	module(name);
	test(name + "_set", function(){
		configManager.set("test1", "my value");
		var read = configManager.get("test1");
		equal(read, "my value");
	});

	test(name + "_set_longdata", function(){
		var str = "";
		for (var i=0; i<1000; ++i) {
			str += 'xxx'.replace(/[x]/g, function(c) {return String.fromCharCode(65+parseInt(Math.random()*26));	});
		}
		configManager.set("test1", str);
		var read = configManager.get("test1");
		equal(read, str);
	});

	test(name + "_remove", function(){
		configManager.set("test1", "my value");
		var read = configManager.get("test1");
		equal(read, "my value");
		configManager.remove("test1");
		read = configManager.get("test1");
		strictEqual(read, null);
	});
}


//createConfigManagerTest("cookies", new fullproof.ConfigManager(true));
//createConfigManagerTest("localStorage", new fullproof.ConfigManager());

test("chain", function() {
	expect(3);
	fullproof.chain(function(c) {
		ok(true);
		c();
	}, function(c) {
		ok(true);
		c();
	}, function(c) {
		ok(true);
		c();
	});
});
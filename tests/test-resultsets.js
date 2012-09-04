module("ResultSets");


function CustomObject(id) {
	if (!(this instanceof CustomObject)) {
		return new CustomObject(id);
	}
	this.id = parseInt(id);
	this.toString = function() {
		return id.toString();
	}
}

var CO = CustomObject;
var COMP = {
		lower_than: function(a,b) {
			return parseInt(a.id) < parseInt(b.id);
		},
		equals: function(a,b) {
			return a.id == b.id;
		}
	};

function buildResultSetOfCustomObject(size, func) {
	var result=new fullproof.ResultSet(COMP);
	for (var i=0; i<size; ++i) {
		var value = func?func(i):i;
		result.insert(new CustomObject(value));
	}
	return result;
}

function verifyResultSetsOfCustomOject(rs1,rs2) {
	var arr1 = (rs1 instanceof fullproof.ResultSet)?rs1.getDataUnsafe():rs1;
	var arr2 = (rs2 instanceof fullproof.ResultSet)?rs2.getDataUnsafe():rs2;
	equal(arr1.length,arr2.length);
	for (var i=0; i<arr1.length && i<arr2.length; ++i) {
		equal(arr1[i].id, arr2[i].id);
	}
}

test("resultsets_create", function() {
	var rs = new fullproof.ResultSet();
	ok(rs);
	ok(rs instanceof fullproof.ResultSet);
	
	var rs2 = fullproof.ResultSet();
	ok(rs2 instanceof fullproof.ResultSet);
});
console.log(fullproof);

//test("binarysearch", function() {
//	var arr = [1,3,4,5,6,9,20,30,50,100,101,102,105,110,120,130];
//	ok(true);
//	console.log("ARR LENGTH: " + arr.length);
//	for (var i=0; i<135; ++i) {
//		console.log("index of " + i + " = " + fullproof.binary_search(arr, i) + "\t   " + arr.join(","));
//	}
//});

test("merge", function() {
	var rs = new fullproof.ResultSet();
	rs.insert(1,2,5);
	rs.merge([0,1,3,5,6]);
	deepEqual(rs.getDataUnsafe(), [0,1,2,3,5,6])
});

test("merge_object", function() {
	var rs = new fullproof.ResultSet(COMP);
	rs.insert(CO(1),CO(2),CO(5));
	rs.merge([CO(0),CO(1),CO(3),CO(5),CO(6)]);
	var expected = [CO(0),CO(1),CO(2),CO(3),CO(5),CO(6)];
	var got = rs.getDataUnsafe();
	verifyResultSetsOfCustomOject(rs,expected);
});


test("merge_object_big", function() {
	var rs = buildResultSetOfCustomObject(1000);
	var rs2 = buildResultSetOfCustomObject(1000, function(v) {
		return v + 500;
	});
	var expected = buildResultSetOfCustomObject(1500);
	rs.merge(rs2);
	verifyResultSetsOfCustomOject(rs,expected);
});

test("merge-empty", function() {
	var rs = new fullproof.ResultSet();
	ok(rs);
	rs.merge([0,1,3,5,6]);
	deepEqual(rs.getDataUnsafe(), [0,1,3,5,6]);
	
	rs = new fullproof.ResultSet();
	rs.merge([]);
	deepEqual(rs.getDataUnsafe(), []);

	rs = new fullproof.ResultSet();
	rs.insert(1,2,3);
	rs.merge([]);
	deepEqual(rs.getDataUnsafe(), [1,2,3]);
});

test("merge-empty2", function() {
	var rs = new fullproof.ResultSet();
	var rs2 = new fullproof.ResultSet();
	rs.merge(rs2);
	deepEqual(rs.getDataUnsafe(), []);
	rs.merge([]);
	deepEqual(rs.getDataUnsafe(), []);
});

test("insert", function() {
	var rs = new fullproof.ResultSet();
	for (var i=0; i<10000; i+=2) {
		rs.insert(i);
	}
	var dd = rs.getDataUnsafe();
	equal(dd.length,10000/2);
});

test("insert_objects", function() {
	var rs = new fullproof.ResultSet(COMP);
	rs.insert(CO(1),CO(2),CO(5));
	rs.insert(CO(0),CO(1),CO(3),CO(5),CO(6));
	var expected = [CO(0),CO(1),CO(2),CO(3),CO(5),CO(6)];
	var got = rs.getDataUnsafe();
	verifyResultSetsOfCustomOject(rs,expected);
});


test("intersect", function(){
	var rs = new fullproof.ResultSet();
	rs.insert(1,2,5);
	rs.intersect([0,1,3,5,6]);
	deepEqual(rs.getDataUnsafe(), [1,5])
});

test("intersect_objects", function(){
	var rs = new fullproof.ResultSet(COMP);
	rs.insert(CO(1),CO(2),CO(5));
	var rs2 = new fullproof.ResultSet(COMP);
	rs2.insert(CO(0),CO(1),CO(3),CO(5),CO(6));
	rs.intersect(rs2);
	var expected = [CO(1),CO(5)];
	var got = rs.getDataUnsafe();
	verifyResultSetsOfCustomOject(rs,expected);
});

test("intersect_big", function() {
	var rs = new fullproof.ResultSet();
	for (var i=0; i<10000; i+=2) {
		rs.insert(i);
	}
	var rs2 = new fullproof.ResultSet();
	for (var i=1; i<10000; i+=2) {
		rs2.insert(i);
	}
	
	rs2.insert(50,100,150,200,250,302);
	
	rs.intersect(rs2);
	var dd = rs.getDataUnsafe();
	deepEqual(dd, [50,100,150,200,250,302])
});

test("intersect_object_big", function() {
	var rs = buildResultSetOfCustomObject(1000); // [ 0...1000]
	var rs2 = buildResultSetOfCustomObject(1000, function(v) {	return v + 500; }); // [500...1500]
	var expected = buildResultSetOfCustomObject(500, function(v) { return v+500;});; // [500...1000]
	rs.intersect(rs2);
	verifyResultSetsOfCustomOject(rs,expected);
});


test("substract", function(){
	var rs = new fullproof.ResultSet();
	rs.insert(1,2,5);
	rs.substract([0,1,3,5,6]);
	deepEqual(rs.getDataUnsafe(), [2])
});

test("substract_2", function(){
	var rs = new fullproof.ResultSet();
	rs.insert(1,2,3,4,5);
	rs.substract([0,1,3,5,6]);
	deepEqual(rs.getDataUnsafe(), [2,4])
});

test("substract_objects", function(){
	var rs = new fullproof.ResultSet(COMP);
	rs.insert(CO(0),CO(1),CO(3),CO(5),CO(6));
	var rs2 = new fullproof.ResultSet(COMP);
	rs2.insert(CO(1),CO(2),CO(5));
	rs.substract(rs2);
	var expected = [CO(0),CO(3),CO(6)];
	var got = rs.getDataUnsafe();
	verifyResultSetsOfCustomOject(rs, expected);
});

test("substract_object_big", function() {
	var rs = buildResultSetOfCustomObject(1000); // [ 0...1000]
	var rs2 = buildResultSetOfCustomObject(1000, function(v) {	return v + 500; }); // [500...1500]
	var expected = buildResultSetOfCustomObject(500, function(v) { return v;});; // [0...500]
	rs.substract(rs2);
	verifyResultSetsOfCustomOject(rs,expected);
});

test("substract_empty1", function(){
	var rs = new fullproof.ResultSet();
	rs.insert(1,2,3,4,5);
	rs.substract([]);
	deepEqual(rs.getDataUnsafe(), [1,2,3,4,5])
});

test("substract_empty2", function(){
	var rs = new fullproof.ResultSet();
	var rs2 = new fullproof.ResultSet();
	rs2.insert(1,2,3,4,5);
	rs.substract(rs2);
	deepEqual(rs.getDataUnsafe(), [])
});

test("substract_empty3", function(){
	var rs = new fullproof.ResultSet();
	var rs2 = new fullproof.ResultSet();
	rs.substract(rs2);
	deepEqual(rs.getDataUnsafe(), [])
});

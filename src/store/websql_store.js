var fullproof = fullproof || {};
fullproof.store = (function(NAMESPACE) {

	NAMESPACE.WebSQLStore = function(comparatorObject) {

		if (!(this instanceof NAMESPACE.WebSQLStore)) {
			return new NAMESPACE.WebSQLStore();
		}
		
		var db = null;

		var make_callback_caller = function(callback,value) {
			return function() {
				if (callback) {
					callback(value);
				}
			}
		};
		
		return {

			capabilities : {
				can_store_object : false,
				memory_based : false,
				disk_based : true,
				available : window.openDatabase ? true : false
			},

			tableName : undefined,
			opened : false,
			
			open : function(database, tablename, size, callback) {
				this.opened = false;
				this.tableName = name;
				db = openDatabase(database, '1.0', 'javascript search engine', size);
				this.tableName = tablename;
				var self = this;
								
				db.transaction(function(tx) {
					tx.executeSql("CREATE TABLE IF NOT EXISTS "+ self.tableName +" (id NCHAR(48), value)", [], 
							function() {
								tx.executeSql("CREATE INDEX IF NOT EXISTS "+ self.tableName +"_indx ON " + self.tableName + " (id)", [],
										function() {
											self.opened = true;
											if (callback) {
												callback(true);
											}
										},
										function() {
											console.log(arguments);
											if (callback) {
												callback(false);
											}
										});
							},
							function() {
								self.opened = false;
								if (callback) {
									callback(false);
								}
							});
				});
			},
			
			clear: function(callback) {
				var self = this;
				db.transaction(function(tx) {
					tx.executeSql("DELETE FROM "+ self.tableName, [], make_callback_caller(callback, true), make_callback_caller(callback, false));
				});
			},
			
			inject: function(word, value, callback) {
				var self = this;
				db.transaction(function(tx) {
					tx.executeSql("INSERT OR REPLACE INTO " + self.tableName + " (id,value) VALUES (?,?)", [word, value], make_callback_caller(callback, true), make_callback_caller(callback, false));
				});
			},
			
			/**
			 * WebSQLStore does not support object storage, only primary values, so we rely
			 * on the sql engine sorting functions. ORDER BY should provide fine results as long as
			 * the datatype of values is consistant.
			 */
			lookup: function(word, callback) {
				var self = this;
				db.transaction(function(tx) {
					tx.executeSql("SELECT * FROM " + self.tableName + " WHERE id=? ORDER BY value ASC", [word],
							function(tx,res) {
								var result = [];
								for (var i=0; i<res.rows.length; ++i) {
//									console.log("GOT A RES");
//									console.log(res.rows.item(i));
									result.push(res.rows.item(i).value);
								}
								callback(new fullproof.ResultSet(comparatorObject).setDataUnsafe(result));
							}, 
							function() {
								console.log(arguments);
								callback(false);
							});
				});
			}
		};
	};

	return NAMESPACE;

})(fullproof.store||{});

function getByTag(tag) {
    var db;
    var req = window.indexedDB.open("CR").onsuccess = function (event) {
        db = event.target.result;
        var transaction = db.transaction(["Stock"], "readonly");
        var objectStore = transaction.objectStore("Stock");
        var index = objectStore.index("SearchTags");
        var arr = [];

        var rangeTest = IDBKeyRange.only(tag);
        index.openCursor(rangeTest).onsuccess = function(e) {
            var cursor = e.target.result;
            if (cursor) {
                for(var field in cursor.value) {
                    arr.push(cursor.value);
                }
                cursor.continue();
            }
            console.log("lookup results: " + arr.length);
        };
    };
}
function getByPk(pk) {
    var db;
    var req = window.indexedDB.open("CR").onsuccess = function (event) {
        db = event.target.result;
        var transaction = db.transaction(["Stock"], "readonly");
        var objectStore = transaction.objectStore("Stock");
        var index = objectStore.index("Barcode_BizId");
        index.get(pk).onsuccess = function(e) {
            var cursor = e.target.result;
            console.dir(cursor);
        };
    };
}
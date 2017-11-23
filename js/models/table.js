"use strict";
/**
 * @returns {undefined}
 */
function buildTables (def) {
    var data = Data,
        service = Service;    
    return new Promise(function (res, rej) {
        function getType (type, format) {
            switch (type) {
            case "String":
                return " TEXT";
                break;
            case "Number":
                if (format === "Double" || format === "Money") {
                    return " REAL";
                } else {
                    return " INTEGER";
                }
                break;
            default:
                return " TEXT";
            }
        } 
        try {
        var i,
            createClause,
            fieldClause,
            pkClause,
            fkClause,
            sql,
            fields = [], pk = [], fk = [], fieldLen, pkLen, fkLen, fieldSQL = [],
            cb = function (err) {
                if (err) {
                    //console.log(sql + ": " + err);                    
                    Service.logError(sql + ": " + err);
                } else {
                    //console.log("tables created successfully!");
                }
            };
        // for each table.
        def.ModelTables.Rows.forEach(function (t, index) {
            createClause = "CREATE TABLE IF NOT EXISTS";
            pk = [];
            fk = [];
            fieldClause = "";
            pkClause = "";
            fkClause = "";
            fieldSQL = [];
            // get all fields
            fields = def.ModelFields.Rows.filter(function (row) {
                return (row.TableId === t.Id);
            });
            //console.log(fields.length + " fields in " + t.Name);
            if (fields.length === 0) {return;}

            // field declaration.
            fields.forEach(function (f) {
                var //name = "[" + f.Name + "]",
                    name = f.Name,
                    type = getType(f.DataType, f.DataFormat),
                    nul = (data.boolean(f.IsRequired))? " NOT NULL": "",
                    unq = (data.boolean(f.IsUnique))? " UNIQUE": "";                
                // foreign key constraints? only if the field is a mandatory field.
                //if (t.Name === "Customers") {console.log("Customers." + f.Name);}
                if (data.boolean(f.Related) && data.boolean(f.IsRequired)) {
                    fk.push({
                        field: f.Name,
                        table: def.ModelTables[f.RelatedTableId].Name,
                        refField: f.Related,
                        del: (data.boolean(def.ModelFields[f.CascadeDelete]))?
                            "CASCADE": "NO ACTION",
                        upd: (data.boolean(def.ModelFields[f.CascadeUpdate]))?
                            "CASCADE": "NO ACTION"
                    });
                }
                // primary key constraints?
                if (data.boolean(f.IsPK) || data.boolean(f.IsIndexed)) {
                    //console.log(f.Name + " is pk for " + t.Name);
                    pk.push(f.Name);
                }
                fieldSQL.push(name + type + nul + unq);
            });
            fieldLen = fieldSQL.length;
            pkLen = pk.length;
            fkLen = fk.length;            
            // fields clause
            for (i = 0; i < fieldLen; i++) {
                // add comma separator?
                fieldClause += (i > 0)? ", ": "";
                fieldClause += " " + fieldSQL[i];
                // field is pk?
                if (pkLen === 1) {
                    if (data.boolean(fields[i].IsPK)) {
                        fieldClause += " PRIMARY KEY";
                    }
                }                
            }
            // add table pk clause?
            if (pkLen > 1) {
                pkClause = ", PRIMARY KEY (";
                for (i = 0; i < pkLen; i++) {
                    // add comma separator?
                    pkClause += (i > 0)? ", ": "";
                    pkClause += " " + pk[i];
                }
                pkClause += ")";
            }
            // add fk clause?
            if (fkLen > 0) {
                // presence of fk is preventing records from being written to db.
                // consequently, commented out!!! 07 Aug 2017.
                /*for (i = 0; i < fkLen; i++) {
                    fkClause += ", FOREIGN KEY";
                    fkClause += " (" + fk[i].field + ")";
                    fkClause += " REFERENCES " + fk[i].table;
                    fkClause += " (" + fk[i].refField + ")";
                    fkClause += " ON DELETE " + fk[i].del;
                    fkClause += " ON UPDATE " + fk[i].upd;
                }*/
            }           
            // write sql
            createClause += " " + t.Name + " (";
            sql = createClause + fieldClause + pkClause + fkClause + ");";
            // create table
            //console.log(sql);
            fs.writeFile(Service.sqlPath + t.Name + ".txt", sql);
            data.runCreateSQL(sql, t.Name, cb);
            // resolve promise
            if (index === def.ModelTables.Rows.length - 1) {
                res();
            }
        });
    } catch (err) {
        console.log(err.stack);
        Service.logError(err);
    }
    });            
}
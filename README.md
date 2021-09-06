### Notes

* You need to compile `sql.js` with the flags
* Subquery for `MATCH`
* Primary Key problems?
* The FTS table reflects the original
* You need triggers for the FTS table!
  * Convention `table_after_{action}`
  * Convention `table_a{short_action}`
* `INSERT OR IGNORE`
* No in-place table schema mods
* Triggers? Gotta delete and re-insert!

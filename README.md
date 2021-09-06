### DSL

```sql
    CREATE TABLE IF NOT EXISTS things (
      id              TEXT NOT NULL UNIQUE,
      title           TEXT NOT NULL,
      category        TEXT,
      excerpt         TEXT,
      content         TEXT,
      modified        TEXT NOT NULL,
      url             TEXT NOT NULL,
      draft           INTEGER NOT NULL DEFAULT 0
    );

    CREATE VIRTUAL TABLE things_fts USING fts5(
      id,
      title,
      category,
      excerpt,
      content,
      modified,
      url,
      draft,
      content="things"
    );

    CREATE TRIGGER things_after_insert AFTER INSERT ON things
    BEGIN
      INSERT INTO things_fts (
        title,
        category,
        excerpt,
        content,
        modified,
        url,
        draft
      )
      VALUES (
        new.title,
        new.category,
        new.excerpt,
        new.content,
        new.modified,
        new.url,
        new.draft
      );
    END;

    CREATE TABLE IF NOT EXISTS "tags" (
      "name"	TEXT NOT NULL UNIQUE,
      PRIMARY KEY("name")
    );

    CREATE TABLE IF NOT EXISTS "tag_map" (
      "thing_id"	TEXT NOT NULL,
      "tag_name"	TEXT NOT NULL
    );
```

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

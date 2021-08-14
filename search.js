const REMOTE_DATABASE = "https://log.nikhil.io/things.db";

(async () => {
  config = {
    locateFile: (filename) => `/${filename}`,
  };
  const sqlPromise = initSqlJs({
    locateFile: (file) => `/${file}`,
  });

  const dataPromise = fetch(REMOTE_DATABASE).then((res) => res.arrayBuffer());
  const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
  const db = new SQL.Database(new Uint8Array(buf));
  const results = document.querySelector("div");
  const resultLabel = document.querySelector("h2");

  document.querySelector("input").addEventListener("keyup", (e) => {
    const term = e.target.value;

    if (term && term.length >= 3) {
      const searchStatement = db.prepare(`
            SELECT *
            FROM things
            WHERE title LIKE '%${term}%' OR search_content LIKE '%${term}%
            LIMIT 2
            ORDER BY modified DESC'
        `);

      searchStatement.bind({ ":term": term });

      let rows = [];
      let res = "";

      while (searchStatement.step()) {
        const row = searchStatement.getAsObject();
        rows.push(row);
      }

      const count = rows.length;
      rows.map(
        (row) =>
          (res += `
            <h3><a href="https://log.nikhil.io${row.url}">${row.title.replace(
            term,
            "<mark>" + term + "</mark>"
          )}</a></h3>
            <p>${row.excerpt.replace(term, "<mark>" + term + "</mark>")}</p>
        `)
      );

      searchStatement.free();
      results.innerHTML = res;
      resultLabel.innerHTML = `Found ${count === 0 ? "no" : count} result${
        count > 1 || count === 0 ? "s" : ""
      }`;
    } else {
      results.innerHTML = "";
      resultLabel.innerHTML = "";
    }
  });
})();

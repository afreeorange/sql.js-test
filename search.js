const REMOTE_DATABASE = "/things.db";

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
  const resultsSection = document.querySelector("#results");
  const tagsSection = document.querySelector("#tags");

  document.querySelector("input").addEventListener("keyup", (e) => {
    const term = e.target.value;

    if (term && term.length >= 3) {
      const thingSearchStatement = db.prepare(`
        SELECT 
            t.id,
            t.title,
            t.excerpt,
            t.modified,
            t.category,
            t.url,
            group_concat(m.tag_name) as tags
        FROM tag_map m
        INNER JOIN (
            SELECT *
            FROM things_fts t
            WHERE things_fts MATCH 'title:${term} OR content:${term}'
            ORDER BY modified DESC, RANK
        ) t ON m.thing_id = t.id
        GROUP BY t.id
        `);

      const tagSearchStatement = db.prepare(`
        SELECT 
            t.name as name,
            count(n.tag_name) as count
        FROM
            tags t
        INNER JOIN
            tag_map n
            ON n.tag_name = t.name
        WHERE
            t.name LIKE '%${term}%'
        GROUP BY
            t.name
        `);

      let rows = [];
      let tagRows = [];

      let res = "";
      let tagRes = "";

      while (tagSearchStatement.step()) {
        tagRows.push(tagSearchStatement.getAsObject());
      }

      while (thingSearchStatement.step()) {
        const row = thingSearchStatement.getAsObject();
        rows.push(row);
      }

      const count = rows.length;
      rows.map(
        (row) =>
          (res += `
              <h3><a href="https://log.nikhil.io${row.url}">${
            row.title
          }</a></h3>
              <p>${row.excerpt}</p>
              <small><strong>${row.category}</strong> &ndash; ${new Date(
            parseInt(row.modified)
          )} &ndash; ${row.tags
            .split(",")
            .map(
              (t) =>
                '<a href="https://log.nikhil.io/tags/' + t + '">' + t + "</a>"
            )
            .join(", ")} </small>
          `)
      );

      console.log("tagRows :>> ", tagRows);

      tagRows.map((t) => {
        tagRes +=
          '<a href="https://log.nikhil.io/tags/' +
          t.name +
          '">' +
          t.name +
          " (" +
          t.count +
          ")</a> ";
      });

      thingSearchStatement.free();
      resultsSection.innerHTML = res;
      resultsSection.innerHTML = `
      <h2>Found ${count === 0 ? "no" : count} result${
        count > 1 || count === 0 ? "s" : ""
      }</h2>
      ${res}
    `;
      tagsSection.innerHTML = `
        <h2>Tags</h2>
        ${tagRes}
      `;
    } else {
      resultsSection.innerHTML = "";
      tagsSection.innerHTML = "";
    }
  });
})();

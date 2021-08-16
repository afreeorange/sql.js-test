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
  const resultsSection = document.querySelector("#search-results");
  const tagsSection = document.querySelector("#tags");

  document.querySelector("#search input").addEventListener("keyup", (e) => {
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
        FROM
          tag_map m
        INNER JOIN (
              SELECT *
              FROM things_fts t
              WHERE things_fts MATCH 'title:${term}* OR content:${term}*'
              ORDER BY RANK
          )
          t ON m.thing_id = t.id
        GROUP BY
          t.id
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

      let res = "";
      let rows = [];
      while (thingSearchStatement.step()) {
        const row = thingSearchStatement.getAsObject();
        rows.push(row);
      }
      const count = rows.length;

      let tagRes = "";
      let tagRows = [];
      while (tagSearchStatement.step()) {
        tagRows.push(tagSearchStatement.getAsObject());
      }
      const tagCount = tagRows.length;

      rows.map(
        (row) =>
          (res += `
          <article>
            <header>
              <h2>
                <a href="https://log.nikhil.io${row.url}">${row.title}</a>
              </h2>
            </header>
            ${row.excerpt !== null ? `<p>${row.excerpt}</p>` : ""}
            <footer>
              <ul class="tags">
                ${row.tags
                  .split(",")
                  .map(
                    (t) => `
                    <li>
                      <a class="search-result-tag" title="Posts tagged ${t}" href="https://log.nikhil.io/tags/${t}">${t}</a>
                    </li>
                  `
                  )
                  .join("")}
              </ul>
              <time>
                ${new Date(parseInt(row.modified)).toDateString()}
              </time>
            </footer>
          </article>
        `)
      );

      tagRows.map((t) => {
        tagRes += `<li>
            <a href="https://log.nikhil.io/tags/${t.name}">${t.name} <span>${t.count}</span></a>
          </li> `;
      });

      thingSearchStatement.free();

      resultsSection.style.display = "block";
      tagsSection.style.display = "block";
      resultsSection.innerHTML = res;
      resultsSection.innerHTML = `
      ${
        count === 0
          ? `<div id="search-no-results">No posts with "${term}"</div>`
          : res
      }
    `;

      if (tagCount === 0) {
        tagsSection.style.display = "none";
      } else {
        tagsSection.innerHTML = `
          <ul class="list-of-things-with-count">
            ${tagRes}
          </ul>
        `;
      }
    } else {
      resultsSection.style.display = "none";
      tagsSection.style.display = "none";
    }
  });
})();

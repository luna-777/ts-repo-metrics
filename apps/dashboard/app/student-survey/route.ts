const html = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Student AI Usage Survey</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #151512;
      --panel: #22221f;
      --panel-2: #2a2a27;
      --text: #f5f2ea;
      --muted: #b8b2a5;
      --line: #3b3a35;
      --accent: #d6ff63;
      --accent-ink: #171713;
      --danger: #ff6b6b;
      --danger-bg: rgba(255, 107, 107, 0.16);
      --shadow: 0 18px 60px rgba(0, 0, 0, 0.28);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(214, 255, 99, 0.12), transparent 34rem),
        var(--bg);
      color: var(--text);
    }

    button, input { font: inherit; }

    .shell {
      width: min(1180px, calc(100% - 28px));
      margin: 0 auto;
      padding: 28px 0 56px;
    }

    .hero {
      display: grid;
      gap: 18px;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
      margin-bottom: 22px;
    }

    h1 {
      margin: 0 0 8px;
      letter-spacing: -0.04em;
      font-size: clamp(2rem, 5vw, 4.7rem);
      line-height: 0.95;
    }

    .subtitle {
      margin: 0;
      color: var(--muted);
      max-width: 720px;
      font-size: 1rem;
      line-height: 1.6;
    }

    .student-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 152px;
      padding: 14px 18px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.04);
      color: var(--accent);
      font-weight: 800;
      box-shadow: var(--shadow);
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      margin-bottom: 16px;
      background: linear-gradient(to bottom, var(--bg) 74%, rgba(21, 21, 18, 0));
    }

    .button-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .btn {
      min-height: 46px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 0 16px;
      background: var(--panel);
      color: var(--text);
      cursor: pointer;
      font-weight: 750;
      transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
    }

    .btn:hover { transform: translateY(-1px); border-color: #68675d; }
    .btn.primary { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
    .btn.danger { background: var(--danger-bg); color: #ffd0d0; border-color: rgba(255, 107, 107, 0.45); }

    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }

    .stat {
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.04);
    }

    .stat-label {
      color: var(--muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .stat-value {
      margin-top: 8px;
      font-size: 2rem;
      line-height: 1;
      font-weight: 850;
    }

    .section-title {
      margin: 24px 0 10px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 0.78rem;
      font-weight: 850;
    }

    .survey-grid {
      display: grid;
      gap: 10px;
    }

    .counter-card {
      display: grid;
      grid-template-columns: 48px minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      min-height: 76px;
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.055);
    }

    .number {
      color: var(--muted);
      text-align: center;
      font-weight: 800;
    }

    .question-name {
      display: block;
      font-size: 1rem;
      line-height: 1.3;
      font-weight: 820;
    }

    .question-meta {
      display: block;
      margin-top: 4px;
      color: var(--muted);
      font-size: 0.78rem;
    }

    .counter {
      display: grid;
      grid-template-columns: 48px 52px 48px;
      gap: 8px;
      align-items: center;
    }

    .count {
      text-align: center;
      font-size: 1.4rem;
      font-weight: 900;
      font-variant-numeric: tabular-nums;
    }

    .stepper {
      width: 48px;
      height: 48px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--panel-2);
      color: var(--text);
      cursor: pointer;
      font-size: 1.25rem;
      font-weight: 900;
    }

    .stepper:active, .btn:active { transform: scale(0.98); }

    .summary {
      display: none;
      margin-top: 26px;
      border-top: 1px solid var(--line);
      padding-top: 26px;
    }

    .summary.active { display: block; }

    .panel {
      border: 1px solid var(--line);
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.045);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .panel-head {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.035);
    }

    .panel-head h2 {
      margin: 0;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
    }

    .table-wrap { overflow-x: auto; }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 1080px;
    }

    th, td {
      padding: 12px 10px;
      border-bottom: 1px solid var(--line);
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    th {
      color: var(--muted);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background: rgba(0, 0, 0, 0.14);
    }

    td:first-child, th:first-child { text-align: left; position: sticky; left: 0; background: #252520; }
    tbody tr:hover td { background: rgba(214, 255, 99, 0.05); }

    .totals-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin: 18px 0;
    }

    .mini-card {
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 14px;
      background: rgba(255, 255, 255, 0.045);
    }

    .mini-card.low {
      border-color: rgba(255, 107, 107, 0.8);
      background: var(--danger-bg);
    }

    .mini-title {
      min-height: 38px;
      color: var(--muted);
      font-size: 0.82rem;
      line-height: 1.3;
    }

    .mini-values {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-top: 12px;
      font-weight: 850;
    }

    .chart {
      display: grid;
      gap: 12px;
      padding: 16px;
    }

    .bar-row {
      display: grid;
      grid-template-columns: 145px minmax(0, 1fr) 54px;
      gap: 12px;
      align-items: center;
    }

    .bar-label {
      color: var(--muted);
      font-size: 0.9rem;
    }

    .bar-track {
      height: 32px;
      border-radius: 999px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.08);
    }

    .bar {
      height: 100%;
      min-width: 3px;
      border-radius: inherit;
      background: var(--accent);
      transition: width 180ms ease;
    }

    .bar.low { background: var(--danger); }

    .empty {
      padding: 22px;
      color: var(--muted);
      text-align: center;
    }

    @media (max-width: 780px) {
      .shell { width: min(100% - 20px, 1180px); padding-top: 18px; }
      .hero { grid-template-columns: 1fr; align-items: start; }
      .toolbar { position: static; }
      .stats, .totals-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .counter-card { grid-template-columns: 34px minmax(0, 1fr); }
      .counter { grid-column: 1 / -1; grid-template-columns: 1fr 70px 1fr; }
      .stepper { width: 100%; height: 54px; }
      .bar-row { grid-template-columns: 1fr; gap: 6px; }
    }

    @media (max-width: 480px) {
      .stats, .totals-grid { grid-template-columns: 1fr; }
      .button-row, .btn { width: 100%; }
      .student-pill { width: 100%; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header class="hero">
      <div>
        <h1>Student AI Usage Review</h1>
        <p class="subtitle">Anonymous project review tracker. Each saved interview becomes Student 1, Student 2, and so on. All data stays in this browser through localStorage.</p>
      </div>
      <div class="student-pill" id="studentLabel">Student 1</div>
    </header>

    <div class="toolbar">
      <div class="button-row">
        <button class="btn primary" id="saveStudent">Save Student + Start Next</button>
        <button class="btn" id="viewSummary">View Summary</button>
        <button class="btn" id="exportCsv">Export CSV</button>
      </div>
      <div class="button-row">
        <button class="btn" id="resetDraft">Reset Current Student</button>
        <button class="btn danger" id="clearAll">Clear All Data</button>
      </div>
    </div>

    <section class="stats" aria-label="Survey stats">
      <article class="stat">
        <div class="stat-label">Saved students</div>
        <div class="stat-value" id="savedCount">0</div>
      </article>
      <article class="stat">
        <div class="stat-label">Current total</div>
        <div class="stat-value" id="draftTotal">0</div>
      </article>
      <article class="stat">
        <div class="stat-label">SDLC mentions</div>
        <div class="stat-value" id="sdlcTotal">0</div>
      </article>
      <article class="stat">
        <div class="stat-label">Planning vs Testing</div>
        <div class="stat-value" id="planningTesting">0 / 0</div>
      </article>
    </section>

    <section aria-label="Survey questions">
      <div class="section-title">AI Tools Used</div>
      <div class="survey-grid" id="toolQuestions"></div>

      <div class="section-title">General</div>
      <div class="survey-grid" id="generalQuestions"></div>

      <div class="section-title">Configuration</div>
      <div class="survey-grid" id="configurationQuestions"></div>

      <div class="section-title">Impact</div>
      <div class="survey-grid" id="impactQuestions"></div>

      <div class="section-title">SDLC Stages</div>
      <div class="survey-grid" id="sdlcQuestions"></div>
    </section>

    <section class="summary" id="summary">
      <div class="panel">
        <div class="panel-head">
          <h2>Summary Dashboard</h2>
          <span id="summaryMeta">No saved students yet</span>
        </div>
        <div id="summaryContent"></div>
      </div>
    </section>
  </main>

  <script>
    (function () {
      var STORAGE_KEY = "student-ai-usage-survey:v1";
      var DRAFT_KEY = "student-ai-usage-survey-draft:v1";

      var tools = [
        { id: "tool_cursor", label: "Cursor", short: "Cursor" },
        { id: "tool_claude_code", label: "Claude Code", short: "Claude" },
        { id: "tool_codex", label: "Codex", short: "Codex" },
        { id: "tool_gemini", label: "Gemini", short: "Gemini" },
        { id: "tool_chatgpt", label: "ChatGPT", short: "ChatGPT" },
        { id: "tool_other", label: "Other", short: "Other" }
      ];

      var questions = [
        { id: "q2", label: "Gave AI requirements/planning before coding?", short: "Req/Plan", group: "general", meta: "Planning setup" },
        { id: "q3", label: "Used global rules?", short: "Global Rules", group: "configuration", meta: "Configuration" },
        { id: "q4", label: "Used global skills?", short: "Global Skills", group: "configuration", meta: "Configuration" },
        { id: "q5", label: "Used individual rules?", short: "Ind Rules", group: "configuration", meta: "Configuration" },
        { id: "q6", label: "Used individual skills?", short: "Ind Skills", group: "configuration", meta: "Configuration" },
        { id: "q7", label: "AI affected code quality and complexity?", short: "Quality", group: "impact", meta: "Code quality" },
        { id: "q8", label: "Used AI for Planning?", short: "Planning", group: "sdlc", meta: "SDLC stage" },
        { id: "q9", label: "Used AI for Design?", short: "Design", group: "sdlc", meta: "SDLC stage" },
        { id: "q10", label: "Used AI for Implementation?", short: "Implementation", group: "sdlc", meta: "SDLC stage" },
        { id: "q11", label: "Used AI for Testing?", short: "Testing", group: "sdlc", meta: "SDLC stage" },
        { id: "q12", label: "Used AI for Deployment?", short: "Deployment", group: "sdlc", meta: "SDLC stage" },
        { id: "q13", label: "Used AI for Maintenance?", short: "Maintenance", group: "sdlc", meta: "SDLC stage" }
      ];

      var allFields = tools.concat(questions);
      var sdlcQuestions = questions.filter(function (question) { return question.group === "sdlc"; });
      var students = loadJson(STORAGE_KEY, []);
      var draft = normalizeCounts(loadJson(DRAFT_KEY, {}));

      var els = {
        studentLabel: document.getElementById("studentLabel"),
        savedCount: document.getElementById("savedCount"),
        draftTotal: document.getElementById("draftTotal"),
        sdlcTotal: document.getElementById("sdlcTotal"),
        planningTesting: document.getElementById("planningTesting"),
        summary: document.getElementById("summary"),
        summaryContent: document.getElementById("summaryContent"),
        summaryMeta: document.getElementById("summaryMeta"),
        viewSummary: document.getElementById("viewSummary")
      };

      renderQuestions();
      render();

      document.getElementById("saveStudent").addEventListener("click", saveStudent);
      document.getElementById("resetDraft").addEventListener("click", resetDraft);
      document.getElementById("clearAll").addEventListener("click", clearAll);
      document.getElementById("exportCsv").addEventListener("click", exportCsv);
      els.viewSummary.addEventListener("click", toggleSummary);

      function loadJson(key, fallback) {
        try {
          var raw = window.localStorage.getItem(key);
          return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
          return fallback;
        }
      }

      function saveJson(key, value) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }

      function normalizeCounts(counts) {
        var next = {};
        allFields.forEach(function (field) {
          var value = Number(counts[field.id]);
          next[field.id] = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
        });
        return next;
      }

      function renderQuestions() {
        renderGroup("toolQuestions", tools.map(function (tool, index) {
          return {
            id: tool.id,
            label: tool.label,
            number: index + 1,
            meta: "AI tool"
          };
        }));

        renderGroup("generalQuestions", questions.filter(function (question) { return question.group === "general"; }));
        renderGroup("configurationQuestions", questions.filter(function (question) { return question.group === "configuration"; }));
        renderGroup("impactQuestions", questions.filter(function (question) { return question.group === "impact"; }));
        renderGroup("sdlcQuestions", questions.filter(function (question) { return question.group === "sdlc"; }));
      }

      function renderGroup(elementId, items) {
        var target = document.getElementById(elementId);
        target.innerHTML = items.map(function (item) {
          var number = item.number || item.id.replace("q", "");
          return '<article class="counter-card">' +
            '<div class="number">' + escapeHtml(number) + '</div>' +
            '<div><span class="question-name">' + escapeHtml(item.label) + '</span><span class="question-meta">' + escapeHtml(item.meta || "") + '</span></div>' +
            '<div class="counter" data-counter="' + escapeHtml(item.id) + '">' +
              '<button class="stepper" data-delta="-1" aria-label="Decrease ' + escapeHtml(item.label) + '">−</button>' +
              '<div class="count" id="count-' + escapeHtml(item.id) + '">0</div>' +
              '<button class="stepper" data-delta="1" aria-label="Increase ' + escapeHtml(item.label) + '">+</button>' +
            '</div>' +
          '</article>';
        }).join("");

        target.querySelectorAll(".stepper").forEach(function (button) {
          button.addEventListener("click", function () {
            var counter = button.closest("[data-counter]").getAttribute("data-counter");
            var delta = Number(button.getAttribute("data-delta"));
            draft[counter] = Math.max(0, (draft[counter] || 0) + delta);
            saveJson(DRAFT_KEY, draft);
            render();
          });
        });
      }

      function render() {
        allFields.forEach(function (field) {
          var target = document.getElementById("count-" + field.id);
          if (target) target.textContent = String(draft[field.id] || 0);
        });

        var draftTotal = sumCounts(draft, allFields);
        var sdlcTotal = sumCounts(draft, sdlcQuestions);
        els.studentLabel.textContent = "Student " + (students.length + 1);
        els.savedCount.textContent = String(students.length);
        els.draftTotal.textContent = String(draftTotal);
        els.sdlcTotal.textContent = String(sdlcTotal);
        els.planningTesting.textContent = String(draft.q8 || 0) + " / " + String(draft.q11 || 0);

        if (els.summary.classList.contains("active")) renderSummary();
      }

      function sumCounts(counts, fields) {
        return fields.reduce(function (total, field) {
          return total + (Number(counts[field.id]) || 0);
        }, 0);
      }

      function saveStudent() {
        if (sumCounts(draft, allFields) === 0) {
          alert("Add at least one count before saving this student.");
          return;
        }

        students.push({
          student: "Student " + (students.length + 1),
          createdAt: new Date().toISOString(),
          counts: normalizeCounts(draft)
        });
        saveJson(STORAGE_KEY, students);
        draft = normalizeCounts({});
        saveJson(DRAFT_KEY, draft);
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      function resetDraft() {
        if (sumCounts(draft, allFields) > 0 && !confirm("Reset the current unsaved student?")) return;
        draft = normalizeCounts({});
        saveJson(DRAFT_KEY, draft);
        render();
      }

      function clearAll() {
        if (!confirm("Clear all saved students and the current draft? This cannot be undone.")) return;
        students = [];
        draft = normalizeCounts({});
        saveJson(STORAGE_KEY, students);
        saveJson(DRAFT_KEY, draft);
        render();
      }

      function toggleSummary() {
        els.summary.classList.toggle("active");
        els.viewSummary.textContent = els.summary.classList.contains("active") ? "Hide Summary" : "View Summary";
        if (els.summary.classList.contains("active")) {
          renderSummary();
          els.summary.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }

      function renderSummary() {
        els.summaryMeta.textContent = students.length ? students.length + " saved student" + (students.length === 1 ? "" : "s") : "No saved students yet";

        if (!students.length) {
          els.summaryContent.innerHTML = '<div class="empty">Save a student to populate the summary dashboard.</div>';
          return;
        }

        var totals = {};
        allFields.forEach(function (field) {
          totals[field.id] = students.reduce(function (total, student) {
            return total + (Number(student.counts[field.id]) || 0);
          }, 0);
        });

        var sdlcTotals = sdlcQuestions.map(function (field) { return totals[field.id]; });
        var lowestSdlc = Math.min.apply(null, sdlcTotals);
        var maxSdlc = Math.max.apply(null, sdlcTotals.concat([1]));

        els.summaryContent.innerHTML =
          buildStudentTable() +
          '<div class="totals-grid">' + allFields.map(function (field) {
            var isLow = field.group === "sdlc" && totals[field.id] === lowestSdlc;
            return '<article class="mini-card ' + (isLow ? "low" : "") + '">' +
              '<div class="mini-title">' + escapeHtml(field.short || field.label) + '</div>' +
              '<div class="mini-values"><span>Total ' + totals[field.id] + '</span><span>Avg ' + average(totals[field.id]) + '</span></div>' +
            '</article>';
          }).join("") + '</div>' +
          '<div class="panel" style="margin: 18px 0;">' +
            '<div class="panel-head"><h2>SDLC Stage Usage</h2><span>Lowest total highlighted red</span></div>' +
            '<div class="chart">' + sdlcQuestions.map(function (field) {
              var total = totals[field.id];
              var isLow = total === lowestSdlc;
              var width = Math.round((total / maxSdlc) * 100);
              return '<div class="bar-row">' +
                '<div class="bar-label">' + escapeHtml(field.short) + '</div>' +
                '<div class="bar-track"><div class="bar ' + (isLow ? "low" : "") + '" style="width: ' + width + '%"></div></div>' +
                '<strong>' + total + '</strong>' +
              '</div>';
            }).join("") + '</div>' +
          '</div>';
      }

      function buildStudentTable() {
        var headers = ['<th>Student</th>'].concat(allFields.map(function (field) {
          return '<th>' + escapeHtml(field.short || field.label) + '</th>';
        })).join("");

        var rows = students.map(function (student) {
          return '<tr><td>' + escapeHtml(student.student) + '</td>' + allFields.map(function (field) {
            return '<td>' + (Number(student.counts[field.id]) || 0) + '</td>';
          }).join("") + '</tr>';
        }).join("");

        return '<div class="table-wrap"><table><thead><tr>' + headers + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
      }

      function average(total) {
        return (total / Math.max(students.length, 1)).toFixed(1);
      }

      function exportCsv() {
        if (!students.length) {
          alert("No saved students to export yet.");
          return;
        }

        var headers = ["Student", "Saved At"].concat(allFields.map(function (field) { return field.label; }));
        var rows = students.map(function (student) {
          return [student.student, student.createdAt].concat(allFields.map(function (field) {
            return Number(student.counts[field.id]) || 0;
          }));
        });

        var csv = [headers].concat(rows).map(function (row) {
          return row.map(csvCell).join(",");
        }).join("\n");

        var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "student-ai-usage-survey.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }

      function csvCell(value) {
        var text = String(value);
        return '"' + text.replace(/"/g, '""') + '"';
      }

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }
    })();
  </script>
</body>
</html>`;

export const dynamic = "force-static";

export function GET() {
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

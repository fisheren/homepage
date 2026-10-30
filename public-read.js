(function () {
  var map = {
    "/api/vocab": "api/vocab.json",
    "/api/practice": "api/practice.json",
    "/api/algorithms": "api/algorithms.json",
    "/api/knowledge": "api/knowledge.json",
    "/api/difficulties": "api/difficulties.json",
    "/api/tech-feed": "api/tech-feed.json",
    "/api/lab": "api/lab.json",
    "/api/history": "api/history.json",
    "/api/self": "api/self.json"
  };
  var orig = window.fetch.bind(window);

  function jsonResponse(payload, status) {
    return new Response(JSON.stringify(payload), {
      status: status,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }

  function gradePractice(body) {
    return orig("api/practice-key.json").then(function (response) {
      return response.json();
    }).then(function (key) {
      var request = JSON.parse(body || "{}");
      var term = null;
      var terms = key.terms || [];
      for (var i = 0; i < terms.length; i += 1) {
        if (terms[i].id === request.id) term = terms[i];
      }
      if (!term) return jsonResponse({ error: "没有这道练习" }, 404);
      var picks = request.theory || {};
      var theory = [];
      var passed = true;
      for (var j = 0; j < term.theory.length; j += 1) {
        var question = term.theory[j];
        var correct = picks[question.id] === question.answer;
        passed = passed && correct;
        theory.push({ id: question.id, correct: correct, explain: question.explain });
      }
      return jsonResponse({ theory: theory, passed: passed }, 200);
    });
  }

  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    var method = ((init && init.method) || "GET").toUpperCase();
    var path = url.split("?")[0];
    if (method === "GET" && map[path]) return orig(map[path]);
    if (method === "POST" && path === "/api/practice") return gradePractice(init && init.body);
    if (path.indexOf("/api/") === 0) {
      return Promise.resolve(jsonResponse({ error: "公开页面只提供阅读。对话、声音、实操运行和重新搜索留在本机。" }, 403));
    }
    return orig(input, init);
  };

  document.addEventListener("DOMContentLoaded", function () {
    var main = document.querySelector("main");
    if (!main) return;
    var note = document.createElement("p");
    note.className = "section-note";
    note.id = "public-reading-note";
    note.textContent = "这是公开阅读页。对话、声音、实操运行和科技日览的重新搜索留在本机。";
    main.insertBefore(note, main.firstChild);
  });
})();

/* 代码块上色。词汇页、算法页、学习页的代码共用这一套颜色。 */
(function () {
  const PYTHON = new Set([
    "def", "class", "if", "elif", "else", "for", "while", "return",
    "import", "from", "as", "in", "and", "or", "not", "True", "False",
    "None", "with", "try", "except", "finally", "lambda", "yield",
    "pass", "break", "continue", "async", "await", "raise", "is",
  ]);
  const DOCKER = new Set([
    "FROM", "WORKDIR", "COPY", "RUN", "EXPOSE", "CMD", "ENV", "ARG",
    "ENTRYPOINT", "ADD", "USER", "LABEL", "VOLUME", "HEALTHCHECK",
    "SHELL", "STOPSIGNAL", "ONBUILD",
  ]);
  const YAML = new Set(["true", "false", "null", "yes", "no"]);

  function span(parent, className, text) {
    if (!text) return;
    const node = document.createElement("span");
    node.className = className;
    node.textContent = text;
    parent.append(node);
  }

  function wordClass(word, after, lang) {
    if (lang === "python" && PYTHON.has(word)) return "tok-keyword";
    if ((lang === "yaml" || lang === "yml" || lang === "markdown" || lang === "md") && /^\s*:/.test(after)) {
      return "tok-key";
    }
    if ((lang === "yaml" || lang === "yml") && YAML.has(word)) return "tok-keyword";
    if ((lang === "python" || lang === "bash" || lang === "sh") && /^\s*\(/.test(after)) {
      return "tok-func";
    }
    if ((lang === "dockerfile" || lang === "docker") && DOCKER.has(word)) return "tok-keyword";
    return "tok-plain";
  }

  function paintRest(parent, text, lang) {
    let index = 0;
    while (index < text.length) {
      const rest = text.slice(index);
      const decorator = rest.match(/^@[A-Za-z_][\w.]*/);
      if (decorator) {
        span(parent, "tok-keyword", decorator[0]);
        index += decorator[0].length;
        continue;
      }
      if (rest.startsWith("#")) {
        span(parent, "tok-comment", rest);
        return;
      }
      const prefix = rest.match(/^[frbFRB]{1,2}(?=['"])/);
      const quoteAt = prefix ? prefix[0].length : 0;
      const quote = rest[quoteAt];
      if (quote === '"' || quote === "'") {
        const triple = rest.slice(quoteAt, quoteAt + 3);
        const opener = triple === '"""' || triple === "'''" ? triple : quote;
        let cursor = quoteAt + opener.length;
        while (cursor < rest.length) {
          if (rest.startsWith(opener, cursor)) {
            cursor += opener.length;
            break;
          }
          cursor += rest[cursor] === "\\" ? 2 : 1;
        }
        span(parent, "tok-string", rest.slice(0, cursor));
        index += cursor;
        continue;
      }
      const flag = rest.match(/^--[A-Za-z0-9][\w-]*/);
      if (flag) {
        span(parent, "tok-flag", flag[0]);
        index += flag[0].length;
        continue;
      }
      const number = rest.match(/^\d+(?:\.\d+)*/);
      if (number) {
        span(parent, "tok-number", number[0]);
        index += number[0].length;
        continue;
      }
      const word = rest.match(/^[A-Za-z_][\w.-]*/);
      if (word) {
        const after = text.slice(index + word[0].length);
        span(parent, wordClass(word[0], after, lang), word[0]);
        index += word[0].length;
        continue;
      }
      span(parent, "tok-punct", rest[0]);
      index += 1;
    }
  }

  function paintLine(parent, line, lang) {
    if ((lang === "markdown" || lang === "md") && /^\s*#{1,6}\s/.test(line)) {
      span(parent, "tok-keyword", line);
      return;
    }
    if (lang === "dockerfile" || lang === "docker") {
      const matched = line.match(/^(\s*)([A-Z]+)(.*)$/);
      if (matched && DOCKER.has(matched[2])) {
        span(parent, "tok-plain", matched[1]);
        span(parent, "tok-keyword", matched[2]);
        paintRest(parent, matched[3], lang);
        return;
      }
    }
    if (lang === "bash" || lang === "sh" || lang === "shell" || lang === "console") {
      const matched = line.match(/^(\s*)([A-Za-z][\w.-]*)(.*)$/);
      if (matched && !line.trim().startsWith("#")) {
        span(parent, "tok-plain", matched[1]);
        span(parent, "tok-command", matched[2]);
        paintRest(parent, matched[3], lang);
        return;
      }
    }
    paintRest(parent, line, lang);
  }

  function highlight(text, language) {
    const lang = String(language || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const code = document.createElement("code");
    if (lang) code.className = "lang-" + lang;
    const lines = String(text || "").split("\n");
    lines.forEach((line, index) => {
      if (index) code.append(document.createTextNode("\n"));
      paintLine(code, line, lang);
    });
    return code;
  }

  window.CodeColor = { highlight };
})();

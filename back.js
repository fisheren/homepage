/* 记录本站页面跳转，并在侧栏提供返回上一页。 */
(function () {
  var STACK = "site-page-stack";
  var FLAG = "site-page-back";
  var NAMES = {
    "index.html": "个人简历",
    "学习.html": "学习笔记",
    "词汇.html": "词汇笔记",
    "算法.html": "算法习题",
    "知识.html": "知识库",
    "本人.html": "本人对话",
    "科技.html": "科技日览",
    "难点.html": "开发难点"
  };

  function normalize(url) {
    var parsed = new URL(url, location.origin);
    var path = parsed.pathname;
    try {
      path = decodeURI(path);
    } catch (_error) {
      path = parsed.pathname;
    }
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    return path + parsed.search + parsed.hash;
  }

  function pageFile(entry) {
    var path = entry.split("#")[0].split("?")[0];
    var parts = path.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "index.html";
  }

  function samePage(left, right) {
    return pageFile(left) === pageFile(right);
  }

  function readStack() {
    try {
      var stack = JSON.parse(sessionStorage.getItem(STACK) || "[]");
      return Array.isArray(stack) ? stack : [];
    } catch (_error) {
      return [];
    }
  }

  function writeStack(stack) {
    try {
      sessionStorage.setItem(STACK, JSON.stringify(stack.slice(-40)));
    } catch (_error) {
      /* 隐私模式可能拒绝写入，按钮保持隐藏。 */
    }
  }

  function updateStack(kind, here) {
    var stack = readStack();
    if (kind === "back") {
      var index = -1;
      for (var i = stack.length - 1; i >= 0; i -= 1) {
        if (samePage(stack[i], here)) {
          index = i;
          break;
        }
      }
      if (index >= 0) {
        stack = stack.slice(0, index + 1);
        stack[index] = here;
      } else {
        stack.push(here);
      }
      return stack;
    }
    if (!stack.length || !samePage(stack[stack.length - 1], here)) stack.push(here);
    else stack[stack.length - 1] = here;
    return stack;
  }

  var rail = document.querySelector(".rail");
  if (!rail) return;
  var button = document.createElement("button");
  button.type = "button";
  button.className = "back";
  button.hidden = true;
  var anchor = rail.querySelector(".switch");
  rail.insertBefore(button, anchor || rail.firstChild);

  function showButton(stack) {
    if (stack.length < 2) {
      button.hidden = true;
      button.replaceChildren();
      button.removeAttribute("aria-label");
      return;
    }
    var previous = stack[stack.length - 2];
    var name = NAMES[pageFile(previous)] || "";
    var label = document.createElement("span");
    label.textContent = "返回上一页";
    button.replaceChildren(label);
    if (name) {
      var where = document.createElement("span");
      where.textContent = name;
      button.append(where);
    }
    button.setAttribute("aria-label", name ? "返回上一页：" + name : "返回上一页");
    button.hidden = false;
  }

  button.addEventListener("click", function () {
    var stack = readStack();
    if (stack.length < 2) return;
    var previous = stack[stack.length - 2];
    try {
      sessionStorage.setItem(FLAG, "1");
    } catch (_error) {
      /* 继续按地址返回。 */
    }
    location.href = previous;
  });

  window.addEventListener("pageshow", function (event) {
    var nav = performance.getEntriesByType("navigation")[0];
    var type = nav ? nav.type : "navigate";
    var flagged = false;
    try {
      flagged = sessionStorage.getItem(FLAG) === "1";
      sessionStorage.removeItem(FLAG);
    } catch (_error) {
      flagged = false;
    }
    var kind = event.persisted || type === "back_forward" || flagged ? "back" : "navigate";
    var stack = updateStack(kind, normalize(location.href));
    writeStack(stack);
    showButton(stack);
  });

  window.addEventListener("hashchange", function () {
    var here = normalize(location.href);
    var stack = readStack();
    if (stack.length && samePage(stack[stack.length - 1], here)) {
      stack[stack.length - 1] = here;
      writeStack(stack);
    }
  });
})();

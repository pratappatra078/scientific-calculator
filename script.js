(() => {
  "use strict";

  /* ======================================================================
     STATE
  ====================================================================== */
  const state = {
    currentInput: "",       // raw expression string being built
    justEvaluated: false,   // true right after "=" was pressed
    hadError: false,
    angleMode: "DEG",       // DEG | RAD | GRAD
    memory: 0,
    history: [],
  };

  const FUNC_NAMES = ["asin", "acos", "atan", "sinh", "cosh", "tanh", "sin", "cos", "tan", "log", "ln"];

  /* ======================================================================
     PERSISTENCE
  ====================================================================== */
  function loadPersisted() {
    try {
      const theme = localStorage.getItem("calc-theme");
      if (theme) applyTheme(theme, false);
      else {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(prefersDark ? "dark" : "light", false);
      }
    } catch (e) { applyTheme("light", false); }

    try {
      const h = localStorage.getItem("calc-history");
      state.history = h ? JSON.parse(h) : [];
    } catch (e) { state.history = []; }

    try {
      const m = localStorage.getItem("calc-memory");
      state.memory = m ? parseFloat(m) : 0;
    } catch (e) { state.memory = 0; }

    try {
      const a = localStorage.getItem("calc-angle");
      if (a) state.angleMode = a;
    } catch (e) {}
  }

  function saveHistory() {
    try { localStorage.setItem("calc-history", JSON.stringify(state.history.slice(0, 50))); } catch (e) {}
  }
  function saveMemory() {
    try { localStorage.setItem("calc-memory", String(state.memory)); } catch (e) {}
  }
  function saveAngle() {
    try { localStorage.setItem("calc-angle", state.angleMode); } catch (e) {}
  }

  /* ======================================================================
     TOKENIZER
  ====================================================================== */
  function tokenize(input) {
    let s = input.replace(/\s+/g, "");
    const tokens = [];
    let i = 0;

    const funcPattern = new RegExp("^(" + FUNC_NAMES.join("|") + ")\\(");

    while (i < s.length) {
      const rest = s.slice(i);

      let m;
      if ((m = rest.match(funcPattern))) {
        tokens.push({ type: "func", value: m[1] });
        tokens.push({ type: "lparen" });
        i += m[0].length;
        continue;
      }
      if (rest.startsWith("√(")) { tokens.push({ type: "func", value: "√" }); tokens.push({ type: "lparen" }); i += 2; continue; }
      if (rest.startsWith("∛(")) { tokens.push({ type: "func", value: "∛" }); tokens.push({ type: "lparen" }); i += 2; continue; }
      if (rest.startsWith("nCr")) { tokens.push({ type: "op", value: "nCr" }); i += 3; continue; }
      if (rest.startsWith("nPr")) { tokens.push({ type: "op", value: "nPr" }); i += 3; continue; }

      const ch = s[i];

      if (/\d/.test(ch) || ch === ".") {
        let j = i;
        while (j < s.length && /[\d.]/.test(s[j])) j++;
        tokens.push({ type: "num", value: parseFloat(s.slice(i, j)) });
        i = j;
        continue;
      }
      if (ch === "π") { tokens.push({ type: "num", value: Math.PI }); i++; continue; }
      if (ch === "e") { tokens.push({ type: "num", value: Math.E }); i++; continue; }
      if (ch === "-") { tokens.push({ type: "op", value: "−" }); i++; continue; }
      if ("+−×÷^".includes(ch)) { tokens.push({ type: "op", value: ch }); i++; continue; }
      if (ch === "(") { tokens.push({ type: "lparen" }); i++; continue; }
      if (ch === ")") { tokens.push({ type: "rparen" }); i++; continue; }
      if (ch === "²") { tokens.push({ type: "postfix", value: "²" }); i++; continue; }
      if (ch === "³") { tokens.push({ type: "postfix", value: "³" }); i++; continue; }
      if (ch === "!") { tokens.push({ type: "postfix", value: "!" }); i++; continue; }
      if (ch === "%") { tokens.push({ type: "postfix", value: "%" }); i++; continue; }
      if (ch === "⁻" && s[i + 1] === "¹") { tokens.push({ type: "postfix", value: "⁻¹" }); i += 2; continue; }

      // unknown char - skip
      i++;
    }
    return tokens;
  }

  /* ======================================================================
     PARSER (recursive descent) + EVALUATOR
  ====================================================================== */
  function parseAndEvaluate(input) {
    let s = input.trim();
    if (!s) throw new Error("empty");

    // auto-balance parentheses
    const opens = (s.match(/\(/g) || []).length;
    const closes = (s.match(/\)/g) || []).length;
    if (closes < opens) s += ")".repeat(opens - closes);

    const tokens = tokenize(s);
    if (!tokens.length) throw new Error("empty");

    let pos = 0;
    const peek = () => tokens[pos];
    const next = () => tokens[pos++];

    function parseExpr() {
      let v = parseTerm();
      while (peek() && peek().type === "op" && (peek().value === "+" || peek().value === "−")) {
        const op = next().value;
        const rhs = parseTerm();
        v = op === "+" ? v + rhs : v - rhs;
      }
      return v;
    }

    function parseTerm() {
      let v = parsePower();
      while (peek() && peek().type === "op" && ["×", "÷", "nCr", "nPr"].includes(peek().value)) {
        const op = next().value;
        const rhs = parsePower();
        if (op === "×") v = v * rhs;
        else if (op === "÷") {
          if (rhs === 0) throw new Error("div0");
          v = v / rhs;
        } else if (op === "nCr") v = nCr(v, rhs);
        else if (op === "nPr") v = nPr(v, rhs);
      }
      return v;
    }

    function parsePower() {
      const v = parseUnary();
      if (peek() && peek().type === "op" && peek().value === "^") {
        next();
        const rhs = parsePower(); // right-assoc
        return Math.pow(v, rhs);
      }
      return v;
    }

    function parseUnary() {
      if (peek() && peek().type === "op" && peek().value === "−") {
        next();
        return -parseUnary();
      }
      if (peek() && peek().type === "op" && peek().value === "+") {
        next();
        return parseUnary();
      }
      return parsePostfix();
    }

    function parsePostfix() {
      let v = parsePrimary();
      while (peek() && peek().type === "postfix") {
        const op = next().value;
        v = applyPostfix(op, v);
      }
      return v;
    }

    function parsePrimary() {
      const t = peek();
      if (!t) throw new Error("unexpected end");

      if (t.type === "num") { next(); return t.value; }

      if (t.type === "lparen") {
        next();
        const v = parseExpr();
        if (peek() && peek().type === "rparen") next();
        return v;
      }

      if (t.type === "func") {
        const fname = next().value;
        if (!peek() || peek().type !== "lparen") throw new Error("bad func");
        next();
        const arg = parseExpr();
        if (peek() && peek().type === "rparen") next();
        return applyFunc(fname, arg);
      }

      if (t.type === "op" && t.value === "−") { next(); return -parseUnary(); }

      throw new Error("unexpected token");
    }

    const result = parseExpr();
    if (pos < tokens.length) {
      // trailing junk - ignore extra closing parens, otherwise it's fine
    }
    if (typeof result !== "number" || Number.isNaN(result)) throw new Error("NaN");
    return result;
  }

  function toRad(v) {
    if (state.angleMode === "DEG") return (v * Math.PI) / 180;
    if (state.angleMode === "GRAD") return (v * Math.PI) / 200;
    return v;
  }
  function fromRad(v) {
    if (state.angleMode === "DEG") return (v * 180) / Math.PI;
    if (state.angleMode === "GRAD") return (v * 200) / Math.PI;
    return v;
  }

  function applyFunc(name, x) {
    switch (name) {
      case "sin": return Math.sin(toRad(x));
      case "cos": return Math.cos(toRad(x));
      case "tan": return Math.tan(toRad(x));
      case "asin": return fromRad(Math.asin(x));
      case "acos": return fromRad(Math.acos(x));
      case "atan": return fromRad(Math.atan(x));
      case "sinh": return Math.sinh(x);
      case "cosh": return Math.cosh(x);
      case "tanh": return Math.tanh(x);
      case "log": return Math.log10(x);
      case "ln": return Math.log(x);
      case "√": return Math.sqrt(x);
      case "∛": return Math.cbrt(x);
      default: throw new Error("unknown func");
    }
  }

  function applyPostfix(op, v) {
    switch (op) {
      case "²": return Math.pow(v, 2);
      case "³": return Math.pow(v, 3);
      case "!": return factorial(v);
      case "%": return v / 100;
      case "⁻¹":
        if (v === 0) throw new Error("div0");
        return 1 / v;
      default: return v;
    }
  }

  function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }
  function nCr(n, r) {
    if (r < 0 || n < 0 || r > n) return NaN;
    return Math.round(factorial(n) / (factorial(r) * factorial(n - r)));
  }
  function nPr(n, r) {
    if (r < 0 || n < 0 || r > n) return NaN;
    return Math.round(factorial(n) / factorial(n - r));
  }

  /* ======================================================================
     NUMBER FORMATTING
  ====================================================================== */
  function formatNumber(num) {
    if (num === Infinity) return "∞";
    if (num === -Infinity) return "-∞";
    if (Number.isNaN(num)) return "Error";

    let n = parseFloat(num.toPrecision(12));

    if (Math.abs(n) !== 0 && (Math.abs(n) >= 1e15 || Math.abs(n) < 1e-9)) {
      return n.toExponential(6).replace(/e([+-])(\d+)/, "e$1$2");
    }

    let str = n.toString();
    if (str.includes("e")) return str;

    let [intPart, decPart] = str.split(".");
    const neg = intPart.startsWith("-");
    if (neg) intPart = intPart.slice(1);
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    let out = (neg ? "-" : "") + intPart + (decPart ? "." + decPart : "");
    return out;
  }

  function rawFromFormatted(str) {
    return str.replace(/,/g, "");
  }

  /* ======================================================================
     DOM REFERENCES
  ====================================================================== */
  const el = {
    calculator: document.getElementById("calculator"),
    expression: document.getElementById("expression"),
    result: document.getElementById("result"),
    memoryBadge: document.getElementById("memoryBadge"),
    menuBtn: document.getElementById("menuBtn"),
    menuPanel: document.getElementById("menuPanel"),
    sciToggleBtn: document.getElementById("sciToggleBtn"),
    sciPanel: document.getElementById("sciPanel"),
    modeBtn: document.getElementById("modeBtn"),
    historyBtn: document.getElementById("historyBtn"),
    historyOverlay: document.getElementById("historyOverlay"),
    historyPanel: document.getElementById("historyPanel"),
    historyList: document.getElementById("historyList"),
    historyEmpty: document.getElementById("historyEmpty"),
    closeHistoryBtn: document.getElementById("closeHistoryBtn"),
    clearHistoryBtn: document.getElementById("clearHistoryBtn"),
    toast: document.getElementById("toast"),
    angleSwitch: document.getElementById("angleSwitch"),
    degCycleBtn: document.getElementById("degCycleBtn"),
  };

  /* ======================================================================
     DISPLAY RENDERING
  ====================================================================== */
  function niceExpr(str) {
    return str
      .replace(/nCr/g, " nCr ")
      .replace(/nPr/g, " nPr ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function safeTrimmedForPreview(str) {
    // strip trailing operators / open constructs so we can live-preview
    let s = str;
    s = s.replace(/(nCr|nPr|[+\-−×÷^(.]|sin\(|cos\(|tan\(|asin\(|acos\(|atan\(|sinh\(|cosh\(|tanh\(|log\(|ln\(|√\(|∛\()+$/, (m) => {
      return "";
    });
    return s;
  }

  function render() {
    el.expression.textContent = state.currentInput ? niceExpr(state.currentInput) : "";
    el.memoryBadge.classList.toggle("show", state.memory !== 0);

    if (state.hadError) {
      el.result.textContent = "Error";
      el.result.className = "result error";
      return;
    }

    if (state.justEvaluated) {
      el.result.className = "result accent";
      return; // text already set by evaluate()
    }

    if (!state.currentInput) {
      el.result.textContent = "0";
      el.result.className = "result";
      return;
    }

    // live preview
    try {
      const trimmed = safeTrimmedForPreview(state.currentInput);
      if (!trimmed) { el.result.textContent = state.currentInput; el.result.className = "result"; return; }
      const val = parseAndEvaluate(trimmed);
      if (rawFromFormatted(formatNumber(val)) === rawFromFormatted(state.currentInput.replace(/[^\d.\-]/g, ""))) {
        el.result.textContent = state.currentInput;
      } else {
        el.result.textContent = formatNumber(val);
      }
      el.result.className = "result";
    } catch (e) {
      el.result.textContent = state.currentInput;
      el.result.className = "result";
    }
  }

  /* ======================================================================
     INPUT HANDLERS
  ====================================================================== */
  function resetIfNeeded(startFresh) {
    if (state.hadError) {
      state.currentInput = "";
      state.hadError = false;
      state.justEvaluated = false;
      return;
    }
    if (state.justEvaluated && startFresh) {
      state.currentInput = "";
      state.justEvaluated = false;
    }
  }

  function inputDigit(d) {
    resetIfNeeded(true);
    // prevent multiple leading zeros weirdness, keep it simple & permissive
    state.currentInput += d;
    render();
  }

  function inputDecimal() {
    resetIfNeeded(true);
    // find current number segment
    const seg = state.currentInput.split(/[+\-−×÷^(,]/).pop();
    if (seg.includes(".")) return;
    if (seg === "" || /[+\-−×÷^(]$/.test(state.currentInput) || state.currentInput === "") {
      state.currentInput += "0.";
    } else {
      state.currentInput += ".";
    }
    render();
  }

  function inputOp(op) {
    if (state.hadError) resetIfNeeded(true);
    if (state.justEvaluated) {
      state.currentInput = rawFromFormatted(el.result.textContent.replace(/^=\s*/, ""));
      state.justEvaluated = false;
    }
    if (state.currentInput === "" && (op === "−")) {
      state.currentInput = "−";
      render();
      return;
    }
    if (state.currentInput === "") return; // ignore operator with nothing entered (except minus, handled above)

    // replace trailing operator with the new one
    if (/(nCr|nPr|[+\-−×÷^])$/.test(state.currentInput.trim())) {
      state.currentInput = state.currentInput.replace(/(nCr|nPr|[+\-−×÷^])\s*$/, op);
    } else {
      state.currentInput += op;
    }
    render();
  }

  function inputFuncOrText(txt) {
    resetIfNeeded(true);
    state.currentInput += txt;
    render();
  }

  function inputParen(kind) {
    resetIfNeeded(true);
    state.currentInput += kind === "open" ? "(" : ")";
    render();
  }

  function inputPostfix(op) {
    if (state.hadError) return;
    if (state.justEvaluated) {
      state.currentInput = rawFromFormatted(el.result.textContent.replace(/^=\s*/, "")) + op;
      state.justEvaluated = false;
      render();
      return;
    }
    if (!state.currentInput) return;
    state.currentInput += op;
    render();
  }

  function toggleSign() {
    if (state.hadError) return;
    let s = state.justEvaluated ? rawFromFormatted(el.result.textContent.replace(/^=\s*/, "")) : state.currentInput;
    if (state.justEvaluated) state.justEvaluated = false;
    if (!s) { s = "−"; state.currentInput = s; render(); return; }

    const negWrapped = /\((-?\d+\.?\d*)\)$/;
    const plainNum = /(\d+\.?\d*)$/;
    if (negWrapped.test(s) && /\(-/.test(s.match(negWrapped)[0])) {
      s = s.replace(negWrapped, (m, g1) => g1.replace("-", ""));
    } else if (plainNum.test(s)) {
      s = s.replace(plainNum, (m) => `(-${m})`);
    }
    state.currentInput = s;
    render();
  }

  function backspace() {
    if (state.hadError || state.justEvaluated) {
      state.currentInput = "";
      state.hadError = false;
      state.justEvaluated = false;
      render();
      return;
    }
    if (!state.currentInput) return;

    // remove trailing multi-char tokens as a whole
    const multiTokens = ["nCr", "nPr", "asin(", "acos(", "atan(", "sinh(", "cosh(", "tanh(", "sin(", "cos(", "tan(", "log(", "ln(", "√(", "∛(", "⁻¹"];
    let removed = false;
    for (const t of multiTokens) {
      if (state.currentInput.endsWith(t)) {
        state.currentInput = state.currentInput.slice(0, -t.length);
        removed = true;
        break;
      }
    }
    if (!removed) state.currentInput = state.currentInput.slice(0, -1);
    render();
  }

  function clearAll() {
    state.currentInput = "";
    state.hadError = false;
    state.justEvaluated = false;
    render();
  }

  function evaluate() {
    if (!state.currentInput || state.hadError) return;
    try {
      const exprForHistory = niceExpr(state.currentInput);
      const value = parseAndEvaluate(state.currentInput);
      const formatted = formatNumber(value);

      el.result.textContent = "= " + formatted;
      el.result.className = "result accent";
      el.expression.textContent = exprForHistory;

      state.history.unshift({ expr: exprForHistory, result: formatted, ts: Date.now() });
      saveHistory();
      renderHistory();

      state.currentInput = rawFromFormatted(formatted);
      state.justEvaluated = true;
      state.hadError = false;
    } catch (e) {
      state.hadError = true;
      render();
    }
  }

  /* ======================================================================
     MEMORY
  ====================================================================== */
  function currentDisplayedValue() {
    try {
      if (state.justEvaluated) return parseFloat(rawFromFormatted(el.result.textContent.replace(/^=\s*/, "")));
      const trimmed = safeTrimmedForPreview(state.currentInput || "0");
      return parseAndEvaluate(trimmed || "0");
    } catch (e) { return 0; }
  }

  function memClear() { state.memory = 0; saveMemory(); render(); toast("Memory cleared"); }
  function memRecall() {
    resetIfNeeded(true);
    state.currentInput += formatNumber(state.memory).replace(/,/g, "");
    render();
  }
  function memAdd() { state.memory += currentDisplayedValue(); saveMemory(); render(); toast("Added to memory"); }
  function memSub() { state.memory -= currentDisplayedValue(); saveMemory(); render(); toast("Subtracted from memory"); }
  function memSet() { state.memory = currentDisplayedValue(); saveMemory(); render(); toast("Saved to memory"); }

  /* ======================================================================
     HISTORY PANEL
  ====================================================================== */
  function renderHistory() {
    el.historyList.innerHTML = "";
    if (!state.history.length) {
      el.historyEmpty.style.display = "block";
      el.historyList.appendChild(el.historyEmpty);
      return;
    }
    el.historyEmpty.style.display = "none";
    state.history.forEach((item) => {
      const div = document.createElement("div");
      div.className = "history-item";
      div.innerHTML = `<div class="h-expr">${item.expr}</div><div class="h-res">= ${item.result}</div>`;
      div.addEventListener("click", () => {
        state.currentInput = rawFromFormatted(item.result);
        state.justEvaluated = true;
        el.result.textContent = "= " + item.result;
        el.result.className = "result accent";
        el.expression.textContent = item.expr;
        closeHistory();
      });
      el.historyList.appendChild(div);
    });
  }

  function openHistory() {
    el.historyOverlay.classList.add("open");
    el.historyPanel.classList.add("open");
  }
  function closeHistory() {
    el.historyOverlay.classList.remove("open");
    el.historyPanel.classList.remove("open");
  }

  /* ======================================================================
     THEME
  ====================================================================== */
  function applyTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    if (persist) { try { localStorage.setItem("calc-theme", theme); } catch (e) {} }
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(cur === "dark" ? "light" : "dark", true);
  }

  /* ======================================================================
     TOAST
  ====================================================================== */
  let toastTimer = null;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("show"), 1800);
  }

  /* ======================================================================
     MENU / SCI / ANGLE
  ====================================================================== */
  function toggleMenu() {
    el.menuPanel.classList.toggle("open");
  }
  function closeMenu() { el.menuPanel.classList.remove("open"); }

  function toggleSci() {
    el.sciPanel.classList.toggle("open");
    el.sciToggleBtn.classList.toggle("active");
  }

  function setAngle(mode) {
    state.angleMode = mode;
    saveAngle();
    document.querySelectorAll(".angle-opt").forEach((b) => b.classList.toggle("active", b.dataset.angle === mode));
    el.degCycleBtn.textContent = mode;
  }
  function cycleAngle() {
    const order = ["DEG", "RAD", "GRAD"];
    const idx = order.indexOf(state.angleMode);
    setAngle(order[(idx + 1) % order.length]);
  }

  /* ======================================================================
     COPY / SHARE
  ====================================================================== */
  function copyResult() {
    const text = state.justEvaluated ? el.result.textContent.replace(/^=\s*/, "") : (el.result.textContent || "0");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast("Copied " + text)).catch(() => toast("Copy failed"));
    } else {
      toast("Copy not supported");
    }
    closeMenu();
  }

  function shareResult() {
    const text = state.justEvaluated ? el.result.textContent.replace(/^=\s*/, "") : (el.result.textContent || "0");
    const shareText = (el.expression.textContent ? el.expression.textContent + " = " : "") + text;
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => toast("Copied to share"));
    } else {
      toast("Share not supported");
    }
    closeMenu();
  }

  /* ======================================================================
     EVENT WIRING
  ====================================================================== */
  document.querySelectorAll("[data-num]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.num;
      if (v === ".") inputDecimal();
      else inputDigit(v);
    });
  });

  document.querySelectorAll("[data-op]").forEach((btn) => {
    btn.addEventListener("click", () => inputOp(btn.dataset.op));
  });

  document.querySelectorAll(".btn.sci[data-val]").forEach((btn) => {
    btn.addEventListener("click", () => inputFuncOrText(btn.dataset.val));
  });

  document.querySelectorAll('[data-action="postfix"]').forEach((btn) => {
    btn.addEventListener("click", () => inputPostfix(btn.dataset.op));
  });

  document.querySelector('[data-action="clear"]').addEventListener("click", clearAll);
  document.querySelector('[data-action="backspace"]').addEventListener("click", backspace);
  document.querySelector('[data-action="equals"]').addEventListener("click", evaluate);
  document.querySelector('[data-action="toggle-sign"]').addEventListener("click", toggleSign);
  document.querySelector('[data-action="paren-open"]').addEventListener("click", () => inputParen("open"));
  document.querySelector('[data-action="paren-close"]').addEventListener("click", () => inputParen("close"));
  document.querySelector('[data-action="rand"]').addEventListener("click", () => inputFuncOrText(String(Math.round(Math.random() * 1000) / 1000)));

  document.querySelector('[data-action="mc"]').addEventListener("click", memClear);
  document.querySelector('[data-action="mr"]').addEventListener("click", memRecall);
  document.querySelector('[data-action="m-plus"]').addEventListener("click", memAdd);
  document.querySelector('[data-action="m-minus"]').addEventListener("click", memSub);
  document.querySelector('[data-action="ms"]').addEventListener("click", memSet);

  el.menuBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  document.addEventListener("click", (e) => {
    if (!el.menuPanel.contains(e.target) && e.target !== el.menuBtn) closeMenu();
  });

  el.sciToggleBtn.addEventListener("click", toggleSci);
  el.modeBtn.addEventListener("click", toggleTheme);

  el.historyBtn.addEventListener("click", openHistory);
  el.closeHistoryBtn.addEventListener("click", closeHistory);
  el.historyOverlay.addEventListener("click", closeHistory);
  el.clearHistoryBtn.addEventListener("click", () => {
    state.history = [];
    saveHistory();
    renderHistory();
    toast("History cleared");
  });

  el.angleSwitch.addEventListener("click", (e) => {
    const btn = e.target.closest(".angle-opt");
    if (btn) setAngle(btn.dataset.angle);
  });
  el.degCycleBtn.addEventListener("click", cycleAngle);

  el.menuPanel.querySelectorAll(".menu-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.action === "copy") copyResult();
      if (btn.dataset.action === "share") shareResult();
    });
  });

  /* ======================================================================
     KEYBOARD SUPPORT
  ====================================================================== */
  window.addEventListener("keydown", (e) => {
    const k = e.key;
    if (/^[0-9]$/.test(k)) { inputDigit(k); return; }
    if (k === ".") { inputDecimal(); return; }
    if (k === "+") { inputOp("+"); return; }
    if (k === "-") { inputOp("−"); return; }
    if (k === "*") { inputOp("×"); return; }
    if (k === "/") { e.preventDefault(); inputOp("÷"); return; }
    if (k === "^") { inputOp("^"); return; }
    if (k === "%") { inputPostfix("%"); return; }
    if (k === "(") { inputParen("open"); return; }
    if (k === ")") { inputParen("close"); return; }
    if (k === "Enter" || k === "=") { e.preventDefault(); evaluate(); return; }
    if (k === "Backspace") { backspace(); return; }
    if (k === "Escape") { clearAll(); closeMenu(); closeHistory(); return; }
  });

  /* ======================================================================
     INIT
  ====================================================================== */
  function init() {
    loadPersisted();
    setAngle(state.angleMode);
    renderHistory();
    render();
  }

  init();
})();
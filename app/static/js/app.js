async function api(path, method = "GET", body) {
  const res = await fetch("/api" + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = "문제가 생겼어요. 잠시 후 다시 시도해주세요.";
    try { msg = (await res.json()).detail || msg; } catch (e) {}
    throw new Error(typeof msg === "string" ? msg : "입력을 확인해주세요.");
  }
  return res.json();
}
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text; // XSS 방지: textContent 사용
  return e;
}

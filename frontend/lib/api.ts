export async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: object
): Promise<T> {
  const response = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let reason = "요청을 처리하지 못했어요. 다시 시도해 주세요.";
    try {
      const data: unknown = await response.json();
      if (data && typeof data === "object" && "detail" in data) {
        const detail = (data as { detail?: unknown }).detail;
        if (typeof detail === "string") reason = detail;
      }
    } catch {
      // Keep the readable fallback message.
    }
    throw new Error(reason);
  }
  return response.json() as Promise<T>;
}

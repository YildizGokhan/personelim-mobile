/* eslint-disable no-console */

if (__DEV__ && typeof global.fetch === "function") {
  const originalFetch = global.fetch;

  global.fetch = async (...args) => {
    const [resource, config = {}] = args;
    const method = config.method || "GET";
    const startedAt = Date.now();

    try {
      const response = await originalFetch(...args);
      const elapsed = Date.now() - startedAt;

      const responseClone = response.clone();
      const contentType = responseClone.headers.get("content-type") || "";

      let preview;
      if (contentType.includes("application/json")) {
        try {
          const json = await responseClone.json();
          preview = JSON.stringify(json);
        } catch (error) {
          preview = "[JSON parse error]";
        }
      } else {
        try {
          const text = await responseClone.text();
          preview = text.slice(0, 200);
        } catch (error) {
          preview = "[Body read error]";
        }
      }

      console.log(
        `%c[API][${method}] ${response.status} ${resource} (${elapsed} ms)`,
        "color:#4CAF50;font-weight:bold;",
        preview
      );

      return response;
    } catch (error) {
      const elapsed = Date.now() - startedAt;
      console.log(
        `%c[API][${method}] ERROR ${resource} (${elapsed} ms)`,
        "color:#F44336;font-weight:bold;",
        error?.message || error
      );
      throw error;
    }
  };
}



const $ = (id) => document.getElementById(id);
const out = $("output");

function render(status, body) {
  out.textContent = "HTTP " + status + "\n\n" + JSON.stringify(body, null, 2);
}

async function request(method, path, body) {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    const token = $("token").value.trim();

    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    const res = await fetch(path, {
      method,
      headers,
      body: ["GET", "DELETE"].includes(method)
        ? undefined
        : JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({
      message: "Respons bukan JSON",
    }));

    render(res.status, json);

    return json;
  } catch (error) {
    out.textContent = "Terjadi error:\n\n" + error.message;

    return null;
  }
}

$("btnLogin").addEventListener("click", async () => {
  const data = await request("POST", "/api/auth/login", {
    email: $("email").value,
    password: $("password").value,
  });

  if (data && data.success && data.data && data.data.token) {
    $("token").value = data.data.token;
  }
});

$("btnSend").addEventListener("click", async () => {
  const method = $("method").value;

  let body;

  if (!["GET", "DELETE"].includes(method)) {
    try {
      body = JSON.parse($("payload").value || "{}");
    } catch (e) {
      out.textContent = "Body JSON tidak valid: " + e.message;
      return;
    }
  }

  await request(method, $("path").value.trim(), body);
});

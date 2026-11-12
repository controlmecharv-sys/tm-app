/* =========================================================
 * login.html — entrar con enlace al correo y administrar la cuenta
 * ========================================================= */
PAGES.login = function () {
  const root = document.getElementById("auth");
  const token = qs("token");

  if (!Auth.enabled()) return renderUnavailable();
  if (token) return verify(token);
  if (Auth.get()) return renderAccount();
  renderForm();

  function renderUnavailable() {
    root.innerHTML = `
      <h1>Cuentas: muy pronto</h1>
      <p class="lead muted">Mientras tanto, tu diario se guarda en este dispositivo y puedes usarlo completo sin registrarte.</p>
      <a class="btn btn-primary btn-lg" href="plan.html">Ir a mi diario</a>`;
  }

  function renderForm(prefill = "") {
    root.innerHTML = `
      <h1>Guarda tu diario</h1>
      <p class="lead muted">Te enviamos un enlace a tu correo. Sin contraseñas. Tu diario quedará disponible en todos tus dispositivos.</p>
      <form class="panel" id="auth-form" novalidate>
        <label class="field">
          <span>Correo</span>
          <input class="input" type="email" name="email" autocomplete="email" inputmode="email" required value="${escapeHtml(prefill)}" placeholder="tu@correo.cl">
        </label>
        <label class="check">
          <input type="checkbox" name="consent" required>
          <span>Acepto que T&amp;M guarde mi diario (comidas, peso, ejercicio y metas) para sincronizarlo entre mis dispositivos. Puedo exportarlo o eliminarlo cuando quiera.</span>
        </label>
        <p class="auth-msg" id="auth-msg" role="status" aria-live="polite"></p>
        <button class="btn btn-primary btn-lg" type="submit">Enviarme el enlace</button>
      </form>`;
    const form = root.querySelector("#auth-form");
    const msg = root.querySelector("#auth-msg");
    form.addEventListener("input", () => { msg.textContent = ""; });
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const email = form.email.value.trim();
      msg.className = "auth-msg error";
      if (!form.email.checkValidity() || !email) { msg.textContent = "Escribe un correo válido."; form.email.focus(); return; }
      if (!form.consent.checked) { msg.textContent = "Para crear la cuenta necesitamos tu autorización."; form.consent.focus(); return; }
      const btn = form.querySelector("button");
      btn.disabled = true; btn.textContent = "Enviando…"; msg.textContent = "";
      try {
        const r = await api("/v1/auth/request", { method: "POST", body: { email, consent: true } });
        renderSent(email, r.dev_link);
      } catch (err) {
        msg.textContent = err.message;
        btn.disabled = false; btn.textContent = "Enviarme el enlace";
      }
    });
  }

  function renderSent(email, devLink) {
    root.innerHTML = `
      <h1>Revisa tu correo</h1>
      <p class="lead muted">Te enviamos un enlace a <b>${escapeHtml(email)}</b>. Ábrelo en este dispositivo. Vence en 15 minutos.</p>
      <div class="panel">
        ${devLink ? `<a class="btn btn-primary btn-lg" href="${escapeHtml(devLink)}" id="dev-link">Abrir enlace (modo desarrollo)</a>` : ""}
        <button type="button" class="btn btn-ghost" id="auth-retry">Usar otro correo</button>
      </div>`;
    root.querySelector("#auth-retry").addEventListener("click", () => renderForm(email));
  }

  async function verify(t) {
    root.innerHTML = `<h1>Entrando…</h1><p class="lead muted">Estamos preparando tu diario.</p>`;
    history.replaceState(null, "", "login.html");   // el token no queda en el historial
    try {
      const r = await api("/v1/auth/verify", { method: "POST", body: { token: t } });
      Auth.set({ token: r.token, user: r.user, seq: 0 });
      await Sync.firstSync();
      location.replace("plan.html");
    } catch (err) {
      root.innerHTML = `
        <h1>No pudimos entrar</h1>
        <p class="lead muted">${escapeHtml(err.message)}</p>
        <button type="button" class="btn btn-primary btn-lg" id="auth-again">Pedir un enlace nuevo</button>`;
      root.querySelector("#auth-again").addEventListener("click", () => renderForm());
    }
  }

  function renderAccount() {
    const a = Auth.get();
    root.innerHTML = `
      <h1>Mi cuenta</h1>
      <p class="lead muted">Tu diario se sincroniza automáticamente entre tus dispositivos.</p>
      <div class="panel">
        <div>
          <div class="auth-row"><span>Correo</span><b>${escapeHtml(a.user.email)}</b></div>
          <div class="auth-row"><span>Sincronización</span><b id="sync-state"></b></div>
        </div>
        <div class="auth-actions">
          <button type="button" class="btn btn-outline" id="sync-now">Sincronizar ahora</button>
          <button type="button" class="btn btn-outline" id="export">Descargar mis datos</button>
          <button type="button" class="btn btn-ghost" id="logout">Cerrar sesión</button>
        </div>
        <button type="button" class="btn-danger-link" id="delete">Eliminar mi cuenta</button>
      </div>`;
    const stateEl = root.querySelector("#sync-state");
    const paint = s => {
      stateEl.textContent = s.running ? "Sincronizando…"
        : s.pending ? `${s.pending} ${s.pending === 1 ? "cambio pendiente" : "cambios pendientes"}`
        : s.lastSync ? "Al día · " + new Date(s.lastSync).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
        : "Pendiente";
    };
    paint(Sync.status());
    Sync.onStatus(paint);

    root.querySelector("#sync-now").addEventListener("click", () => Sync.run());
    root.querySelector("#export").addEventListener("click", async () => {
      try {
        const data = await api("/v1/me/export");
        const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
        const link = Object.assign(document.createElement("a"), { href: url, download: "tm-mis-datos.json" });
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (err) { toast(err.message); }
    });
    root.querySelector("#logout").addEventListener("click", async () => {
      try { await api("/v1/auth/logout", { method: "POST" }); } catch (e) { /* igual se cierra localmente */ }
      Auth.clear();
      toast("Sesión cerrada. Tu diario sigue en este dispositivo.");
      renderForm();
    });
    root.querySelector("#delete").addEventListener("click", async () => {
      if (!confirm("¿Eliminar tu cuenta? Se borrará tu diario del servidor de forma permanente. Lo guardado en este dispositivo se mantiene.")) return;
      try {
        await api("/v1/me", { method: "DELETE" });
        Auth.clear();
        toast("Cuenta eliminada");
        renderForm();
      } catch (err) { toast(err.message); }
    });
  }
};

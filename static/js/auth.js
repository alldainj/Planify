
(() => {
    "use strict";

    const originalSetItem = Storage.prototype.setItem;

    let authenticated = false;
    let syncTimer = null;
    let currentUsername = "";

    const nativeSet = (key, value) => {
        originalSetItem.call(localStorage, key, value);
    };

    // ==========================================
    // МИГРАЦИЯ СТАРЫХ СОБЫТИЙ
    // ==========================================

    if (!localStorage.getItem("planifyMigrationChecked")) {
        try {
            const oldEvents = JSON.parse(
                localStorage.getItem("planifyEvents") || "[]"
            );

            if (oldEvents.length > 0) {
                nativeSet("planifyMigrationPending", "1");
            }
        } catch {
            nativeSet("planifyMigrationPending", "0");
        }

        nativeSet("planifyMigrationChecked", "1");
    }

    // ==========================================
    // СОЗДАНИЕ ИНТЕРФЕЙСА АВТОРИЗАЦИИ
    // ==========================================

    const authStyles = document.createElement("style");

    authStyles.textContent = `
        #planifyAuth {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: #080D18;
            font-family: Inter, sans-serif;
        }

        .auth-card {
            width: 100%;
            max-width: 410px;
            padding: 38px;
            background: #101827;
            border: 1px solid #263650;
            border-radius: 18px;
            box-shadow: 0 25px 80px #0007;
        }

        .auth-logo {
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -1.5px;
            margin-bottom: 28px;
            color: #EAF0FF;
        }

        .auth-logo span {
            color: #3478F6;
        }

        .auth-card h2 {
            font-size: 25px;
            margin-bottom: 9px;
            color: #EAF0FF;
        }

        .auth-description {
            color: #8998B3;
            font-size: 13px;
            line-height: 1.6;
            margin-bottom: 25px;
        }

        .auth-card label {
            display: block;
            color: #8998B3;
            font-size: 12px;
            margin: 17px 0 8px;
        }

        .auth-card input {
            width: 100%;
            padding: 14px;
            border: 1px solid #263650;
            border-radius: 9px;
            outline: none;
            background: #080D18;
            color: #EAF0FF;
            font-size: 14px;
        }

        .auth-card input:focus {
            border-color: #3478F6;
        }

        .auth-submit {
            width: 100%;
            padding: 14px;
            margin-top: 23px;
            border: none;
            border-radius: 9px;
            background: #3478F6;
            color: white;
            font-weight: 700;
            cursor: pointer;
            transition: .2s;
        }

        .auth-submit:hover {
            background: #5590ff;
        }

        .auth-submit:disabled {
            opacity: .6;
            cursor: wait;
        }

        .auth-switch {
            display: block;
            margin: 20px auto 0;
            border: none;
            background: none;
            color: #80AAFF;
            font-size: 12px;
            cursor: pointer;
        }

        .auth-message {
            min-height: 18px;
            margin-top: 15px;
            color: #FF929F;
            font-size: 12px;
            line-height: 1.5;
        }

        .auth-message.success {
            color: #83DDB0;
        }

        #planifyLogout {
            margin-left: auto;
            padding: 8px 11px;
            border: 1px solid #50313D;
            border-radius: 8px;
            background: #30232E;
            color: #FF929F;
            font-size: 11px;
            cursor: pointer;
        }

        #planifyLogout:hover {
            background: #542D3B;
        }

        @media (max-width: 600px) {
            .auth-card {
                padding: 27px;
            }
        }
    `;

    document.head.append(authStyles);

    const authScreen = document.createElement("div");

    authScreen.id = "planifyAuth";

    authScreen.innerHTML = `
        <div class="auth-card">
            <div class="auth-logo">Planify<span>.</span></div>

            <h2 id="authTitle">С возвращением!</h2>

            <p class="auth-description" id="authDescription">
                Войди в свой аккаунт, чтобы открыть личный календарь.
            </p>

            <form id="authForm">
                <label for="authUsername">Имя пользователя</label>
                <input
                    id="authUsername"
                    type="text"
                    minlength="3"
                    maxlength="30"
                    autocomplete="username"
                    placeholder="Твоё имя"
                    required
                >

                <label for="authPassword">Пароль</label>
                <input
                    id="authPassword"
                    type="password"
                    minlength="8"
                    maxlength="128"
                    autocomplete="current-password"
                    placeholder="Не менее 8 символов"
                    required
                >

                <button class="auth-submit" id="authSubmit" type="submit">
                    Войти
                </button>

                <div class="auth-message" id="authMessage"></div>
            </form>

            <button class="auth-switch" id="authSwitch" type="button">
                Нет аккаунта? Зарегистрироваться
            </button>
        </div>
    `;

    document.body.append(authScreen);

    let authMode = "login";

    const authForm = document.getElementById("authForm");
    const authTitle = document.getElementById("authTitle");
    const authDescription = document.getElementById("authDescription");
    const authSubmit = document.getElementById("authSubmit");
    const authSwitch = document.getElementById("authSwitch");
    const authMessage = document.getElementById("authMessage");
    const authUsername = document.getElementById("authUsername");
    const authPassword = document.getElementById("authPassword");

    function setMode(mode) {
        authMode = mode;

        authTitle.textContent =
            mode === "login" ? "С возвращением!" : "Создать аккаунт";

        authDescription.textContent =
            mode === "login"
                ? "Войди в свой аккаунт, чтобы открыть личный календарь."
                : "Зарегистрируйся, чтобы сохранять свои планы и синхронизировать их.";

        authSubmit.textContent =
            mode === "login" ? "Войти" : "Зарегистрироваться";

        authSwitch.textContent =
            mode === "login"
                ? "Нет аккаунта? Зарегистрироваться"
                : "Уже есть аккаунт? Войти";

        authPassword.autocomplete =
            mode === "login" ? "current-password" : "new-password";

        authMessage.textContent = "";
        authMessage.className = "auth-message";
    }

    authSwitch.addEventListener("click", () => {
        setMode(authMode === "login" ? "register" : "login");
    });

    // ==========================================
    // ЗАПРОСЫ К СЕРВЕРУ
    // ==========================================

    async function apiRequest(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        let data = {};

        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            throw new Error(
                data.detail || "Произошла ошибка сервера."
            );
        }

        return data;
    }

    // ==========================================
    // СОБЫТИЯ АККАУНТА
    // ==========================================

    async function loadAccountEvents() {
        const result = await apiRequest("/api/events");

        let localEvents = [];

        try {
            localEvents = JSON.parse(
                localStorage.getItem("planifyEvents") || "[]"
            );
        } catch {
            localEvents = [];
        }

        const serverEvents = Array.isArray(result.events)
            ? result.events
            : [];

        const migrationPending =
            localStorage.getItem("planifyMigrationPending") === "1";

        if (
            migrationPending &&
            serverEvents.length === 0 &&
            localEvents.length > 0
        ) {
            await apiRequest("/api/events", {
                method: "PUT",
                body: JSON.stringify({
                    events: localEvents
                })
            });
        } else {
            const serverJSON = JSON.stringify(serverEvents);
            const localJSON = JSON.stringify(localEvents);

            if (serverJSON !== localJSON) {
                nativeSet("planifyEvents", serverJSON);
                return true;
            }
        }

        nativeSet("planifyMigrationPending", "0");

        return false;
    }

    // ==========================================
    // СИНХРОНИЗАЦИЯ
    // ==========================================

    async function syncEvents() {
        if (!authenticated) return;

        let events = [];

        try {
            events = JSON.parse(
                localStorage.getItem("planifyEvents") || "[]"
            );
        } catch {
            return;
        }

        try {
            await apiRequest("/api/events", {
                method: "PUT",
                body: JSON.stringify({
                    events
                })
            });
        } catch (error) {
            console.error("Planify sync error:", error);
        }
    }

    function scheduleSync() {
        if (!authenticated) return;

        clearTimeout(syncTimer);

        syncTimer = setTimeout(syncEvents, 700);
    }

    Storage.prototype.setItem = function (key, value) {
        originalSetItem.call(this, key, value);

        if (
            this === localStorage &&
            key === "planifyEvents" &&
            authenticated
        ) {
            scheduleSync();
        }
    };

    // ==========================================
    // ПРОФИЛЬ И ВЫХОД
    // ==========================================

    function setupProfile(username) {
        const profile = document.querySelector(".sidebar-bottom");

        if (!profile) return;

        const avatar = profile.querySelector(".avatar");
        const strong = profile.querySelector("strong");
        const small = profile.querySelector("small");

        if (avatar) {
            avatar.textContent = username.charAt(0).toUpperCase();
        }

        if (strong) {
            strong.textContent = username;
        }

        if (small) {
            small.textContent = "Мой аккаунт";
        }

        if (!document.getElementById("planifyLogout")) {
            const logout = document.createElement("button");

            logout.id = "planifyLogout";
            logout.textContent = "Выйти";

            logout.addEventListener("click", async () => {
                logout.disabled = true;

                try {
                    await syncEvents();

                    await apiRequest("/api/auth/logout", {
                        method: "POST",
                        body: "{}"
                    });

                    authenticated = false;

                    nativeSet("planifyEvents", "[]");
                    nativeSet("planifyActiveUser", "");

                    location.reload();
                } catch (error) {
                    alert(error.message);
                    logout.disabled = false;
                }
            });

            profile.append(logout);
        }
    }

    // ==========================================
    // ЗАВЕРШЕНИЕ АВТОРИЗАЦИИ
    // ==========================================

    async function finishAuthentication(username) {
        currentUsername = username;

        const changed = await loadAccountEvents();

        nativeSet("planifyActiveUser", username);
        nativeSet("planifyMigrationPending", "0");

        authenticated = true;

        if (changed) {
            location.reload();
            return;
        }

        authScreen.style.display = "none";

        setupProfile(username);
    }

    // ==========================================
    // ФОРМА ВХОДА И РЕГИСТРАЦИИ
    // ==========================================

    authForm.addEventListener("submit", async event => {
        event.preventDefault();

        const username = authUsername.value.trim();
        const password = authPassword.value;

        if (username.length < 3 || username.length > 30) {
            authMessage.textContent =
                "Имя пользователя должно содержать от 3 до 30 символов.";
            return;
        }

        if (password.length < 8) {
            authMessage.textContent =
                "Пароль должен содержать минимум 8 символов.";
            return;
        }

        authSubmit.disabled = true;
        authMessage.textContent = "Подключаемся к серверу...";

        try {
            const endpoint = authMode === "login"
                ? "/api/auth/login"
                : "/api/auth/register";

            const result = await apiRequest(endpoint, {
                method: "POST",
                body: JSON.stringify({
                    username,
                    password
                })
            });

            await finishAuthentication(result.username);

            authMessage.textContent = "Успешно!";
            authMessage.className = "auth-message success";

        } catch (error) {
            authMessage.textContent = error.message;
        } finally {
            authSubmit.disabled = false;
        }
    });

    // ==========================================
    // ПРОВЕРКА АВТОРИЗАЦИИ ПРИ ЗАПУСКЕ
    // ==========================================

    async function initializeAuth() {
        try {
            const result = await apiRequest("/api/auth/me");

            if (!result.authenticated) {
                authScreen.style.display = "flex";
                return;
            }

            await finishAuthentication(result.username);

        } catch (error) {
            console.error("Planify auth error:", error);

            authMessage.textContent =
                "Не удалось подключиться к серверу. Проверь, запущен ли Planify.";

            authScreen.style.display = "flex";
        }
    }

    initializeAuth();

})();

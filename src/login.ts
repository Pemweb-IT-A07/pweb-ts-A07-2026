import { login, logout, redirectAfterLogin } from "./services/auth.service.js";
import { getSession } from "./services/storage.service.js";
import { qs } from "./utils/dom.js";

function init(): void {
  const existing = getSession();
  if (existing) {
    const form = qs<HTMLFormElement>("#login-form");
    const alreadyLoggedIn = qs<HTMLDivElement>("#already-logged-in");
    const loggedInName = qs<HTMLElement>("#logged-in-name");
    const loggedInRole = qs<HTMLElement>("#logged-in-role");
    const continueBtn = qs<HTMLButtonElement>("#continue-btn");
    const logoutBtn = qs<HTMLButtonElement>("#logout-btn");

    form.hidden = true;
    alreadyLoggedIn.hidden = false;
    loggedInName.textContent = existing.firstName;
    loggedInRole.textContent = existing.role;

    continueBtn.addEventListener("click", () => redirectAfterLogin(existing));
    logoutBtn.addEventListener("click", () => logout());
    return;
  }

  const form = qs<HTMLFormElement>("#login-form");
  const usernameInput = qs<HTMLInputElement>("#username");
  const passwordInput = qs<HTMLInputElement>("#password");
  const togglePasswordButton = qs<HTMLButtonElement>("#toggle-password");
  const eyeOpenIcon = qs<SVGSVGElement>(".password-eye-open");
  const eyeClosedIcon = qs<SVGSVGElement>(".password-eye-closed");
  const submitButton = qs<HTMLButtonElement>("#login-submit");
  const errorMessage = qs<HTMLParagraphElement>("#login-error");

  togglePasswordButton.addEventListener("click", () => {
    const showPassword = passwordInput.type === "password";
    passwordInput.type = showPassword ? "text" : "password";
    togglePasswordButton.setAttribute("aria-label", `${showPassword ? "Sembunyikan" : "Tampilkan"} password`);
    togglePasswordButton.setAttribute("aria-pressed", String(showPassword));
    eyeOpenIcon.toggleAttribute("hidden", showPassword);
    eyeClosedIcon.toggleAttribute("hidden", !showPassword);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void handleSubmit();
  });

  async function handleSubmit(): Promise<void> {
    errorMessage.hidden = true;
    errorMessage.textContent = "";

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      errorMessage.textContent = "Username dan password wajib diisi.";
      errorMessage.hidden = false;
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Memproses...";

    try {
      const session = await login(username, password);
      redirectAfterLogin(session);
    } catch (error) {
      errorMessage.textContent = error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui.";
      errorMessage.hidden = false;
      submitButton.disabled = false;
      submitButton.textContent = "Masuk";
    }
  }
}

init();

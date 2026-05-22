(() => {
  "use strict";

  const FAVICON_URL = "assets/favicon.png";
  const LOGO_URL = "assets/smartbook-logo.png";
  const LOGO_MASK_URL = "assets/smartbook-logo-mask.png";
  const API_BASE_URL = "https://app.smartbookai.es";
  const DEFAULT_PLAN = "sin_plan";
  const ALLOWED_PLAN_VALUES = new Set(["starter", "lite", "smart", "power", "ultra", DEFAULT_PLAN]);
  const REGISTER_DRAFT_KEY = "sba_register_draft";
  const RESEND_UNLOCK_KEY = "sba_resend_unlock_at";
  const RESEND_COOLDOWN_MS = 3 * 60 * 1000;

  const TOP_THRESHOLD = 4;
  const BRAND_PURPLE_FALLBACK = "#6951ff";
  const HEADMARK_SIZE = 16;
  const REL_NOOPENER = "noopener";
  const REL_NOREFERRER = "noreferrer";
  const LOGO_FILE_PATTERN = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;
  const LOGO_REPEAT_GAP = 5;
  const DEFAULT_LOGO_URLS = [
    "assets/logos/bhd.jpeg",
    "assets/logos/digitallaw.png",
    "assets/logos/lavadora.png",
    "assets/logos/pescado.png",
    "assets/logos/reshop.jpeg",
    "assets/logos/rydalca.jpeg",
  ];

  const root = document.documentElement;
  const userAgent = navigator.userAgent;
  const isChromium = /(?:Chrome|Chromium|Edg)\//.test(userAgent) && !/Firefox\//.test(userAgent);
  const navbar = document.querySelector(".navbar");
  const headmarkCanvas = document.querySelector(".nav-headmark-canvas");
  const headmarkContext = headmarkCanvas ? headmarkCanvas.getContext("2d", { willReadFrequently: true }) : null;
  const navbarLogo = document.querySelector(".navbar .logo-img");
  const navLinks = document.querySelector(".nav-links");
  const navPill = navLinks ? navLinks.querySelector(".nav-pill") : null;
  const navItems = navLinks ? [...navLinks.querySelectorAll("a")].filter((link) => link !== navPill) : [];
  const revealElements = [...document.querySelectorAll(".reveal")];
  const videoModal = document.querySelector("#hero-video-modal");
  const videoModalOpenItems = [...document.querySelectorAll("[data-video-modal-open]")];
  const videoModalCloseItems = [...document.querySelectorAll("[data-video-modal-close]")];
  const videoModalPlayer = videoModal ? videoModal.querySelector(".video-modal-player") : null;
  const videoModalCloseButton = videoModal ? videoModal.querySelector(".video-modal-close") : null;
  const invoiceInfoModal = document.querySelector("#invoice-info-modal");
  const invoiceInfoOpenItems = [...document.querySelectorAll("[data-invoice-info-open]")];
  const invoiceInfoCloseItems = [...document.querySelectorAll("[data-invoice-info-close]")];
  const invoiceInfoCloseButton = invoiceInfoModal ? invoiceInfoModal.querySelector(".invoice-info-close") : null;
  const verifactuInfoModal = document.querySelector("#verifactu-info-modal");
  const verifactuInfoOpenItems = [...document.querySelectorAll("[data-verifactu-info-open]")];
  const verifactuInfoCloseItems = [...document.querySelectorAll("[data-verifactu-info-close]")];
  const verifactuInfoCloseButton = verifactuInfoModal ? verifactuInfoModal.querySelector(".invoice-info-close") : null;
  const successStoryModal = document.querySelector("#success-story-modal");
  const successStoryOpenItems = [...document.querySelectorAll("[data-success-story-open]")];
  const successStoryCloseItems = [...document.querySelectorAll("[data-success-story-close]")];
  const successStoryCloseButton = successStoryModal ? successStoryModal.querySelector(".invoice-info-close") : null;
  const logoMarquee = document.querySelector(".logo-marquee");
  const logoMarqueeTrack = logoMarquee ? logoMarquee.querySelector(".logo-marquee-track") : null;
  const frontendForms = [...document.querySelectorAll("[data-frontend-form]")];
  const frontendPlaceholderLinks = [...document.querySelectorAll("[data-frontend-placeholder]")];
  const confirmEmail = document.querySelector("#confirm-email");
  const resendButton = document.querySelector("#btn-resend");
  const resendButtonLabel = document.querySelector("#btn-resend-label");
  const resendFeedback = document.querySelector("#resend-feedback");
  const loginForm = document.querySelector("#form-login");
  const registerForm = document.querySelector("#form-registro");

  let activeNavLink = null;
  let layoutFrame = null;
  let videoModalReturnFocus = null;
  let invoiceInfoReturnFocus = null;
  let verifactuInfoReturnFocus = null;
  let successStoryReturnFocus = null;
  let logoMarqueeFrame = null;
  let logoMarqueeOffset = 0;
  let logoMarqueeLastTime = 0;

  root.classList.toggle("is-chromium", isChromium);

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const navEntries = typeof performance.getEntriesByType === "function"
    ? performance.getEntriesByType("navigation")
    : [];
  if (navEntries.length > 0 && navEntries[0].type === "reload") {
    window.scrollTo(0, 0);
  }

  const parseHexToRgb = (rawHex) => {
    const hex = String(rawHex ?? "").trim().replace(/^#/, "");
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  };

  const accentColor = () => parseHexToRgb(
    getComputedStyle(root).getPropertyValue("--accent") || BRAND_PURPLE_FALLBACK
  ) ?? parseHexToRgb(BRAND_PURPLE_FALLBACK);

  const paintHeadmarkPurple = () => {
    if (!headmarkContext || !headmarkCanvas) return;

    const color = accentColor();
    if (!color) return;

    const favicon = new Image();
    favicon.decoding = "async";
    favicon.addEventListener("load", () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = HEADMARK_SIZE;
      offscreen.height = HEADMARK_SIZE;
      const offscreenContext = offscreen.getContext("2d", { willReadFrequently: true });
      if (!offscreenContext) return;

      offscreenContext.clearRect(0, 0, HEADMARK_SIZE, HEADMARK_SIZE);
      offscreenContext.drawImage(favicon, 0, 0, HEADMARK_SIZE, HEADMARK_SIZE);
      const imageData = offscreenContext.getImageData(0, 0, HEADMARK_SIZE, HEADMARK_SIZE);
      const { data } = imageData;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
          data[i] = color.r;
          data[i + 1] = color.g;
          data[i + 2] = color.b;
        }
      }

      offscreenContext.putImageData(imageData, 0, 0);
      headmarkContext.clearRect(0, 0, headmarkCanvas.width, headmarkCanvas.height);
      headmarkContext.drawImage(offscreen, 0, 0, headmarkCanvas.width, headmarkCanvas.height);
    });
    favicon.src = FAVICON_URL;
  };

  const clearNavPill = () => {
    if (!navPill) return;
    activeNavLink = null;
    navLinks?.classList.remove("is-flow");
    navItems.forEach((item) => item.classList.remove("is-pill-active"));
    navPill.style.setProperty("--pill-x", "0px");
    navPill.style.setProperty("--pill-y", "0px");
    navPill.style.opacity = "0";
    navPill.style.width = "0px";
    navPill.style.height = "0px";
  };

  const setActiveNavPill = (link, instant = false) => {
    if (!navPill || !link || !navLinks) return;
    if (!navLinks.contains(link)) {
      clearNavPill();
      return;
    }

    const navRect = navLinks.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    if (linkRect.width <= 0 || linkRect.height <= 0) {
      clearNavPill();
      return;
    }

    navItems.forEach((item) => item.classList.toggle("is-pill-active", item === link));
    navLinks.classList.add("is-flow");
    navPill.style.setProperty("--pill-x", `${linkRect.left - navRect.left}px`);
    navPill.style.setProperty("--pill-y", `${linkRect.top - navRect.top}px`);
    navPill.style.width = `${linkRect.width}px`;
    navPill.style.height = `${linkRect.height}px`;
    navPill.style.opacity = "1";
    navPill.classList.toggle("no-transition", instant);
    activeNavLink = link;

    if (instant) {
      requestAnimationFrame(() => navPill.classList.remove("no-transition"));
    }
  };

  const setNavbarState = () => {
    if (!navbar) return;

    const isAtTop = window.scrollY <= TOP_THRESHOLD;
    navbar.classList.toggle("scrolled", !isAtTop);

    if (navbarLogo) {
      const targetLogo = isAtTop ? LOGO_URL : LOGO_MASK_URL;
      if (navbarLogo.getAttribute("src") !== targetLogo) {
        navbarLogo.setAttribute("src", targetLogo);
      }
    }

    if (activeNavLink) {
      setActiveNavPill(activeNavLink, true);
    }
  };

  const queueLayoutUpdate = () => {
    if (layoutFrame) return;
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = null;
      setNavbarState();
    });
  };

  const initRevealAnimations = () => {
    if (!revealElements.length) return;

    if (!("IntersectionObserver" in window)) {
      revealElements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    revealElements.forEach((element) => observer.observe(element));
  };

  const hardenBlankTargetLinks = () => {
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
      const relValues = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
      relValues.add(REL_NOOPENER);
      relValues.add(REL_NOREFERRER);
      link.setAttribute("rel", [...relValues].join(" "));
    });
  };

  const showFrontendToast = (message) => {
    let toast = document.querySelector("[data-frontend-toast]");
    if (!toast) {
      toast = document.createElement("p");
      toast.className = "frontend-toast";
      toast.dataset.frontendToast = "";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.append(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showFrontendToast.timer);
    showFrontendToast.timer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 3600);
  };

  const setFieldState = (field, message = "") => {
    if (!field) return;

    field.setCustomValidity(message);
    field.toggleAttribute("aria-invalid", Boolean(message));
    const phoneControl = field.closest(".contact-page-phone-control");
    if (phoneControl) {
      phoneControl.classList.toggle("field-invalid", Boolean(message));
    }
  };

  const setFormFeedback = (form, message, state = "ok") => {
    const feedback = form.querySelector("[data-form-feedback]");
    if (!feedback) return;

    feedback.textContent = message;
    feedback.classList.toggle("ok", state === "ok");
    feedback.classList.toggle("err", state === "err");
  };

  const sanitizeSingleLine = (value, maxLength) => String(value || "")
    .replace(/[<>{}`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

  const sanitizeMultiLine = (value, maxLength) => String(value || "")
    .replace(/[<>{}`]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);

  const sanitizePhone = (value) => String(value || "")
    .replace(/[^+\d\s().-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30);

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,160}$/.test(value);
  const apiUrl = (path) => `${API_BASE_URL}${path}`;
  const normalizeEmail = (value) => sanitizeSingleLine(value, 160).toLowerCase();
  const normalizePlan = (value) => {
    const plan = sanitizeSingleLine(value, 40).toLowerCase();
    return ALLOWED_PLAN_VALUES.has(plan) ? plan : DEFAULT_PLAN;
  };
  const isValidPassword = (value) => {
    const password = String(value || "");
    return (
      password.length >= 8 &&
      password.length <= 256 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password)
    );
  };

  const getNamedField = (form, name) => form.querySelector(`[name="${name}"]`);

  const validateTextField = ({ field, label, min = 0, max = 160, required = false, multiline = false }) => {
    if (!field) return null;

    const cleaned = multiline ? sanitizeMultiLine(field.value, max) : sanitizeSingleLine(field.value, max);
    field.value = cleaned;
    setFieldState(field);

    if (required && !cleaned) return { field, message: `${label} es obligatorio.` };
    if (cleaned && cleaned.length < min) return { field, message: `${label} debe tener al menos ${min} caracteres.` };
    return null;
  };

  const validateEmailField = (field) => {
    if (!field) return null;

    const email = sanitizeSingleLine(field.value, 160).toLowerCase();
    field.value = email;
    setFieldState(field);

    if (!email) return { field, message: "Email es obligatorio." };
    if (!isValidEmail(email)) return { field, message: "Introduce un email válido." };
    return null;
  };

  const validatePhoneField = (field) => {
    if (!field) return null;

    const phone = sanitizePhone(field.value);
    field.value = phone;
    setFieldState(field);

    if (phone && !/^[+\d\s().-]{6,30}$/.test(phone)) {
      return { field, message: "Introduce un teléfono válido." };
    }

    return null;
  };

  const validateRequiredPhoneField = (field) => {
    if (!field) return null;

    const phone = sanitizePhone(field.value);
    field.value = phone;
    setFieldState(field);

    if (!phone) return { field, message: "Teléfono es obligatorio." };
    if (!/^[+\d\s().-]{6,30}$/.test(phone)) return { field, message: "Introduce un teléfono válido." };
    return null;
  };

  const validatePasswordField = (field) => {
    if (!field) return null;

    const password = String(field.value || "");
    setFieldState(field);

    if (!password) return { field, message: "Contraseña es obligatoria." };
    if (!isValidPassword(password)) {
      return {
        field,
        message: "La contraseña debe tener entre 8 y 256 caracteres e incluir mayúscula, minúscula y número.",
      };
    }
    return null;
  };

  const applyFirstFormError = (form, error) => {
    if (!error) return false;

    setFieldState(error.field, error.message);
    setFormFeedback(form, error.message, "err");
    error.field.focus({ preventScroll: false });
    error.field.reportValidity();
    return true;
  };

  const validateContactForm = (form) => {
    const phoneInput = form.querySelector("[data-phone-number]");
    const phoneHidden = form.querySelector("[data-phone-full]");
    const phonePrefix = form.querySelector("[data-phone-prefix-code]");

    const error =
      validateTextField({ field: getNamedField(form, "nombre"), label: "Nombre", min: 2, max: 80, required: true }) ||
      validateEmailField(getNamedField(form, "email")) ||
      validateTextField({ field: getNamedField(form, "empresa"), label: "Empresa", max: 120 }) ||
      validatePhoneField(phoneInput) ||
      validateTextField({ field: getNamedField(form, "mensaje"), label: "Mensaje", min: 10, max: 1000, required: true, multiline: true });

    if (phoneHidden) {
      const number = sanitizePhone(phoneInput ? phoneInput.value : "");
      const prefix = sanitizePhone(phonePrefix ? phonePrefix.textContent : "");
      phoneHidden.value = number ? `${prefix} ${number}`.trim() : "";
    }

    return !applyFirstFormError(form, error);
  };

  const initFrontendForms = () => {
    frontendForms.forEach((form) => {
      form.addEventListener("input", (event) => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
          setFieldState(event.target);
          setFormFeedback(form, "", "ok");
        }
      });

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const valid = validateContactForm(form);
        if (!valid) return;

        form.reset();
        setFormFeedback(form, "Consulta preparada para conexión futura. No se ha enviado ningún dato.", "ok");
      });
    });
  };

  const initFrontendPlaceholders = () => {
    frontendPlaceholderLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        showFrontendToast(link.dataset.placeholderMessage || "Funcionalidad preparada para conexión futura.");
      });
    });
  };

  const parseJsonResponse = async (response) => {
    try {
      return await response.json();
    } catch {
      return {};
    }
  };

  const responseErrorMessage = (data, fallback) => {
    if (!data || typeof data !== "object") return fallback;
    if (typeof data.error === "string") return sanitizeSingleLine(data.error, 240);
    if (typeof data.detail === "string") return sanitizeSingleLine(data.detail, 240);

    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
      return sanitizeSingleLine(firstValue[0], 240);
    }
    if (typeof firstValue === "string") return sanitizeSingleLine(firstValue, 240);
    return fallback;
  };

  const redirectToBackendTarget = (target) => {
    try {
      const url = new URL(String(target || "/"), API_BASE_URL);
      if (url.origin === API_BASE_URL || url.origin === window.location.origin) {
        window.location.assign(url.href);
        return;
      }
    } catch {
      // Fallback below.
    }
    window.location.assign(API_BASE_URL);
  };

  const setButtonLoading = (button, label, loadingText, defaultText, loading) => {
    if (!button) return;

    button.disabled = loading;
    if (label) label.textContent = loading ? loadingText : defaultText;
  };

  const validateLoginForm = (form) => {
    const emailField = form.querySelector("#login-email");
    const passwordField = form.querySelector("#login-password");
    const error = validateEmailField(emailField) || validatePasswordField(passwordField);
    return !applyFirstFormError(form, error);
  };

  const validateBackendRegisterForm = (form) => {
    const error =
      validateTextField({ field: form.querySelector("#name"), label: "Nombre", min: 2, max: 80, required: true }) ||
      validateRequiredPhoneField(form.querySelector("#phone")) ||
      validateEmailField(form.querySelector("#email")) ||
      validatePasswordField(form.querySelector("#password"));

    return !applyFirstFormError(form, error);
  };

  const initLoginForm = () => {
    if (!loginForm) return;

    const params = new URLSearchParams(window.location.search);
    const banner = loginForm.ownerDocument.querySelector("#login-banner");
    const submitButton = loginForm.querySelector("#btn-login-submit");
    const submitLabel = loginForm.querySelector("#btn-login-label");

    if (params.get("registro") === "ok" && banner) {
      banner.textContent = "Cuenta creada correctamente. Ya puedes iniciar sesión.";
      banner.classList.add("ok");
    }

    loginForm.addEventListener("input", (event) => {
      if (event.target instanceof HTMLInputElement) {
        setFieldState(event.target);
        setFormFeedback(loginForm, "", "ok");
      }
    });

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validateLoginForm(loginForm)) return;

      const email = normalizeEmail(loginForm.querySelector("#login-email")?.value);
      const password = String(loginForm.querySelector("#login-password")?.value || "");

      setButtonLoading(submitButton, submitLabel, "Entrando...", "Entrar", true);
      setFormFeedback(loginForm, "", "ok");

      try {
        const response = await fetch(apiUrl("/api/login/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        const data = await parseJsonResponse(response);

        if (!response.ok) {
          setFormFeedback(loginForm, responseErrorMessage(data, "Credenciales incorrectas. Revisa tu email y contraseña."), "err");
          return;
        }

        redirectToBackendTarget(data.redirect || "/");
      } catch {
        setFormFeedback(loginForm, "No se pudo conectar con el servidor. Inténtalo de nuevo en unos minutos.", "err");
      } finally {
        setButtonLoading(submitButton, submitLabel, "Entrando...", "Entrar", false);
      }
    });
  };

  const initRegisterForm = () => {
    if (!registerForm) return;

    const params = new URLSearchParams(window.location.search);
    const selectedPlan = normalizePlan(params.get("plan"));
    const storedDraft = sessionStorage.getItem(REGISTER_DRAFT_KEY);

    if (storedDraft) {
      try {
        const draft = JSON.parse(storedDraft);
        if (draft && typeof draft === "object") {
          if (draft.nombre) registerForm.querySelector("#name").value = sanitizeSingleLine(draft.nombre, 80);
          if (draft.telefono) registerForm.querySelector("#phone").value = sanitizePhone(draft.telefono);
          if (draft.email) registerForm.querySelector("#email").value = normalizeEmail(draft.email);
        }
      } catch {
        sessionStorage.removeItem(REGISTER_DRAFT_KEY);
      }
    }

    registerForm.addEventListener("input", (event) => {
      if (event.target instanceof HTMLInputElement) {
        setFieldState(event.target);
        setFormFeedback(registerForm, "", "ok");
      }
    });

    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validateBackendRegisterForm(registerForm)) return;

      const payload = {
        nombre: sanitizeSingleLine(registerForm.querySelector("#name")?.value, 80),
        telefono: sanitizePhone(registerForm.querySelector("#phone")?.value),
        email: normalizeEmail(registerForm.querySelector("#email")?.value),
        password: String(registerForm.querySelector("#password")?.value || ""),
        plan: selectedPlan,
      };

      if (payload.plan === DEFAULT_PLAN) {
        sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify({
          nombre: payload.nombre,
          telefono: payload.telefono,
          email: payload.email,
        }));
        window.location.assign("planes.html");
        return;
      }

      const submitButton = registerForm.querySelector(".auth-form-submit");
      const submitLabel = submitButton?.querySelector("span");
      setButtonLoading(submitButton, submitLabel, "Creando cuenta...", "Crear cuenta", true);
      setFormFeedback(registerForm, "", "ok");

      try {
        const response = await fetch(apiUrl("/api/register/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse(response);

        if (!response.ok) {
          setFormFeedback(registerForm, responseErrorMessage(data, "No se pudo completar el registro. Revisa los datos e inténtalo de nuevo."), "err");
          return;
        }

        sessionStorage.removeItem(REGISTER_DRAFT_KEY);
        window.location.assign(`confirm.html?email=${encodeURIComponent(payload.email)}`);
      } catch {
        setFormFeedback(registerForm, "No se pudo conectar con el servidor. Inténtalo de nuevo en unos minutos.", "err");
      } finally {
        setButtonLoading(submitButton, submitLabel, "Creando cuenta...", "Crear cuenta", false);
      }
    });
  };

  const initAuthForms = () => {
    initLoginForm();
    initRegisterForm();
  };

  const initConfirmPage = () => {
    const params = new URLSearchParams(window.location.search);
    const email = normalizeEmail(params.get("email"));

    if (confirmEmail) {
      if (isValidEmail(email)) confirmEmail.textContent = email;
    }

    if (!resendButton || !resendFeedback) return;

    const setResendFeedback = (message, state) => {
      resendFeedback.textContent = message;
      resendFeedback.classList.toggle("ok", state === "ok");
      resendFeedback.classList.toggle("err", state === "err");
    };

    const updateCooldown = () => {
      const unlockAt = Number(localStorage.getItem(RESEND_UNLOCK_KEY) || 0);
      const remainingMs = unlockAt - Date.now();
      if (remainingMs <= 0) {
        resendButton.disabled = false;
        if (resendButtonLabel) resendButtonLabel.textContent = "Reenviar correo";
        return;
      }

      resendButton.disabled = true;
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      if (resendButtonLabel) resendButtonLabel.textContent = `Reenviar en ${remainingSeconds}s`;
      window.setTimeout(updateCooldown, 1000);
    };

    updateCooldown();

    resendButton.addEventListener("click", async () => {
      if (!isValidEmail(email)) {
        setResendFeedback("No se ha podido identificar un email válido para reenviar la confirmación.", "err");
        return;
      }

      resendButton.disabled = true;
      if (resendButtonLabel) resendButtonLabel.textContent = "Enviando...";
      setResendFeedback("", "ok");

      try {
        const response = await fetch(apiUrl("/api/resend-confirmation/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await parseJsonResponse(response);

        if (!response.ok && response.status !== 429) {
          const fallback = response.status === 410
            ? "El registro ha expirado. Puedes registrarte de nuevo para recibir otro enlace."
            : "No se pudo reenviar el correo. Inténtalo de nuevo más tarde.";
          setResendFeedback(responseErrorMessage(data, fallback), "err");
          resendButton.disabled = false;
          if (resendButtonLabel) resendButtonLabel.textContent = "Reenviar correo";
          return;
        }

        localStorage.setItem(RESEND_UNLOCK_KEY, String(Date.now() + RESEND_COOLDOWN_MS));
        setResendFeedback("Correo reenviado. Revisa tu bandeja de entrada y spam.", "ok");
        updateCooldown();
      } catch {
        setResendFeedback("No se pudo conectar con el servidor. Inténtalo de nuevo en unos minutos.", "err");
        resendButton.disabled = false;
        if (resendButtonLabel) resendButtonLabel.textContent = "Reenviar correo";
      }
    });
  };

  const initConfirmErrorPage = () => {
    const title = document.querySelector("#error-title");
    const intro = document.querySelector("#error-intro");
    const expired = document.querySelector("#reason-expired");
    const used = document.querySelector("#reason-used");
    if (!title || !intro) return;

    const params = new URLSearchParams(window.location.search);
    const reason = sanitizeSingleLine(params.get("reason"), 20).toLowerCase();

    if (reason === "expired") {
      title.textContent = "El enlace ha caducado";
      intro.textContent = "Por motivos de seguridad, los enlaces de confirmación son válidos durante un tiempo limitado. Este enlace ha superado ese límite.";
      expired?.classList.add("is-current-reason");
    } else if (reason === "used") {
      title.textContent = "El enlace ya fue utilizado";
      intro.textContent = "Por motivos de seguridad, cada enlace de confirmación solo puede usarse una vez. Este enlace ya fue empleado anteriormente.";
      used?.classList.add("is-current-reason");
    }
  };

  const decodePathPart = (value) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const logoNameFromUrl = (url) => {
    const fileName = decodePathPart(String(url).split("/").pop() || "");
    return fileName
      .replace(LOGO_FILE_PATTERN, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Logo";
  };

  const getLogoUrls = () => {
    const datasetLogos = logoMarquee ? logoMarquee.dataset.logoList || "" : "";
    const configuredLogos = datasetLogos
      .split(",")
      .map((url) => sanitizeSingleLine(url, 180))
      .filter((url) => LOGO_FILE_PATTERN.test(url) && !/^https?:\/\//i.test(url));

    return configuredLogos.length ? configuredLogos : DEFAULT_LOGO_URLS;
  };

  const shuffleItems = (items) => {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  };

  const pickNextLogo = (logos, recentLogos) => {
    const recentSet = new Set(recentLogos);
    const candidates = logos.filter((logo) => !recentSet.has(logo));
    const pool = candidates.length ? candidates : logos;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const isLogoSequenceSpaced = (sequence, gap = LOGO_REPEAT_GAP) => {
    if (sequence.length <= 1) return true;

    return sequence.every((logo, index) => {
      for (let offset = 1; offset <= Math.min(gap, sequence.length - 1); offset += 1) {
        if (logo === sequence[(index + offset) % sequence.length]) return false;
      }
      return true;
    });
  };

  const createLogoSequence = (logos, minItems = 24) => {
    if (logos.length <= 1) return logos;

    const targetLength = Math.max(minItems, logos.length);
    const effectiveGap = Math.min(LOGO_REPEAT_GAP, logos.length - 1);

    for (let attempt = 0; attempt < 80; attempt += 1) {
      const sequence = [];

      while (sequence.length < targetLength) {
        sequence.push(pickNextLogo(logos, sequence.slice(-effectiveGap)));
      }

      if (isLogoSequenceSpaced(sequence, effectiveGap)) {
        return sequence;
      }
    }

    const stableOrder = shuffleItems(logos);
    const fallback = [];
    while (fallback.length < targetLength) {
      fallback.push(...stableOrder);
    }
    return fallback.slice(0, targetLength);
  };

  const logoItem = (src) => {
    const item = document.createElement("div");
    item.className = "logo-marquee-item";

    const image = document.createElement("img");
    image.src = src;
    image.alt = logoNameFromUrl(src);
    image.loading = "lazy";
    image.decoding = "async";

    item.append(image);
    return item;
  };

  const stopLogoMarquee = () => {
    if (!logoMarqueeFrame) return;
    cancelAnimationFrame(logoMarqueeFrame);
    logoMarqueeFrame = null;
  };

  const tickLogoMarquee = (time) => {
    if (!logoMarqueeTrack) return;

    if (!logoMarqueeLastTime) logoMarqueeLastTime = time;
    const elapsedSeconds = Math.min((time - logoMarqueeLastTime) / 1000, 0.05);
    logoMarqueeLastTime = time;

    logoMarqueeOffset += elapsedSeconds * 18;

    let firstItem = logoMarqueeTrack.firstElementChild;
    while (firstItem) {
      const firstItemWidth = firstItem.getBoundingClientRect().width;
      if (!firstItemWidth || logoMarqueeOffset < firstItemWidth) break;
      logoMarqueeTrack.append(firstItem);
      logoMarqueeOffset -= firstItemWidth;
      firstItem = logoMarqueeTrack.firstElementChild;
    }

    logoMarqueeTrack.style.transform = `translate3d(${-logoMarqueeOffset}px, 0, 0)`;
    logoMarqueeFrame = requestAnimationFrame(tickLogoMarquee);
  };

  const startLogoMarquee = () => {
    stopLogoMarquee();
    logoMarqueeOffset = 0;
    logoMarqueeLastTime = 0;
    if (logoMarqueeTrack) {
      logoMarqueeTrack.style.transform = "translate3d(0, 0, 0)";
    }
    logoMarqueeFrame = requestAnimationFrame(tickLogoMarquee);
  };

  const renderLogoMarquee = (logos) => {
    if (!logoMarquee || !logoMarqueeTrack || !logos.length) return;

    const baseSequence = createLogoSequence(logos);
    const fragment = document.createDocumentFragment();

    baseSequence.forEach((logo) => {
      fragment.append(logoItem(logo));
    });

    logoMarqueeTrack.replaceChildren(fragment);
    logoMarquee.classList.add("is-ready");
    startLogoMarquee();
  };

  const initLogoMarquee = () => {
    if (!logoMarquee || !logoMarqueeTrack) return;

    renderLogoMarquee(getLogoUrls());
  };

  const closeVideoModal = () => {
    if (!videoModal) return;

    videoModal.classList.remove("is-open");
    videoModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("video-modal-open");

    if (videoModalPlayer) {
      videoModalPlayer.pause();
      videoModalPlayer.currentTime = 0;
    }

    if (videoModalReturnFocus instanceof HTMLElement) {
      videoModalReturnFocus.focus();
    }
    videoModalReturnFocus = null;
  };

  const openVideoModal = (trigger) => {
    if (!videoModal) return;

    videoModalReturnFocus = document.activeElement;
    if (videoModalPlayer && trigger instanceof HTMLElement && trigger.dataset.videoModalSrc) {
      videoModalPlayer.src = trigger.dataset.videoModalSrc;
    }
    videoModal.classList.add("is-open");
    videoModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("video-modal-open");

    if (videoModalPlayer) {
      videoModalPlayer.currentTime = 0;
      videoModalPlayer.play().catch(() => {});
    }

    videoModalCloseButton?.focus();
  };

  const closeInvoiceInfoModal = () => {
    if (!invoiceInfoModal) return;

    invoiceInfoModal.classList.remove("is-open");
    invoiceInfoModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("invoice-info-modal-open");

    if (invoiceInfoReturnFocus instanceof HTMLElement) {
      invoiceInfoReturnFocus.focus();
    }
    invoiceInfoReturnFocus = null;
  };

  const openInvoiceInfoModal = () => {
    if (!invoiceInfoModal) return;

    invoiceInfoReturnFocus = document.activeElement;
    invoiceInfoModal.classList.add("is-open");
    invoiceInfoModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("invoice-info-modal-open");
    invoiceInfoCloseButton?.focus();
  };

  const closeVerifactuInfoModal = () => {
    if (!verifactuInfoModal) return;

    verifactuInfoModal.classList.remove("is-open");
    verifactuInfoModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("invoice-info-modal-open");

    if (verifactuInfoReturnFocus instanceof HTMLElement) {
      verifactuInfoReturnFocus.focus();
    }
    verifactuInfoReturnFocus = null;
  };

  const openVerifactuInfoModal = () => {
    if (!verifactuInfoModal) return;

    verifactuInfoReturnFocus = document.activeElement;
    verifactuInfoModal.classList.add("is-open");
    verifactuInfoModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("invoice-info-modal-open");
    verifactuInfoCloseButton?.focus();
  };

  const closeSuccessStoryModal = () => {
    if (!successStoryModal) return;

    successStoryModal.classList.remove("is-open");
    successStoryModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("invoice-info-modal-open");

    if (successStoryReturnFocus instanceof HTMLElement) {
      successStoryReturnFocus.focus();
    }
    successStoryReturnFocus = null;
  };

  const openSuccessStoryModal = () => {
    if (!successStoryModal) return;

    successStoryReturnFocus = document.activeElement;
    successStoryModal.classList.add("is-open");
    successStoryModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("invoice-info-modal-open");
    successStoryCloseButton?.focus();
  };

  const flagToRegionCode = (flag) => {
    const letters = [...String(flag || "")]
      .map((character) => character.codePointAt(0) - 0x1F1E6 + 65)
      .filter((codePoint) => codePoint >= 65 && codePoint <= 90)
      .map((codePoint) => String.fromCodePoint(codePoint));
    return letters.length === 2 ? letters.join("") : "";
  };

  const countryNameFromFlag = (flag) => {
    const regionCode = flagToRegionCode(flag);
    if (!regionCode || typeof Intl.DisplayNames !== "function") return regionCode || "Pais";

    try {
      return new Intl.DisplayNames(["es"], { type: "region" }).of(regionCode) || regionCode;
    } catch {
      return regionCode;
    }
  };

  const initPhonePrefixCombobox = () => {
    const control = document.querySelector("[data-phone-prefix-combobox]");
    if (!control) return;

    const source = control.querySelector("[data-phone-prefix-source]");
    const button = control.querySelector("[data-phone-prefix-button]");
    const flagLabel = control.querySelector("[data-phone-prefix-flag]");
    const codeLabel = control.querySelector("[data-phone-prefix-code]");
    const menu = control.querySelector("[data-phone-prefix-menu]");
    const phoneInput = control.querySelector("[data-phone-number]");
    const phoneHidden = control.querySelector("[data-phone-full]");
    const form = control.closest("form");

    if (!source || !button || !flagLabel || !codeLabel || !menu || !phoneInput || !phoneHidden) return;

    const optionData = [...source.options].map((option, index) => {
      const flag = (option.textContent || "").trim().split(/\s+/)[0] || "";
      return {
        flag,
        country: countryNameFromFlag(flag),
        prefix: option.value,
        selected: option.selected,
        id: `phone-prefix-option-${index}`,
      };
    });

    if (!optionData.length) return;

    const updateHiddenPhone = () => {
      const number = phoneInput.value.trim();
      phoneHidden.value = number ? `${source.value} ${number}` : source.value;
    };

    const setSelectedPrefix = (item) => {
      source.value = item.prefix;
      flagLabel.textContent = item.flag;
      codeLabel.textContent = item.prefix;
      menu.querySelectorAll("[role='option']").forEach((option) => {
        option.setAttribute("aria-selected", String(option.dataset.prefix === item.prefix && option.dataset.flag === item.flag));
      });
      updateHiddenPhone();
    };

    const closeMenu = () => {
      control.classList.remove("is-open");
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    };

    const openMenu = () => {
      control.classList.add("is-open");
      menu.hidden = false;
      button.setAttribute("aria-expanded", "true");
    };

    const menuFragment = document.createDocumentFragment();
    optionData.forEach((item) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.id = item.id;
      optionButton.className = "contact-page-phone-option";
      optionButton.dataset.prefix = item.prefix;
      optionButton.dataset.flag = item.flag;
      optionButton.setAttribute("role", "option");
      optionButton.setAttribute("aria-selected", "false");

      const flagSpan = document.createElement("span");
      flagSpan.className = "contact-page-phone-option-flag";
      flagSpan.textContent = item.flag;

      const countrySpan = document.createElement("span");
      countrySpan.className = "contact-page-phone-option-country";
      countrySpan.textContent = item.country;

      const prefixSpan = document.createElement("span");
      prefixSpan.className = "contact-page-phone-option-code";
      prefixSpan.textContent = item.prefix;

      optionButton.append(flagSpan, countrySpan, prefixSpan);
      optionButton.addEventListener("click", () => {
        setSelectedPrefix(item);
        closeMenu();
        phoneInput.focus();
      });
      menuFragment.append(optionButton);
    });
    menu.replaceChildren(menuFragment);

    const initialItem = optionData.find((item) => item.selected) || optionData[0];
    setSelectedPrefix(initialItem);

    button.addEventListener("click", () => {
      if (menu.hidden) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    button.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowDown" && event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openMenu();
      const selectedOption = menu.querySelector("[aria-selected='true']") || menu.querySelector("[role='option']");
      selectedOption?.focus();
    });

    document.addEventListener("click", (event) => {
      if (!control.contains(event.target)) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    phoneInput.addEventListener("input", updateHiddenPhone);
    form?.addEventListener("submit", updateHiddenPhone);
  };

  navItems.forEach((link) => {
    link.addEventListener("mouseenter", () => setActiveNavPill(link));
    link.addEventListener("focus", () => setActiveNavPill(link));
  });

  if (navPill && navLinks) {
    navLinks.addEventListener("mouseleave", clearNavPill);
    navLinks.addEventListener("focusout", (event) => {
      if (!navLinks.contains(event.relatedTarget)) clearNavPill();
    });
  }

  videoModalOpenItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      openVideoModal(item);
    });
  });
  videoModalCloseItems.forEach((item) => item.addEventListener("click", closeVideoModal));
  invoiceInfoOpenItems.forEach((item) => {
    item.addEventListener("click", openInvoiceInfoModal);
  });
  invoiceInfoCloseItems.forEach((item) => item.addEventListener("click", closeInvoiceInfoModal));
  verifactuInfoOpenItems.forEach((item) => {
    item.addEventListener("click", openVerifactuInfoModal);
  });
  verifactuInfoCloseItems.forEach((item) => item.addEventListener("click", closeVerifactuInfoModal));
  successStoryOpenItems.forEach((item) => {
    item.addEventListener("click", openSuccessStoryModal);
  });
  successStoryCloseItems.forEach((item) => item.addEventListener("click", closeSuccessStoryModal));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && videoModal?.classList.contains("is-open")) {
      closeVideoModal();
    }

    if (event.key === "Escape" && invoiceInfoModal?.classList.contains("is-open")) {
      closeInvoiceInfoModal();
    }

    if (event.key === "Escape" && verifactuInfoModal?.classList.contains("is-open")) {
      closeVerifactuInfoModal();
    }

    if (event.key === "Escape" && successStoryModal?.classList.contains("is-open")) {
      closeSuccessStoryModal();
    }
  });

  window.addEventListener("scroll", queueLayoutUpdate, { passive: true });
  window.addEventListener("resize", queueLayoutUpdate);

  paintHeadmarkPurple();
  setNavbarState();
  initRevealAnimations();
  initLogoMarquee();
  initPhonePrefixCombobox();
  initFrontendForms();
  initAuthForms();
  initFrontendPlaceholders();
  initConfirmPage();
  initConfirmErrorPage();
  hardenBlankTargetLinks();
})();

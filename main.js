import { login, setupAuthenticator, verifyAuthenticator, solicitarResetPassword, restablecerPassword } from './src/auth/api.js';

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
    "assets/logos/logolab.png",
    "assets/logos/pescado.png",
    "assets/logos/reshop.jpeg",
    "assets/logos/rydalca.jpeg",
  ];

  const root = document.documentElement;
  const userAgent = navigator.userAgent;
  const isChromium = /(?:Chrome|Chromium|Edg)\//.test(userAgent) && !/Firefox\//.test(userAgent);
  const keepNavbarAtTop = document.body.classList.contains("agency-page");
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

    const isScrolled = window.scrollY > TOP_THRESHOLD;
    const isAtTop = keepNavbarAtTop || window.scrollY <= TOP_THRESHOLD;
    navbar.classList.toggle("scrolled", !isAtTop);
    navbar.classList.toggle("agency-scrolled", keepNavbarAtTop && isScrolled);

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
      password.length >= 12 &&
      password.length <= 256 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[^a-zA-Z0-9\s]/.test(password)
    );
  };

  const PASSWORD_RULES = [
    { key: "length", test: (v) => v.length >= 12 },
    { key: "upper",  test: (v) => /[A-Z]/.test(v) },
    { key: "lower",  test: (v) => /[a-z]/.test(v) },
    { key: "number", test: (v) => /\d/.test(v) },
    { key: "symbol", test: (v) => /[^a-zA-Z0-9\s]/.test(v) },
  ];

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
        message: "La contraseña debe tener al menos 12 caracteres e incluir mayúscula, minúscula y un símbolo.",
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

  const initResultsCarousel = () => {
    const items = [...document.querySelectorAll("[data-results-item]")];
    const indicators = [...document.querySelectorAll("[data-results-go]")];
    if (!items.length) return;

    const total = items.length;
    let current = 0;
    let busy = false;

    const update = () => {
      items.forEach((item, i) => {
        item.classList.toggle("is-active", i === current);
      });
      indicators.forEach((ind, i) => {
        ind.classList.toggle("is-active", i === current);
        ind.setAttribute("aria-selected", String(i === current));
      });
    };

    const navigate = (dir) => {
      if (busy) return;
      busy = true;
      current = (current + dir + total) % total;
      update();
      setTimeout(() => (busy = false), 480);
    };

    document.getElementById("results-prev")?.addEventListener("click", () => navigate(-1));
    document.getElementById("results-next")?.addEventListener("click", () => navigate(1));

    indicators.forEach((ind) => {
      ind.addEventListener("click", () => {
        const target = Number(ind.dataset.resultsGo);
        if (target !== current) navigate(target - current);
      });
    });

    update();
  };

  const initResultsChat = () => {
    const form = document.getElementById("results-chat-form");
    if (!form) return;

    const msgs = document.getElementById("results-chat-messages");
    const input = document.getElementById("results-chat-input");
    const sendBtn = form.querySelector(".results-chat-send");
    const modal = document.getElementById("chat-limit-modal");
    const modalClose = document.getElementById("chat-limit-close");
    const FLOWISE_URL =
      "https://cloud.flowiseai.com/api/v1/prediction/26728be9-ac01-435c-a80b-69df66bc87c3";
    const MAX_USER_MSGS = 5;
    let sending = false;
    let userMsgCount = 0;

    const openLimitModal = () => {
      if (modal) { modal.hidden = false; document.body.style.overflow = "hidden"; }
    };
    const closeLimitModal = () => {
      if (modal) { modal.hidden = true; document.body.style.overflow = ""; }
    };

    modalClose?.addEventListener("click", closeLimitModal);
    modal?.addEventListener("click", (e) => { if (e.target === modal) closeLimitModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal && !modal.hidden) closeLimitModal(); });

    const addMsg = (text, isUser) => {
      const d = document.createElement("div");
      d.className = "results-chat-msg " + (isUser ? "results-chat-msg-user" : "results-chat-msg-bot");
      d.textContent = text;
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
      return d;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const question = input.value.trim();
      if (!question || sending) return;

      if (userMsgCount >= MAX_USER_MSGS) {
        openLimitModal();
        return;
      }

      sending = true;
      userMsgCount++;
      input.value = "";
      sendBtn.disabled = true;
      addMsg(question, true);

      const loader = addMsg("···", false);
      loader.classList.add("results-chat-msg-loading");

      try {
        const res = await fetch(FLOWISE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });
        const data = await res.json();
        loader.textContent = data.text || data.answer || "Sin respuesta.";
      } catch {
        loader.textContent = "Error al conectar con el asistente. Inténtalo de nuevo.";
      } finally {
        loader.classList.remove("results-chat-msg-loading");
        msgs.scrollTop = msgs.scrollHeight;
        sending = false;
        sendBtn.disabled = false;
        input.focus();
      }
    });
  };

  const initAgencyTabs = () => {
    const buttons = [...document.querySelectorAll("[data-agency-tab]")];
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = "agency-tab-panel-" + btn.dataset.agencyTab;
        const targetPanel = document.getElementById(targetId);
        if (!targetPanel || btn.getAttribute("aria-selected") === "true") return;

        buttons.forEach((b) => {
          b.classList.remove("is-active");
          b.setAttribute("aria-selected", "false");
        });
        document.querySelectorAll(".agency-tab-panel").forEach((p) => {
          p.classList.remove("is-active");
        });

        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");
        targetPanel.classList.add("is-active");
      });
    });
  };

  const initTabsModal = () => {
    const trigger  = document.getElementById("tabs-demo-trigger");
    const modal    = document.getElementById("tabs-modal");
    const closeBtn = document.getElementById("tabs-modal-close");
    if (!trigger || !modal) return;

    const openModal = () => {
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      closeBtn?.focus();
    };
    const closeModal = () => {
      modal.hidden = true;
      document.body.style.overflow = "";
      trigger.focus();
    };

    trigger.addEventListener("click", openModal);
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(); }
    });
    closeBtn?.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });

    const modalBtns = [...modal.querySelectorAll("[data-modal-tab]")];
    modalBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetPanel = modal.querySelector("#modal-tab-panel-" + btn.dataset.modalTab);
        if (!targetPanel || btn.getAttribute("aria-selected") === "true") return;
        modalBtns.forEach((b) => { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
        modal.querySelectorAll(".agency-tab-panel").forEach((p) => p.classList.remove("is-active"));
        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");
        targetPanel.classList.add("is-active");
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
    const planHidden = form.querySelector("#reg-plan");
    const planError = planHidden && !planHidden.value
      ? { field: document.getElementById("plan-selector-btn"), message: "Selecciona un plan para continuar." }
      : null;

    const error =
      planError ||
      validateTextField({ field: form.querySelector("#nombre-empresa"), label: "Nombre de empresa", min: 2, max: 120, required: true }) ||
      validateEmailField(form.querySelector("#reg-email")) ||
      validatePasswordField(form.querySelector("#reg-password"));

    return !applyFirstFormError(form, error);
  };

  // VITE_APP_URL apunta a sba-frontend (http://localhost:3000 en dev, https://app.smartbookai.es en prod).
  // OJO: no usamos window.location.origin — este script corre en el origen de la landing (frontend2),
  // no en el de la app, así que apuntaría al puerto/dominio equivocado.
  const APP_CALLBACK_URL    = `${import.meta.env?.VITE_APP_URL || 'https://app.smartbookai.es'}/auth/callback`;
  const ADMIN_GROUP         = "dimiadmin";
  const SBA_ID_TOKEN_KEY      = "sba_id_token";
  const SBA_ACCESS_TOKEN_KEY  = "sba_access_token";
  const SBA_REFRESH_TOKEN_KEY = "sba_refresh_token";
  // ─────────────────────────────────────────────────────────────────────────

  const decodeJwtPayload = (token) => {
    try {
      const base64Url = String(token || "").split(".")[1] || "";
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "=");
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  };

  const getIdToken    = () => sessionStorage.getItem(SBA_ID_TOKEN_KEY);
  const getAccessToken = () => sessionStorage.getItem(SBA_ACCESS_TOKEN_KEY);
  const isAuthenticated = () => Boolean(getIdToken());

  const logout = () => {
    sessionStorage.removeItem(SBA_ID_TOKEN_KEY);
    sessionStorage.removeItem(SBA_ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(SBA_REFRESH_TOKEN_KEY);
    window.location.assign("login.html");
  };

  const requireAuth = () => {
    if (!isAuthenticated()) {
      window.location.replace("login.html");
      return false;
    }
    return true;
  };

  // Los tokens viajan como cookies (sba_id_token y sba_access_token), no en la URL.
  // El enrutamiento admin/onboarding/dashboard lo decide /auth/callback en Next.js.
  const buildCallbackUrl = () => APP_CALLBACK_URL;

  // Punto único de aterrizaje tras un login válido, con o sin MFA de por medio:
  // guarda los tokens definitivos y redirige. registrationToken/session (los
  // artefactos intermedios del MFA) nunca pasan por aquí ni se persisten.
  const completeLogin = (tokens) => {
    sessionStorage.setItem(SBA_ID_TOKEN_KEY,      tokens.IdToken);
    sessionStorage.setItem(SBA_ACCESS_TOKEN_KEY,  tokens.AccessToken);
    sessionStorage.setItem(SBA_REFRESH_TOKEN_KEY, tokens.RefreshToken);

    // En localhost el navegador rechaza una cookie con Domain=smartbookai.es (no coincide
    // con el host actual), así que en dev se omite y el navegador la asocia al host actual.
    const isLocalhost = window.location.hostname === "localhost";
    const cookieBase = isLocalhost
      ? "Path=/; Max-Age=3600; Secure; SameSite=Strict"
      : "Domain=smartbookai.es; Path=/; Max-Age=3600; Secure; SameSite=Strict";
    document.cookie = `sba_id_token=${encodeURIComponent(tokens.IdToken)}; ${cookieBase}`;
    document.cookie = `sba_access_token=${encodeURIComponent(tokens.AccessToken)}; ${cookieBase}`;

    window.location.assign(buildCallbackUrl());
  };

  // Cablea una fila de cajas de un dígito (autoavance, retroceso con backspace,
  // pegado de los 6 dígitos de golpe) y llama a onComplete en cuanto se llenan.
  const wireOtpInputs = (container, onComplete) => {
    const boxes = Array.from(container.querySelectorAll(".otp-box"));
    const getCode = () => boxes.map((box) => box.value).join("");

    boxes.forEach((box, index) => {
      box.addEventListener("input", () => {
        box.value = box.value.replace(/[^0-9]/g, "").slice(0, 1);
        box.classList.toggle("filled", box.value !== "");
        if (box.value && index < boxes.length - 1) boxes[index + 1].focus();
        if (getCode().length === boxes.length) onComplete(getCode());
      });

      box.addEventListener("keydown", (event) => {
        if (event.key === "Backspace" && !box.value && index > 0) {
          boxes[index - 1].focus();
        }
      });

      box.addEventListener("paste", (event) => {
        event.preventDefault();
        const pasted = (event.clipboardData?.getData("text") || "").replace(/[^0-9]/g, "").slice(0, boxes.length);
        pasted.split("").forEach((digit, i) => {
          boxes[i].value = digit;
          boxes[i].classList.add("filled");
        });
        const last = boxes[Math.min(pasted.length, boxes.length) - 1];
        if (last) last.focus();
        if (pasted.length === boxes.length) onComplete(pasted);
      });
    });

    return {
      reset: () => boxes.forEach((box) => { box.value = ""; box.classList.remove("filled"); }),
      focusFirst: () => boxes[0]?.focus(),
    };
  };

  const initLoginForm = () => {
    if (!loginForm) return;

    const params       = new URLSearchParams(window.location.search);
    const banner       = loginForm.ownerDocument.querySelector("#login-banner");
    const submitButton = loginForm.querySelector("#btn-login-submit");
    const submitLabel  = loginForm.querySelector("#btn-login-label");

    if (params.get("registro") === "ok" && banner) {
      banner.textContent = "Cuenta creada correctamente. Ya puedes iniciar sesión.";
      banner.classList.add("ok");
    }

    const eyeBtn   = document.getElementById("btn-eye-login");
    const pwdField = document.getElementById("login-password");
    if (eyeBtn && pwdField) {
      eyeBtn.addEventListener("click", () => {
        const show = pwdField.type === "password";
        pwdField.type = show ? "text" : "password";
        eyeBtn.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
      });
    }

    loginForm.addEventListener("input", (event) => {
      if (event.target instanceof HTMLInputElement) {
        setFieldState(event.target);
        setFormFeedback(loginForm, "", "ok");
      }
    });

    // ── Paneles de MFA (ocultos hasta que /auth/login diga lo contrario) ─────
    const requiredPanel        = document.getElementById("mfa-required-panel");
    const enforcementPanel     = document.getElementById("mfa-enforcement-panel");
    const requiredEmailEl      = document.getElementById("mfa-required-email");
    const requiredFeedback     = requiredPanel?.querySelector("[data-mfa-required-feedback]");
    const enforcementFeedback  = enforcementPanel?.querySelector("[data-mfa-enforcement-feedback]");
    const requiredSubmitBtn    = document.getElementById("btn-mfa-required-submit");
    const requiredSubmitLabel  = document.getElementById("btn-mfa-required-label");
    const enforcementSubmitBtn   = document.getElementById("btn-mfa-enforcement-submit");
    const enforcementSubmitLabel = document.getElementById("btn-mfa-enforcement-label");
    const backToPasswordBtn    = document.getElementById("btn-mfa-required-back");

    // ── Panel de "olvidé mi contraseña" ───────────────────────────────────────
    const forgotPanel      = document.getElementById("forgot-password-panel");
    const forgotSentPanel  = document.getElementById("forgot-password-sent-panel");
    const forgotFeedback   = forgotPanel?.querySelector("[data-forgot-feedback]");
    const forgotEmailInput = document.getElementById("forgot-email");
    const forgotSubmitBtn  = document.getElementById("btn-forgot-submit");
    const forgotSubmitLabel = document.getElementById("btn-forgot-label");
    const forgotSentEmailEl = document.getElementById("forgot-sent-email");
    const forgotTrigger    = document.getElementById("btn-forgot-trigger");
    const forgotBackBtn    = document.getElementById("btn-forgot-back");
    const forgotSentBackBtn = document.getElementById("btn-forgot-sent-back");

    const showOnly = (panel) => {
      [loginForm, requiredPanel, enforcementPanel, forgotPanel, forgotSentPanel].forEach((el) => {
        if (el) el.hidden = el !== panel;
      });
    };

    forgotTrigger?.addEventListener("click", (event) => {
      event.preventDefault();
      if (forgotFeedback) forgotFeedback.textContent = "";
      if (forgotEmailInput) forgotEmailInput.value = loginForm.querySelector("#login-email")?.value || "";
      showOnly(forgotPanel);
    });

    forgotBackBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      showOnly(loginForm);
    });

    forgotSentBackBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      showOnly(loginForm);
    });

    forgotSubmitBtn?.addEventListener("click", async () => {
      const email = normalizeEmail(forgotEmailInput?.value);
      if (!isValidEmail(email)) {
        if (forgotFeedback) forgotFeedback.textContent = "Introduce un correo electrónico válido.";
        return;
      }

      if (forgotFeedback) forgotFeedback.textContent = "";
      setButtonLoading(forgotSubmitBtn, forgotSubmitLabel, "Enviando...", "Enviar enlace", true);

      try {
        const { ok, data } = await solicitarResetPassword(email);
        if (!ok) {
          if (forgotFeedback) forgotFeedback.textContent = data.message || "No se pudo procesar la solicitud. Inténtalo de nuevo.";
          return;
        }
        if (forgotSentEmailEl) forgotSentEmailEl.textContent = email;
        showOnly(forgotSentPanel);
      } catch {
        if (forgotFeedback) forgotFeedback.textContent = "No se pudo conectar con el servidor. Comprueba tu conexión.";
      } finally {
        setButtonLoading(forgotSubmitBtn, forgotSubmitLabel, "Enviando...", "Enviar enlace", false);
      }
    });

    // Estado del intento de login en curso — vive solo en memoria de esta pestaña
    // mientras se completa el MFA; nunca se guarda en localStorage ni en cookies.
    let pending = null; // { kind: 'session', session, email } | { kind: 'registration', registrationToken }

    const submitRequiredCode = async (code) => {
      if (!pending || pending.kind !== "session") return;
      setButtonLoading(requiredSubmitBtn, requiredSubmitLabel, "Verificando...", "Verificar y entrar", true);
      if (requiredFeedback) requiredFeedback.textContent = "";

      try {
        const { ok, data } = await verifyAuthenticator({ session: pending.session, email: pending.email, code });
        if (ok && data.status === "OK") {
          completeLogin(data.tokens);
          return;
        }
        requiredOtp?.reset();
        requiredOtp?.focusFirst();
        if (requiredFeedback) requiredFeedback.textContent = data.message || "Código incorrecto. Inténtalo de nuevo.";
      } catch {
        if (requiredFeedback) requiredFeedback.textContent = "No se pudo conectar con el servidor. Comprueba tu conexión.";
      } finally {
        setButtonLoading(requiredSubmitBtn, requiredSubmitLabel, "Verificando...", "Verificar y entrar", false);
      }
    };

    const submitEnforcementCode = async (code) => {
      if (!pending || pending.kind !== "registration") return;
      setButtonLoading(enforcementSubmitBtn, enforcementSubmitLabel, "Confirmando...", "Confirmar y activar", true);
      if (enforcementFeedback) enforcementFeedback.textContent = "";

      try {
        const { ok, data } = await verifyAuthenticator({ registrationToken: pending.registrationToken, code });
        if (ok && data.status === "OK") {
          completeLogin(data.tokens);
          return;
        }
        enforcementOtp?.reset();
        enforcementOtp?.focusFirst();
        if (enforcementFeedback) enforcementFeedback.textContent = data.message || "Código incorrecto. Inténtalo de nuevo.";
      } catch {
        if (enforcementFeedback) enforcementFeedback.textContent = "No se pudo conectar con el servidor. Comprueba tu conexión.";
      } finally {
        setButtonLoading(enforcementSubmitBtn, enforcementSubmitLabel, "Confirmando...", "Confirmar y activar", false);
      }
    };

    const requiredOtp    = requiredPanel    ? wireOtpInputs(requiredPanel, submitRequiredCode)       : null;
    const enforcementOtp = enforcementPanel ? wireOtpInputs(enforcementPanel, submitEnforcementCode) : null;

    requiredSubmitBtn?.addEventListener("click", () => {
      const code = Array.from(requiredPanel.querySelectorAll(".otp-box")).map((box) => box.value).join("");
      if (code.length === 6) submitRequiredCode(code);
    });

    enforcementSubmitBtn?.addEventListener("click", () => {
      const code = Array.from(enforcementPanel.querySelectorAll(".otp-box")).map((box) => box.value).join("");
      if (code.length === 6) submitEnforcementCode(code);
    });

    backToPasswordBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      pending = null;
      requiredOtp?.reset();
      showOnly(loginForm);
    });

    const startEnforcementSetup = async (registrationToken) => {
      pending = { kind: "registration", registrationToken };
      showOnly(enforcementPanel);

      try {
        const { ok, data } = await setupAuthenticator({ registrationToken });
        if (!ok || !data.otpauthUrl) {
          if (enforcementFeedback) enforcementFeedback.textContent = data.message || "No se pudo generar el código QR. Vuelve a intentarlo.";
          return;
        }
        const canvas = document.getElementById("mfa-qr");
        if (canvas) {
          const { default: QRCode } = await import('qrcode');
          await QRCode.toCanvas(canvas, data.otpauthUrl, { width: 176, margin: 1 });
        }
        const secretEl = document.getElementById("mfa-secret-code");
        if (secretEl) secretEl.textContent = data.secretCode || "";
      } catch {
        if (enforcementFeedback) enforcementFeedback.textContent = "No se pudo conectar con el servidor. Comprueba tu conexión.";
      }
    };

    // ── Paso 1: usuario + contraseña ─────────────────────────────────────────
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validateLoginForm(loginForm)) return;

      const email    = normalizeEmail(loginForm.querySelector("#login-email")?.value);
      const password = String(loginForm.querySelector("#login-password")?.value || "");

      setButtonLoading(submitButton, submitLabel, "Entrando...", "Entrar", true);
      setFormFeedback(loginForm, "", "ok");

      try {
        const { ok, status, data } = await login(email, password);

        if (ok && data.status === "OK") {
          completeLogin(data.tokens);
          return;
        }

        if (ok && data.status === "MFA_REQUIRED") {
          pending = { kind: "session", session: data.session, email: data.email };
          if (requiredEmailEl) requiredEmailEl.textContent = data.email;
          requiredOtp?.reset();
          showOnly(requiredPanel);
          requiredOtp?.focusFirst();
          return;
        }

        if (ok && data.status === "MFA_ENFORCEMENT_REQUIRED") {
          await startEnforcementSetup(data.registrationToken);
          return;
        }

        if (status === 403 && data.code === "UNCONFIRMED") {
          setFormFeedback(loginForm, data.message, "err");
          setTimeout(() => {
            window.location.assign(`confirm.html?email=${encodeURIComponent(email)}`);
          }, 2000);
          return;
        }
        if (status === 401) {
          if (pwdField) pwdField.value = "";
          setFormFeedback(loginForm, data.message || "Correo electrónico o contraseña incorrectos.", "err");
          return;
        }
        if (status === 404) {
          setFormFeedback(loginForm, data.message || "No existe una cuenta con ese correo electrónico.", "err");
          return;
        }
        if (status === 429) {
          setFormFeedback(loginForm, data.message || "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.", "err");
          return;
        }
        setFormFeedback(loginForm, data.message || "No se pudo iniciar sesión. Inténtalo de nuevo en unos minutos.", "err");
      } catch {
        setFormFeedback(loginForm, "No se pudo conectar con el servidor. Comprueba tu conexión.", "err");
      } finally {
        setButtonLoading(submitButton, submitLabel, "Entrando...", "Entrar", false);
      }
    });
  };

  const PLAN_LABELS = {
    starter: { name: "Starter", price: "9,99€/mes", thumb: "starter" },
    lite:    { name: "Lite",    price: "29,99€/mes", thumb: "lite" },
    smart:   { name: "Smart",   price: "49,99€/mes", thumb: "smart" },
    power:   { name: "Power",   price: "79,99€/mes", thumb: "power" },
    ultra:   { name: "Ultra",   price: "129,99€/mes", thumb: "ultra" },
  };

  const initPlanSelector = () => {
    const btn     = document.getElementById("plan-selector-btn");
    const panel   = document.getElementById("plan-selector-panel");
    const hidden  = document.getElementById("reg-plan");
    const preview = document.getElementById("plan-selector-preview");
    if (!btn || !panel || !hidden || !preview) return;

    const opts = panel.querySelectorAll(".plan-opt:not(.plan-opt--soon)");

    const selectPlan = (planKey) => {
      hidden.value = planKey;
      const meta = PLAN_LABELS[planKey];
      if (meta) {
        preview.innerHTML = `
          <div class="plan-opt-thumb plan-opt-thumb--${meta.thumb}">
            ${getThumbSVG(planKey)}
          </div>
          <span><strong>${meta.name}</strong> &nbsp;${meta.price}</span>`;
      }
      panel.querySelectorAll(".plan-opt").forEach((o) => o.classList.remove("is-selected"));
      panel.querySelector(`[data-plan="${planKey}"]`)?.classList.add("is-selected");
      closePanel();
    };

    const getThumbSVG = (key) => {
      const icons = {
        starter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        lite:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
        smart:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 1 8 8c0 3-1.5 5.5-4 7l-1 5H9l-1-5C5.5 15.5 4 13 4 10a8 8 0 0 1 8-8z"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
        power:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
        ultra:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      };
      return icons[key] || "";
    };

    const openPanel = () => {
      panel.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
    };

    const closePanel = () => {
      panel.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    };

    btn.addEventListener("click", () => {
      panel.classList.contains("is-open") ? closePanel() : openPanel();
    });

    opts.forEach((opt) => {
      opt.addEventListener("click", () => selectPlan(opt.dataset.plan));
      opt.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectPlan(opt.dataset.plan); }
      });
    });

    document.addEventListener("click", (e) => {
      if (!btn.contains(e.target) && !panel.contains(e.target)) closePanel();
    });

    // Pre-seleccionar si hay ?plan= en la URL
    const urlPlan = new URLSearchParams(window.location.search).get("plan")?.toLowerCase();
    if (urlPlan && PLAN_LABELS[urlPlan] && !panel.querySelector(`[data-plan="${urlPlan}"]`)?.classList.contains("plan-opt--soon")) {
      selectPlan(urlPlan);
    }
  };

  const initPasswordChecks = () => {
    const passwordField = document.querySelector("#reg-password");
    const checksContainer = document.querySelector("#password-checks");
    if (!passwordField || !checksContainer) return;

    const updateChecks = () => {
      const value = passwordField.value;
      const hasInput = value.length > 0;
      PASSWORD_RULES.forEach(({ key, test }) => {
        const el = checksContainer.querySelector(`[data-rule="${key}"]`);
        if (!el) return;
        const ok = test(value);
        el.classList.toggle("is-ok", ok);
        el.classList.toggle("is-fail", hasInput && !ok);
      });
    };

    passwordField.addEventListener("focus", () => {
      checksContainer.hidden = false;
      updateChecks();
    });
    passwordField.addEventListener("input", updateChecks);
  };

  const PLAN_META = {
    starter: {
      name: "Starter",
      price: "9,99€/mes",
      priceId: "price_1TckmxA8fYEQHYCQ4bwd78qR",
      features: ["Generación manual de facturas", "Gestión básica de clientes", "Panel básico", "Exportación simple de facturas"],
    },
    lite: {
      name: "Lite",
      price: "29,99€/mes",
      priceId: "price_1TUqacA8fYEQHYCQA3bkh3eb",
      features: ["Todo lo del plan Starter", "Subida de facturas en PDF", "Extracción automática con IA", "Facturas recibidas y emitidas"],
    },
  };

  const initRegisterForm = () => {
    if (!registerForm) return;

    initPlanSelector();
    initPasswordChecks();

    // Eye toggle
    const eyeBtn = document.getElementById("btn-eye-reg");
    const pwdInput = document.getElementById("reg-password");
    if (eyeBtn && pwdInput) {
      eyeBtn.addEventListener("click", () => {
        const show = pwdInput.type === "password";
        pwdInput.type = show ? "text" : "password";
        eyeBtn.querySelector("svg").innerHTML = show
          ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
          : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        eyeBtn.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
      });
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

      const nombreEmpresa = sanitizeSingleLine(registerForm.querySelector("#nombre-empresa")?.value, 120);
      const email         = normalizeEmail(registerForm.querySelector("#reg-email")?.value);
      const password      = String(registerForm.querySelector("#reg-password")?.value || "");
      const plan          = normalizePlan(registerForm.querySelector("#reg-plan")?.value);

      const submitButton = registerForm.querySelector(".auth-form-submit");
      const submitLabel  = submitButton?.querySelector("span");
      const errorEl      = document.getElementById("registro-error");

      const showRegError  = (msg) => { if (errorEl) errorEl.textContent = msg; };
      const clearRegError = ()    => { if (errorEl) errorEl.textContent = ""; };

      const SERVER_ERROR_MSG = "Ha ocurrido un problema en nuestros servidores en España, por favor inténtelo de nuevo en unos minutos.";

      clearRegError();
      setButtonLoading(submitButton, submitLabel, "Procesando registro seguro...", "Registrarme gratis", true);

      try {
        const response = await fetch("https://vmkldqb82b.execute-api.eu-south-2.amazonaws.com/prod/auth/solicitar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombreEmpresa, email, password, planId: plan }),
        });

        const data = await parseJsonResponse(response);

        if (response.status === 200 || response.status === 201) {
          localStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify({ email, nombreEmpresa, plan }));
          window.location.href = `confirm.html?email=${encodeURIComponent(email)}`;
          return;
        }

        if (response.status === 409) {
          showRegError(sanitizeSingleLine(data.message || "Este email o empresa ya está registrado. Si ya tienes cuenta, inicia sesión.", 240));
          return;
        }

        if (response.status === 422) {
          showRegError("La contraseña no cumple los requisitos de seguridad. Revisa que tenga al menos 12 caracteres, una mayúscula, una minúscula, un número y un símbolo.");
          return;
        }

        if (response.status === 400) {
          showRegError(sanitizeSingleLine(data.message || "Los datos introducidos no son válidos. Por favor, revísalos.", 240));
          return;
        }

        if (response.status >= 500) {
          showRegError(SERVER_ERROR_MSG);
          return;
        }

        showRegError(responseErrorMessage(data, "No se pudo completar el registro. Revisa los datos e inténtalo de nuevo."));
      } catch {
        showRegError(SERVER_ERROR_MSG);
      } finally {
        setButtonLoading(submitButton, submitLabel, "Procesando registro seguro...", "Registrarme gratis", false);
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
  const initWebPreviewModal = () => {
    const trigger  = document.getElementById("web-demo-trigger");
    const modal    = document.getElementById("web-modal");
    const closeBtn = document.getElementById("web-modal-close");
    if (!trigger || !modal) return;

    const openModal = () => {
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      closeBtn?.focus();
    };

    const closeModal = () => {
      modal.hidden = true;
      document.body.style.overflow = "";
      trigger.focus();
    };

    trigger.addEventListener("click", openModal);
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(); }
    });
    closeBtn?.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && !modal.hidden) closeModal();
    });
  };

  const initDemoChatModal = () => {
    const trigger     = document.getElementById("chatbot-demo-trigger");
    const modal       = document.getElementById("chatbot-modal");
    const closeBtn    = document.getElementById("chatbot-modal-close");
    const form        = document.getElementById("demo-chat-form");
    const messagesEl  = document.getElementById("demo-chat-messages");
    const inputEl     = document.getElementById("demo-chat-input");
    const sendBtn     = document.getElementById("demo-chat-send");
    if (!trigger || !modal) return;

    const FLOWISE_URL = "https://cloud.flowiseai.com/api/v1/prediction/26728be9-ac01-435c-a80b-69df66bc87c3";
    const MAX_MSGS    = 5;
    let sending       = false;
    let msgCount      = 0;

    const openModal = () => {
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      inputEl?.focus();
    };

    const closeModal = () => {
      modal.hidden = true;
      document.body.style.overflow = "";
      trigger.focus();
    };

    trigger.addEventListener("click", openModal);
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(); }
    });
    closeBtn?.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && !modal.hidden) closeModal();
    });

    const addMsg = (text, isUser) => {
      const d = document.createElement("div");
      d.className = "results-chat-msg " + (isUser ? "results-chat-msg-user" : "results-chat-msg-bot");
      d.textContent = text;
      messagesEl.appendChild(d);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return d;
    };

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const question = inputEl.value.trim();
      if (!question || sending) return;

      if (msgCount >= MAX_MSGS) {
        addMsg("Has alcanzado el límite de la demo. ¡Contáctanos para saber más!", false);
        inputEl.disabled = true;
        sendBtn.disabled = true;
        return;
      }

      sending = true;
      msgCount++;
      inputEl.value = "";
      sendBtn.disabled = true;
      addMsg(question, true);

      const loader = addMsg("···", false);
      loader.classList.add("results-chat-msg-loading");

      try {
        const res = await fetch(FLOWISE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });
        const data = await res.json();
        loader.textContent = data.text || data.answer || "Sin respuesta.";
      } catch {
        loader.textContent = "Error al conectar con el asistente. Inténtalo de nuevo.";
      } finally {
        loader.classList.remove("results-chat-msg-loading");
        messagesEl.scrollTop = messagesEl.scrollHeight;
        sending = false;
        sendBtn.disabled = false;
        inputEl.focus();
      }
    });
  };

  const initPagoExitoso = () => {
    const card = document.querySelector(".pe-card");
    if (!card) return;
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    const noteEl    = document.getElementById("pe-session-note");
    if (sessionId && noteEl) {
      noteEl.textContent = `Ref: ${sessionId}`;
      noteEl.hidden = false;
      noteEl.removeAttribute("aria-hidden");
    }
  };

  const STRIPE_LINK_API = "https://vmkldqb82b.execute-api.eu-south-2.amazonaws.com/prod/auth/stripe-link";

  const initVerificarPago = () => {
    const loadingEl = document.getElementById("vp-loading");
    const errorEl   = document.getElementById("vp-error");
    const errorMsg  = document.getElementById("vp-error-msg");
    if (!loadingEl || !errorEl) return;

    const showError = (msg) => {
      loadingEl.hidden = true;
      if (errorMsg) errorMsg.textContent = msg;
      errorEl.hidden = false;
    };

    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      showError("El enlace de verificación no contiene un token válido. Por favor, usa el enlace que recibiste en tu correo.");
      return;
    }

    fetch(STRIPE_LINK_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.url) {
          window.location.href = data.url;
        } else {
          showError(data.message || "El enlace ha caducado o no es válido. Los enlaces expiran a los 15 minutos.");
        }
      })
      .catch(() => {
        showError("No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.");
      });
  };

  const EMPRESAS_API = "https://vmkldqb82b.execute-api.eu-south-2.amazonaws.com/prod/empresas";

  // Cablea el eye-toggle y el submit del formulario de activación una vez el
  // token ya se validó y el formulario está visible en el DOM.
  const wireCompletarForm = (token) => {
    const form = document.getElementById("form-completar");
    if (!form) return;

    initPasswordChecks();

    const eyeBtn   = document.getElementById("btn-eye-cr");
    const pwdInput = document.getElementById("reg-password");
    if (eyeBtn && pwdInput) {
      eyeBtn.addEventListener("click", () => {
        const show = pwdInput.type === "password";
        pwdInput.type = show ? "text" : "password";
        eyeBtn.querySelector("svg").innerHTML = show
          ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
          : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        eyeBtn.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const nombre    = sanitizeSingleLine(form.querySelector("#cr-nombre")?.value, 120);
      const apellidos = sanitizeSingleLine(form.querySelector("#cr-apellidos")?.value, 120);
      const password  = String(form.querySelector("#reg-password")?.value || "");

      const submitButton = form.querySelector(".auth-form-submit");
      const submitLabel  = submitButton?.querySelector("span");
      const errorEl      = document.getElementById("cr-form-error");

      const showFormError  = (msg) => { if (errorEl) errorEl.textContent = msg; };
      const clearFormError = ()    => { if (errorEl) errorEl.textContent = ""; };

      const SERVER_ERROR_MSG = "Ha ocurrido un problema en nuestros servidores en España, por favor inténtelo de nuevo en unos minutos.";

      clearFormError();

      if (!nombre || !apellidos) {
        showFormError("Introduce tu nombre y tus apellidos.");
        return;
      }
      if (!isValidPassword(password)) {
        showFormError("La contraseña no cumple los requisitos de seguridad. Revisa que tenga al menos 12 caracteres, una mayúscula, una minúscula, un número y un símbolo.");
        return;
      }

      setButtonLoading(submitButton, submitLabel, "Activando tu cuenta...", "Activar mi cuenta", true);

      try {
        const response = await fetch(`${EMPRESAS_API}/completar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password, nombre, apellidos }),
        });

        const data = await parseJsonResponse(response);

        if (response.status === 201) {
          document.getElementById("cr-form-card").hidden = true;
          document.getElementById("cr-success").hidden = false;
          return;
        }

        if (response.status === 404 || response.status === 410) {
          showFormError(data.message || "El enlace de invitación ha caducado. Pide a tu administrador que te reenvíe la invitación.");
          return;
        }

        if (response.status >= 500) {
          showFormError(SERVER_ERROR_MSG);
          return;
        }

        showFormError(responseErrorMessage(data, "No se pudo activar la cuenta. Revisa los datos e inténtalo de nuevo."));
      } catch {
        showFormError(SERVER_ERROR_MSG);
      } finally {
        setButtonLoading(submitButton, submitLabel, "Activando tu cuenta...", "Activar mi cuenta", false);
      }
    });
  };

  const initCompletarRegistro = () => {
    const loadingEl = document.getElementById("cr-loading");
    const errorEl   = document.getElementById("cr-error");
    const errorMsg  = document.getElementById("cr-error-msg");
    const formCard  = document.getElementById("cr-form-card");
    if (!loadingEl || !errorEl || !formCard) return;

    const showError = (msg) => {
      loadingEl.hidden = true;
      if (errorMsg) errorMsg.textContent = msg;
      errorEl.hidden = false;
    };

    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      showError("El enlace de invitación no contiene un token válido. Pide a tu administrador que te reenvíe la invitación.");
      return;
    }

    fetch(`${EMPRESAS_API}/aceptar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          showError(data.message || "El enlace de invitación no es válido o ha caducado.");
          return;
        }

        loadingEl.hidden = true;
        formCard.hidden = false;

        const emailEl = document.getElementById("cr-email");
        if (emailEl) emailEl.textContent = data.email || "";

        const nombreField = document.getElementById("cr-nombre");
        if (nombreField && data.nombreTemporal && data.nombreTemporal !== "Empleado Pendiente") {
          nombreField.value = data.nombreTemporal;
        }

        wireCompletarForm(token);
      })
      .catch(() => {
        showError("No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.");
      });
  };

  // Cablea un botón de ojo (mostrar/ocultar) sobre un campo de contraseña dado.
  const wirePasswordEye = (eyeBtn, pwdInput) => {
    if (!eyeBtn || !pwdInput) return;
    eyeBtn.addEventListener("click", () => {
      const show = pwdInput.type === "password";
      pwdInput.type = show ? "text" : "password";
      eyeBtn.querySelector("svg").innerHTML = show
        ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
        : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
      eyeBtn.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
    });
  };

  const initRestablecerPassword = () => {
    const errorEl   = document.getElementById("rp-error");
    const errorMsg  = document.getElementById("rp-error-msg");
    const formCard  = document.getElementById("rp-form-card");
    const successEl = document.getElementById("rp-success");
    const form      = document.getElementById("form-restablecer");
    if (!errorEl || !formCard || !form) return;

    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      formCard.hidden = true;
      if (errorMsg) errorMsg.textContent = "El enlace no contiene un token válido. Solicita uno nuevo desde la pantalla de inicio de sesión.";
      errorEl.hidden = false;
      return;
    }

    initPasswordChecks();
    wirePasswordEye(document.getElementById("btn-eye-rp"), document.getElementById("reg-password"));
    wirePasswordEye(document.getElementById("btn-eye-rp-confirm"), document.getElementById("rp-password-confirm"));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const password        = String(form.querySelector("#reg-password")?.value || "");
      const passwordConfirm = String(form.querySelector("#rp-password-confirm")?.value || "");

      const submitButton = form.querySelector(".auth-form-submit");
      const submitLabel  = submitButton?.querySelector("span");
      const feedbackEl   = document.getElementById("rp-form-error");

      const showFormError  = (msg) => { if (feedbackEl) feedbackEl.textContent = msg; };
      const clearFormError = ()    => { if (feedbackEl) feedbackEl.textContent = ""; };

      const SERVER_ERROR_MSG = "Ha ocurrido un problema en nuestros servidores en España, por favor inténtelo de nuevo en unos minutos.";

      clearFormError();

      if (!isValidPassword(password)) {
        showFormError("La contraseña no cumple los requisitos de seguridad. Revisa que tenga al menos 12 caracteres, una mayúscula, una minúscula, un número y un símbolo.");
        return;
      }
      if (password !== passwordConfirm) {
        showFormError("Las dos contraseñas no coinciden.");
        return;
      }

      setButtonLoading(submitButton, submitLabel, "Restableciendo...", "Restablecer contraseña", true);

      try {
        const { ok, status, data } = await restablecerPassword(token, password);

        if (ok) {
          formCard.hidden = true;
          if (successEl) successEl.hidden = false;
          return;
        }

        if (status === 404 || status === 410) {
          formCard.hidden = true;
          if (errorMsg) errorMsg.textContent = data.message || "El enlace no es válido o ya ha sido utilizado.";
          errorEl.hidden = false;
          return;
        }

        if (status >= 500) {
          showFormError(SERVER_ERROR_MSG);
          return;
        }

        showFormError(responseErrorMessage(data, "No se pudo restablecer la contraseña. Inténtalo de nuevo."));
      } catch {
        showFormError(SERVER_ERROR_MSG);
      } finally {
        setButtonLoading(submitButton, submitLabel, "Restableciendo...", "Restablecer contraseña", false);
      }
    });
  };

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
  initResultsCarousel();
  initResultsChat();
  initAgencyTabs();
  initTabsModal();
  initWebPreviewModal();
  initDemoChatModal();
  initVerificarPago();
  initPagoExitoso();
  initCompletarRegistro();
  initRestablecerPassword();
})();

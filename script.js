/* 1. Save and restore the personal care plan */
const careForm = document.querySelector("#careForm");
const saveMessage = document.querySelector("#saveMessage");

if (careForm && saveMessage) {
  /* Use the visitor's local calendar date, rather than a UTC date. */
  function updateStartDateMinimum() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    careForm.elements.planStart.min = year + "-" + month + "-" + day;
  }

  updateStartDateMinimum();
  careForm.elements.planStart.addEventListener("focus", updateStartDateMinimum);

  careForm.addEventListener("submit", function (event) {
    event.preventDefault();

    /* Recheck in case the page has stayed open past midnight. */
    updateStartDateMinimum();
    if (!careForm.reportValidity()) {
      return;
    }

    const formData = new FormData(careForm);
    const carePlan = Object.fromEntries(formData.entries());
    carePlan.includePlaytime = careForm.elements.includePlaytime.checked;

    try {
      localStorage.setItem("pawfectCarePlan", JSON.stringify(carePlan));
      saveMessage.className = "alert alert-success mt-3";
      saveMessage.textContent =
        "Care plan saved in this browser. Your pet's personal assistant deserves a treat too!";
    } catch (error) {
      saveMessage.className = "alert alert-danger mt-3";
      saveMessage.textContent =
        "Your browser could not save the plan. Please check its storage settings.";
    }
  });

  /* A fresh page starts blank. Saved answers load only on request. */
  function clearPlannerDisplay() {
    careForm.reset();

    for (const field of careForm.querySelectorAll("input, select, textarea")) {
      field.setCustomValidity("");
      field.classList.remove("is-invalid");
      field.removeAttribute("aria-invalid");
    }

    for (const message of careForm.querySelectorAll(".invalid-feedback")) {
      message.classList.remove("d-block");
      message.textContent = "";
    }

    saveMessage.className = "mt-3";
    saveMessage.textContent = "";
  }

  clearPlannerDisplay();
  window.addEventListener("pageshow", clearPlannerDisplay);

  const loadPlanButton = document.querySelector("#loadPlanButton");

  if (loadPlanButton) {
    loadPlanButton.addEventListener("click", function () {
      try {
        const savedPlan = localStorage.getItem("pawfectCarePlan");

        if (!savedPlan) {
          saveMessage.className = "alert alert-info mt-3";
          saveMessage.textContent =
            "There is no saved plan in this browser yet. Your pet's planning adventure starts here!";
          return;
        }

        const carePlan = JSON.parse(savedPlan);

        if (!carePlan || typeof carePlan !== "object" || Array.isArray(carePlan)) {
          throw new Error("The saved plan has an unexpected format.");
        }

        clearPlannerDisplay();
        updateStartDateMinimum();

        const fieldNames = [
          "ownerName", "petName", "ownerEmail", "petType", "petBreed",
          "petAge", "petWeight", "planStart", "activityLevel", "careNotes"
        ];

        for (const name of fieldNames) {
          const field = careForm.elements.namedItem(name);

          if (field && typeof carePlan[name] === "string") {
            field.value = carePlan[name];
          }
        }

        careForm.elements.includePlaytime.checked =
          carePlan.includePlaytime === true || carePlan.includePlaytime === "yes";

        for (const name of ["ownerName", "petName"]) {
          const field = careForm.elements.namedItem(name);
          if (field.value !== "" && field.value.trim() === "") {
            field.setCustomValidity("Enter a name using more than just spaces.");
          }
        }

        saveMessage.className = "alert alert-info mt-3";
        saveMessage.textContent =
          "Your saved care plan has been loaded. You can edit it and save again.";

        if (careForm.elements.planStart.validity.rangeUnderflow) {
          saveMessage.className = "alert alert-warning mt-3";
          saveMessage.textContent =
            "Your saved plan has been loaded. Choose today or a future start date before saving again.";
        }
      } catch (error) {
        saveMessage.className = "alert alert-warning mt-3";
        saveMessage.textContent =
          "Your saved plan could not be loaded. You can fill in a new plan.";
      }
    });
  }
}

/* 2. Clear messages beside missing or invalid fields */
if (careForm && saveMessage) {
  const fieldChecks = [
    {
      id: "ownerName",
      missing: "Enter your name.",
      invalid: "Enter your name using more than just spaces."
    },
    {
      id: "petName",
      missing: "Enter your pet's name.",
      invalid: "Enter your pet's name using more than just spaces."
    },
    {
      id: "ownerEmail",
      missing: "Enter your email address.",
      invalid: "Enter an email address in a format such as alex@example.com."
    },
    {
      id: "petType",
      missing: "Choose your pet type from the list.",
      invalid: "Choose one of the pet types in the list."
    },
    {
      id: "petAge",
      missing: "Enter your pet's age in years.",
      invalid: "Enter an age of 0 or more, using at most one decimal place, such as 2 or 0.5."
    },
    {
      id: "petWeight",
      missing: "Enter a weight or leave this optional field blank.",
      invalid: "Enter a weight of at least 0.01 kg, using at most two decimal places, or leave it blank."
    },
    {
      id: "planStart",
      missing: "Choose today or a future date for your plan to begin.",
      invalid: "Choose a complete, valid date for today or later. Yesterday is already taken!"
    },
    {
      id: "activityLow",
      missing: "Choose one activity level: Low, Moderate, or High.",
      invalid: "Choose one activity level."
    }
  ];

  for (const check of fieldChecks) {
    check.field = document.getElementById(check.id);
    check.controls = [check.field];

    if (check.field.type === "radio") {
      check.controls = Array.from(
        careForm.querySelectorAll('input[name="activityLevel"]')
      );
    }

    check.message = document.createElement("div");
    check.message.id = check.id + "Error";
    check.message.className = "invalid-feedback";

    if (check.field.type === "radio") {
      check.field.closest("fieldset").append(check.message);
    } else {
      const fieldGroup = check.field.closest(".input-group") || check.field;
      fieldGroup.insertAdjacentElement("afterend", check.message);
    }

    for (const control of check.controls) {
      const description = control.getAttribute("aria-describedby") || "";
      control.setAttribute(
        "aria-describedby",
        (description + " " + check.message.id).trim()
      );
    }
  }

  function checkName(field) {
    field.setCustomValidity("");

    if (field.value !== "" && field.value.trim() === "") {
      field.setCustomValidity("Enter a name using more than just spaces.");
    }
  }

  function showFieldMessage(check) {
    const invalid = !check.field.validity.valid;

    for (const control of check.controls) {
      control.classList.toggle("is-invalid", invalid);
      control.setAttribute("aria-invalid", String(invalid));
    }

    check.message.classList.toggle("d-block", invalid);
    check.message.textContent = "";

    if (invalid) {
      check.message.textContent = check.invalid;

      if (check.field.validity.valueMissing && !check.field.validity.badInput) {
        check.message.textContent = check.missing;
      }
    }
  }

  checkName(careForm.elements.ownerName);
  checkName(careForm.elements.petName);

  /* The browser blocks saving and focuses the first invalid field. */
  careForm.addEventListener("invalid", function (event) {
    const check = fieldChecks.find(item => item.controls.includes(event.target));

    if (check) {
      showFieldMessage(check);
    }

    saveMessage.className = "alert alert-danger mt-3";
    saveMessage.textContent =
      "Your changes have not been saved. Please check the highlighted fields and try again.";
  }, true);

  careForm.addEventListener("input", function (event) {
    const field = event.target;

    if (field.name === "ownerName" || field.name === "petName") {
      checkName(field);
    }

    const check = fieldChecks.find(item => item.controls.includes(field));

    if (check && check.controls.some(control => control.classList.contains("is-invalid"))) {
      showFieldMessage(check);
    }

    const hasErrors = fieldChecks.some(item =>
      item.controls.some(control => control.classList.contains("is-invalid"))
    );

    if (!hasErrors) {
      saveMessage.className = "alert alert-info mt-3";
      saveMessage.textContent =
        "You have unsaved changes. Choose Save care plan when you are ready.";
    }
  });
}

/* 3. Pause and resume the homepage slideshow */
const petCarousel = document.querySelector("#petCarousel");
const carouselToggle = document.querySelector("#carouselToggle");

if (petCarousel && carouselToggle) {
  const slideshow = bootstrap.Carousel.getOrCreateInstance(petCarousel);
  let isPaused = false;

  carouselToggle.addEventListener("click", function () {
    isPaused = !isPaused;

    if (isPaused) {
      slideshow.pause();
      carouselToggle.textContent = "Resume slideshow";
    } else {
      slideshow.cycle();
      carouselToggle.textContent = "Pause slideshow";
    }
  });
}


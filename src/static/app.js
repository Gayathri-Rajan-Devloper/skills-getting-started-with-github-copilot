document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Fetch activities, render cards (including participants), populate select, handle signup.

  const activitiesUrl = "/activities";

  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (typeof c === "string") e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    });
    return e;
  }

  async function loadActivities() {
    const res = await fetch(activitiesUrl);
    if (!res.ok) {
      showMessage("Could not load activities.", "error");
      return {};
    }
    return await res.json();
  }

  function renderActivities(activities) {
    const container = document.getElementById("activities-list");
    container.innerHTML = ""; // clear loading text

    const names = Object.keys(activities).sort();
    if (names.length === 0) {
      container.appendChild(el("p", { text: "No activities available." }));
      return;
    }

    names.forEach(name => {
      const a = activities[name];
      const card = el("div", { class: "activity-card", "data-activity": name, "data-max": String(a.max_participants) }, [
        el("h4", { text: name }),
        el("p", { text: a.description }),
        el("p", { text: `Schedule: ${a.schedule}` }),
        el("p", { class: "activity-capacity", text: `Capacity: ${a.participants.length} / ${a.max_participants}` }),
      ]);

      // Participants section
      const participantsWrap = el("div", { class: "participants" });
      participantsWrap.appendChild(el("h5", { text: "Participants" }));

      if (Array.isArray(a.participants) && a.participants.length > 0) {
        const ul = el("ul", { class: "participants-list" });
        a.participants.forEach(p => {
          ul.appendChild(createParticipantListItem(name, p));
        });
        participantsWrap.appendChild(ul);
      } else {
        participantsWrap.appendChild(el("div", { class: "participants-empty", text: "No participants yet." }));
      }

      card.appendChild(participantsWrap);
      container.appendChild(card);
    });
  }

  function createParticipantListItem(activityName, participantEmail) {
    const li = el("li");
    const emailSpan = el("span", { text: participantEmail, class: "participant-email" });
    const removeBtn = el("button", { class: "participant-remove", title: "Unregister" }, "✖");

    removeBtn.addEventListener("click", async () => {
      if (!confirm(`Unregister ${participantEmail} from ${activityName}?`)) return;
      const url = `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(participantEmail)}`;
      try {
        const res = await fetch(url, { method: "DELETE" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          showMessage(body.detail || body.message || "Unregister failed.", "error");
          return;
        }
        showMessage(body.message || "Unregistered successfully", "success");
        const activities = await loadActivities();
        renderActivities(activities);
        populateSelect(activities);
      } catch (err) {
        showMessage("Network error. Please try again.", "error");
      }
    });

    li.appendChild(emailSpan);
    li.appendChild(removeBtn);
    return li;
  }

  function addParticipantToCard(activityName, participantEmail) {
    const cards = Array.from(document.querySelectorAll('.activity-card'));
    const card = cards.find(c => c.getAttribute('data-activity') === activityName);
    if (!card) return;

    const participantsWrap = card.querySelector('.participants');
    let ul = card.querySelector('.participants-list');
    const empty = card.querySelector('.participants-empty');
    if (!ul) {
      // remove empty placeholder if present
      if (empty) empty.remove();
      ul = el('ul', { class: 'participants-list' });
      participantsWrap.appendChild(ul);
    }
    ul.appendChild(createParticipantListItem(activityName, participantEmail));

    // update capacity display and data-max if present
    const capacityEl = card.querySelector('.activity-capacity');
    const max = parseInt(card.getAttribute('data-max') || '0', 10);
    const current = ul.querySelectorAll('li').length;
    if (capacityEl) capacityEl.textContent = `Capacity: ${current} / ${max}`;
  }

  function populateSelect(activities) {
    const select = document.getElementById("activity");
    select.innerHTML = '<option value="">-- Select an activity --</option>';
    Object.keys(activities).sort().forEach(name => {
      const opt = el("option", { value: name, text: name });
      select.appendChild(opt);
    });
  }

  function showMessage(text, type = "info") {
    const msg = document.getElementById("message");
    msg.className = `message ${type}`;
    msg.textContent = text;
    msg.classList.remove("hidden");
    // auto-hide success after a few seconds
    if (type === "success") {
      setTimeout(() => msg.classList.add("hidden"), 4000);
    }
  }

  async function submitSignup(event) {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;
    if (!email || !activity) {
      showMessage("Please provide an email and select an activity.", "error");
      return;
    }

    const url = `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`;
    try {
      const res = await fetch(url, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMessage(body.detail || body.message || "Signup failed.", "error");
        return;
      }
      showMessage(body.message || "Signed up successfully!", "success");
      // Optimistically update the DOM so the new participant appears immediately
      addParticipantToCard(activity, email);
      // refresh select/options in case activities changed
      const activities = await loadActivities();
      populateSelect(activities);
      document.getElementById("signup-form").reset();
    } catch (err) {
      showMessage("Network error. Please try again.", "error");
    }
  }

  async function init() {
    const activities = await loadActivities();
    renderActivities(activities);
    populateSelect(activities);

    document.getElementById("signup-form").addEventListener("submit", submitSignup);
  }

  // Initialize app
  init();
});

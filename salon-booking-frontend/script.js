console.log("frontend script loaded: changes applied");
const API_BASE = "http://localhost:5000/api";

const authMessage = document.getElementById("authMessage");
const bookingMessage = document.getElementById("bookingMessage");
const salonList = document.getElementById("salonList");
const logoutBtn = document.getElementById("logoutBtn");

const state = {
  selectedSalonId: null,
  selectedServiceId: null,
  selectedServicePrice: 0
  ,selectedServiceDuration: 0
};

// Quick booking state (separate from modal state)
const quickState = {
  salonId: null,
  serviceId: null,
  servicePrice: 0,
  serviceDuration: 0
};

let searchOptionsRequestId = 0;

function setMessage(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = "message " + (type === "error" ? "error" : "success");
}

function isLoggedIn() {
  return !!localStorage.getItem("token");
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    return null;
  }
}

function updateUserUI() {
  const currentUser = getCurrentUser();
  const isAdminPage = window.location.pathname === "/admin";
  const userInfo = document.getElementById("userInfo");
  const authSection = document.getElementById("authSection");
  const userName = document.getElementById("userName");
  const userRole = document.getElementById("userRole");
  const salonDashboard = document.getElementById("salonDashboard");
  const adminDashboard = document.getElementById("adminDashboard");
  const discoverSection = document.getElementById("discoverSection");
  const quickBookingSection = document.getElementById("quickBookingSection");
  const salonDashboardSection = salonDashboard;

  if (currentUser) {
    if (userInfo) userInfo.classList.remove("hidden");
    if (userName) userName.textContent = currentUser.name;
    if (userRole) userRole.textContent = currentUser.role;
    if (authSection && isAdminPage && currentUser.role === "admin") authSection.classList.add("hidden");
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    if (userInfo) userInfo.classList.add("hidden");
    if (authSection) authSection.classList.remove("hidden");
    if (logoutBtn) logoutBtn.style.display = "none";
  }

  if (salonDashboard) {
    salonDashboard.classList.toggle("hidden", !(currentUser && currentUser.role === "salon_owner"));
  }

  if (adminDashboard) {
    adminDashboard.classList.toggle("hidden", !(currentUser && currentUser.role === "admin"));
  }

  if (isAdminPage) {
    discoverSection?.classList.add("hidden");
    quickBookingSection?.classList.add("hidden");
    salonDashboardSection?.classList.add("hidden");
    if (authSection && currentUser?.role === "admin") authSection.classList.add("hidden");
  }

  if (currentUser?.role === "admin") loadAdminDashboard();
  if (currentUser?.role === "salon_owner") loadOwnerDashboard();
}

async function loadAdminDashboard() {
  const statsEl = document.getElementById("adminStats");
  const dataEl = document.getElementById("adminSalonData");
  const token = localStorage.getItem("token");
  if (!statsEl || !token) return;

  try {
    const response = await fetch(`${API_BASE}/admin/dashboard?city=Salem`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load admin dashboard");
    statsEl.innerHTML = Object.entries(data.statistics || {})
      .map(([label, value]) => `<button class="stat-box" type="button" data-dashboard-section="${label}"><strong>${value}</strong><span>${label}</span></button>`)
      .join("");
    if (dataEl) {
      dataEl.innerHTML = `
        <section class="dashboard-panel" data-dashboard-panel="customers"><h3>Customers</h3>
        ${(data.customers || []).map((customer) => `<div class="dashboard-item"><h4>${customer.name}</h4><p>${customer.email}${customer.phone ? ` | ${customer.phone}` : ""}</p></div>`).join("") || "<p>No customers found.</p>"}</section>
        <section class="dashboard-panel active" data-dashboard-panel="salons"><h3>Salem salons</h3>
        ${(data.salons || []).map((salon) => `
          <div class="dashboard-item">
            <h4>${salon.name}</h4>
            <p>${salon.city} | ${salon.address}</p>
            <p>Salon owner: ${salon.owner?.name || "Unassigned"} | Phone: ${salon.phone || "N/A"}</p>
            <p>Rating: ${salon.rating || "New"} | Status: ${salon.isActive ? "Active" : "Inactive"}</p>
          </div>
        `).join("") || "<p>No salons found.</p>"}</section>
        <section class="dashboard-panel" data-dashboard-panel="services"><h3>Services</h3>
        ${(data.services || []).map((service) => `<div class="dashboard-item"><h4>${service.name}</h4><p>${service.salon?.name || "Salon"} | $${service.price} | ${service.duration} min</p></div>`).join("") || "<p>No services found.</p>"}</section>
        <section class="dashboard-panel" data-dashboard-panel="staff"><h3>Stylists</h3>
        ${(data.staff || []).map((member) => `<div class="dashboard-item"><h4>${member.name}</h4><p>${member.salon?.name || "Salon"} | ${member.role || "stylist"}</p></div>`).join("") || "<p>No stylists found.</p>"}</section>
        <section class="dashboard-panel" data-dashboard-panel="appointments"><h3>Appointments and customers</h3>
        ${(data.appointments || []).map((appointment) => `<div class="dashboard-item"><h4>${appointment.appointmentDate} ${appointment.startTime}</h4><p>${appointment.salon?.name || "Salon"} | ${appointment.service?.name || "Service"}</p><p>Customer: ${appointment.customer?.name || "Customer"} | Stylist: ${appointment.staff?.name || "Stylist"} | Status: ${appointment.status}</p></div>`).join("") || "<p>No appointments found.</p>"}</section>
      `;
      statsEl.querySelectorAll("[data-dashboard-section]").forEach((card) => {
        card.addEventListener("click", () => {
          const panel = dataEl.querySelector(`[data-dashboard-panel="${card.dataset.dashboardSection}"]`);
          if (!panel) return;
          dataEl.querySelectorAll(".dashboard-panel").forEach((item) => item.classList.remove("active"));
          statsEl.querySelectorAll(".stat-box").forEach((item) => item.classList.remove("active"));
          panel.classList.add("active");
          card.classList.add("active");
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }
  } catch (error) {
    statsEl.innerHTML = `<p class="error">${error.message}</p>`;
    if (dataEl) dataEl.innerHTML = "";
  }
}

async function loadOwnerDashboard() {
  const statsEl = document.getElementById("salonStats");
  const dataEl = document.getElementById("ownerSalonData");
  const token = localStorage.getItem("token");
  if (!statsEl || !dataEl || !token) return;

  try {
    const response = await fetch(`${API_BASE}/admin/owner-dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load salon dashboard");
    statsEl.innerHTML = Object.entries(data.statistics || {})
      .map(([label, value]) => `<div class="stat-box"><strong>${value}</strong><span>${label}</span></div>`)
      .join("");
    dataEl.innerHTML = `
      <h3>Your salons</h3>
      ${(data.salons || []).map((salon) => `
        <div class="card"><h4>${salon.name}</h4>
        <p>${salon.city} | ${salon.address}</p>
        <p>${salon.description || "Add a description to tell customers about this salon."}</p></div>
      `).join("") || "<p>No salons found for this account.</p>"}
      <h3>Recent appointments</h3>
      ${(data.appointments || []).slice(0, 10).map((appointment) => `
        <div class="card"><strong>${appointment.appointmentDate} ${appointment.startTime}</strong>
        <p>${appointment.customer?.name || "Customer"} - ${appointment.service?.name || "Service"} with ${appointment.staff?.name || "Stylist"}</p>
        <p>Status: ${appointment.status}</p></div>
      `).join("") || "<p>No appointments yet.</p>"}
    `;
  } catch (error) {
    dataEl.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

async function fetchSalons() {
  try {
    const response = await fetch(`${API_BASE}/salons`);
    if (!response.ok) {
      throw new Error("Failed to fetch salons");
    }

    const data = await response.json();
    const salons = Array.isArray(data) ? data : data.salons || [];

    if (!salons.length) {
      if (salonList) {
        salonList.innerHTML = "<p class='error'>No salons available yet.</p>";
      }
      return;
    }

    renderSalons(salons);
  } catch (error) {
    if (salonList) {
      salonList.innerHTML = `<p class="error">${error.message}</p>`;
    }
  }
}

function renderSalons(salons) {
  if (!salonList) return;
  salonList.innerHTML = "";

  salons.forEach((salon) => {
    const div = document.createElement("div");
    div.className = "salon-item";
    div.innerHTML = `
      <h3>${salon.name}</h3>
      <p><strong>City:</strong> ${salon.city || "N/A"}</p>
      <p><strong>Address:</strong> ${salon.address || "N/A"}</p>
      <p><strong>Phone:</strong> ${salon.phone || "N/A"}</p>
      <p><strong>Rating:</strong> ${salon.rating || "New"}</p>
      <p>${salon.description || "Professional beauty services and styling."}</p>
    `;
    salonList.appendChild(div);
  });
}

async function registerUser() {
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const roleInput = document.getElementById("role");

  if (!nameInput || !emailInput || !passwordInput || !roleInput) return;

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const role = roleInput.value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Registration failed");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    updateUserUI();
    setMessage(authMessage, "Registration successful!", "success");
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  }
}

async function loginUser() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!emailInput || !passwordInput) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    updateUserUI();
    setMessage(authMessage, "Login successful!", "success");
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  }
}

async function searchSalons() {
  const searchInput = document.getElementById("searchInput");
  const searchType = document.getElementById("searchType");
  const cityInput = document.getElementById("cityInput");
  const searchStatus = document.getElementById("searchStatus");

  if (!searchInput || !cityInput || !salonList) return;

  const params = new URLSearchParams();
  const search = searchInput.value.trim();
  // force city to Salem per user requirement
  const city = "Salem";

  if (search) params.append("search", search);
  params.append("type", searchType?.value || "salon");
  params.append("city", city);

  try {
    const response = await fetch(`${API_BASE}/salons?${params.toString()}`);
    if (!response.ok) {
      throw new Error("Search failed");
    }

    const data = await response.json();
    const salons = Array.isArray(data) ? data : data.salons || [];

    salonList.innerHTML = "";

    if (!salons.length) {
      salonList.innerHTML = "<p class='error'>No salons found for this search.</p>";
      if (searchStatus) searchStatus.textContent = "No Salem salons or services matched your search.";
      return;
    }

    if (searchStatus) {
      searchStatus.textContent = `${salons.length} Salem salon${salons.length === 1 ? "" : "s"} found`;
    }

    salons.forEach((salon) => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <h3>${salon.name}</h3>
        <p><strong>City:</strong> ${salon.city || "N/A"}</p>
        <p><strong>Address:</strong> ${salon.address || "N/A"}</p>
        <p><strong>Phone:</strong> ${salon.phone || "N/A"}</p>
        <p><strong>Rating:</strong> ${salon.rating || "New"}</p>
        <p>${salon.description || "Professional beauty services and styling."}</p>
        <button data-salonid="${salon._id}">View Details</button>
      `;

      const button = div.querySelector("button");
      button.addEventListener("click", () => showSalonDetails(salon._id));
      salonList.appendChild(div);
    });
  } catch (error) {
    salonList.innerHTML = `<p class="error">${error.message}</p>`;
    if (searchStatus) searchStatus.textContent = "Unable to load Salem salons. Check that the backend is running.";
  }
}

async function loadSearchOptions(type = "salon") {
  const searchInput = document.getElementById("searchInput");
  const searchType = document.getElementById("searchType");
  const requestId = ++searchOptionsRequestId;
  if (!searchInput) return;

  try {
    const salonsResponse = await fetch(`${API_BASE}/salons?city=Salem`);
    const salonsData = await salonsResponse.json();
    const salons = salonsData.salons || [];
    let options = [];

    if (type === "salon") {
      options = salons.map((salon) => ({ value: salon.name, label: salon.name }));
    } else {
      const serviceGroups = await Promise.all(salons.map(async (salon) => {
        const response = await fetch(`${API_BASE}/services/salon/${salon._id}`);
        const data = await response.json();
        return data.services || [];
      }));
      const services = serviceGroups.flat();
      options = [...new Map(services.map((service) => [service.name, service.name])).values()]
        .map((name) => ({ value: name, label: name }));
    }

    if (requestId !== searchOptionsRequestId || searchType?.value !== type) return;

    searchInput.innerHTML = `<option value="">Select a ${type}</option>`;
    options.forEach((optionData) => {
      const option = document.createElement("option");
      option.value = optionData.value;
      option.textContent = optionData.label;
      searchInput.appendChild(option);
    });
  } catch (error) {
    searchInput.innerHTML = `<option value="">Unable to load ${type} options</option>`;
  }
}

// --- Quick booking helpers ---
async function loadSalonsForBooking() {
  try {
    const res = await fetch(`${API_BASE}/salons?city=Salem`);
    const data = await res.json();
    const salons = Array.isArray(data) ? data : data.salons || [];
    const sel = document.getElementById('quickSalonSelect');
    if (!sel) return;
    sel.innerHTML = "<option value=''>Select salon</option>";
    salons.forEach(s => {
      const o = document.createElement('option');
      o.value = s._id;
      o.textContent = s.name;
      sel.appendChild(o);
    });
  } catch (err) {
    const sel = document.getElementById('quickSalonSelect');
    if (sel) sel.innerHTML = "<option value=''>Unable to load salons</option>";
  }
}

async function loadServicesForSalonTo(selectId, salonId) {
  try {
    const res = await fetch(`${API_BASE}/services/salon/${salonId}`);
    const data = await res.json();
    const services = Array.isArray(data) ? data : data.services || [];
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = "<option value=''>Select service</option>";
    services.forEach(s => {
      const o = document.createElement('option');
      o.value = s._id;
      o.dataset.price = s.price;
      o.dataset.duration = s.duration || 60;
      o.textContent = `${s.name} - $${s.price}`;
      sel.appendChild(o);
    });
  } catch (err) {
    const sel = document.getElementById(selectId);
    if (sel) sel.innerHTML = "<option value=''>No services</option>";
  }
}

// adapt loadStaffForSalon to optionally populate a supplied select id
async function loadStaffForSalon(salonId, targetSelectId) {
  const selectId = targetSelectId || 'modalStaffSelect';
  const stationSelect = document.getElementById(selectId);
  const stylistList = document.getElementById("stylistList");
  if (!stationSelect) return;

  try {
    const headers = {};
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}/staff?salonId=${salonId}`, { headers });

    const data = await response.json();
    const staff = Array.isArray(data) ? data : data.staff || [];

    stationSelect.innerHTML = "<option value=''>Select stylist</option>";
    if (stylistList) {
      stylistList.innerHTML = staff.length
        ? staff.map((member) => `<span class="stylist-name">${member.name}</span>`).join("")
        : "<span>No stylists available</span>";
    }

    staff.forEach((member) => {
      const option = document.createElement("option");
      option.value = member._id;
      option.textContent = member.name || "Stylist";
      stationSelect.appendChild(option);
    });
  } catch (error) {
    stationSelect.innerHTML = "<option value=''>No stylists available</option>";
    if (stylistList) stylistList.innerHTML = "<span>No stylists available</span>";
  }
}

async function loadAvailableSlotsFor(staffSelectId, dateInputId, slotSelectId) {
  const staffSelect = document.getElementById(staffSelectId);
  const bookingDate = document.getElementById(dateInputId);
  const slotSelect = document.getElementById(slotSelectId);
  if (!staffSelect || !bookingDate || !slotSelect) return;

  const staffId = staffSelect.value;
  const date = bookingDate.value;
  if (!staffId || !date) return;

  try {
    const response = await fetch(`${API_BASE}/availability?staffId=${staffId}&date=${date}`);
    const data = await response.json();
    const slots = Array.isArray(data) ? data : data.slots || [];

    slotSelect.innerHTML = "<option value=''>Select time slot</option>";
    slots.forEach((slot) => {
      if (slot.available === false) return;
      const option = document.createElement("option");
      option.value = slot.startTime;
      option.textContent = `${slot.startTime} - ${slot.endTime}`;
      slotSelect.appendChild(option);
    });
  } catch (error) {
    slotSelect.innerHTML = "<option value=''>No time slots available</option>";
  }
}

async function quickBookAppointment() {
  const salonSel = document.getElementById('quickSalonSelect');
  const serviceSel = document.getElementById('quickServiceSelect');
  const staffSel = document.getElementById('quickStaffSelect');
  const dateEl = document.getElementById('quickBookingDate');
  const slotSel = document.getElementById('quickSlotSelect');
  const msg = document.getElementById('quickBookingMessage');
  const conf = document.getElementById('quickBookingConfirmation');

  if (!salonSel || !serviceSel || !staffSel || !dateEl || !slotSel) return;
  if (!isLoggedIn()) {
    setMessage(msg, 'Please login before booking so the appointment can be saved.', 'error');
    return;
  }
  const salon = salonSel.value;
  const service = serviceSel.value;
  const appointmentDate = dateEl.value;
  let staff = staffSel.value;
  let startTime = slotSel.value;

  // if user didn't pick a staff, pick a random available stylist (if any)
  if (!staff) {
    const opts = Array.from(staffSel.options).filter(o => o.value);
    if (opts.length) {
      const rand = opts[Math.floor(Math.random() * opts.length)];
      staff = rand.value;
      staffSel.value = staff;
    }
  }

  // if user didn't pick a slot, pick a random available slot (if any)
  if (!startTime) {
    const slotOpts = Array.from(slotSel.options).filter(o => o.value);
    if (slotOpts.length) {
      const randSlot = slotOpts[Math.floor(Math.random() * slotOpts.length)];
      startTime = randSlot.value;
      slotSel.value = startTime;
    }
  }

  if (!salon || !service || !staff || !appointmentDate || !startTime) {
    if (msg) setMessage(msg, 'Please complete all booking details.', 'error');
    return;
  }

  // compute endTime helper
  function addMinutesToTime(timeStr, minutesToAdd) {
    const [hh, mm] = timeStr.split(":").map(Number);
    const total = hh * 60 + mm + Number(minutesToAdd);
    const h2 = Math.floor((total % (24*60)) / 60).toString().padStart(2, "0");
    const m2 = (total % 60).toString().padStart(2, "0");
    return `${h2}:${m2}`;
  }

  const selectedOption = serviceSel.options[serviceSel.selectedIndex];
  const duration = selectedOption?.dataset?.duration || 60;
  const price = selectedOption?.dataset?.price || 0;
  const endTime = addMinutesToTime(startTime, duration);

  try {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ salon, service, staff, appointmentDate, startTime, endTime, price: Number(price), notes: '' })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Appointment creation failed');

    if (msg) setMessage(msg, 'Data filled and appointment saved to MongoDB successfully.', 'success');
    if (conf) {
      conf.classList.remove('hidden');
      conf.innerHTML = `
        <h4>Booking Confirmed</h4>
        <p><strong>Salon:</strong> ${salonSel.options[salonSel.selectedIndex].textContent}</p>
        <p><strong>Stylist:</strong> ${staffSel.options[staffSel.selectedIndex]?.textContent || 'Stylist'}</p>
        <p><strong>Service:</strong> ${serviceSel.options[serviceSel.selectedIndex].textContent}</p>
        <p><strong>Date & Time:</strong> ${appointmentDate} ${startTime} - ${endTime}</p>
        <p><strong>Price:</strong> $${price}</p>
      `;
    }
  } catch (err) {
    if (msg) setMessage(msg, err.message, 'error');
  }
}

// allow Enter key to trigger search
document.addEventListener("DOMContentLoaded", () => {
  const s = document.getElementById("searchInput");
  const c = document.getElementById("cityInput");
  if (s) s.addEventListener("keydown", (e) => { if (e.key === "Enter") searchSalons(); });
  if (c) c.addEventListener("keydown", (e) => { if (e.key === "Enter") searchSalons(); });
  // populate quick booking salon list after DOM is ready
  if (typeof loadSalonsForBooking === 'function') loadSalonsForBooking();
});

async function showSalonDetails(salonId) {
  const salonDetailsSection = document.getElementById("salonDetailsSection");
  const salonName = document.getElementById("salonName");
  const salonAddress = document.getElementById("salonAddress");
  const salonCity = document.getElementById("salonCity");
  const serviceList = document.getElementById("serviceList");
  const bookingSection = document.getElementById("bookingSection");

  if (!salonDetailsSection || !salonName || !salonAddress || !salonCity || !serviceList) return;

  state.selectedSalonId = salonId;

  try {
    const salonRes = await fetch(`${API_BASE}/salons/${salonId}`);
    const salon = await salonRes.json();

    salonName.textContent = salon.name || "Salon";
    salonAddress.textContent = salon.address || "N/A";
    salonCity.textContent = salon.city || "N/A";

    const servicesRes = await fetch(`${API_BASE}/services/salon/${salonId}`);
    const servicesData = await servicesRes.json();
    const services = Array.isArray(servicesData) ? servicesData : servicesData.services || [];

    serviceList.innerHTML = "";

    services.forEach((service) => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <h4>${service.name}</h4>
        <p>Category: ${service.category || "General"}</p>
        <p>Price: $${service.price}</p>
        <p>Duration: ${service.duration || 60} min</p>
        <button data-service-id="${service._id}" data-price="${service.price}">Select Service</button>
      `;

      const button = div.querySelector("button");
      button.addEventListener("click", () => {
        state.selectedServiceId = service._id;
        state.selectedServicePrice = service.price;
        state.selectedServiceDuration = service.duration || 60;
        loadStaffForSalon(salonId);
        if (bookingSection) bookingSection.classList.remove("hidden");
      });

      serviceList.appendChild(div);
    });

    salonDetailsSection.classList.remove("hidden");
    loadStaffForSalon(salonId);
  } catch (error) {
    salonName.textContent = "Unable to load salon";
  }
}

async function loadAvailableSlots() {
  const staffSelect = document.getElementById("modalStaffSelect");
  const bookingDate = document.getElementById("bookingDate");
  const slotSelect = document.getElementById("slotSelect");

  if (!staffSelect || !bookingDate || !slotSelect) return;

  const staffId = staffSelect.value;
  const date = bookingDate.value;

  if (!staffId || !date) return;

  try {
    const response = await fetch(`${API_BASE}/availability?staffId=${staffId}&date=${date}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });

    const data = await response.json();
    const slots = Array.isArray(data) ? data : data.slots || [];

    slotSelect.innerHTML = "<option value=''>Select time slot</option>";

    slots.forEach((slot) => {
      if (slot.available === false) return;
      const option = document.createElement("option");
      option.value = slot.startTime;
      option.textContent = `${slot.startTime} - ${slot.endTime}`;
      slotSelect.appendChild(option);
    });
  } catch (error) {
    slotSelect.innerHTML = "<option value=''>No time slots available</option>";
  }
}

async function bookAppointment() {
  if (!isLoggedIn()) {
    setMessage(bookingMessage, "Please login first.", "error");
    return;
  }

  const staffSelect = document.getElementById("modalStaffSelect");
  const bookingDate = document.getElementById("bookingDate");
  const slotSelect = document.getElementById("slotSelect");
  const token = localStorage.getItem("token");

  if (!staffSelect || !bookingDate || !slotSelect || !token) {
    setMessage(bookingMessage, "Booking form is incomplete.", "error");
    return;
  }

  let staff = staffSelect.value;
  const appointmentDate = bookingDate.value;
  let startTime = slotSelect.value;

  // pick random stylist if none selected
  if (!staff) {
    const opts = Array.from(staffSelect.options).filter(o => o.value);
    if (opts.length) {
      const rand = opts[Math.floor(Math.random() * opts.length)];
      staff = rand.value;
      staffSelect.value = staff;
    }
  }

  // pick random slot if none selected
  if (!startTime) {
    const slotOpts = Array.from(slotSelect.options).filter(o => o.value);
    if (slotOpts.length) {
      const randSlot = slotOpts[Math.floor(Math.random() * slotOpts.length)];
      startTime = randSlot.value;
      slotSelect.value = startTime;
    }
  }

  if (!state.selectedSalonId || !state.selectedServiceId || !staff || !appointmentDate || !startTime) {
    setMessage(bookingMessage, "Please complete all booking details.", "error");
    return;
  }

  try {
    // compute endTime from duration
    function addMinutesToTime(timeStr, minutesToAdd) {
      const [hh, mm] = timeStr.split(":").map(Number);
      const total = hh * 60 + mm + Number(minutesToAdd);
      const h2 = Math.floor((total % (24*60)) / 60).toString().padStart(2, "0");
      const m2 = (total % 60).toString().padStart(2, "0");
      return `${h2}:${m2}`;
    }

    const endTime = addMinutesToTime(startTime, state.selectedServiceDuration || 60);

    const response = await fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        salon: state.selectedSalonId,
        service: state.selectedServiceId,
        staff,
        appointmentDate,
        startTime,
        endTime,
        price: Number(state.selectedServicePrice),
        notes: ""
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Appointment creation failed");
    }
    setMessage(bookingMessage, "Appointment created successfully!", "success");
    // show booking confirmation in the modal
    const confirmationEl = document.getElementById("bookingConfirmation");
    const staffName = document.querySelector(`#modalStaffSelect option[value="${staff}"]`)?.textContent || "Stylist";
    const salonName = document.getElementById("salonName")?.textContent || "Salon";
    const appointment = data.appointment || data || {};
    const apptDate = appointment.appointmentDate || appointment.date || appointment.dateString || appointmentDate;
    const apptStart = appointment.startTime || startTime;
    const apptEnd = appointment.endTime || endTime;
    const apptPrice = appointment.price ?? Number(state.selectedServicePrice);
    if (confirmationEl) {
      confirmationEl.classList.remove("hidden");
      confirmationEl.innerHTML = `
        <h4>Booking Confirmed</h4>
        <p><strong>Salon:</strong> ${salonName}</p>
        <p><strong>Stylist:</strong> ${staffName}</p>
        <p><strong>Service:</strong> ${document.querySelector('[data-service-id]')?.closest('.card')?.querySelector('h4')?.textContent || ''}</p>
        <p><strong>Date & Time:</strong> ${apptDate} ${apptStart} - ${apptEnd}</p>
        <p><strong>Price:</strong> $${apptPrice}</p>
      `;
    }
    // reset booking UI and state after successful booking
    state.selectedSalonId = null;
    state.selectedServiceId = null;
    state.selectedServicePrice = 0;
    const bookingSectionEl = document.getElementById("bookingSection");
    if (bookingSectionEl) bookingSectionEl.classList.add("hidden");
    const staffSel = document.getElementById("modalStaffSelect");
    if (staffSel) staffSel.innerHTML = "<option value=''>Select stylist</option>";
    const bookingDateEl = document.getElementById("bookingDate");
    if (bookingDateEl) bookingDateEl.value = "";
    const slotSel = document.getElementById("slotSelect");
    if (slotSel) slotSel.innerHTML = "<option value=''>Select time slot</option>";
  } catch (error) {
    setMessage(bookingMessage, error.message, "error");
  }
}

// Booking history, appointment cancellation and dashboard functions removed
// from the root view to match the simplified UI (Discover + Auth + Modal booking).

function registerPageHandlers() {
  const registerBtn = document.getElementById("registerBtn");
  const loginBtn = document.getElementById("loginBtn");
  const searchBtn = document.getElementById("searchBtn");
  const searchType = document.getElementById("searchType");
  const bookBtn = document.getElementById("bookBtn");
  const staffSelect = document.getElementById("modalStaffSelect");
  const bookingDate = document.getElementById("bookingDate");
  const createStaffBtn = document.getElementById("createStaffBtn");
  const createAvailabilityBtn = document.getElementById("createAvailabilityBtn");

  if (registerBtn) registerBtn.addEventListener("click", registerUser);
  if (loginBtn) loginBtn.addEventListener("click", loginUser);
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    updateUserUI();
    setMessage(authMessage, "Logged out successfully.", "success");
  });
  if (searchBtn) searchBtn.addEventListener("click", searchSalons);
  if (searchType) searchType.addEventListener("change", () => loadSearchOptions(searchType.value));
  if (bookBtn) bookBtn.addEventListener("click", bookAppointment);
  // quick booking handlers
  const quickSalon = document.getElementById('quickSalonSelect');
  const quickService = document.getElementById('quickServiceSelect');
  const quickStaff = document.getElementById('quickStaffSelect');
  const quickDate = document.getElementById('quickBookingDate');
  const quickSlot = document.getElementById('quickSlotSelect');
  const quickBookBtn = document.getElementById('quickBookBtn');

  if (quickSalon) quickSalon.addEventListener('change', async (e) => {
    const salonId = e.target.value;
    if (!salonId) {
      quickService.innerHTML = "<option value=''>Select salon first</option>";
      quickStaff.innerHTML = "<option value=''>Select salon first</option>";
      return;
    }
    await loadServicesForSalonTo('quickServiceSelect', salonId);
    // load staff
    loadStaffForSalon(salonId, 'quickStaffSelect');
  });

  if (quickService) quickService.addEventListener('change', (e) => {
    const opt = quickService.options[quickService.selectedIndex];
    quickState.serviceId = opt?.value || null;
    quickState.serviceDuration = opt?.dataset?.duration || 60;
    quickState.servicePrice = opt?.dataset?.price || 0;
  });

  if (quickStaff && quickDate) {
    quickStaff.addEventListener('change', () => loadAvailableSlotsFor('quickStaffSelect','quickBookingDate','quickSlotSelect'));
    quickDate.addEventListener('change', () => loadAvailableSlotsFor('quickStaffSelect','quickBookingDate','quickSlotSelect'));
  }

  if (quickBookBtn) quickBookBtn.addEventListener('click', quickBookAppointment);
  if (staffSelect) staffSelect.addEventListener("change", loadAvailableSlots);
  if (bookingDate) bookingDate.addEventListener("change", loadAvailableSlots);

  // Salon owner utilities removed from root view (create staff / availability)
}

// modal close handler
document.addEventListener("click", (e) => {
  const modal = document.getElementById("salonModal");
  if (!modal) return;
  const closeBtn = document.getElementById("closeSalonModal");
  if (e.target === modal) {
    modal.style.display = "none";
    const bookingSection = document.getElementById("bookingSection");
    if (bookingSection) bookingSection.classList.add("hidden");
  }
  if (closeBtn && e.target === closeBtn) {
    modal.style.display = "none";
    const bookingSection = document.getElementById("bookingSection");
    if (bookingSection) bookingSection.classList.add("hidden");
  }
});

// show modal when salon details section is displayed
const origShow = showSalonDetails;
showSalonDetails = async function(salonId) {
  await origShow(salonId);
  const modal = document.getElementById("salonModal");
  if (modal) modal.style.display = "flex";
};

registerPageHandlers();
updateUserUI();
loadSearchOptions();
// Populate quick booking salon list
loadSalonsForBooking();
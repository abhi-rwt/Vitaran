/************************************************
 * Vitaran - FINAL PRO DASHBOARD (ULTRA FIXED PRO)
 * Senior Engineering Edition - Stable Build
 ************************************************/

let currentPlan = null;
let map;
let markers = [];
let routeLine;
let currentStep = "pickup";
let activeToast = null;

// 🔥 PERSISTENT STATE FOR PROFIT LOCKING
let highProfitCount = parseInt(localStorage.getItem("highProfitCount") || "0");
let isLocked = localStorage.getItem("isLocked") === "true";

/* ================= TOAST SYSTEM ================= */

function showToast(msg, type = "success") {
    if (activeToast) activeToast.remove();

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = msg;

    document.body.appendChild(toast);
    activeToast = toast;

    setTimeout(() => toast.classList.add("show"), 50);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.remove();
            activeToast = null;
        }, 300);
    }, 2500);
}

/* ================= REALISTIC KM LOGIC ================= */

function getSmartKM(plan) {
    plan = plan.toLowerCase();

    // Fix: Specific KM ranges based on industry standards
    if (plan.includes("food")) return (Math.random() * 2 + 1).toFixed(1);       // 1.0 - 3.0 KM
    if (plan.includes("grocery")) return (Math.random() * 2 + 1.5).toFixed(1);  // 1.5 - 3.5 KM
    if (plan.includes("e-commerce")) return (Math.random() * 5 + 3).toFixed(1); // 3.0 - 8.0 KM

    return (Math.random() * 4 + 2).toFixed(1);
}

/* ================= AUTH & INITIALIZATION ================= */

document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const res = await fetch("/api/auth/me", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token })
        });

        const data = await res.json();

        if (!data.success) {
            window.location.href = "login.html";
            return;
        }

        currentPlan = data.user?.plan || localStorage.getItem("plan") || "All-in-One";
        document.querySelector(".badge").innerText = currentPlan + " Active";

        const savedPhoto = localStorage.getItem("profilePhoto");
        if (savedPhoto) {
            document.getElementById("userPhoto").src = savedPhoto;
        }

        if (localStorage.getItem("isVerified") !== "true") {
            document.body.classList.add("modal-open");
            document.getElementById("verifyModal").style.display = "flex";
        } else {
            const profileCard = document.querySelector(".profile-card");
            if (profileCard) profileCard.remove();
        }

        initMap();
        initDashboard();
        initActionFlow();
        initVerificationUI();

    } catch (err) {
        console.error("Init Error:", err);
        showToast("Something went wrong", "error");
    }

});

/* ================= LEAFLET MAP (HOT TILES) ================= */

function initMap() {
    // Using OSM HOT tiles for a more professional 'delivery' look
    map = L.map('map', { zoomControl: false }).setView([28.6139, 77.2090], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OSM Team'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
}

/* ================= REVERSE GEOCODING ================= */

async function getAddress(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        // Extracting meaningful address parts (House/Street, Area, City)
        const parts = data.address;
        const main = parts.road || parts.suburb || parts.neighbourhood || "Street Location";
        const area = parts.city_district || parts.town || parts.city || "Area";
        return `${main}, ${area}`;
    } catch {
        return "Delhi, India";
    }
}

/* ================= PLATFORM & LOGOS ================= */

const PLATFORM_CONFIG = {
    Food: ["Swiggy", "Zomato"],
    Grocery: ["Blinkit", "Instamart", "Zepto"],
    "E-Commerce": ["Amazon", "Flipkart", "Meesho", "Myntra"],
    "All-in-One": ["Swiggy", "Zomato", "Blinkit", "Instamart", "Zepto", "Amazon", "Flipkart"]
};

function getLogo(name) {
    const map = {
        Swiggy: "swiggy.png", Zomato: "zomato.png",
        Blinkit: "blinkit.png", Instamart: "instamart.png", Zepto: "zepto.png",
        Amazon: "amazon.png", Flipkart: "flipkart.png", Meesho: "meesho.png", Myntra: "myntra.png"
    };
    return `/logos/${map[name] || "default.png"}`;
}

function getPlatformsFromPlan(plan) {
    if (plan.includes("Food")) return PLATFORM_CONFIG.Food;
    if (plan.includes("Grocery")) return PLATFORM_CONFIG.Grocery;
    if (plan.includes("E-Commerce")) return PLATFORM_CONFIG["E-Commerce"];
    return PLATFORM_CONFIG["All-in-One"];
}

/* ================= DASHBOARD (SORTING & LOCKING) ================= */

function initDashboard() {
    const tbody = document.querySelector(".table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const platforms = getPlatformsFromPlan(currentPlan);
    let orders = [];

    // Generate Mock Data
    for (let i = 0; i < 8; i++) {
        const km = getSmartKM(currentPlan);
        const name = platforms[Math.floor(Math.random() * platforms.length)];
        const profit = Math.floor(Math.random() * 90 + 10); // 10 to 100

        orders.push({
            platform: name,
            id: Math.floor(Math.random() * 9000),
            amount: Math.floor(Math.random() * 800 + 100),
            km,
            profit
        });
    }

    // 🎯 1. SORT BY PROFIT (Highest to Lowest)
    orders.sort((a, b) => b.profit - a.profit);

    orders.forEach((o, index) => {
        const tr = document.createElement("tr");
        const isHigh = o.profit >= 50;
        const isLow = o.profit < 20;

        // 🎯 2. UI HIGHLIGHTING
        if (index < 2) tr.classList.add("high-profit-row"); // Top 2 Highlight
        if (isHigh) tr.style.borderLeft = "4px solid #00c853";
        if (isLow) tr.style.opacity = "0.5";

        // 🎯 3. DYNAMIC LOCK LOGIC
        const locked = isLocked && isHigh;

        tr.innerHTML = `
        <td>
            <img src="${getLogo(o.platform)}" style="width:20px; vertical-align:middle;">
            ${o.platform}
        </td>
        <td>#VT${o.id}</td>
        <td><span class="tag">COD</span></td>
        <td>₹${o.amount}</td>
        <td>${o.km} KM</td>
        <td class="${isHigh ? 'green' : ''}">₹${o.profit}</td>
        <td>
            <button class="btn accept ${locked ? 'disabled' : ''}" 
                    ${locked ? 'disabled' : ''} 
                    style="min-width: 100px;">
                ${locked ? 'Do Low First' : 'Accept'}
            </button>
        </td>
        `;

        tr.querySelector("button").onclick = () => {
            if (!locked) acceptOrder(parseFloat(o.km), o.profit);
        };

        tbody.appendChild(tr);
    });
}

/* ================= ORDER ACCEPTANCE (OSRM ROUTING) ================= */

async function acceptOrder(orderKM, profit) {
    // 🎯 4. LOCK LOGIC: HIGH -> LOCK -> LOW -> UNLOCK
    if (profit >= 50) {
        highProfitCount = 1; // User has taken 1 high profit
        isLocked = true;
        localStorage.setItem("isLocked", "true");
        localStorage.setItem("highProfitCount", "1");
        showToast("High profit locked. Need 1 low order.", "error");
    } else if (profit < 20) {
        isLocked = false;
        highProfitCount = 0;
        localStorage.setItem("isLocked", "false");
        localStorage.setItem("highProfitCount", "0");
        showToast("High profit unlocked! ✅", "success");
    }

    document.getElementById("mapContainer").classList.add("map-full");
    document.getElementById("ordersCard")?.classList.add("fade");

    setTimeout(() => {
        document.getElementById("actionBar").style.display = "flex";
        map.invalidateSize();
    }, 500);

    markers.forEach(m => map.removeLayer(m));
    markers = [];
    if (routeLine) map.removeLayer(routeLine);

    navigator.geolocation.getCurrentPosition(async pos => {
        const user = [pos.coords.latitude, pos.coords.longitude];
        const angle = Math.random() * Math.PI * 2;
        const dist = orderKM / 111;

        const pickup = [user[0] + Math.cos(angle) * (dist / 3), user[1] + Math.sin(angle) * (dist / 3)];
        const drop = [pickup[0] + Math.cos(angle) * (dist), pickup[1] + Math.sin(angle) * (dist)];

        // 🎯 5. REVERSE GEOCODE FOR UI
        const pickupName = await getAddress(pickup[0], pickup[1]);
        const dropName = await getAddress(drop[0], drop[1]);

        document.getElementById("pickupText").innerText = pickupName;
        document.getElementById("dropText").innerText = dropName;

        markers.push(L.marker(user).addTo(map).bindPopup("Your Location"));
        markers.push(L.marker(pickup).addTo(map).bindPopup("<b>Pickup:</b> " + pickupName));
        markers.push(L.marker(drop).addTo(map).bindPopup("<b>Drop:</b> " + dropName));

        // 🎯 6. OSRM ROAD ROUTING
        try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${user[1]},${user[0]};${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`;
            const res = await fetch(osrmUrl);
            const data = await res.json();

            if (!data.routes || data.routes.length === 0) throw "OSRM Fail";

            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            routeLine = L.polyline(coords, { color: "#0a58ff", weight: 6, opacity: 0.8 }).addTo(map);

        } catch (err) {
            // Fallback to straight line if OSRM is down
            routeLine = L.polyline([user, pickup, drop], { color: "red", dashArray: '10, 10' }).addTo(map);
        }

        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    }, () => {
        showToast("Please allow location access", "error");
    });
}

/* ================= ACTION FLOW ================= */

function initActionFlow() {
    document.getElementById("pickupBtn").onclick = () => {
        currentStep = "pickup";
        openCamera();
    };

    document.getElementById("dropBtn").onclick = () => {
        currentStep = "drop";
        openCamera();
    };

    document.getElementById("payBtn").onclick = () => {
        showToast("Payment Received Successfully 💰");
        setTimeout(() => location.reload(), 1500);
    };
}

/* ================= PROFESSIONAL CAMERA UI ================= */

function openCamera() {
    const modal = document.getElementById("photoModal");
    const videoContainer = document.getElementById("videoContainer");
    const captureBtn = document.getElementById("captureActionBtn");

    if (!modal) return;

    modal.style.display = "flex";
    videoContainer.innerHTML = ""; // Clear old video

    const constraints = {
        video: { facingMode: "environment" } // Prioritize back camera
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            const video = document.createElement("video");
            video.srcObject = stream;
            video.setAttribute("playsinline", true); // Fix for iOS
            video.style.width = "100%";
            video.style.height = "100%";
            video.style.objectFit = "cover";
            video.play();

            videoContainer.appendChild(video);

            captureBtn.onclick = () => {
                stream.getTracks().forEach(track => track.stop());
                modal.style.display = "none";

                if (currentStep === "pickup") {
                    showToast("Order Picked Up! ✅");
                    document.getElementById("pickupBtn").style.display = "none";
                    document.getElementById("dropBtn").style.display = "inline-block";
                } else {
                    showToast("Order Delivered! ✅");
                    document.getElementById("dropBtn").style.display = "none";
                    document.getElementById("payBtn").style.display = "inline-block";
                }
            };
        })
        .catch(err => {
            console.error(err);
            showToast("Camera access denied or unavailable", "error");
            modal.style.display = "none";
        });
}

/* ================= VERIFICATION SYSTEM ================= */

function initVerificationUI() {
    const photoInput = document.getElementById("profilePhoto");
    const preview = document.getElementById("preview");
    const idInput = document.getElementById("idNumber");

    photoInput?.addEventListener("change", () => {
        const file = photoInput.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast("Image must be under 2MB", "error");
                photoInput.value = "";
                return;
            }
            preview.src = URL.createObjectURL(file);
            preview.style.display = "block";
        }
    });

    idInput?.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 12);
    });
}

function verifyUser() {
    const file = document.getElementById("profilePhoto").files[0];
    const id = document.getElementById("idNumber").value;

    if (!file) {
        showToast("Please upload a profile photo", "error");
        return;
    }
    if (id.length !== 12) {
        showToast("ID must be 12 digits", "error");
        return;
    }

    localStorage.setItem("isVerified", "true");

    const reader = new FileReader();
    reader.onload = function (e) {
        localStorage.setItem("profilePhoto", e.target.result);
        showToast("Profile Verified! ✅");
        setTimeout(() => location.reload(), 1200);
    };
    reader.readAsDataURL(file);
}

function openVerify() {
    document.body.classList.add("modal-open");
    const modal = document.getElementById("verifyModal");
    if (modal) modal.style.display = "flex";
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}
/************************************************
 * Vitaran - FINAL PRO DASHBOARD (ULTRA FIXED PRO)
 ************************************************/

let currentPlan = null;
let map;
let markers = [];
let routeLine;
let currentStep = "pickup";
let activeToast = null;

// 🔥 Stats & Lock State (Persisted)
// Ensure we parse properly or set defaults
let stats = JSON.parse(localStorage.getItem("vitaranStats") || '{"total":0, "active":0, "completed":0, "earnings":0}');
let highProfitCount = parseInt(localStorage.getItem("highProfitCount") || "0");
let isLocked = localStorage.getItem("isLocked") === "true";

/* ================= STATS UI UPDATER ================= */

function updateStatsUI() {
    // 1. Save to Storage first
    localStorage.setItem("vitaranStats", JSON.stringify(stats));
    localStorage.setItem("isLocked", isLocked);

    // 2. Dashboard ke top cards ko update karein (Direct DOM manipulation for instant change)
    const cards = document.querySelectorAll(".card h2");
    if (cards.length >= 3) {
        cards[0].innerText = stats.total;     // Total Orders
        cards[1].innerText = stats.active;    // Active
        cards[2].innerText = stats.completed; // Completed
    }
    
    // Earnings specifically Blue text waale h2 mein hoti hai
    const earningsEl = document.querySelector(".card h2[style*='color: #0a58ff']") || document.querySelector(".card h2.earnings-text");
    if (earningsEl) {
        earningsEl.innerText = `₹${stats.earnings}`;
    }
}

/* ================= TOAST SYSTEM ================= */

function showToast(msg, type = "success") {
    if (activeToast) activeToast.remove();

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 12px 24px; 
        background: ${type === 'success' ? '#2ecc71' : (type === 'warning' ? '#f39c12' : '#e74c3c')}; 
        color: white; border-radius: 8px; z-index: 9999; transition: 0.3s; transform: translateY(-20px); opacity: 0;
    `;
    toast.innerText = msg;

    document.body.appendChild(toast);
    activeToast = toast;

    setTimeout(() => {
        toast.style.transform = "translateY(0)";
        toast.style.opacity = "1";
    }, 50);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => {
            toast.remove();
            activeToast = null;
        }, 300);
    }, 2500);
}

/* ================= DISTANCE LOGIC FIX ================= */

function getSmartKM(plan) {
    const p = plan.toLowerCase();
    if (p.includes("food")) return (Math.random() * 2 + 1).toFixed(1);
    if (p.includes("grocery")) return (Math.random() * 2 + 1.5).toFixed(1);
    if (p.includes("e-commerce")) return (Math.random() * 5 + 3).toFixed(1);
    return (Math.random() * 4 + 2).toFixed(1);
}

/* ================= INITIALIZATION ================= */

document.addEventListener("DOMContentLoaded", async () => {
    updateStatsUI(); // Load saved stats immediately
    
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
        const badge = document.querySelector(".badge");
        if(badge) badge.innerText = currentPlan + " Active";

        const savedPhoto = localStorage.getItem("profilePhoto");
        if (savedPhoto) {
            const up = document.getElementById("userPhoto");
            if(up) up.src = savedPhoto;
        }

        if (localStorage.getItem("isVerified") !== "true") {
            document.body.classList.add("modal-open");
            const vm = document.getElementById("verifyModal");
            if(vm) vm.style.display = "flex";
        } else {
            const pc = document.querySelector(".profile-card");
            if(pc) pc.remove();
        }

        initMap();
        initDashboard();
        initActionFlow();
        initVerificationUI();

    } catch (err) {
        console.error(err);
        showToast("Session error", "error");
    }
});

/* ================= MAP & ROUTING ================= */

function initMap() {
    map = L.map('map', { zoomControl: false }).setView([28.6139, 77.2090], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
}

async function getAddress(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        const addr = data.address;
        return addr.road || addr.suburb || addr.city || "Point Location";
    } catch {
        return "Unknown Location";
    }
}

/* ================= DASHBOARD & LOCK SYSTEM ================= */

const PLATFORM_CONFIG = {
    Food: ["Swiggy", "Zomato"],
    Grocery: ["Blinkit", "Instamart", "Zepto"],
    "E-Commerce": ["Amazon", "Flipkart", "Meesho", "Myntra"],
    "All-in-One": ["Swiggy", "Zomato", "Blinkit", "Instamart", "Zepto", "Amazon", "Flipkart"]
};

function getLogo(name) {
    return `/logos/${name.toLowerCase()}.png`;
}

function getPlatformsFromPlan(plan) {
    if (plan.includes("Food")) return PLATFORM_CONFIG.Food;
    if (plan.includes("Grocery")) return PLATFORM_CONFIG.Grocery;
    if (plan.includes("E-Commerce")) return PLATFORM_CONFIG["E-Commerce"];
    return PLATFORM_CONFIG["All-in-One"];
}

function initDashboard() {
    const tbody = document.querySelector(".table tbody");
    if(!tbody) return;
    tbody.innerHTML = "";

    const platforms = getPlatformsFromPlan(currentPlan);
    let orders = [];

    for (let i = 0; i < 10; i++) {
        const plat = platforms[Math.floor(Math.random() * platforms.length)];
        const km = getSmartKM(plat);
        orders.push({
            platform: plat,
            id: Math.floor(Math.random() * 9000 + 1000),
            amount: Math.floor(Math.random() * 800 + 100),
            km,
            profit: Math.floor(Math.random() * 90 + 5)
        });
    }

    // Profit high to low sort
    orders.sort((a, b) => b.profit - a.profit);

    orders.forEach((o, index) => {
        const tr = document.createElement("tr");
        const isHigh = o.profit >= 50;
        const isLow = o.profit < 20;

        // 🔥 LOCK LOGIC FIX: Check against current persistence
        const locked = (isLocked && isHigh);

        if (index < 2) tr.style.borderLeft = "5px solid #ff9f43"; 
        if (isHigh) tr.style.background = "rgba(46, 204, 113, 0.1)"; 
        if (isLow) tr.style.opacity = "0.7"; 

        tr.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${getLogo(o.platform)}" style="width:24px; border-radius:4px;">
                    <b>${o.platform}</b>
                </div>
            </td>
            <td>#VT${o.id}</td>
            <td><span class="tag" style="background:#eee; padding:2px 8px; border-radius:4px; font-size:10px;">COD</span></td>
            <td>₹${o.amount}</td>
            <td>${o.km} KM</td>
            <td style="color:${isHigh ? '#27ae60' : '#333'}; font-weight:bold;">₹${o.profit}</td>
            <td>
                <button class="btn ${locked ? 'secondary' : 'primary'}" 
                    style="padding: 6px 12px; border-radius:6px; cursor:${locked ? 'not-allowed' : 'pointer'};"
                    ${locked ? 'disabled' : ''}>
                    ${locked ? 'Locked' : 'Accept'}
                </button>
            </td>
        `;

        tr.querySelector("button").onclick = () => acceptOrder(o);
        tbody.appendChild(tr);
    });
}

/* ================= ORDER FLOW & STATS ================= */

async function acceptOrder(order) {
    // 🔥 STATS UPDATE: Increment Active & Total immediately
    stats.total += 1;
    stats.active = 1;
    updateStatsUI();

    // Lock Logic trigger: If taking a high profit, lock others
    if (order.profit >= 50) {
        isLocked = true;
        localStorage.setItem("isLocked", "true");
        showToast("High Profit Locked! Deliver a low order to unlock.", "warning");
    }
    
    localStorage.setItem("currentOrderProfit", order.profit);

    const mc = document.getElementById("mapContainer");
    if(mc) mc.classList.add("map-full");
    const oc = document.getElementById("ordersCard");
    if(oc) oc.style.display = "none";
    
    const ab = document.getElementById("actionBar");
    if(ab) ab.style.display = "flex";
    
    map.invalidateSize();

    markers.forEach(m => map.removeLayer(m));
    if (routeLine) map.removeLayer(routeLine);
    markers = [];

    navigator.geolocation.getCurrentPosition(async pos => {
        const userLoc = [pos.coords.latitude, pos.coords.longitude];
        const offset = (order.km / 111) * 0.7;
        const pickupLoc = [userLoc[0] + offset * 0.5, userLoc[1] + offset * 0.3];
        const dropLoc = [pickupLoc[0] + offset, pickupLoc[1] + offset];

        const pAddr = await getAddress(pickupLoc[0], pickupLoc[1]);
        const dAddr = await getAddress(dropLoc[0], dropLoc[1]);

        document.getElementById("pickupText").innerText = pAddr;
        document.getElementById("dropText").innerText = dAddr;

        const userIcon = L.divIcon({className: 'user-marker', html: '📍', iconSize: [20, 20]});
        markers.push(L.marker(userLoc, {icon: userIcon}).addTo(map).bindPopup("You"));
        markers.push(L.marker(pickupLoc).addTo(map).bindPopup(`<b>Pickup:</b><br>${pAddr}`));
        markers.push(L.marker(dropLoc).addTo(map).bindPopup(`<b>Drop:</b><br>${dAddr}`));

        try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLoc[1]},${userLoc[0]};${pickupLoc[1]},${pickupLoc[0]};${dropLoc[1]},${dropLoc[0]}?overview=full&geometries=geojson`;
            const routeRes = await fetch(osrmUrl);
            const routeData = await routeRes.json();
            if (routeData.routes && routeData.routes.length > 0) {
                const coords = routeData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                routeLine = L.polyline(coords, { color: '#0a58ff', weight: 5 }).addTo(map);
                map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
            }
        } catch (e) {
            routeLine = L.polyline([userLoc, pickupLoc, dropLoc], { color: '#e74c3c' }).addTo(map);
            map.fitBounds(routeLine.getBounds());
        }
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
        const finishedProfit = parseInt(localStorage.getItem("currentOrderProfit") || "0");

        // 🔥 UNLOCK LOGIC: Unlock only if the delivered order was Low Profit (<20)
        if (finishedProfit < 20) {
            isLocked = false;
            localStorage.setItem("isLocked", "false");
            showToast("High Profits Unlocked! ✅");
        }

        // 🔥 FINAL STATS UPDATE
        stats.active = 0;
        stats.completed += 1;
        stats.earnings += finishedProfit;
        updateStatsUI();

        showToast("Earnings added to wallet 💰");
        setTimeout(() => location.reload(), 1500);
    };
}

/* ================= CAMERA SYSTEM ================= */

function openCamera() {
    const modal = document.createElement("div");
    modal.style.cssText = `
        position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9);
        display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:10000;
    `;

    modal.innerHTML = `
        <div style="width:90%; max-width:400px; background:#fff; border-radius:15px; overflow:hidden;">
            <video id="camPreview" autoplay playsinline style="width:100%; height:300px; object-fit:cover; background:#000;"></video>
            <div style="padding:20px; text-align:center;">
                <h3 style="margin-bottom:10px;">Verify ${currentStep === 'pickup' ? 'Pickup' : 'Delivery'}</h3>
                <button id="captureBtn" class="btn primary" style="width:100%; padding:12px;">CAPTURE PHOTO</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    let streamObj = null;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            streamObj = stream;
            document.getElementById("camPreview").srcObject = stream;
        })
        .catch(() => {
            showToast("Camera error", "error");
            modal.remove();
        });

    document.getElementById("captureBtn").onclick = () => {
        if (streamObj) streamObj.getTracks().forEach(t => t.stop());
        modal.remove();

        if (currentStep === "pickup") {
            showToast("Package Picked Up ✅");
            document.getElementById("pickupBtn").style.display = "none";
            document.getElementById("dropBtn").style.display = "inline-block";
        } else {
            showToast("Package Delivered ✅");
            document.getElementById("dropBtn").style.display = "none";
            document.getElementById("payBtn").style.display = "inline-block";
        }
    };
}

/* ================= VERIFICATION UI ================= */

function initVerificationUI() {
    const photoInput = document.getElementById("profilePhoto");
    const preview = document.getElementById("preview");
    const idInput = document.getElementById("idNumber");

    photoInput?.addEventListener("change", () => {
        const file = photoInput.files[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = "block";
        }
    });

    idInput?.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 12);
    });
}

function verifyUser() {
    const file = document.getElementById("profilePhoto")?.files[0];
    const id = document.getElementById("idNumber")?.value;
    if (!file || id?.length !== 12) {
        showToast("Fill all details", "error");
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        localStorage.setItem("profilePhoto", e.target.result);
        localStorage.setItem("isVerified", "true");
        showToast("Verified!");
        setTimeout(() => location.reload(), 1000);
    };
    reader.readAsDataURL(file);
}

function openVerify() {
    const vm = document.getElementById("verifyModal");
    if(vm) {
        document.body.classList.add("modal-open");
        vm.style.display = "flex";
    }
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}
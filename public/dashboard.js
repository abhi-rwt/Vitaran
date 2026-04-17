/************************************************
 * Vitaran - FINAL PRO DASHBOARD (ULTRA FIXED PRO)
 ************************************************/

let currentPlan = null;
let map;
let markers = [];
let routeLine;
let currentStep = "pickup";
let activeToast = null;

// Logic State (Persisted)
let highProfitCount = parseInt(localStorage.getItem("highProfitCount") || "0");
let isLocked = localStorage.getItem("isLocked") === "true";

/* ================= TOAST SYSTEM ================= */

function showToast(msg, type = "success") {
    if (activeToast) activeToast.remove();

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 12px 24px; 
        background: ${type === 'success' ? '#2ecc71' : '#e74c3c'}; 
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
    // Requirements: Food (1-3), Grocery (1.5-3.5), E-Comm (3-8)
    if (p.includes("food")) return (Math.random() * 2 + 1).toFixed(1);
    if (p.includes("grocery")) return (Math.random() * 2 + 1.5).toFixed(1);
    if (p.includes("e-commerce")) return (Math.random() * 5 + 3).toFixed(1);

    return (Math.random() * 4 + 2).toFixed(1);
}

/* ================= INITIALIZATION ================= */

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
            document.querySelector(".profile-card")?.remove();
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

/* ================= MAP & ROUTING (FIXED) ================= */

function initMap() {
    // Using OSM HOT layer for a more modern "delivery" feel
    map = L.map('map', { zoomControl: false }).setView([28.6139, 77.2090], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
}

async function getAddress(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        // Return a cleaner short address
        const addr = data.address;
        return addr.road || addr.suburb || addr.city || "Point Location";
    } catch {
        return "Unknown Location";
    }
}

/* ================= DASHBOARD & SORTING (FIXED) ================= */

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

    // 🔥 SORT BY HIGHEST PROFIT
    orders.sort((a, b) => b.profit - a.profit);

    orders.forEach((o, index) => {
        const tr = document.createElement("tr");
        const isHigh = o.profit >= 50;
        const isLow = o.profit < 20;

        // Visual Styling
        if (index < 2) tr.style.borderLeft = "5px solid #ff9f43"; // Highlight Top 2
        if (isHigh) tr.style.background = "rgba(46, 204, 113, 0.1)"; // Premium Green
        if (isLow) tr.style.opacity = "0.5"; // Faded

        // Lock Logic: High orders locked if isLocked is true
        const locked = isLocked && isHigh;

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
                    ${locked ? 'Do Low First' : 'Accept'}
                </button>
            </td>
        `;

        tr.querySelector("button").onclick = () => acceptOrder(o);
        tbody.appendChild(tr);
    });
}

/* ================= ORDER FLOW & OSRM ROUTE ================= */

async function acceptOrder(order) {
    // 🔥 PROFIT LOCK LOGIC
    if (order.profit >= 50) {
        highProfitCount = 1; // User took their one allowed high profit
        isLocked = true;
        localStorage.setItem("isLocked", "true");
        localStorage.setItem("highProfitCount", "1");
        showToast("High Profit Locked. Take a low order next!", "warning");
    } else if (order.profit < 20) {
        isLocked = false;
        highProfitCount = 0;
        localStorage.setItem("isLocked", "false");
        localStorage.setItem("highProfitCount", "0");
        showToast("High Profit Unlocked! ✅");
    }

    // UI Transitions
    document.getElementById("mapContainer").classList.add("map-full");
    const oc = document.getElementById("ordersCard");
    if(oc) oc.style.display = "none";
    
    document.getElementById("actionBar").style.display = "flex";
    map.invalidateSize();

    // Clean Map
    markers.forEach(m => map.removeLayer(m));
    if (routeLine) map.removeLayer(routeLine);
    markers = [];

    navigator.geolocation.getCurrentPosition(async pos => {
        const userLoc = [pos.coords.latitude, pos.coords.longitude];
        
        // Simulating realistic offsets for pickup/drop based on KM
        const offset = (order.km / 111) * 0.7;
        const pickupLoc = [userLoc[0] + offset * 0.5, userLoc[1] + offset * 0.3];
        const dropLoc = [pickupLoc[0] + offset, pickupLoc[1] + offset];

        // Fetch Real Addresses
        const pAddr = await getAddress(pickupLoc[0], pickupLoc[1]);
        const dAddr = await getAddress(dropLoc[0], dropLoc[1]);

        document.getElementById("pickupText").innerText = pAddr;
        document.getElementById("dropText").innerText = dAddr;

        // Custom Markers
        const userIcon = L.divIcon({className: 'user-marker', html: '📍', iconSize: [20, 20]});
        markers.push(L.marker(userLoc, {icon: userIcon}).addTo(map).bindPopup("Your Location"));
        markers.push(L.marker(pickupLoc).addTo(map).bindPopup(`<b>Pickup:</b><br>${pAddr}`));
        markers.push(L.marker(dropLoc).addTo(map).bindPopup(`<b>Drop:</b><br>${dAddr}`));

        // 🔥 OSRM ROAD ROUTING
        try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLoc[1]},${userLoc[0]};${pickupLoc[1]},${pickupLoc[0]};${dropLoc[1]},${dropLoc[0]}?overview=full&geometries=geojson`;
            const routeRes = await fetch(osrmUrl);
            const routeData = await routeRes.json();

            if (routeData.routes && routeData.routes.length > 0) {
                const coordinates = routeData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                routeLine = L.polyline(coordinates, { color: '#0a58ff', weight: 5, opacity: 0.8 }).addTo(map);
                map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
            }
        } catch (e) {
            // Fallback to straight line
            routeLine = L.polyline([userLoc, pickupLoc, dropLoc], { color: '#e74c3c', dashArray: '5, 10' }).addTo(map);
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
        showToast("Earnings added to wallet 💰");
        setTimeout(() => location.reload(), 1500);
    };
}

/* ================= CAMERA SYSTEM (FIXED) ================= */

function openCamera() {
    const modal = document.createElement("div");
    modal.style.cssText = `
        position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9);
        display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:10000;
    `;

    modal.innerHTML = `
        <div style="width:90%; max-width:400px; background:#fff; border-radius:15px; overflow:hidden; position:relative;">
            <video id="camPreview" autoplay playsinline style="width:100%; height:300px; object-fit:cover; background:#000;"></video>
            <div style="padding:20px; text-align:center;">
                <h3 style="margin-bottom:10px;">Verify ${currentStep === 'pickup' ? 'Pickup' : 'Delivery'}</h3>
                <button id="captureBtn" class="btn primary" style="width:100%; padding:12px; font-weight:bold;">CAPTURE PHOTO</button>
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
        .catch(err => {
            showToast("Camera access denied", "error");
            modal.remove();
        });

    document.getElementById("captureBtn").onclick = () => {
        if (streamObj) streamObj.getTracks().forEach(track => track.stop());
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
            if (file.size > 2 * 1024 * 1024) {
                showToast("Image too large (Max 2MB)", "error");
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
    const file = document.getElementById("profilePhoto")?.files[0];
    const id = document.getElementById("idNumber")?.value;

    if (!file || id?.length !== 12) {
        showToast("Complete all fields correctly", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        localStorage.setItem("profilePhoto", e.target.result);
        localStorage.setItem("isVerified", "true");
        showToast("Account Verified! Welcome.");
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
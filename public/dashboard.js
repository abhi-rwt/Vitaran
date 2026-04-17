/************************************************
 * Vitaran - FINAL PRO DASHBOARD (ULTRA FIXED)
 * Full Features: Smart Priority, OSRM Routes, Dual Camera
 ************************************************/

let currentPlan = null;
let map;
let markers = [];
let routeLine;
let currentStep = "pickup";
let activeToast = null;

// 🔥 Locking System State (Persistence)
let highProfitCount = parseInt(localStorage.getItem("highProfitCount") || "0");
let isLocked = localStorage.getItem("isLocked") === "true";

/* ================= TOAST ================= */

function showToast(msg, type="success"){
    if(activeToast){
        activeToast.remove();
    }
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    activeToast = toast;

    setTimeout(()=>toast.classList.add("show"),50);
    setTimeout(()=>{
        toast.classList.remove("show");
        setTimeout(()=>{
            toast.remove();
            activeToast = null;
        },300);
    },2500);
}

/* ================= KM FIX ================= */

function getSmartKM(plan){
    plan = plan.toLowerCase();
    if(plan.includes("food")) return (Math.random()*2 + 1).toFixed(1);
    if(plan.includes("grocery")) return (Math.random()*2 + 1.5).toFixed(1);
    if(plan.includes("e-commerce")) return (Math.random()*7 + 3).toFixed(1);
    return (Math.random()*4 + 2).toFixed(1);
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token){
        window.location.href="login.html";
        return;
    }

    try {
        const res = await fetch("/api/auth/me",{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ token })
        });
        const data = await res.json();

        if (!data.success){
            window.location.href="login.html";
            return;
        }

        currentPlan = data.user?.plan || localStorage.getItem("plan") || "All-in-One";
        document.querySelector(".badge").innerText = currentPlan + " Active";

        const savedPhoto = localStorage.getItem("profilePhoto");
        if(savedPhoto){
            document.getElementById("userPhoto").src = savedPhoto;
        }

        if(localStorage.getItem("isVerified") !== "true"){
            document.body.classList.add("modal-open");
            document.getElementById("verifyModal").style.display="flex";
        }else{
            document.querySelector(".profile-card")?.remove();
        }

        initMap();
        initDashboard();
        initActionFlow();
        initVerificationUI();

    } catch(err) {
        console.log(err);
        showToast("Something went wrong","error");
    }
});

/* ================= MAP ================= */

function initMap(){
    map = L.map('map').setView([28.6139,77.2090], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution:'© OpenStreetMap'
    }).addTo(map);
}

/* ================= ADDRESS ================= */

async function getAddress(lat, lng){
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        return data.display_name?.split(",").slice(0,3).join(",") || "Location";
    } catch {
        return "Location";
    }
}

/* ================= PLATFORM CONFIG ================= */

const PLATFORM_CONFIG = {
    Food: ["Swiggy","Zomato"],
    Grocery: ["Blinkit","Instamart","Zepto"],
    "E-Commerce": ["Amazon","Flipkart","Meesho","Myntra"],
    "All-in-One": ["Swiggy","Zomato","Blinkit","Instamart","Zepto","Amazon","Flipkart"]
};

/* ================= LOGO ================= */

function getLogo(name){
    const logoMap = {
        Swiggy:"swiggy.png",
        Zomato:"zomato.png",
        Blinkit:"blinkit.png",
        Instamart:"instamart.png",
        Zepto:"zepto.png",
        Amazon:"amazon.png",
        Flipkart:"flipkart.png",
        Meesho:"meesho.png",
        Myntra:"myntra.png"
    };
    return `/logos/${logoMap[name] || "default.png"}`;
}

/* ================= PLAN PARSER ================= */

function getPlatformsFromPlan(plan){
    if(plan.includes("Food")) return PLATFORM_CONFIG["Food"];
    if(plan.includes("Grocery")) return PLATFORM_CONFIG["Grocery"];
    if(plan.includes("E-Commerce")) return PLATFORM_CONFIG["E-Commerce"];
    return PLATFORM_CONFIG["All-in-One"];
}

/* ================= DASHBOARD (SORTING & LOCKING) ================= */

function initDashboard(){
    const tbody=document.querySelector(".table tbody");
    tbody.innerHTML="";

    const platforms = getPlatformsFromPlan(currentPlan);
    let orders = [];

    // Order generate karein
    for(let i=0; i<8; i++){
        const km = getSmartKM(currentPlan);
        const name = platforms[Math.floor(Math.random()*platforms.length)];
        const profit = Math.floor(Math.random()*90 + 5); // ₹5 to ₹95
        orders.push({
            platform: name,
            orderId: "VT" + Math.floor(Math.random()*9000),
            amount: Math.floor(Math.random()*800 + 100),
            km: km,
            profit: profit
        });
    }

    // 🔥 1. SORT BY PROFIT (Highest First)
    orders.sort((a,b) => b.profit - a.profit);

    orders.forEach((o, index) => {
        const tr = document.createElement("tr");
        const isHighProfit = o.profit >= 50;
        const isLowProfit = o.profit < 20;

        // 🔥 2. UI HIGHLIGHTING
        if(index < 2) tr.style.borderLeft = "6px solid #00c853"; // Top 2 Highlight
        if(isHighProfit) tr.classList.add("priority"); // Greenish background
        if(isLowProfit) tr.style.opacity = "0.7"; // Faded for low profit

        // 🔥 3. LOCKING SYSTEM UI
        const isOrderLocked = isLocked && isHighProfit;
        const btnText = isOrderLocked ? "Locked" : "Accept";
        const btnClass = isOrderLocked ? "btn disabled" : "btn accept";
        const btnState = isOrderLocked ? "disabled" : "";

        tr.innerHTML=`
            <td>
                <img src="${getLogo(o.platform)}" style="width:20px;margin-right:6px;">
                ${o.platform}
            </td>
            <td>#${o.orderId}</td>
            <td><span class="tag">COD</span></td>
            <td>₹${o.amount}</td>
            <td>${o.km} KM</td>
            <td class="${isHighProfit ? 'green' : ''}">₹${o.profit}</td>
            <td><button class="${btnClass}" ${btnState}>${btnText}</button></td>
        `;

        tr.querySelector("button").onclick = ()=>acceptOrder(parseFloat(o.km), o.profit);
        tbody.appendChild(tr);
    });
}

/* ================= ACCEPT ORDER (OSRM ROUTE) ================= */

async function acceptOrder(orderKM, profit){
    // 🔥 4. LOCKING LOGIC MATH
    if(profit >= 50){
        highProfitCount++;
        if(highProfitCount >= 2){
            isLocked = true;
            localStorage.setItem("isLocked", "true");
            showToast("High Profit Locked! Complete a low order.", "error");
        }
    } else if(profit < 20){
        // Unlock after completing 1 low profit order
        isLocked = false;
        highProfitCount = 0;
        localStorage.setItem("isLocked", "false");
        showToast("High Profit Orders Unlocked! ✅");
    }
    localStorage.setItem("highProfitCount", highProfitCount);

    document.getElementById("mapContainer").classList.add("map-full");
    document.getElementById("ordersCard")?.classList.add("fade");

    setTimeout(()=>{
        document.getElementById("actionBar").style.display="flex";
        map.invalidateSize();
    },600);

    markers.forEach(m=>map.removeLayer(m));
    markers=[];
    if(routeLine) map.removeLayer(routeLine);

    navigator.geolocation.getCurrentPosition(async pos=>{
        const user = [pos.coords.latitude, pos.coords.longitude];
        const angle = Math.random()*Math.PI*2;
        const dist = orderKM/111;

        const pickup = [user[0] + Math.cos(angle)*(dist/3), user[1] + Math.sin(angle)*(dist/3)];
        const drop = [pickup[0] + Math.cos(angle)*(dist), pickup[1] + Math.sin(angle)*(dist)];

        const pickupName = await getAddress(pickup[0], pickup[1]);
        const dropName = await getAddress(drop[0], drop[1]);

        markers.push(L.marker(user).addTo(map).bindPopup("You"));
        markers.push(L.marker(pickup).addTo(map).bindPopup("Pickup: "+pickupName));
        markers.push(L.marker(drop).addTo(map).bindPopup("Drop: "+dropName));

        // 🔥 5. OSRM REAL ROAD NAVIGATION
        try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${user[1]},${user[0]};${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`;
            const res = await fetch(osrmUrl);
            const data = await res.json();
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            
            routeLine = L.polyline(coords, {color:"#0a58ff", weight:6}).addTo(map);
        } catch(e) {
            // Fallback to straight line
            routeLine = L.polyline([user,pickup,drop],{color:"#0a58ff", weight:5}).addTo(map);
        }

        map.fitBounds(routeLine.getBounds(), {padding: [50,50]});
    },()=>{
        showToast("Please allow location","error");
    });
}

/* ================= ACTION FLOW ================= */

function initActionFlow(){
    document.getElementById("pickupBtn").onclick = ()=>{
        currentStep="pickup";
        openCamera();
    };
    document.getElementById("dropBtn").onclick = ()=>{
        currentStep="drop";
        openCamera();
    };
    document.getElementById("payBtn").onclick = ()=>{
        showToast("Payment Received 💰");
        setTimeout(()=>location.reload(),1200);
    };
}

/* ================= CAMERA (ALL DEVICE & BACK CAM FIX) ================= */

function openCamera(){
    // 🔥 6. MOBILE BACK CAMERA PRIORITY
    const constraints = { 
        video: { facingMode: "environment" } 
    };

    navigator.mediaDevices?.getUserMedia(constraints)
    .then(stream=>{
        const video = document.createElement("video");
        video.srcObject = stream;
        video.setAttribute("playsinline", true);
        video.play();

        const modal = document.createElement("div");
        modal.className = "modal";
        modal.style.display = "flex";

        modal.innerHTML = `
            <div class="modal-box">
                <div id="camPreview" style="width:100%; height:250px; background:#000; border-radius:12px; overflow:hidden;"></div>
                <h3 style="margin-top:10px;">Capture Photo</h3>
                <button class="btn primary" style="width:100%; margin-top:10px;">Capture Now</button>
            </div>
        `;

        modal.querySelector("#camPreview").prepend(video);
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.objectFit = "cover";
        
        document.body.appendChild(modal);

        modal.querySelector("button").onclick = ()=>{
            stream.getTracks().forEach(track=>track.stop());
            modal.remove();

            if(currentStep==="pickup"){
                showToast("Pickup Completed ✅");
                document.getElementById("pickupBtn").style.display="none";
                document.getElementById("dropBtn").style.display="inline-block";
            }else{
                showToast("Delivery Completed ✅");
                document.getElementById("dropBtn").style.display="none";
                document.getElementById("payBtn").style.display="inline-block";
            }
        };
    })
    .catch(()=>{
        // FALLBACK FOR DESKTOP/FAIL
        const input = document.createElement("input");
        input.type="file";
        input.accept="image/*";
        input.capture="environment";
        input.click();

        input.onchange=()=>{
            if(!input.files.length){
                showToast("No photo","error");
                return;
            }
            if(currentStep==="pickup"){
                showToast("Pickup Completed ✅");
                document.getElementById("pickupBtn").style.display="none";
                document.getElementById("dropBtn").style.display="inline-block";
            }else{
                showToast("Delivery Completed ✅");
                document.getElementById("dropBtn").style.display="none";
                document.getElementById("payBtn").style.display="inline-block";
            }
        };
    });
}

/* ================= VERIFY ================= */

function initVerificationUI(){
    const photoInput = document.getElementById("profilePhoto");
    const preview = document.getElementById("preview");
    const idInput = document.getElementById("idNumber");

    photoInput?.addEventListener("change",()=>{
        const file = photoInput.files[0];
        if(file){
            if(file.size > 2 * 1024 * 1024){
                showToast("Image must be under 2MB","error");
                photoInput.value="";
                return;
            }
            preview.src = URL.createObjectURL(file);
            preview.style.display="block";
        }
    });

    idInput?.addEventListener("input",(e)=>{
        e.target.value = e.target.value.replace(/\D/g,"");
        if(e.target.value.length > 12){
            e.target.value = e.target.value.slice(0,12);
        }
    });
}

function verifyUser(){
    const file = document.getElementById("profilePhoto").files[0];
    const id = document.getElementById("idNumber")?.value || "";

    if(!file){
        showToast("Please upload profile photo","error");
        return;
    }
    if(id.length !== 12){
        showToast("Enter valid 12-digit ID","error");
        return;
    }

    localStorage.setItem("isVerified","true");
    const reader = new FileReader();
    reader.onload = function(e){
        localStorage.setItem("profilePhoto", e.target.result);
        showToast("Profile Verified Successfully ✅");
        setTimeout(()=>{
            document.body.classList.remove("modal-open");
            document.getElementById("verifyModal").style.display="none";
            location.reload();
        },1200);
    };
    reader.readAsDataURL(file);
}

function openVerify(){
    document.body.classList.add("modal-open");
    document.getElementById("verifyModal").style.display="flex";
}

function logout(){
    localStorage.clear();
    window.location.href="login.html";
}
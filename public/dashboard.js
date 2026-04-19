/************************************************
 * Vitaran - FINAL PRO DASHBOARD (ULTRA FIXED PRO)
 ************************************************/

let currentPlan = null;
let map;
let markers = [];
let routeLine;
let currentStep = "pickup";
let activeToast = null;

/* =========================================
   🔥 STATS SYSTEM (FIXED - NO MORE 0 ISSUE)
========================================= */

let stats = JSON.parse(localStorage.getItem("vitaranStats") || '{"total":0,"active":0,"completed":0,"earnings":0}');

function updateStatsUI(){
    localStorage.setItem("vitaranStats", JSON.stringify(stats));

    document.getElementById("stat-total").innerText = stats.total;
    document.getElementById("stat-active").innerText = stats.active;
    document.getElementById("stat-completed").innerText = stats.completed;
    document.getElementById("stat-earnings").innerText = `₹${stats.earnings}`;
}


// 🔥 MAIN INIT (FIXED)
document.addEventListener("DOMContentLoaded", () => {

    updateStatsUI();
    initMap();
    initActionFlow();
    initVerificationUI();

    // 🔥 PLAN LOAD
    currentPlan = localStorage.getItem("plan") || "All-in-One";

    const planBadge = document.querySelector(".badge");
    if(planBadge) planBadge.innerText = currentPlan + " Active";


    // 🔥 🔥 MAIN FIX START (PER USER VERIFY SYSTEM)

    const token = localStorage.getItem("token");

    if(!token){
        window.location.href = "login.html";
        return;
    }

    const isVerified = localStorage.getItem("verified_" + token);

    // 🔥 VERIFIED USER
    if(isVerified === "true"){

        document.getElementById("profileNotice").style.display = "none";
        document.getElementById("verifyModal").style.display = "none";
        document.getElementById("ordersCard").style.display = "block";

        document.body.classList.remove("modal-open");

        // 🔥 USER PHOTO (PER USER)
        const userPhoto = document.getElementById("userPhoto");
        const savedPhoto = localStorage.getItem("userPhoto_" + token);

        if(userPhoto && savedPhoto){
            userPhoto.src = savedPhoto;
        }

        initDashboard();
    }

    // 🔥 UNVERIFIED USER (FIRST LOGIN)
    else{

        document.getElementById("ordersCard").style.display = "none";
        document.getElementById("profileNotice").style.display = "flex";
        document.getElementById("verifyModal").style.display = "flex";

        document.body.classList.add("modal-open");
    }
});

/* =========================================
   🔥 LOCK SYSTEM (FINAL FIXED CYCLE)
   HIGH → LOCK → LOW → UNLOCK
========================================= */

let lastDelivered = localStorage.getItem("lastDelivered") || "none";

/* ================= TOAST ================= */

function showToast(msg, type="success"){
    if(activeToast) activeToast.remove();

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

/* ================= KM ================= */

function getSmartKM(plan){
    plan = plan ? plan.toLowerCase() : "all";

    if(plan.includes("food")) return (Math.random()*2 + 1).toFixed(1);
    if(plan.includes("grocery")) return (Math.random()*2 + 1.5).toFixed(1);
    if(plan.includes("e-commerce")) return (Math.random()*5 + 3).toFixed(1);

    return (Math.random()*4 + 2).toFixed(1);
}

/* ================= MAP ================= */

function initMap(){
    const mapDiv = document.getElementById('map');
    if(!mapDiv) return;
    map = L.map('map').setView([28.6139,77.2090], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution:'© OpenStreetMap'
    }).addTo(map);
}

/* ================= ADDRESS ================= */

async function getAddress(lat,lng){
    try{
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        return data.display_name?.split(",").slice(0,3).join(",") || "Location";
    }catch{
        return "Location";
    }
}

/* ================= PLATFORM ================= */

const PLATFORM_CONFIG = {
    Food: ["Swiggy","Zomato"],
    Grocery: ["Blinkit","Instamart","Zepto"],
    "E-Commerce": ["Amazon","Flipkart","Meesho","Myntra"],
    "All-in-One": ["Swiggy","Zomato","Blinkit","Instamart","Zepto","Amazon","Flipkart"]
};


function getLogo(name){

    const map = {
        Swiggy: "swiggy.png",
        Zomato: "zomato.png",
        Blinkit: "blinkit.png",
        Instamart: "Instamart.png",
        Zepto: "zepto.jpeg",
        Amazon: "amazon.png",
        Flipkart: "flipkart.png",
        Meesho: "meesho.png",
        Myntra: "myntra.jpeg"
    };

    return `/logos/${map[name] || "default.png"}`;
}


// 🔥 FINAL PLAN → PLATFORM LOGIC (ULTRA FIX)
function getPlatformsFromPlan(plan){

    if(!plan) return PLATFORM_CONFIG["All-in-One"];

    plan = plan.toString().toLowerCase().trim();

    console.log("📦 Plan detect ho raha hai:", plan);

    // 🔥 FOOD
    if(plan.includes("food")){
        return PLATFORM_CONFIG.Food;
    }

    // 🔥 GROCERY / QUICK
    if(plan.includes("grocery") || plan.includes("quick")){
        return PLATFORM_CONFIG.Grocery;
    }

    // 🔥 E-COMMERCE
    if(plan.includes("e-commerce") || plan.includes("ecommerce") || plan.includes("commerce")){
        return PLATFORM_CONFIG["E-Commerce"];
    }

    // 🔥 DEFAULT
    return PLATFORM_CONFIG["All-in-One"];
}

/* ================= DASHBOARD ================= */

function initDashboard(){

    const tbody = document.querySelector(".table tbody");
    if(!tbody) return;

    tbody.innerHTML = "";

    // 🔥 PLAN FIX (MAIN)
    let savedPlan = localStorage.getItem("plan");

    if(!savedPlan || savedPlan === "null" || savedPlan === "undefined"){
        savedPlan = "All-in-One";
    }

    currentPlan = savedPlan.trim();

    console.log("🔥 Current Plan:", currentPlan);

    // 🔥 PLATFORM FIX
    const platforms = getPlatformsFromPlan(currentPlan);

    let orders = [];

    for(let i=0;i<8;i++){

        const km = getSmartKM(currentPlan);

        const name = platforms[Math.floor(Math.random()*platforms.length)];

        const profit = Math.floor(Math.random()*90 + 10);

        orders.push({
            platform: name,
            id: Math.floor(Math.random()*9000),
            amount: Math.floor(Math.random()*800 + 100),
            km: km,
            profit: profit
        });
    }

    // 🔥 HIGH PROFIT FIRST
    orders.sort((a,b)=>b.profit - a.profit);

    orders.forEach((o,index)=>{

        const tr = document.createElement("tr");

        const isHigh = o.profit >= 50;
        const isLow = o.profit < 20;

        if(index < 2) tr.classList.add("high-profit-row");
        if(isLow) tr.style.opacity = "0.6";

        const locked = (lastDelivered === "high" && isHigh);

        tr.innerHTML = `
        <td>
            <img src="${getLogo(o.platform)}" 
                 style="width:20px; vertical-align:middle; margin-right:5px;">
            ${o.platform}
        </td>
        <td>#VT${o.id}</td>
        <td>COD</td>
        <td>₹${o.amount}</td>
        <td>${o.km} KM</td>
        <td class="${isHigh ? "green" : ""}">₹${o.profit}</td>
        <td>
            <button class="btn accept ${locked ? "disabled" : ""}" 
                    ${locked ? "disabled" : ""}>
                ${locked ? "Locked" : "Accept"}
            </button>
        </td>
        `;

        const btn = tr.querySelector("button");

        btn.onclick = () => {

            if(locked){
                showToast("Low profit order complete karo ❌","error");
                return;
            }

            acceptOrder(parseFloat(o.km), o.profit);
        };

        tbody.appendChild(tr);
    });
}

/* ================= ACCEPT ORDER ================= */

async function acceptOrder(orderKM,profit){
    localStorage.setItem("currentOrderProfit", profit);
    stats.total++;
    stats.active = 1;
    updateStatsUI();

    document.getElementById("mapContainer").classList.add("map-full");
    document.getElementById("ordersCard")?.classList.add("fade");

    setTimeout(()=>{
        document.getElementById("actionBar").style.display="flex";
        map.invalidateSize();
    },500);

    markers.forEach(m=>map.removeLayer(m));
    markers=[];
    if(routeLine) map.removeLayer(routeLine);

    navigator.geolocation.getCurrentPosition(async pos=>{
        const user = [pos.coords.latitude,pos.coords.longitude];
        const angle = Math.random()*Math.PI*2;
        const dist = orderKM/111;

        const pickup = [user[0] + Math.cos(angle)*(dist/2), user[1] + Math.sin(angle)*(dist/2)];
        const drop = [pickup[0] + Math.cos(angle)*(dist), pickup[1] + Math.sin(angle)*(dist)];

        const pickupName = await getAddress(pickup[0],pickup[1]);
        const dropName = await getAddress(drop[0],drop[1]);

        document.getElementById("pickupText").innerText = "Pickup: " + pickupName.split(",")[0];
        document.getElementById("dropText").innerText = "Drop: " + dropName.split(",")[0];

        markers.push(L.marker(user).addTo(map).bindPopup("You"));
        markers.push(L.marker(pickup).addTo(map).bindPopup("Pickup"));
        markers.push(L.marker(drop).addTo(map).bindPopup("Drop"));

        try{
            const url = `https://router.project-osrm.org/route/v1/driving/${user[1]},${user[0]};${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`;
            const res = await fetch(url);
            const data = await res.json();
            const coords = data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);

            routeLine = L.polyline(coords,{color:"#0a58ff",weight:6,opacity:0.9,dashArray:"5,10"}).addTo(map);

            const riderIcon = L.icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
                iconSize: [40,40],
                iconAnchor: [20,20]
            });

            let rider = L.marker(user, {icon:riderIcon}).addTo(map);
            const mid = Math.floor(coords.length/2);
            window.deliveryData = { rider, pickupCoords: coords.slice(0, mid), dropCoords: coords.slice(mid) };
        }catch{
            routeLine = L.polyline([user,pickup,drop],{color:"red",weight:5}).addTo(map);
        }
        map.fitBounds(routeLine.getBounds(),{padding:[50,50]});
    },()=>showToast("Allow location ❌","error"));
}

/* ================= ACTION ================= */

function initActionFlow(){
    document.getElementById("pickupBtn").onclick = ()=>{
        currentStep="pickup";
        openCamera();
        const data = window.deliveryData;
        if(!data) return;
        const {rider, pickupCoords} = data;
        let i = 0;
        const move = setInterval(()=>{
            if(i >= pickupCoords.length){ clearInterval(move); showToast("Reached Pickup ✅"); return; }
            rider.setLatLng(pickupCoords[i]); i++;
        },100);
    };

    document.getElementById("dropBtn").onclick = ()=>{
        currentStep="drop";
        openCamera();
        const data = window.deliveryData;
        if(!data) return;
        const {rider, dropCoords} = data;
        let i = 0;
        const move = setInterval(()=>{
            if(i >= dropCoords.length){ clearInterval(move); showToast("Order Delivered ✅"); return; }
            rider.setLatLng(dropCoords[i]); i++;
        },100);
    };

    document.getElementById("payBtn").onclick = ()=>{
        const profit = parseInt(localStorage.getItem("currentOrderProfit") || "0");
        stats.active = 0;
        stats.completed++;
        stats.earnings += profit;
        updateStatsUI();
        lastDelivered = (profit >= 50) ? "high" : "none";
        localStorage.setItem("lastDelivered", lastDelivered);
        showToast("Payment received 💰");
        setTimeout(()=>location.reload(),1000);
    };
}

/* ================= CAMERA ================= */

function openCamera(){
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display="flex";
    modal.innerHTML = `
        <div class="modal-box">
            <div id="camBox" style="width:100%; height:250px; background:#000; border-radius:12px;"></div>
            <h3>Capture Photo</h3>
            <button class="btn primary">Capture</button>
        </div>
    `;
    document.body.appendChild(modal);

    navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}})
    .then(stream=>{
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();
        modal.querySelector("#camBox").appendChild(video);
        video.style.width="100%"; video.style.height="100%";

        modal.querySelector("button").onclick = ()=>{
            stream.getTracks().forEach(t=>t.stop());
            modal.remove();
            if(currentStep==="pickup"){
                document.getElementById("pickupBtn").style.display="none";
                document.getElementById("dropBtn").style.display="inline-block";
            }else{
                document.getElementById("dropBtn").style.display="none";
                document.getElementById("payBtn").style.display="inline-block";
            }
        };
    });
}

/* ================= VERIFY SYSTEM (FIXED) ================= */

function initVerificationUI(){
    const dpUpload = document.getElementById("dpUpload");
    const photoInput = document.getElementById("profilePhoto");
    const previewImg = document.getElementById("preview");
    const verifyBtn = document.getElementById("verifyBtn");

    if(dpUpload && photoInput){
        dpUpload.onclick = () => photoInput.click();

        photoInput.onchange = (e) => {
            const file = e.target.files[0];

            if(file){
                const reader = new FileReader();

                reader.onload = (ev) => {
                    previewImg.src = ev.target.result;

                    // 🔥 FIX: user specific photo save
                    const token = localStorage.getItem("token");
                    localStorage.setItem("userPhoto_" + token, ev.target.result);
                };

                reader.readAsDataURL(file);
            }
        };
    }

    if(verifyBtn){
        verifyBtn.onclick = verifyUser;
    }
}


function verifyUser(){

    const idType = document.getElementById("idType").value;
    const idNum = document.getElementById("idNumber").value;

    const token = localStorage.getItem("token");

    if(!idType || idNum.length < 5){
        showToast("Enter valid ID Details ❌", "error");
        return;
    }

    // 🔥 FIX: user specific photo check
    const photo = localStorage.getItem("userPhoto_" + token);

    if(!photo){
        showToast("Upload Profile Photo 📸", "error");
        return;
    }

    showToast("Verification Successful! ✅");

    // 🔥 MAIN FIX: per user verification save
    localStorage.setItem("verified_" + token, "true");

    setTimeout(() => {
        document.getElementById("verifyModal").style.display = "none";
        location.reload();
    }, 1000);
}


function openVerify(){
    document.getElementById("verifyModal").style.display = "flex";
}


function logout(){
    // 🔥 IMPORTANT: sirf token remove karo, pura localStorage mat uda
    localStorage.removeItem("token");
    window.location.href="login.html";
}
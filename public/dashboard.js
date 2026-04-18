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
    plan = plan.toLowerCase();

    if(plan.includes("food")) return (Math.random()*2 + 1).toFixed(1);
    if(plan.includes("grocery")) return (Math.random()*2 + 1.5).toFixed(1);
    if(plan.includes("e-commerce")) return (Math.random()*5 + 3).toFixed(1);

    return (Math.random()*4 + 2).toFixed(1);
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {

    updateStatsUI();

    const token = localStorage.getItem("token");
    if (!token){
        window.location.href="login.html";
        return;
    }

    try{
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

        // 🔥🔥 USER BASED VERIFICATION FIX (MAIN FIX)
        const userId = data.user.id;

        if(localStorage.getItem("currentUser") !== userId){
            localStorage.setItem("currentUser", userId);
            localStorage.setItem("isVerified","false");
        }

        // 🔥 NORMAL FLOW (UNCHANGED)
        currentPlan = data.user?.plan || localStorage.getItem("plan") || "All-in-One";

        document.querySelector(".badge").innerText = currentPlan + " Active";

        const savedPhoto = localStorage.getItem("profilePhoto");
        if(savedPhoto){
            document.getElementById("userPhoto").src = savedPhoto;
        }

        // 🔥 VERIFY MODAL CONTROL
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

    }catch(err){
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
    Food:["Swiggy","Zomato"],
    Grocery:["Blinkit","Instamart","Zepto"],
    "E-Commerce":["Amazon","Flipkart","Meesho","Myntra"],
    "All-in-One":["Swiggy","Zomato","Blinkit","Instamart","Zepto","Amazon","Flipkart"]
};

function getLogo(name){
    const map = {
        Swiggy:"swiggy.png",
        Zomato:"zomato.png",
        Blinkit:"blinkit.png",
        Instamart:"Instamart.png",
        Zepto:"zepto.jpeg",
        Amazon:"amazon.png",
        Flipkart:"flipkart.png",
        Meesho:"meesho.png",
        Myntra:"myntra.jpeg"
    };
    return `/logos/${map[name] || "default.png"}`;
}

function getPlatformsFromPlan(plan){
    if(plan.includes("Food")) return PLATFORM_CONFIG.Food;
    if(plan.includes("Grocery")) return PLATFORM_CONFIG.Grocery;
    if(plan.includes("E-Commerce")) return PLATFORM_CONFIG["E-Commerce"];
    return PLATFORM_CONFIG["All-in-One"];
}

/* ================= DASHBOARD ================= */

function initDashboard(){

    const tbody = document.querySelector(".table tbody");
    tbody.innerHTML = "";

    const platforms = getPlatformsFromPlan(currentPlan);
    let orders = [];

    for(let i=0;i<8;i++){
        const km = getSmartKM(currentPlan);
        const name = platforms[Math.floor(Math.random()*platforms.length)];
        const profit = Math.floor(Math.random()*90 + 10);

        orders.push({
            platform:name,
            id:Math.floor(Math.random()*9000),
            amount:Math.floor(Math.random()*800 + 100),
            km,
            profit
        });
    }

    orders.sort((a,b)=>b.profit - a.profit);

    orders.forEach((o,index)=>{

        const tr = document.createElement("tr");

        const isHigh = o.profit >= 50;
        const isLow = o.profit < 20;

        if(index < 2) tr.classList.add("high-profit-row");
        if(isLow) tr.style.opacity = "0.6";

        // 🔥 LOCK LOGIC FINAL
        const locked = (lastDelivered === "high" && isHigh);

        tr.innerHTML = `
        <td><img src="${getLogo(o.platform)}"> ${o.platform}</td>
        <td>#VT${o.id}</td>
        <td>COD</td>
        <td>₹${o.amount}</td>
        <td>${o.km} KM</td>
        <td class="${isHigh ? "green" : ""}">₹${o.profit}</td>
        <td>
            <button class="btn accept ${locked ? "disabled" : ""}" ${locked ? "disabled" : ""}>
                ${locked ? "Locked" : "Accept"}
            </button>
        </td>
        `;

        const btn = tr.querySelector("button");
        btn.onclick = () => {
            if (locked) {
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

    // 🔥 SAVE PROFIT
    localStorage.setItem("currentOrderProfit", profit);

    // 🔥 STATS UPDATE
    stats.total++;
    stats.active = 1;
    updateStatsUI();

    // 🔥 UI SWITCH
    document.getElementById("mapContainer").classList.add("map-full");
    document.getElementById("ordersCard")?.classList.add("fade");

    setTimeout(()=>{
        document.getElementById("actionBar").style.display="flex";
        map.invalidateSize();
    },500);

    // 🔥 CLEAR OLD MAP
    markers.forEach(m=>map.removeLayer(m));
    markers=[];
    if(routeLine) map.removeLayer(routeLine);

    navigator.geolocation.getCurrentPosition(async pos=>{

        const user = [pos.coords.latitude,pos.coords.longitude];

        const angle = Math.random()*Math.PI*2;
        const dist = orderKM/111;

        const pickup = [
            user[0] + Math.cos(angle)*(dist/2),
            user[1] + Math.sin(angle)*(dist/2)
        ];

        const drop = [
            pickup[0] + Math.cos(angle)*(dist),
            pickup[1] + Math.sin(angle)*(dist)
        ];

        // 🔥 ADDRESS
        const pickupName = await getAddress(pickup[0],pickup[1]);
        const dropName = await getAddress(drop[0],drop[1]);

        document.getElementById("pickupText").innerText = "Pickup: " + pickupName.split(",")[0];
        document.getElementById("dropText").innerText = "Drop: " + dropName.split(",")[0];

        // 🔥 MARKERS (clean UI)
        markers.push(L.marker(user).addTo(map).bindPopup("You"));
        markers.push(L.marker(pickup).addTo(map).bindPopup("Pickup"));
        markers.push(L.marker(drop).addTo(map).bindPopup("Drop"));

        try{
            const url = `https://router.project-osrm.org/route/v1/driving/${user[1]},${user[0]};${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`;

            const res = await fetch(url);
            const data = await res.json();

            if(!data.routes || !data.routes.length) throw "fail";

            const coords = data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);

            // 🔥 ROUTE LINE
            routeLine = L.polyline(coords,{
                color:"#0a58ff",
                weight:6,
                opacity:0.9,
                dashArray:"5,10"
            }).addTo(map);

            // 🔥 ETA
            const distance = data.routes[0].distance / 1000;
            const time = data.routes[0].duration / 60;

            const etaBox = document.getElementById("etaText");
            if(etaBox){
                etaBox.innerText = `ETA: ${time.toFixed(0)} min | ${distance.toFixed(1)} km`;
            }

            // 🔥 BIKE ICON (FIXED)
            const riderIcon = L.icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
                iconSize: [40,40],
                iconAnchor: [20,20]
            });

            // 🔥 RIDER START POSITION = USER
            let rider = L.marker(user, {icon:riderIcon}).addTo(map);

            // 🔥 ROUTE SPLIT (pickup + drop)
            const mid = Math.floor(coords.length/2);
            const pickupCoords = coords.slice(0, mid);
            const dropCoords = coords.slice(mid);

            // 🔥 GLOBAL STORE (buttons ke liye use hoga)
            window.deliveryData = {
                rider,
                pickupCoords,
                dropCoords
            };

        }catch{
            routeLine = L.polyline([user,pickup,drop],{
                color:"red",
                weight:5
            }).addTo(map);
        }

        map.fitBounds(routeLine.getBounds(),{padding:[50,50]});

    },()=>{
        showToast("Allow location ❌","error");
    });
}

/* ================= ACTION ================= */

function initActionFlow(){

    // ================= PICKUP =================
    document.getElementById("pickupBtn").onclick = ()=>{

        currentStep="pickup";
        openCamera(); // 📸 camera पहले जैसा रहेगा

        // 🔥 RIDER MOVE TO PICKUP
        const data = window.deliveryData;
        if(!data) return;

        const {rider, pickupCoords} = data;

        let i = 0;
        const move = setInterval(()=>{
            if(i >= pickupCoords.length){
                clearInterval(move);
                showToast("Reached Pickup ✅");
                return;
            }
            rider.setLatLng(pickupCoords[i]);
            map.panTo(pickupCoords[i]);
            i++;
        },200);
    };


    // ================= DROP =================
    document.getElementById("dropBtn").onclick = ()=>{

        currentStep="drop";
        openCamera(); // 📸 camera भी रहेगा

        // 🔥 RIDER MOVE TO DROP
        const data = window.deliveryData;
        if(!data) return;

        const {rider, dropCoords} = data;

        let i = 0;
        const move = setInterval(()=>{
            if(i >= dropCoords.length){
                clearInterval(move);
                showToast("Order Delivered ✅");
                return;
            }
            rider.setLatLng(dropCoords[i]);
            map.panTo(dropCoords[i]);
            i++;
        },200);
    };


    // ================= PAYMENT =================
    document.getElementById("payBtn").onclick = ()=>{

        const profit = parseInt(localStorage.getItem("currentOrderProfit") || "0");

        // 🔥 STATS FIX
        stats.active = 0;
        stats.completed++;
        stats.earnings += profit;
        updateStatsUI();

        // 🔥 LOCK SYSTEM
        if(profit >= 50){
            lastDelivered = "high";
        }else{
            lastDelivered = "none";
        }

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

        video.style.width="100%";
        video.style.height="100%";

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

/* ================= VERIFY ================= */

function initVerificationUI(){}

function verifyUser(){}

function openVerify(){}

function logout(){
    localStorage.clear();
    window.location.href="login.html";
}
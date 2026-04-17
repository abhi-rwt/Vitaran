/************************************************
 * Vitaran - FINAL PRO DASHBOARD (ULTRA FIXED PRO)
 ************************************************/

/* ================= GLOBAL VARIABLES ================= */
// App ka main control
let currentPlan = null;
let map;
let markers = [];
let routeLine;
let currentStep = "pickup";
let activeToast = null;

// 🔥 LOCK SYSTEM (cycle based: High → Low)
let lastDelivered = localStorage.getItem("lastDelivered") || "none";

// 🔥 STATS (earnings fix)
let stats = JSON.parse(localStorage.getItem("stats") || '{"total":0,"completed":0,"earnings":0}');


/* ================= STATS FUNCTION ================= */
// Dashboard ke numbers update karega
function updateStats(){
    localStorage.setItem("stats", JSON.stringify(stats));

    document.getElementById("stat-total")?.innerText = stats.total;
    document.getElementById("stat-completed")?.innerText = stats.completed;
    document.getElementById("stat-earnings")?.innerText = "₹" + stats.earnings;
}


/* ================= TOAST ================= */
// Popup message system
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


/* ================= KM LOGIC ================= */
// Distance generate karta hai
function getSmartKM(plan){
    plan = plan.toLowerCase();

    if(plan.includes("food")) return (Math.random()*2 + 1).toFixed(1);
    if(plan.includes("grocery")) return (Math.random()*2 + 1.5).toFixed(1);
    if(plan.includes("e-commerce")) return (Math.random()*5 + 3).toFixed(1);

    return (Math.random()*4 + 2).toFixed(1);
}


/* ================= INIT ================= */
// Page load hone pe sab start hota hai
document.addEventListener("DOMContentLoaded", async () => {

    updateStats(); // 🔥 earnings load fix

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

    }catch(err){
        console.log(err);
        showToast("Something went wrong","error");
    }

});


/* ================= MAP ================= */
// Map initialize
function initMap(){
    map = L.map('map').setView([28.6139,77.2090], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution:'© OpenStreetMap'
    }).addTo(map);
}


/* ================= ADDRESS ================= */
// LatLng → Address
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
// Platform selection
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
        Instamart:"instamart.png",
        Zepto:"zepto.png",
        Amazon:"amazon.png",
        Flipkart:"flipkart.png",
        Meesho:"meesho.png",
        Myntra:"myntra.png"
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
// Orders UI generate
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

        // 🔥 LOCK FIX (cycle)
        const locked = (lastDelivered === "high" && isHigh);

        tr.innerHTML = `
        <td><img src="${getLogo(o.platform)}"> ${o.platform}</td>
        <td>#VT${o.id}</td>
        <td>COD</td>
        <td>₹${o.amount}</td>
        <td>${o.km} KM</td>
        <td class="${isHigh ? 'green':''}">₹${o.profit}</td>
        <td>
            <button class="btn accept ${locked?'disabled':''}" ${locked?'disabled':''}>
                ${locked?'Locked':'Accept'}
            </button>
        </td>
        `;

        tr.querySelector("button").onclick = ()=>{
            if(!locked){
                acceptOrder(parseFloat(o.km), o.profit);
            }
        };

        tbody.appendChild(tr);
    });
}
/* ================= ACCEPT ORDER ================= */
// Order accept hone par map + flow start hota hai

async function acceptOrder(orderKM,profit){

    // 🔥 CURRENT ORDER SAVE (earnings ke liye)
    localStorage.setItem("currentOrderProfit", profit);

    // 🔥 TOTAL ORDER COUNT UPDATE
    stats.total++;
    updateStats();

    document.getElementById("mapContainer").classList.add("map-full");
    document.getElementById("ordersCard")?.classList.add("fade");

    setTimeout(()=>{
        document.getElementById("actionBar").style.display="flex";
        map.invalidateSize(); // ✅ MAP FULL FIX
    },500);

    // Purane markers remove
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

        const pickupName = await getAddress(pickup[0],pickup[1]);
        const dropName = await getAddress(drop[0],drop[1]);

        document.getElementById("pickupText").innerText = pickupName;
        document.getElementById("dropText").innerText = dropName;

        markers.push(L.marker(user).addTo(map).bindPopup("You"));
        markers.push(L.marker(pickup).addTo(map).bindPopup(pickupName));
        markers.push(L.marker(drop).addTo(map).bindPopup(dropName));

        try{
            const url = `https://router.project-osrm.org/route/v1/driving/${user[1]},${user[0]};${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`;

            const res = await fetch(url);
            const data = await res.json();

            const coords = data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);

            routeLine = L.polyline(coords,{
                color:"#0a58ff",
                weight:6
            }).addTo(map);

        }catch{
            routeLine = L.polyline([user,pickup,drop],{
                color:"red"
            }).addTo(map);
        }

        map.fitBounds(routeLine.getBounds(),{padding:[40,40]});

    },()=>{
        showToast("Allow location ❌","error");
    });
}


/* ================= ACTION FLOW ================= */
// Pickup → Drop → Payment

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

        const profit = parseInt(localStorage.getItem("currentOrderProfit") || "0");

        // 🔥 COMPLETED + EARNINGS FIX
        stats.completed++;
        stats.earnings += profit;
        updateStats();

        // 🔥 LOCK SYSTEM (MAIN FIX)
        if(profit >= 50){
            lastDelivered = "high";   // HIGH diya → next high lock
        }else if(profit < 20){
            lastDelivered = "low";    // LOW diya → unlock
        }

        localStorage.setItem("lastDelivered", lastDelivered);

        showToast("Payment received 💰");

        setTimeout(()=>location.reload(),1000);
    };
}


/* ================= CAMERA ================= */
// Camera UI (original wala clean version)

function openCamera(){

    navigator.mediaDevices.getUserMedia({video:true})
    .then(stream=>{

        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();

        const modal = document.createElement("div");
        modal.className = "modal";

        modal.innerHTML = `
        <div class="modal-box">
            <div style="height:250px"></div>
            <button class="btn primary">Capture</button>
        </div>
        `;

        modal.querySelector("div").appendChild(video);
        video.style.width="100%";
        video.style.height="100%";

        document.body.appendChild(modal);

        modal.querySelector("button").onclick = ()=>{
            stream.getTracks().forEach(t=>t.stop());
            modal.remove();

            if(currentStep==="pickup"){
                showToast("Pickup done ✅");
                document.getElementById("pickupBtn").style.display="none";
                document.getElementById("dropBtn").style.display="inline-block";
            }else{
                showToast("Drop done ✅");
                document.getElementById("dropBtn").style.display="none";
                document.getElementById("payBtn").style.display="inline-block";
            }
        };

    })
    .catch(()=>{
        showToast("Camera not supported","error");
    });
}


/* ================= VERIFY ================= */
// Profile verify system

function initVerificationUI(){

    const photoInput = document.getElementById("profilePhoto");
    const preview = document.getElementById("preview");
    const idInput = document.getElementById("idNumber");

    photoInput?.addEventListener("change",()=>{
        const file = photoInput.files[0];

        if(file){
            if(file.size > 2*1024*1024){
                showToast("Max 2MB image","error");
                photoInput.value="";
                return;
            }

            preview.src = URL.createObjectURL(file);
            preview.style.display="block";
        }
    });

    idInput?.addEventListener("input",(e)=>{
        e.target.value = e.target.value.replace(/\D/g,"").slice(0,12);
    });
}

function verifyUser(){

    const file = document.getElementById("profilePhoto").files[0];
    const id = document.getElementById("idNumber").value;

    if(!file){
        showToast("Upload photo","error");
        return;
    }

    if(id.length !== 12){
        showToast("Invalid ID","error");
        return;
    }

    localStorage.setItem("isVerified","true");

    const reader = new FileReader();

    reader.onload = function(e){
        localStorage.setItem("profilePhoto",e.target.result);

        showToast("Verified ✅");

        setTimeout(()=>{
            location.reload();
        },1000);
    };

    reader.readAsDataURL(file);
}


/* ================= MISC ================= */

function openVerify(){
    document.body.classList.add("modal-open");
    document.getElementById("verifyModal").style.display="flex";
}

function logout(){
    localStorage.clear();
    window.location.href="login.html";
}
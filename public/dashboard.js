/************************************************  
 * Vitaran - FINAL PRO DASHBOARD (ULTRA FIXED PRO)  
 ************************************************/  

let currentPlan = null;
let map;
let markers = [];
let routeLine;
let currentStep = "pickup";
let activeToast = null;

// 🔥 Stats + Lock State
let stats = JSON.parse(localStorage.getItem("vitaranStats") || '{"total":0,"active":0,"completed":0,"earnings":0}');
let lastOrderType = localStorage.getItem("lastOrderType") || "none"; // 🔥 NEW
let isLocked = lastOrderType === "high"; // 🔥 NEW

/* ================= STATS ================= */

function updateStatsUI() {
    localStorage.setItem("vitaranStats", JSON.stringify(stats));

    document.getElementById("stat-total").innerText = stats.total;
    document.getElementById("stat-active").innerText = stats.active;
    document.getElementById("stat-completed").innerText = stats.completed;
    document.getElementById("stat-earnings").innerText = `₹${stats.earnings}`;
}

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
    const p = plan.toLowerCase();

    if(p.includes("food")) return (Math.random()*2 + 1).toFixed(1);
    if(p.includes("grocery")) return (Math.random()*2 + 1.5).toFixed(1);
    if(p.includes("e-commerce")) return (Math.random()*5 + 3).toFixed(1);

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

function initMap(){
    map = L.map('map').setView([28.6139,77.2090], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',{
        attribution:'© OpenStreetMap'
    }).addTo(map);
}

/* ================= ADDRESS ================= */

async function getAddress(lat,lng){
    try{
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        return data.display_name?.split(",").slice(0,2).join(",") || "Location";
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
    return `/logos/${name.toLowerCase()}.png`;
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

    for(let i=0;i<10;i++){
        const km = getSmartKM(currentPlan);
        const name = platforms[Math.floor(Math.random()*platforms.length)];
        const profit = Math.floor(Math.random()*90 + 5);

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

        // 🔥 FIX LOCK
        const locked = (lastOrderType === "high" && isHigh);

        if(index < 2) tr.classList.add("high-profit-row");
        if(isLow) tr.style.opacity = "0.6";

        tr.innerHTML = `
        <td><img src="${getLogo(o.platform)}"> ${o.platform}</td>
        <td>#VT${o.id}</td>
        <td>COD</td>
        <td>₹${o.amount}</td>
        <td>${o.km} KM</td>
        <td class="${isHigh?'green':''}">₹${o.profit}</td>
        <td>
            <button class="btn accept ${locked?'disabled':''}" ${locked?'disabled':''}>
                ${locked?'Do Low First':'Accept'}
            </button>
        </td>
        `;

        tr.querySelector("button").onclick = ()=>{
            if(!locked){
                acceptOrder(o);
            }
        };

        tbody.appendChild(tr);
    });
}

/* ================= ACCEPT ORDER ================= */

async function acceptOrder(order){

    stats.total++;
    stats.active = 1;
    updateStatsUI();

    // 🔥 FIX LOCK FLOW
    if(order.profit >= 50){
        lastOrderType = "high";
        localStorage.setItem("lastOrderType","high");
    }else if(order.profit < 20){
        lastOrderType = "low";
        localStorage.setItem("lastOrderType","low");
    }

    document.getElementById("mapContainer").classList.add("map-full");
    document.getElementById("ordersCard").style.display="none";
    document.getElementById("actionBar").style.display="flex";

    markers.forEach(m=>map.removeLayer(m));
    markers=[];
    if(routeLine) map.removeLayer(routeLine);

    navigator.geolocation.getCurrentPosition(async pos=>{

        const user = [pos.coords.latitude,pos.coords.longitude];

        const offset = (order.km/111)*0.7;

        const pickup = [user[0]+offset*0.5,user[1]+offset*0.3];
        const drop = [pickup[0]+offset,pickup[1]+offset];

        const pAddr = await getAddress(pickup[0],pickup[1]);
        const dAddr = await getAddress(drop[0],drop[1]);

        document.getElementById("pickupText").innerText = pAddr;
        document.getElementById("dropText").innerText = dAddr;

        markers.push(L.marker(user).addTo(map));
        markers.push(L.marker(pickup).addTo(map));
        markers.push(L.marker(drop).addTo(map));

        try{
            const url = `https://router.project-osrm.org/route/v1/driving/${user[1]},${user[0]};${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`;
            const res = await fetch(url);
            const data = await res.json();

            const coords = data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);

            routeLine = L.polyline(coords,{color:"#0a58ff",weight:5}).addTo(map);

        }catch{
            routeLine = L.polyline([user,pickup,drop],{color:"red"}).addTo(map);
        }

        map.fitBounds(routeLine.getBounds(),{padding:[40,40]});

    });

}

/* ================= ACTION ================= */

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

        // 🔥 FIX STATS
        stats.active = 0;
        stats.completed++;
        stats.earnings += profit;
        updateStatsUI();

        // 🔥 UNLOCK FLOW
        if(lastOrderType === "low"){
            localStorage.setItem("lastOrderType","none");
        }

        showToast("Payment received 💰");
        setTimeout(()=>location.reload(),1000);
    };
}

/* ================= CAMERA ================= */

function openCamera(){

    navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}})
    .then(stream=>{

        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();

        const modal = document.createElement("div");
        modal.className="modal";

        modal.innerHTML=`
        <div class="modal-box">
            <div style="height:250px"></div>
            <button class="btn primary">Capture</button>
        </div>
        `;

        modal.querySelector("div").appendChild(video);
        video.style.width="100%";
        video.style.height="100%";
        video.style.objectFit="cover";

        document.body.appendChild(modal);

        modal.querySelector("button").onclick=()=>{
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

    })
    .catch(()=>{
        showToast("Camera error","error");
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
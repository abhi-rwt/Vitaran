/************************************************
 * Vitaran - FINAL PRO DASHBOARD (ULTRA FIXED PRO)
 ************************************************/

let currentPlan = null;
let map;
let markers = [];
let routeLine;
let currentStep = "pickup";
let activeToast = null;

// 🔥 NEW LOCK SYSTEM (CYCLE BASED)
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

/* ================= KM FIX ================= */

function getSmartKM(plan){
    plan = plan.toLowerCase();

    if(plan.includes("food")) return (Math.random()*2 + 1).toFixed(1);
    if(plan.includes("grocery")) return (Math.random()*2 + 1.5).toFixed(1);
    if(plan.includes("e-commerce")) return (Math.random()*5 + 3).toFixed(1);

    return (Math.random()*4 + 2).toFixed(1);
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {

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
        Instamart:"instamart.png",
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

        // 🔥 NEW LOCK LOGIC
        const locked = (lastDelivered === "high" && isHigh);

        tr.innerHTML = `
        <td>
            <img src="${getLogo(o.platform)}">
            ${o.platform}
        </td>
        <td>#VT${o.id}</td>
        <td><span class="tag">COD</span></td>
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

async function acceptOrder(orderKM,profit){

    // 🔥 SAVE CURRENT ORDER
    localStorage.setItem("currentOrderProfit", profit);

    document.getElementById("mapContainer").classList.add("map-full");
    document.getElementById("ordersCard")?.classList.add("fade");

    setTimeout(()=>{
        document.getElementById("actionBar").style.display="flex";
        map.invalidateSize(); // ✅ FIX MAP
    },500);

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

        markers.push(L.marker(user).addTo(map));
        markers.push(L.marker(pickup).addTo(map));
        markers.push(L.marker(drop).addTo(map));

        try{
            const url = `https://router.project-osrm.org/route/v1/driving/${user[1]},${user[0]};${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`;

            const res = await fetch(url);
            const data = await res.json();

            const coords = data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);

            routeLine = L.polyline(coords,{color:"#0a58ff",weight:6}).addTo(map);

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

        // 🔥 LOCK FLOW FIX
        if(profit >= 50){
            lastDelivered = "high";
            localStorage.setItem("lastDelivered","high");
        }else if(profit < 20){
            lastDelivered = "low";
            localStorage.setItem("lastDelivered","low");
        }

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
            <div id="camBox" style="width:100%; height:250px; background:#000; border-radius:12px; overflow:hidden;"></div>
            <h3 style="margin-top:10px;">Capture Photo</h3>
            <button class="btn primary" style="width:100%; margin-top:10px;">Capture</button>
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
        video.style.objectFit="cover";

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
    })
    .catch(()=>{
        showToast("Camera error","error");
        modal.remove();
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

function openVerify(){
    document.body.classList.add("modal-open");
    document.getElementById("verifyModal").style.display="flex";
}

function logout(){
    localStorage.clear();
    window.location.href="login.html";
}
/************************************************
 * Vitaran - Dashboard (Mappls Integrated)
 ************************************************/

let currentPlan = null;
let map;

/* ================= INIT ================= */

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

        /* Verification Logic */
        if(localStorage.getItem("isVerified") !== "true"){
            setTimeout(()=>{
                const modal = document.getElementById("verifyModal");
                if(modal) modal.style.display = "flex";
            },300);
        } else {
            const card = document.querySelector(".profile-card");
            if(card) card.style.display = "none";
        }

        const savedPhoto = localStorage.getItem("profilePhoto");
        if(savedPhoto){
            const img = document.getElementById("userPhoto");
            if(img) img.src = savedPhoto;
        }

        if (!data.user.plan) {
            window.location.href = "subscription.html";
            return;
        }

        currentPlan = data.user.plan;
        const badge = document.querySelector(".badge");
        if (badge) { badge.innerText = currentPlan + " Active"; }

        /* INITIALIZE COMPONENTS */
        initDashboard(currentPlan);
        initVerificationUI();
        
        // 🔥 FIX: Check if Mappls is ready before init
        if (typeof mappls !== 'undefined') {
            initMap();
        } else {
            console.error("Mappls SDK not loaded. Check your HTML script tag.");
        }

    } catch (err) {
        console.log("Dashboard error:", err);
    }
});

/* ================= LOGOUT ================= */

function logout(){
    localStorage.clear();
    window.location.href="login.html";
}

/* ================= MAP (FIXED) ================= */

function initMap(){
    // Mappls map initialization with fixed height check
    try {
        map = new mappls.Map('map', {
            center: [28.6139, 77.2090], // Delhi center
            zoom: 12,
            hybrid: true
        });
        
        // Refresh map size after a short delay
        setTimeout(() => {
            if(map) map.invalidateSize();
        }, 500);
        
    } catch (e) {
        console.error("Map Init Error:", e);
    }
}

/* ================= PLAN CONFIG ================= */

const PLAN_CONFIG = {
    "E-Commerce 1 Month": { platforms: ["Amazon","Flipkart","Meesho","Myntra"], maxProfit: 60 },
    "Food 1 Month": { platforms: ["Swiggy","Zomato"], maxProfit: 80 },
    "Grocery 1 Month": { platforms: ["Zepto","Instamart","Blinkit"], maxProfit: 80 },
    "All-in-One 1 Month":{
        platforms:["Amazon","Flipkart","Meesho","Myntra","Swiggy","Zomato","Zepto","Instamart","Blinkit"],
        maxProfit:100
    }
};

/* ================= DASHBOARD ORDERS LOGIC ================= */

function initDashboard(userPlan){
    let config = PLAN_CONFIG[userPlan] || PLAN_CONFIG["All-in-One 1 Month"];
    const random = (min,max)=> Math.floor(Math.random()*(max-min+1))+min;
    const randomFrom = arr => arr[Math.floor(Math.random()*arr.length)];

    function platformLogo(name){
        const lower = name.toLowerCase();
        if(lower === "myntra") return "/logos/myntra.jpeg";
        return `/logos/${lower}.png`;
    }

    const orders = [];
    for(let i=0;i<random(5,9);i++){
        const amount = random(150,1000);
        const km = parseFloat((Math.random()*8+1).toFixed(1));
        let profit = Math.round(25 + (km * 8) + (amount * 0.02));

        if(profit > config.maxProfit){ profit = config.maxProfit; }

        orders.push({
            platform: randomFrom(config.platforms),
            orderId: "VT" + random(1000,9999),
            payment: Math.random() > 0.5 ? "PAID" : "COD",
            amount, km, profit
        });
    }

    orders.sort((a,b)=>b.profit-a.profit);
    const tbody = document.querySelector(".table tbody");
    if(!tbody) return;
    tbody.innerHTML="";

    const lastOrderType = localStorage.getItem("lastOrderType");

    orders.forEach((o,index)=>{
        const tr = document.createElement("tr");
        if(index===0) tr.classList.add("priority");

        const isHigh = o.profit >= 70;
        const isDisabled = (lastOrderType === "HIGH" && isHigh);

        tr.innerHTML = `
            <td><img src="${platformLogo(o.platform)}" onerror="this.src='/logos/default.png'"> ${o.platform}</td>
            <td>#${o.orderId}</td>
            <td><span class="tag">${o.payment}</span></td>
            <td>₹${o.amount}</td>
            <td>${o.km} KM</td>
            <td class="${isHigh ? 'green' : ''}">₹${o.profit}</td>
            <td class="action-cell"></td>
        `;

        const btn = document.createElement("button");
        btn.className = "btn accept";
        btn.innerText = isDisabled ? "Locked" : "Accept";

        if(isDisabled){
            btn.disabled = true;
            btn.style.opacity = "0.5";
        }else{
            btn.onclick = ()=>acceptOrder(o.orderId,o.payment,o.amount,o.profit);
        }

        tr.querySelector(".action-cell").appendChild(btn);
        tbody.appendChild(tr);
    });

    /* STATS UPDATE */
    const stats = document.querySelectorAll(".stat strong");
    if(stats.length >= 4){
        stats[0].innerText = random(80,150);
        stats[1].innerText = random(3,9);
        stats[2].innerText = random(70,120);
        stats[3].innerText = "₹" + random(3000,12000);
    }
}

/* ================= ACCEPT ORDER (FIXED) ================= */

function acceptOrder(id,payment,amount,profit){
    localStorage.setItem("lastOrderType", profit >= 70 ? "HIGH" : "NORMAL");

    const card = document.getElementById("ordersCard");
    if(card) {
        card.style.opacity = "0";
        setTimeout(()=>{
            card.style.display = "none";
            document.getElementById("mapContainer").classList.add("map-full");
            // Important for Mappls to redraw when going full screen
            if(map) map.invalidateSize();
        },300);
    }

    /* MAP ROUTE LOGIC */
    setTimeout(()=>{
        const pickupLat = 28.61 + (Math.random()*0.02);
        const pickupLng = 77.20 + (Math.random()*0.02);
        const userLat = 28.6139;
        const userLng = 77.2090;

        // Clear existing markers if any (Optional)
        
        // Add Marker for User
        new mappls.Marker({
            map: map,
            position: { "lat": userLat, "lng": userLng },
            popupHtml: '<div>You 📍</div>'
        });

        // Add Marker for Pickup
        new mappls.Marker({
            map: map,
            position: { "lat": pickupLat, "lng": pickupLng },
            popupHtml: '<div>Pickup 🚚</div>'
        });

        // Add Polyline (Route)
        const pathPoints = [
            { lat: userLat, lng: userLng },
            { lat: pickupLat, lng: pickupLng }
        ];

        new mappls.Polyline({
            map: map,
            path: pathPoints,
            strokeColor: '#0a58ff',
            strokeOpacity: 1.0,
            strokeWeight: 5
        });

        // Center map between points
        map.setCenter({ lat: (userLat + pickupLat)/2, lng: (userLng + pickupLng)/2 });
        map.setZoom(14);

    },500);
}

/* ================= VERIFICATION UI ================= */

function initVerificationUI(){
    const idType = document.getElementById("idType");
    const idNumber = document.getElementById("idNumber");
    const photoInput = document.getElementById("profilePhoto");
    const preview = document.getElementById("preview");

    photoInput?.addEventListener("change", ()=>{
        const file = photoInput.files[0];
        if(file){
            preview.src = URL.createObjectURL(file);
            preview.style.display = "block";
        }
    });

    idType?.addEventListener("change", ()=>{
        idNumber.value = "";
        if(idType.value === "aadhaar"){
            idNumber.maxLength = 12;
            idNumber.oninput = ()=> idNumber.value = idNumber.value.replace(/\D/g,'');
        }
        if(idType.value === "pan"){
            idNumber.maxLength = 10;
            idNumber.oninput = ()=> idNumber.value = idNumber.value.toUpperCase();
        }
    });
}

function validateID(type,value){
    if(type === "aadhaar") return /^[0-9]{12}$/.test(value);
    if(type === "pan") return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value);
    return false;
}

function verifyUser(){
    const file = document.getElementById("profilePhoto").files[0];
    const idType = document.getElementById("idType").value;
    const idNumber = document.getElementById("idNumber").value.trim();

    if(!file || !idType || !validateID(idType,idNumber)){
        alert("Details check kar ❌");
        return;
    }

    localStorage.setItem("isVerified","true");
    const reader = new FileReader();
    reader.onload = function(e){
        localStorage.setItem("profilePhoto", e.target.result);
        const modal = document.getElementById("verifyModal");
        if(modal) modal.style.display = "none";
        const userImg = document.getElementById("userPhoto");
        if(userImg) userImg.src = e.target.result;
        const card = document.querySelector(".profile-card");
        if(card) card.style.display = "none";
    };
    reader.readAsDataURL(file);
}

function openVerify(){
    const modal = document.getElementById("verifyModal");
    if(modal) modal.style.display = "flex";
}
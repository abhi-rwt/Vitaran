/************************************************
 * Vitaran - FINAL PRO DASHBOARD (PRODUCTION) V3
 ************************************************/

let currentPlan = null;
let currentFilter = null;
let currentStatsFilter = "all";
let map;
let markers = [];
let routeLine;
let currentStep = "pickup";
let activeToast = null;

/* =========================================
   🔥 3-DASH MENU + DARK MODE SYSTEM
========================================= */

function toggleMenu() {
  document.getElementById('dropdown').classList.toggle('show');
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('darkMode', isDark);

  const btn = document.getElementById('darkModeBtn');
  if(btn) btn.innerText = isDark? '☀️ Light Mode' : '🌙 Dark Mode';
}

window.onclick = function(e) {
  if (!e.target.matches('.user-photo')) {
    const dropdown = document.getElementById('dropdown');
    if(dropdown) dropdown.classList.remove('show');
  }
}

/* =========================================
   STATS SYSTEM - 🔥 FIXED BACKEND COMPATIBLE
========================================= */

let stats = { 
  totalOrders: 0, 
  active: 0, 
  completed: 0, 
  earnings: 0 
};

let statsByCategory = {
  all: { totalOrders: 0, active: 0, completed: 0, earnings: 0 },
  ecommerce: { totalOrders: 0, active: 0, completed: 0, earnings: 0 },
  food: { totalOrders: 0, active: 0, completed: 0, earnings: 0 },
  grocery: { totalOrders: 0, active: 0, completed: 0, earnings: 0 }
};

async function loadUserStats() {
  const token = localStorage.getItem("token");
  if(!token) return;

  try {
    const res = await fetch('/api/user/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if(data.success) {
      if(data.stats.totalOrders!== undefined){
        stats = data.stats;
        statsByCategory.all = data.stats;
      } else {
        statsByCategory = data.stats;
        stats = data.stats.all || data.stats;
      }
      updateStatsUI();
    }
  } catch (err) {
    console.log('Stats load error:', err);
  }
}

function updateStatsUI(){
    const currentStats = statsByCategory[currentStatsFilter] || stats || {};
    document.getElementById("stat-total").innerText = currentStats.totalOrders || 0;
    document.getElementById("stat-active").innerText = currentStats.active || 0;
    document.getElementById("stat-completed").innerText = currentStats.completed || 0;
    document.getElementById("stat-earnings").innerText = `₹${currentStats.earnings || 0}`;
    
    const titles = {
        all: "Dashboard Stats",
        ecommerce: "E-Commerce Stats", 
        food: "Food Delivery Stats",
        grocery: "Grocery Delivery Stats"
    };
    const titleEl = document.getElementById("statsTitle");
    if(titleEl) titleEl.innerText = titles[currentStatsFilter] || "Dashboard Stats";
}

// 🔥 MAIN INIT
document.addEventListener("DOMContentLoaded", async () => {
    if(localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark');
      const btn = document.getElementById('darkModeBtn');
      if(btn) btn.innerText = '☀️ Light Mode';
    }

    updateStatsUI();
    initMap();
    initActionFlow();
    initVerificationUI();
    initStatsFilter();

    const token = localStorage.getItem("token");
    if(!token){
        window.location.href = "login.html";
        return;
    }

    try {
        const res = await fetch('/api/user/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Auth failed');

        const user = await res.json();

        const userId = user._id;
        localStorage.setItem('userId', userId);

        const planBadge = document.querySelector(".badge");
        if(planBadge) planBadge.innerText = user.plan + " Active";
        currentPlan = user.plan;

        if (user.isFirstLogin &&!user.isVerified) {
            document.getElementById("ordersCard").style.display = "none";
            document.getElementById("profileNotice").style.display = "flex";
            document.getElementById("verifyModal").style.display = "flex";
            document.body.classList.add("modal-open");
            initFilterButtons(); // 🔥 FIX: Verify na bhi ho to button chale
        } else {
            document.getElementById("profileNotice").style.display = "none";
            document.getElementById("verifyModal").style.display = "none";
            document.getElementById("ordersCard").style.display = "block";
            document.body.classList.remove("modal-open");

            const userPhoto = document.getElementById("userPhoto");
            if(userPhoto && user.photo) userPhoto.src = user.photo;

            await loadUserStats();
            initFilterButtons();
            initDashboard();
        }
    } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        window.location.href = "login.html";
    }
});

/* =========================================
   STATS FILTER INIT
========================================= */

function initStatsFilter(){
    const statsFilter = document.getElementById('statsFilter');
    if(statsFilter){
        statsFilter.onchange = (e) => {
            currentStatsFilter = e.target.value;
            updateStatsUI();
        };
    }
}

/* =========================================
   LOCK SYSTEM
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

function getSmartKM(platform){
    if(["Swiggy","Zomato"].includes(platform)) return (Math.random()*2 + 1).toFixed(1);
    if(["Zepto","Instamart","Blinkit"].includes(platform)) return (Math.random()*2 + 1.5).toFixed(1);
    if(["Amazon","Flipkart","Meesho","Myntra"].includes(platform)) return (Math.random()*5 + 3).toFixed(1);
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

/* ================= PLATFORM CONFIG ================= */

const PLATFORM_CONFIG = {
    ecommerce: ["Amazon","Flipkart","Meesho","Myntra"],
    food: ["Swiggy","Zomato"],
    grocery: ["Zepto","Instamart","Blinkit"],
    all: ["Amazon","Flipkart","Meesho","Myntra","Swiggy","Zomato","Zepto","Instamart","Blinkit"]
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

function getAllowedPlatforms(plan){
    if(!plan) return [];
    plan = plan.toString().toLowerCase().trim();

    if(plan.includes("all-in-one") || plan.includes("all in one")) return PLATFORM_CONFIG.all;
    if(plan.includes("e-commerce") || plan.includes("ecommerce")) return PLATFORM_CONFIG.ecommerce;
    if(plan.includes("both")) return [...PLATFORM_CONFIG.food,...PLATFORM_CONFIG.grocery];
    if(plan.includes("food")) return PLATFORM_CONFIG.food;
    if(plan.includes("grocery")) return PLATFORM_CONFIG.grocery;
    
    return [];
}

function getPlatformsFromFilter(filter){
    if(filter === "All-in-One") return PLATFORM_CONFIG.all;
    if(filter === "E-Commerce") return PLATFORM_CONFIG.ecommerce;
    if(filter === "Food") return PLATFORM_CONFIG.food;
    if(filter === "Grocery") return PLATFORM_CONFIG.grocery;
    if(filter === "Both") return [...PLATFORM_CONFIG.food,...PLATFORM_CONFIG.grocery];
    return PLATFORM_CONFIG.all;
}

function getSubscriptionCategory(platform){
    if(PLATFORM_CONFIG.ecommerce.includes(platform)) return "e-commerce";
    if(PLATFORM_CONFIG.food.includes(platform)) return "quick-commerce-food";
    if(PLATFORM_CONFIG.grocery.includes(platform)) return "quick-commerce-grocery";
    return "all-in-one";
}

/* ================= 🔥 FILTER BUTTON HANDLERS - BACKUP ================= */

function handleMainFilter(plan){
    console.log("🔥 Main button clicked:", plan);
    const subPlanRow = document.getElementById('subPlanFilters');
    const planLower = currentPlan? currentPlan.toLowerCase() : "";
    
    if(plan === "Quick Commerce"){
        subPlanRow.style.display = "flex";
        if(planLower.includes("food")) currentFilter = "Food";
        else if(planLower.includes("grocery")) currentFilter = "Grocery";
        else if(planLower.includes("both")) currentFilter = "Both";
        else currentFilter = "Food";
    } else {
        subPlanRow.style.display = "none";
        currentFilter = plan;
    }

    updateFilterUI();
    initDashboard();
}

function handleSubFilter(subplan){
    console.log("🔥 Sub button clicked:", subplan);
    currentFilter = subplan;
    updateFilterUI();
    initDashboard();
}

/* ================= FILTER BUTTONS INIT ================= */

function initFilterButtons(){
    const mainBtns = document.querySelectorAll('.main-plans.filter-btn');
    const subBtns = document.querySelectorAll('.sub-plans.filter-btn');
    const subPlanRow = document.getElementById('subPlanFilters');

    const planLower = currentPlan? currentPlan.toLowerCase() : "";
    
    if(planLower.includes("all-in-one") || planLower.includes("all in one")){
        currentFilter = "All-in-One";
    } else if(planLower.includes("e-commerce") || planLower.includes("ecommerce")){
        currentFilter = "E-Commerce";
    } else if(planLower.includes("food")){
        currentFilter = "Food";
    } else if(planLower.includes("grocery")){
        currentFilter = "Grocery";
    } else if(planLower.includes("both")){
        currentFilter = "Both";
    } else {
        currentFilter = "E-Commerce";
    }

    console.log("🔥 Plan:", currentPlan, "| Auto Filter:", currentFilter);

    mainBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            handleMainFilter(this.dataset.plan);
        });
    });

    subBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            handleSubFilter(this.dataset.subplan);
        });
    });

    if(planLower.includes("quick commerce") || planLower.includes("food") || planLower.includes("grocery") || planLower.includes("both")){
        subPlanRow.style.display = "flex";
    }
    updateFilterUI();
}

function updateFilterUI(){
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');

        if(btn.dataset.plan === currentFilter){
            btn.classList.add('active');
        }
        if(btn.dataset.plan === "Quick Commerce" && ["Food","Grocery","Both"].includes(currentFilter)){
            btn.classList.add('active');
        }

        if(btn.dataset.subplan === currentFilter){
            btn.classList.add('active');
        }
    });
}

/* ================= DASHBOARD - UPGRADE BUTTON ================= */

function initDashboard(){
    const tbody = document.querySelector(".table tbody");
    if(!tbody) return;
    tbody.innerHTML = "";

    console.log("🔥 Current Plan:", currentPlan, "| Filter:", currentFilter);

    const allowedPlatforms = getAllowedPlatforms(currentPlan);
    const filterPlatforms = getPlatformsFromFilter(currentFilter);

    let orders = [];
    for(let i=0; i<15; i++){
        const name = filterPlatforms[Math.floor(Math.random()*filterPlatforms.length)];
        const profit = Math.floor(Math.random()*90 + 10);
        const km = getSmartKM(name);

        orders.push({
            platform: name,
            id: Math.floor(Math.random()*9000),
            amount: Math.floor(Math.random()*800 + 100),
            km: km,
            profit: profit,
            isAllowed: allowedPlatforms.includes(name)
        });
    }

    orders.sort((a,b)=>b.profit - a.profit);

    orders.forEach((o,index)=>{
        const tr = document.createElement("tr");
        const isHigh = o.profit >= 50;

        if(index < 2 && o.isAllowed) tr.classList.add("high-profit-row");
        if(!o.isAllowed) tr.style.opacity = "0.7";

        const planLocked =!o.isAllowed;
        const profitLocked = (lastDelivered === "high" && isHigh);

        tr.innerHTML = `
        <td>
            <img src="${getLogo(o.platform)}" alt="${o.platform}">
            ${o.platform}
        </td>
        <td>#VT${o.id}</td>
        <td>COD</td>
        <td>₹${o.amount}</td>
        <td>${o.km} KM</td>
        <td class="${isHigh && o.isAllowed? "green" : ""}">₹${o.profit}</td>
        <td>
            <button class="btn ${planLocked? 'upgrade' : 'accept'}" 
                    ${profitLocked &&!planLocked? 'disabled' : ''}>
                ${planLocked? 'Upgrade' : (profitLocked? 'Locked' : 'Accept')}
            </button>
        </td>
        `;

        const btn = tr.querySelector("button");
        btn.onclick = () => {
            if(planLocked){
                const category = getSubscriptionCategory(o.platform);
                showToast(`Upgrade to ${category} plan`);
                setTimeout(()=>{
                    window.location.href = `subscription.html?plan=${category}`;
                }, 800);
                return;
            }
            if(profitLocked){
                showToast("Low profit order complete karo ❌","error");
                return;
            }
            acceptOrder(parseFloat(o.km), o.profit, o.platform);
        };
        tbody.appendChild(tr);
    });
}

/* ================= ACCEPT ORDER ================= */

async function acceptOrder(orderKM,profit,platform){
    localStorage.setItem("currentOrderProfit", profit);
    localStorage.setItem("currentOrderPlatform", platform);

    try {
      const token = localStorage.getItem("token");
      await fetch('/api/user/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'accept', platform: platform })
      });
    } catch(err) {
      console.log('Stats update error:', err);
    }

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

    document.getElementById("payBtn").onclick = async ()=>{
        const profit = parseInt(localStorage.getItem("currentOrderProfit") || "0");
        const platform = localStorage.getItem("currentOrderPlatform") || "";

        try {
          const token = localStorage.getItem("token");
          await fetch('/api/user/update-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ action: 'complete', profit: profit, platform: platform })
          });
        } catch(err) {
          console.log('Stats update error:', err);
        }

        lastDelivered = (profit >= 50)? "high" : "none";
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

/* ================= VERIFY SYSTEM ================= */

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
                };
                reader.readAsDataURL(file);
            }
        };
    }

    if(verifyBtn){
        verifyBtn.onclick = verifyUser;
    }

    const idTypeSelect = document.getElementById("idType");
    const idNumberInput = document.getElementById("idNumber");

    if(idTypeSelect && idNumberInput){
        idTypeSelect.onchange = () => {
            const type = idTypeSelect.value;

            if(type === 'Aadhar' || type === 'Aadhaar Card' || type === 'aadhaar'){
                idNumberInput.type = 'text';
                idNumberInput.inputMode = 'numeric';
                idNumberInput.maxLength = 12;
                idNumberInput.placeholder = 'Enter 12 digit Aadhar';
                idNumberInput.value = '';
            }
            else if(type === 'PAN' || type === 'PAN Card' || type === 'pan'){
                idNumberInput.type = 'text';
                idNumberInput.inputMode = 'text';
                idNumberInput.maxLength = 10;
                idNumberInput.placeholder = 'Enter PAN: ABCDE1234F';
                idNumberInput.value = '';
            }
        };

        idNumberInput.oninput = (e) => {
            const type = idTypeSelect.value;

            if(type === 'Aadhar' || type === 'Aadhaar Card' || type === 'aadhaar'){
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            }
            else if(type === 'PAN' || type === 'PAN Card' || type === 'pan'){
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            }
        };
    }
}

function validateId() {
  let idType = document.getElementById("idType").value;
  const idNum = document.getElementById("idNumber").value.toUpperCase();

  if(idType === 'Aadhaar Card' || idType === 'aadhaar') idType = 'Aadhar';
  if(idType === 'PAN Card' || idType === 'pan') idType = 'PAN';

  if(idType === 'Aadhar') {
    if(!/^\d{12}$/.test(idNum)) {
      showToast('Aadhar must be 12 digits only', 'error');
      return false;
    }
  }
  else if(idType === 'PAN') {
    if(!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(idNum)) {
      showToast('PAN format: ABCDE1234F', 'error');
      return false;
    }
  } else {
    showToast('Please select ID type', 'error');
    return false;
  }

  return true;
}

async function verifyUser(){
    if(!validateId()) return;

    let idType = document.getElementById("idType").value;
    const idNum = document.getElementById("idNumber").value.toUpperCase();
    const token = localStorage.getItem("token");
    const previewImg = document.getElementById("preview");
    const photo = previewImg.src;

    if(idType === 'Aadhaar Card' || idType === 'aadhaar') idType = 'Aadhar';
    if(idType === 'PAN Card' || idType === 'pan') idType = 'PAN';

    if(!photo || photo.includes('149071.png')){
        showToast("Upload Profile Photo 📸", "error");
        return;
    }

    try {
        const res = await fetch('/api/user/verify-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ idType, idNum, photo })
        });

        const data = await res.json();

        if (!res.ok ||!data.success) {
          throw new Error(data.error || 'Verify failed');
        }

        showToast("Verification Successful! ✅");

        setTimeout(() => {
            document.getElementById("verifyModal").style.display = "none";
            location.reload();
        }, 1000);
    } catch (err) {
        showToast(err.message || "Verification failed ❌", "error");
    }
}

function openVerify(){
    document.getElementById("verifyModal").style.display = "flex";
    document.body.classList.add("modal-open");
}

function logout(){
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href="login.html";
}
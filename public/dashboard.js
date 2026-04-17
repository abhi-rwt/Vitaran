/************************************************
 * Vitaran - FINAL PRO DASHBOARD (LEAFLET FIXED)
 ************************************************/

let currentPlan = null;
let map;
let markers = [];
let routeLine;
let currentStep = "pickup";

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
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

/* PLAN FIX (IMPORTANT) */
currentPlan = data.user?.plan || localStorage.getItem("plan") || "All-in-One 1 Month";

/* VERIFY */
if(localStorage.getItem("isVerified") !== "true"){
    setTimeout(()=>{
        document.getElementById("verifyModal").style.display="flex";
    },300);
}else{
    document.querySelector(".profile-card")?.remove();
}

/* PHOTO */
const savedPhoto = localStorage.getItem("profilePhoto");
if(savedPhoto){
    document.getElementById("userPhoto").src = savedPhoto;
}

/* BADGE */
document.querySelector(".badge").innerText = currentPlan + " Active";

/* INIT */
initMap();
initDashboard();
initActionFlow();
initVerificationUI();

}catch(err){
console.log("Error:",err);
}

});


/* ================= MAP ================= */

function initMap(){

map = L.map('map').setView([28.6139,77.2090], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'© OpenStreetMap'
}).addTo(map);

}


/* ================= PLATFORM CONFIG (FULL) ================= */

const PLATFORM_CONFIG = {

"Food 1 Month": [
{ name:"Swiggy", logo:"/logos/swiggy.png" },
{ name:"Zomato", logo:"/logos/zomato.png" }
],
"Food 3 Months": [
{ name:"Swiggy", logo:"/logos/swiggy.png" },
{ name:"Zomato", logo:"/logos/zomato.png" }
],
"Food 12 Months": [
{ name:"Swiggy", logo:"/logos/swiggy.png" },
{ name:"Zomato", logo:"/logos/zomato.png" }
],

"Grocery 1 Month": [
{ name:"Blinkit", logo:"/logos/blinkit.png" },
{ name:"Instamart", logo:"/logos/instamart.png" },
{ name:"Zepto", logo:"/logos/zepto.png" }
],
"Grocery 3 Months": [
{ name:"Blinkit", logo:"/logos/blinkit.png" },
{ name:"Instamart", logo:"/logos/instamart.png" },
{ name:"Zepto", logo:"/logos/zepto.png" }
],
"Grocery 12 Months": [
{ name:"Blinkit", logo:"/logos/blinkit.png" },
{ name:"Instamart", logo:"/logos/instamart.png" },
{ name:"Zepto", logo:"/logos/zepto.png" }
],

"E-Commerce 1 Month": [
{ name:"Amazon", logo:"/logos/amazon.png" },
{ name:"Flipkart", logo:"/logos/flipkart.png" },
{ name:"Meesho", logo:"/logos/meesho.png" },
{ name:"Myntra", logo:"/logos/myntra.png" }
],
"E-Commerce 3 Months": [
{ name:"Amazon", logo:"/logos/amazon.png" },
{ name:"Flipkart", logo:"/logos/flipkart.png" },
{ name:"Meesho", logo:"/logos/meesho.png" },
{ name:"Myntra", logo:"/logos/myntra.png" }
],
"E-Commerce 12 Months": [
{ name:"Amazon", logo:"/logos/amazon.png" },
{ name:"Flipkart", logo:"/logos/flipkart.png" },
{ name:"Meesho", logo:"/logos/meesho.png" },
{ name:"Myntra", logo:"/logos/myntra.png" }
],

"All-in-One 1 Month": [
{ name:"Swiggy", logo:"/logos/swiggy.png" },
{ name:"Zomato", logo:"/logos/zomato.png" },
{ name:"Blinkit", logo:"/logos/blinkit.png" },
{ name:"Instamart", logo:"/logos/instamart.png" },
{ name:"Zepto", logo:"/logos/zepto.png" },
{ name:"Amazon", logo:"/logos/amazon.png" },
{ name:"Flipkart", logo:"/logos/flipkart.png" }
],
"All-in-One 3 Months": [
{ name:"Swiggy", logo:"/logos/swiggy.png" },
{ name:"Zomato", logo:"/logos/zomato.png" },
{ name:"Blinkit", logo:"/logos/blinkit.png" },
{ name:"Instamart", logo:"/logos/instamart.png" },
{ name:"Zepto", logo:"/logos/zepto.png" },
{ name:"Amazon", logo:"/logos/amazon.png" },
{ name:"Flipkart", logo:"/logos/flipkart.png" }
],
"All-in-One 12 Months": [
{ name:"Swiggy", logo:"/logos/swiggy.png" },
{ name:"Zomato", logo:"/logos/zomato.png" },
{ name:"Blinkit", logo:"/logos/blinkit.png" },
{ name:"Instamart", logo:"/logos/instamart.png" },
{ name:"Zepto", logo:"/logos/zepto.png" },
{ name:"Amazon", logo:"/logos/amazon.png" },
{ name:"Flipkart", logo:"/logos/flipkart.png" }
]

};


/* ================= DASHBOARD ================= */

function initDashboard(){

const tbody=document.querySelector(".table tbody");
tbody.innerHTML="";

/* PLAN BASED FILTER */
let platforms = PLATFORM_CONFIG[currentPlan] || PLATFORM_CONFIG["All-in-One 1 Month"];

for(let i=0;i<6;i++){

const km = (Math.random()*6+1).toFixed(1);
const platform = platforms[Math.floor(Math.random()*platforms.length)];

const tr=document.createElement("tr");

tr.innerHTML=`
<td>
<img src="${platform.logo}" style="width:20px;margin-right:6px;">
${platform.name}
</td>
<td>#VT${Math.floor(Math.random()*9000)}</td>
<td><span class="tag">COD</span></td>
<td>₹${Math.floor(Math.random()*800)}</td>
<td>${km} KM</td>
<td class="green">₹${Math.floor(Math.random()*80)}</td>
<td><button class="btn accept">Accept</button></td>
`;

tr.querySelector("button").onclick = ()=>acceptOrder(parseFloat(km));

tbody.appendChild(tr);

}

}


/* ================= ACCEPT ORDER ================= */

function acceptOrder(orderKM){

document.getElementById("mapContainer").classList.add("map-full");
document.getElementById("ordersCard")?.classList.add("fade");

setTimeout(()=>{
document.getElementById("actionBar").style.display="flex";
map.invalidateSize();
},800);

/* CLEAR */
markers.forEach(m=>map.removeLayer(m));
markers=[];
if(routeLine) map.removeLayer(routeLine);

/* USER LOCATION */
navigator.geolocation.getCurrentPosition(async pos=>{

const user = [pos.coords.latitude, pos.coords.longitude];

/* FIXED DISTANCE LOGIC */
const angle = Math.random()*Math.PI*2;

const pickup = [
user[0] + (Math.cos(angle) * orderKM/222),
user[1] + (Math.sin(angle) * orderKM/222)
];

const drop = [
pickup[0] + (Math.cos(angle) * orderKM/111),
pickup[1] + (Math.sin(angle) * orderKM/111)
];

/* MARKERS */
markers.push(L.marker(user).addTo(map).bindPopup("You"));
markers.push(L.marker(pickup).addTo(map).bindPopup("Pickup"));
markers.push(L.marker(drop).addTo(map).bindPopup("Drop"));

/* ROUTE (REAL ROAD) */
const url = `https://router.project-osrm.org/route/v1/driving/${user[1]},${user[0]};${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`;

const res = await fetch(url);
const data = await res.json();

const coords = data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);

routeLine = L.polyline(coords,{color:"#0a58ff",weight:5}).addTo(map);
map.fitBounds(routeLine.getBounds());

},()=>{
alert("Location allow kar ❌");
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
alert("Payment Received 💰");
location.reload();
};

}


/* ================= CAMERA ================= */

function openCamera(){

const input = document.createElement("input");
input.type = "file";
input.accept = "image/*";
input.capture = "environment";

input.click();

input.onchange = ()=>{
if(currentStep==="pickup"){
alert("Pickup Done ✅");
document.getElementById("pickupBtn").style.display="none";
document.getElementById("dropBtn").style.display="inline-block";
}
else{
alert("Drop Done ✅");
document.getElementById("dropBtn").style.display="none";
document.getElementById("payBtn").style.display="inline-block";
}
};

}


/* ================= VERIFY ================= */

function initVerificationUI(){

const photoInput=document.getElementById("profilePhoto");
const preview=document.getElementById("preview");

photoInput?.addEventListener("change",()=>{
const file=photoInput.files[0];
if(file){
preview.src=URL.createObjectURL(file);
preview.style.display="block";
}
});

}

function verifyUser(){

const file=document.getElementById("profilePhoto").files[0];

if(!file){
alert("Photo upload kar ❌");
return;
}

localStorage.setItem("isVerified","true");

const reader=new FileReader();

reader.onload=function(e){
localStorage.setItem("profilePhoto",e.target.result);
location.reload();
};

reader.readAsDataURL(file);

}

function openVerify(){
document.getElementById("verifyModal").style.display="flex";
}

function logout(){
localStorage.clear();
window.location.href="login.html";
}
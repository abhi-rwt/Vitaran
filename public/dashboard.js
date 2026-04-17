/************************************************
 * Vitaran - FINAL PRO DASHBOARD (ULTRA FINAL)
 ************************************************/

let currentPlan = null;
let map;
let markers = [];
let routeLine;
let currentStep = "pickup";
let activeToast = null;


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

/* PLAN */
currentPlan = data.user?.plan || localStorage.getItem("plan") || "All-in-One";

/* BADGE */
document.querySelector(".badge").innerText = currentPlan + " Active";

/* PROFILE PHOTO */
const savedPhoto = localStorage.getItem("profilePhoto");
if(savedPhoto){
document.getElementById("userPhoto").src = savedPhoto;
}

/* VERIFY */
if(localStorage.getItem("isVerified") !== "true"){
document.body.classList.add("modal-open");
document.getElementById("verifyModal").style.display="flex";
}else{
document.querySelector(".profile-card")?.remove();
}

/* INIT */
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


/* ================= PLATFORM CONFIG ================= */

const PLATFORM_CONFIG = {
Food: ["Swiggy","Zomato"],
Grocery: ["Blinkit","Instamart","Zepto"],
"E-Commerce": ["Amazon","Flipkart","Meesho","Myntra"],
"All-in-One": ["Swiggy","Zomato","Blinkit","Instamart","Zepto","Amazon","Flipkart"]
};


/* ================= LOGO FIX ================= */

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


/* ================= PLAN PARSER ================= */

function getPlatformsFromPlan(plan){

if(plan.includes("Food")) return PLATFORM_CONFIG["Food"];
if(plan.includes("Grocery")) return PLATFORM_CONFIG["Grocery"];
if(plan.includes("E-Commerce")) return PLATFORM_CONFIG["E-Commerce"];

return PLATFORM_CONFIG["All-in-One"];
}


/* ================= DASHBOARD ================= */

function initDashboard(){

const tbody=document.querySelector(".table tbody");
tbody.innerHTML="";

const platforms = getPlatformsFromPlan(currentPlan);

for(let i=0;i<6;i++){

const km = (Math.random()*6+1).toFixed(1);
const name = platforms[Math.floor(Math.random()*platforms.length)];

const tr=document.createElement("tr");

tr.innerHTML=`
<td>
<img src="${getLogo(name)}" style="width:20px;margin-right:6px;">
${name}
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
},600);

/* CLEAR */
markers.forEach(m=>map.removeLayer(m));
markers=[];
if(routeLine) map.removeLayer(routeLine);

/* LOCATION */
navigator.geolocation.getCurrentPosition(async pos=>{

const user = [pos.coords.latitude, pos.coords.longitude];

const angle = Math.random()*Math.PI*2;

const pickup = [
user[0] + Math.cos(angle)*(orderKM/222),
user[1] + Math.sin(angle)*(orderKM/222)
];

const drop = [
pickup[0] + Math.cos(angle)*(orderKM/111),
pickup[1] + Math.sin(angle)*(orderKM/111)
];

/* MARKERS */
markers.push(L.marker(user).addTo(map).bindPopup("You"));
markers.push(L.marker(pickup).addTo(map).bindPopup("Pickup"));
markers.push(L.marker(drop).addTo(map).bindPopup("Drop"));

/* ROUTE */
try{

const url = `https://router.project-osrm.org/route/v1/driving/${user[1]},${user[0]};${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`;

const res = await fetch(url);
const data = await res.json();

if(data.routes?.length){

const coords = data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);

routeLine = L.polyline(coords,{
color:"#0a58ff",
weight:5
}).addTo(map);

map.fitBounds(routeLine.getBounds());

}else{
throw "route fail";
}

}catch{

routeLine = L.polyline([user,pickup,drop],{
color:"red"
}).addTo(map);

map.fitBounds(routeLine.getBounds());

}

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


/* ================= CAMERA ================= */

function openCamera(){

const input = document.createElement("input");
input.type="file";
input.accept="image/*";
input.capture="environment";

input.click();

input.onchange=()=>{

if(!input.files.length){
showToast("Photo not captured","error");
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

}


/* ================= VERIFY ================= */

function initVerificationUI(){

const photoInput = document.getElementById("profilePhoto");
const preview = document.getElementById("preview");
const idInput = document.getElementById("idNumber");

/* PHOTO */
photoInput?.addEventListener("change",()=>{
const file = photoInput.files[0];

if(file){

if(file.size > 2 * 1024 * 1024){
showToast("Image must be under 2MB","error");
photoInput.value="";
return;
}

if(!file.type.startsWith("image/")){
showToast("Only image allowed","error");
photoInput.value="";
return;
}

preview.src = URL.createObjectURL(file);
preview.style.display="block";
}
});

/* ID LIMIT */
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
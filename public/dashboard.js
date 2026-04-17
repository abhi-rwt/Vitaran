/************************************************
 * Vitaran - Dashboard (LEAFLET PRO VERSION)
 ************************************************/

let map;
let markers = [];
let polyline;
let currentStep = "pickup";
let userLocation = [28.6139,77.2090];

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {

getLiveLocation();

initDashboard();
initVerificationUI();
initMap();
initActionFlow();

});


/* ================= LIVE LOCATION ================= */

function getLiveLocation(){

if(navigator.geolocation){
navigator.geolocation.getCurrentPosition((pos)=>{

userLocation = [
pos.coords.latitude,
pos.coords.longitude
];

if(map){
map.setView(userLocation,13);
L.marker(userLocation).addTo(map).bindPopup("Your Location");
}

});
}

}


/* ================= MAP ================= */

function initMap(){

map = L.map('map').setView(userLocation, 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
attribution:'© OpenStreetMap'
}).addTo(map);

}


/* ================= ROUTE (REAL ROAD) ================= */

async function drawRoute(user,pickup,drop){

const url = `https://router.project-osrm.org/route/v1/driving/${user[1]},${user[0]};${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`;

const res = await fetch(url);
const data = await res.json();

const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);

if(polyline) map.removeLayer(polyline);

polyline = L.polyline(coords,{
color:"#0a58ff",
weight:5
}).addTo(map);

map.fitBounds(polyline.getBounds());

}


/* ================= DISTANCE BASED LOCATION ================= */

function generateLocation(base,km){

const earthRadius = 6371;

const dLat = (km / earthRadius) * (180 / Math.PI);
const dLng = dLat / Math.cos(base[0] * Math.PI/180);

return [
base[0] + dLat,
base[1] + dLng
];

}


/* ================= ACCEPT ================= */

function acceptOrder(km){

document.getElementById("mapContainer").classList.add("map-full");
document.getElementById("ordersCard")?.classList.add("fade");

setTimeout(()=>{
document.getElementById("actionBar").style.display="flex";
map.invalidateSize();
},800);

/* CLEAR */
markers.forEach(m=>map.removeLayer(m));
markers=[];
if(polyline) map.removeLayer(polyline);

setTimeout(()=>{

const user = userLocation;

const pickup = generateLocation(user, km/2);
const drop = generateLocation(pickup, km/2);

/* TEXT */
document.getElementById("pickupText").innerText = "Pickup Location";
document.getElementById("dropText").innerText = "Drop Location";

/* MARKERS */
const m1 = L.marker(user).addTo(map).bindPopup("You");
const m2 = L.marker(pickup).addTo(map).bindPopup("Pickup");
const m3 = L.marker(drop).addTo(map).bindPopup("Drop");

markers.push(m1,m2,m3);

/* ROUTE */
drawRoute(user,pickup,drop);

},500);

}


/* ================= ACTION FLOW ================= */

function initActionFlow(){

document.getElementById("pickupBtn").onclick = () => {
currentStep = "pickup";
openPhotoModal("Pickup Photo Required");
};

document.getElementById("dropBtn").onclick = () => {
currentStep = "drop";
openPhotoModal("Drop Photo Required");
};

document.getElementById("payBtn").onclick = () => {
alert("Payment Received 💰");
document.getElementById("actionBar").style.display = "none";
location.reload();
};

}


/* ================= PHOTO ================= */

function openPhotoModal(title){
document.getElementById("photoTitle").innerText = title;
document.getElementById("photoModal").style.display = "flex";
}

document.getElementById("photoInput")?.addEventListener("change",function(){
const file=this.files[0];
if(file){
const preview=document.getElementById("photoPreview");
preview.src=URL.createObjectURL(file);
preview.style.display="block";
}
});

function submitPhoto(){

document.getElementById("photoModal").style.display="none";

if(currentStep==="pickup"){
alert("Pickup Done ✅");
document.getElementById("pickupBtn").style.display="none";
document.getElementById("dropBtn").style.display="inline-block";
}
else if(currentStep==="drop"){
alert("Drop Done ✅");
document.getElementById("dropBtn").style.display="none";
document.getElementById("payBtn").style.display="inline-block";
}

}


/* ================= DASHBOARD ================= */

function initDashboard(){

const tbody=document.querySelector(".table tbody");
tbody.innerHTML="";

for(let i=0;i<6;i++){

const km = (Math.random()*6+1).toFixed(1);

const tr=document.createElement("tr");

tr.innerHTML=`
<td>Swiggy</td>
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
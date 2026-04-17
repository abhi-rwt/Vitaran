/************************************************
 * Vitaran - Dashboard (LEAFLET FINAL FLOW)
 ************************************************/

let currentPlan = null;
let map;
let markers = [];
let polyline;
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
    const img=document.getElementById("userPhoto");
    if(img) img.src=savedPhoto;
}

currentPlan=data.user?.plan || "Active";

document.querySelector(".badge").innerText=currentPlan+" Active";

/* INIT */
initDashboard();
initVerificationUI();
initMap();
initActionFlow();

}catch(err){
console.log("Dashboard error:",err);
}

});


/* ================= LEAFLET MAP ================= */

function initMap(){

map = L.map('map').setView([28.6139,77.2090], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'© OpenStreetMap'
}).addTo(map);

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


/* ================= ACCEPT ================= */

function acceptOrder(){

document.getElementById("mapContainer").classList.add("map-full");
document.getElementById("ordersCard")?.classList.add("fade");

setTimeout(()=>{
document.getElementById("actionBar").style.display="flex";
map.invalidateSize(); // 🔥 FIX
},800);

/* CLEAR */
markers.forEach(m=>map.removeLayer(m));
markers=[];
if(polyline) map.removeLayer(polyline);

setTimeout(()=>{

const user = [28.6139,77.2090];

const pickup = [
user[0] + (Math.random()*0.02),
user[1] + (Math.random()*0.02)
];

const drop = [
pickup[0] + (Math.random()*0.02),
pickup[1] + (Math.random()*0.02)
];

/* TEXT */
document.getElementById("pickupText").innerText = "Pickup: Connaught Place";
document.getElementById("dropText").innerText = "Drop: India Gate";

/* MARKERS */
const m1 = L.marker(user).addTo(map);
const m2 = L.marker(pickup).addTo(map);
const m3 = L.marker(drop).addTo(map);

markers.push(m1,m2,m3);

/* LINE */
polyline = L.polyline([user,pickup,drop], {
color:"#0a58ff",
weight:5
}).addTo(map);

/* FIT */
map.fitBounds(polyline.getBounds());

},500);

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
if(!tbody) return;

tbody.innerHTML="";

for(let i=0;i<6;i++){

const tr=document.createElement("tr");

tr.innerHTML=`
<td>Swiggy</td>
<td>#VT${Math.floor(Math.random()*9000)}</td>
<td><span class="tag">COD</span></td>
<td>₹${Math.floor(Math.random()*800)}</td>
<td>${(Math.random()*5+1).toFixed(1)} KM</td>
<td class="green">₹${Math.floor(Math.random()*80)}</td>
<td><button class="btn accept">Accept</button></td>
`;

tr.querySelector("button").onclick = acceptOrder;

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
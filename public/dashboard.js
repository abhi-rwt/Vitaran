/************************************************
 * Vitaran - Dashboard (MAPPLS FINAL FLOW)
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
    const card=document.querySelector(".profile-card");
    if(card) card.style.display="none";
}

/* PHOTO */
const savedPhoto = localStorage.getItem("profilePhoto");
if(savedPhoto){
    const img=document.getElementById("userPhoto");
    if(img) img.src=savedPhoto;
}

if(!data.user.plan){
    window.location.href="subscription.html";
    return;
}

currentPlan=data.user.plan;

const badge=document.querySelector(".badge");
if(badge){
    badge.innerText=currentPlan+" Active";
}

/* INIT */
initDashboard(currentPlan);
initVerificationUI();
waitForMap();
initActionFlow();

}catch(err){
console.log("Dashboard error:",err);
}

});


/* ================= MAP LOAD SAFE ================= */

function waitForMap(){
if(typeof mappls === "undefined"){
    setTimeout(waitForMap,500);
    return;
}
initMap();
}

function initMap(){

map = new mappls.Map("map", {
    center: [28.6139, 77.2090],
    zoom: 12
});

console.log("✅ Mappls Loaded");

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

/* SHOW BUTTON */
setTimeout(()=>{
document.getElementById("actionBar").style.display="flex";
},800);

/* CLEAR */
markers.forEach(m=>m.remove());
markers=[];
if(polyline) polyline.remove();

setTimeout(()=>{

const user = { lat: 28.6139, lng: 77.2090 };

const pickup = {
    lat: user.lat + (Math.random()*0.02),
    lng: user.lng + (Math.random()*0.02)
};

const drop = {
    lat: pickup.lat + (Math.random()*0.02),
    lng: pickup.lng + (Math.random()*0.02)
};

/* TEXT */
document.getElementById("pickupText").innerText = "Pickup: Connaught Place";
document.getElementById("dropText").innerText = "Drop: India Gate";

/* MARKERS */
const m1 = new mappls.Marker({
map: map,
position: user
});

const m2 = new mappls.Marker({
map: map,
position: pickup
});

const m3 = new mappls.Marker({
map: map,
position: drop
});

markers.push(m1,m2,m3);

/* LINE */
polyline = new mappls.Polyline({
map: map,
path: [user, pickup, drop],
strokeColor: "#0a58ff",
strokeWeight: 5
});

/* CENTER */
map.setCenter({
lat:(user.lat+drop.lat)/2,
lng:(user.lng+drop.lng)/2
});

map.setZoom(14);

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
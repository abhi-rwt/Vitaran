/************************************************
 * Vitaran - Dashboard (ULTRA FINAL VERSION)
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

/* 🔥 VERIFY POPUP */
if(localStorage.getItem("isVerified") !== "true"){
setTimeout(()=>{
document.getElementById("verifyModal").style.display = "flex";
},300);
}

/* 🔥 HIDE PROFILE CARD */
if(localStorage.getItem("isVerified") === "true"){
const card = document.querySelector(".profile-card");
if(card) card.style.display = "none";
}

/* 🔥 LOAD PROFILE PHOTO */
const savedPhoto = localStorage.getItem("profilePhoto");
if(savedPhoto){
const img = document.getElementById("userPhoto");
if(img) img.src = savedPhoto;
}

/* PLAN CHECK */
if (!data.user.plan) {
window.location.href = "subscription.html";
return;
}

currentPlan = data.user.plan;

/* BADGE */
const badge = document.querySelector(".badge");
if (badge) {
badge.innerText = currentPlan + " Active";
}

/* INIT */
initDashboard(currentPlan);
initMap();
initVerificationUI();

} catch (err) {
console.log("Dashboard error:", err);
}

});


/* ================= LOGOUT ================= */

function logout(){
localStorage.clear();
window.location.href="login.html";
}


/* ================= MAP ================= */

function initMap(){

map = L.map('map').setView([28.6139, 77.2090], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
attribution:'© OpenStreetMap'
}).addTo(map);

}


/* ================= PLAN ================= */

const PLAN_CONFIG = {
"E-Commerce 1 Month": { platforms: ["Amazon","Flipkart","Meesho","Myntra"], maxProfit: 60 },
"Food 1 Month": { platforms: ["Swiggy","Zomato"], maxProfit: 80 },
"Grocery 1 Month": { platforms: ["Zepto","Instamart","Blinkit"], maxProfit: 80 },
"All-in-One 1 Month":{
platforms:["Amazon","Flipkart","Meesho","Myntra","Swiggy","Zomato","Zepto","Instamart","Blinkit"],
maxProfit:100
}
};


/* ================= DASHBOARD ================= */

function initDashboard(userPlan){

let config = PLAN_CONFIG[userPlan] || PLAN_CONFIG["All-in-One 1 Month"];

const random = (min,max)=> Math.floor(Math.random()*(max-min+1))+min;
const randomFrom = arr => arr[Math.floor(Math.random()*arr.length)];

function platformLogo(name){
const lower = name.toLowerCase();
if(lower === "myntra") return "/logos/myntra.jpeg";
return `/logos/${lower}.png`;
}

const BASE_PAY = 25;
const PER_KM = 8;
const COMMISSION = 0.02;

const orders = [];

for(let i=0;i<random(5,9);i++){

const amount = random(150,1000);
const km = parseFloat((Math.random()*8+1).toFixed(1));

let profit = Math.round(BASE_PAY + (km * PER_KM) + (amount * COMMISSION));

if(profit > config.maxProfit){
profit = config.maxProfit;
}

orders.push({
platform: randomFrom(config.platforms),
orderId: "VT" + random(1000,9999),
payment: Math.random() > 0.5 ? "PAID" : "COD",
amount,
km,
profit
});

}

orders.sort((a,b)=>b.profit-a.profit);

const tbody = document.querySelector(".table tbody");
tbody.innerHTML="";

const lastOrderType = localStorage.getItem("lastOrderType");

orders.forEach((o,index)=>{

const tr = document.createElement("tr");
if(index===0) tr.classList.add("priority");

const isHigh = o.profit >= 70;
const isDisabled = (lastOrderType === "HIGH" && isHigh);

tr.innerHTML = `
<td>
<img src="${platformLogo(o.platform)}" onerror="this.src='/logos/default.png'">
${o.platform}
</td>
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

/* STATS */

const stats = document.querySelectorAll(".stat strong");

if(stats.length >= 4){
const active = random(3,9);
const completed = random(70,120);

stats[0].innerText = active + completed;
stats[1].innerText = active;
stats[2].innerText = completed;
stats[3].innerText = "₹" + random(3000,12000);
}

}


/* ================= ACCEPT (UBER STYLE) ================= */

function acceptOrder(id,payment,amount,profit){

localStorage.setItem("lastOrderType", profit >= 70 ? "HIGH" : "NORMAL");

/* 🔥 STEP 1: TABLE FADE */
const card = document.getElementById("ordersCard");
card.style.opacity = "0";
card.style.transform = "translateY(20px)";

/* 🔥 STEP 2: MAP FULL SCREEN */
setTimeout(()=>{
card.style.display = "none";

const mapBox = document.getElementById("mapContainer");
mapBox.classList.add("map-full");

map.invalidateSize();

},300);

/* 🔥 STEP 3: ADD ROUTE */
setTimeout(()=>{

const pickupLat = 28.61 + (Math.random()*0.02);
const pickupLng = 77.20 + (Math.random()*0.02);

const userLat = 28.6139;
const userLng = 77.2090;

/* MARKERS */
const pickup = L.marker([pickupLat,pickupLng]).addTo(map);
pickup.bindPopup("Pickup 🚚").openPopup();

const user = L.marker([userLat,userLng]).addTo(map);
user.bindPopup("You 📍");

/* ROUTE LINE */
const route = L.polyline([
[userLat,userLng],
[pickupLat,pickupLng]
],{
color:"#0a58ff",
weight:5
}).addTo(map);

/* FIT VIEW */
map.fitBounds(route.getBounds());

},500);

}


/* ================= VERIFY UI ================= */

function initVerificationUI(){

const idType = document.getElementById("idType");
const idNumber = document.getElementById("idNumber");
const photoInput = document.getElementById("profilePhoto");
const preview = document.getElementById("preview");

/* PHOTO PREVIEW */
photoInput?.addEventListener("change", ()=>{
const file = photoInput.files[0];
if(file){
preview.src = URL.createObjectURL(file);
preview.style.display = "block";
}
});

/* INPUT CONTROL */
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


/* ================= VALIDATION ================= */

function validateID(type,value){

if(type === "aadhaar"){
return /^[0-9]{12}$/.test(value);
}

if(type === "pan"){
return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value);
}

return false;
}


/* ================= VERIFY ================= */

function verifyUser(){

const file = document.getElementById("profilePhoto").files[0];
const idType = document.getElementById("idType").value;
const idNumber = document.getElementById("idNumber").value.trim();

if(!file){
alert("Photo upload kar ❌");
return;
}

if(!idType){
alert("ID select kar ❌");
return;
}

if(!validateID(idType,idNumber)){
alert("Invalid ID ❌");
return;
}

/* SAVE */
localStorage.setItem("isVerified","true");

/* SAVE PHOTO */
const reader = new FileReader();

reader.onload = function(e){

localStorage.setItem("profilePhoto", e.target.result);

/* UI UPDATE */
document.getElementById("verifyModal").style.display = "none";

const img = document.getElementById("userPhoto");
if(img) img.src = e.target.result;

const card = document.querySelector(".profile-card");
if(card) card.style.display = "none";

};

reader.readAsDataURL(file);

}


/* ================= OPEN POPUP ================= */

function openVerify(){
document.getElementById("verifyModal").style.display = "flex";
}
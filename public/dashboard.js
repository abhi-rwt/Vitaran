/************************************************
 * Vitaran - Dashboard (FINAL STABLE MAP)
 ************************************************/

let currentPlan = null;
let map;
let markers = [];

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

/* 🔥 SAFE MAP INIT */
waitForMap();

}catch(err){
console.log("Dashboard error:",err);
}

});


/* ================= MAP SAFE LOAD ================= */

function waitForMap(){
if(typeof mappls === "undefined"){
    console.log("⏳ waiting map...");
    setTimeout(waitForMap,500);
    return;
}
initMap();
}

function initMap(){

const mapDiv = document.getElementById("map");
if(!mapDiv){
    console.log("❌ map div missing");
    return;
}

map = new mappls.Map("map",{
    center:[28.6139,77.2090],
    zoom:12
});

console.log("✅ Map Loaded");

/* 🔥 IMPORTANT FIX */
setTimeout(()=>{
    if(map){
        map.resize();
    }
},800);

}


/* ================= LOGOUT ================= */

function logout(){
localStorage.clear();
window.location.href="login.html";
}


/* ================= PLAN ================= */

const PLAN_CONFIG = {
"E-Commerce 1 Month":{platforms:["Amazon","Flipkart","Meesho","Myntra"],maxProfit:60},
"Food 1 Month":{platforms:["Swiggy","Zomato"],maxProfit:80},
"Grocery 1 Month":{platforms:["Zepto","Instamart","Blinkit"],maxProfit:80},
"All-in-One 1 Month":{
platforms:["Amazon","Flipkart","Meesho","Myntra","Swiggy","Zomato","Zepto","Instamart","Blinkit"],
maxProfit:100
}
};


/* ================= DASHBOARD ================= */

function initDashboard(userPlan){

let config = PLAN_CONFIG[userPlan] || PLAN_CONFIG["All-in-One 1 Month"];

const random=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const randomFrom=arr=>arr[Math.floor(Math.random()*arr.length)];

function platformLogo(name){
const lower=name.toLowerCase();
if(lower==="myntra") return "/logos/myntra.jpeg";
return `/logos/${lower}.png`;
}

const orders=[];

for(let i=0;i<random(5,9);i++){

const amount=random(150,1000);
const km=(Math.random()*8+1).toFixed(1);

let profit=Math.round(25+(km*8)+(amount*0.02));

if(profit>config.maxProfit){
profit=config.maxProfit;
}

orders.push({
platform:randomFrom(config.platforms),
orderId:"VT"+random(1000,9999),
payment:Math.random()>0.5?"PAID":"COD",
amount,km,profit
});

}

orders.sort((a,b)=>b.profit-a.profit);

const tbody=document.querySelector(".table tbody");
if(!tbody) return;

tbody.innerHTML="";

orders.forEach((o,index)=>{

const tr=document.createElement("tr");

if(index===0) tr.classList.add("priority");

tr.innerHTML=`
<td><img src="${platformLogo(o.platform)}"> ${o.platform}</td>
<td>#${o.orderId}</td>
<td><span class="tag">${o.payment}</span></td>
<td>₹${o.amount}</td>
<td>${o.km} KM</td>
<td class="${o.profit>=70?'green':''}">₹${o.profit}</td>
<td class="action-cell"></td>
`;

const btn=document.createElement("button");
btn.className="btn accept";
btn.innerText="Accept";

btn.onclick=()=>acceptOrder(o.orderId,o.payment,o.amount,o.profit);

tr.querySelector(".action-cell").appendChild(btn);
tbody.appendChild(tr);

});

}


/* ================= ACCEPT (UBER FLOW FIXED) ================= */

function acceptOrder(id,payment,amount,profit){

/* FULLSCREEN MAP */
const mapBox=document.getElementById("mapContainer");
mapBox.classList.add("map-full");

/* FADE TABLE */
const card=document.getElementById("ordersCard");
if(card){
card.classList.add("fade");
}

/* CLEAR OLD MARKERS */
markers.forEach(m=>m.remove());
markers=[];

/* WAIT FOR ANIMATION THEN DRAW */
setTimeout(()=>{

if(!map) return;

/* 🔥 IMPORTANT */
map.resize();

const userLat=28.6139;
const userLng=77.2090;

const pickupLat=userLat+(Math.random()*0.02);
const pickupLng=userLng+(Math.random()*0.02);

/* MARKERS */

const userMarker = new mappls.Marker({
map:map,
position:{lat:userLat,lng:userLng}
});

const pickupMarker = new mappls.Marker({
map:map,
position:{lat:pickupLat,lng:pickupLng}
});

markers.push(userMarker,pickupMarker);

/* ROUTE LINE */

new mappls.Polyline({
map:map,
path:[
{lat:userLat,lng:userLng},
{lat:pickupLat,lng:pickupLng}
],
strokeColor:"#0a58ff",
strokeWeight:5
});

/* CENTER */

map.setCenter({
lat:(userLat+pickupLat)/2,
lng:(userLng+pickupLng)/2
});

map.setZoom(14);

},500);

}


/* ================= VERIFY ================= */

function initVerificationUI(){

const idType=document.getElementById("idType");
const idNumber=document.getElementById("idNumber");
const photoInput=document.getElementById("profilePhoto");
const preview=document.getElementById("preview");

photoInput?.addEventListener("change",()=>{
const file=photoInput.files[0];
if(file){
preview.src=URL.createObjectURL(file);
preview.style.display="block";
}
});

idType?.addEventListener("change",()=>{

idNumber.value="";

if(idType.value==="aadhaar"){
idNumber.maxLength=12;
idNumber.oninput=()=>idNumber.value=idNumber.value.replace(/\D/g,'');
}

if(idType.value==="pan"){
idNumber.maxLength=10;
idNumber.oninput=()=>idNumber.value=idNumber.value.toUpperCase();
}

});

}


function validateID(type,value){
if(type==="aadhaar") return /^[0-9]{12}$/.test(value);
if(type==="pan") return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value);
return false;
}


function verifyUser(){

const file=document.getElementById("profilePhoto").files[0];
const idType=document.getElementById("idType").value;
const idNumber=document.getElementById("idNumber").value.trim();

if(!file || !idType || !validateID(idType,idNumber)){
alert("Details check kar ❌");
return;
}

localStorage.setItem("isVerified","true");

const reader=new FileReader();

reader.onload=function(e){

localStorage.setItem("profilePhoto",e.target.result);

document.getElementById("verifyModal").style.display="none";

const img=document.getElementById("userPhoto");
if(img) img.src=e.target.result;

const card=document.querySelector(".profile-card");
if(card) card.style.display="none";

};

reader.readAsDataURL(file);

}


function openVerify(){
document.getElementById("verifyModal").style.display="flex";
}
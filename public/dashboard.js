/************************************************
 * Vitaran - Dashboard (FINAL PRO FLOW)
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
initMap();

initActionFlow(); // 🔥 NEW

}catch(err){
console.log("Dashboard error:",err);
}

});


/* ================= GOOGLE MAP ================= */

function initMap(){

const mapDiv = document.getElementById("map");

if(!mapDiv){
    console.log("❌ map div missing");
    return;
}

map = new google.maps.Map(mapDiv, {
    center: { lat: 28.6139, lng: 77.2090 },
    zoom: 12,
});

}


/* ================= ACTION FLOW ================= */

function initActionFlow(){

const pickupBtn = document.getElementById("pickupBtn");
const dropBtn = document.getElementById("dropBtn");
const payBtn = document.getElementById("payBtn");

/* PICKUP */
pickupBtn.onclick = () => {
currentStep = "pickup";
openPhotoModal("Pickup Photo Required");
};

/* DROP */
dropBtn.onclick = () => {
currentStep = "drop";
openPhotoModal("Drop Photo Required");
};

/* PAYMENT */
payBtn.onclick = () => {

alert("Payment Received 💰");

document.getElementById("actionBar").style.display = "none";
location.reload();

};

}


/* ================= ACCEPT ================= */

function acceptOrder(id,payment,amount,profit){

document.getElementById("mapContainer").classList.add("map-full");
document.getElementById("ordersCard")?.classList.add("fade");

/* SHOW BUTTON */
setTimeout(()=>{
document.getElementById("actionBar").style.display="flex";
},800);

/* CLEAR */
markers.forEach(m=>m.setMap(null));
markers=[];
if(polyline) polyline.setMap(null);

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

/* TEXT UI */
document.getElementById("pickupText").innerText = "Pickup: Connaught Place";
document.getElementById("dropText").innerText = "Drop: India Gate";

/* MARKERS */
const m1 = new google.maps.Marker({ position:user, map });
const m2 = new google.maps.Marker({ position:pickup, map });
const m3 = new google.maps.Marker({ position:drop, map });

markers.push(m1,m2,m3);

/* ROUTE */
polyline = new google.maps.Polyline({
path:[user,pickup,drop],
strokeColor:"#0a58ff",
strokeWeight:5
});

polyline.setMap(map);

/* FIT */
const bounds = new google.maps.LatLngBounds();
bounds.extend(user);
bounds.extend(drop);
map.fitBounds(bounds);

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

const PLAN_CONFIG = {
"E-Commerce 1 Month":{platforms:["Amazon","Flipkart","Meesho","Myntra"],maxProfit:60},
"Food 1 Month":{platforms:["Swiggy","Zomato"],maxProfit:80},
"Grocery 1 Month":{platforms:["Zepto","Instamart","Blinkit"],maxProfit:80},
"All-in-One 1 Month":{
platforms:["Amazon","Flipkart","Meesho","Myntra","Swiggy","Zomato","Zepto","Instamart","Blinkit"],
maxProfit:100
}
};

function initDashboard(userPlan){

let config = PLAN_CONFIG[userPlan] || PLAN_CONFIG["All-in-One 1 Month"];

const random=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const randomFrom=arr=>arr[Math.floor(Math.random()*arr.length)];

const tbody=document.querySelector(".table tbody");
if(!tbody) return;

tbody.innerHTML="";

for(let i=0;i<random(5,9);i++){

const amount=random(150,1000);
const km=(Math.random()*8+1).toFixed(1);

let profit=Math.round(25+(km*8)+(amount*0.02));

if(profit>config.maxProfit) profit=config.maxProfit;

const tr=document.createElement("tr");

tr.innerHTML=`
<td>Platform</td>
<td>#VT${random(1000,9999)}</td>
<td><span class="tag">COD</span></td>
<td>₹${amount}</td>
<td>${km} KM</td>
<td class="${profit>=70?'green':''}">₹${profit}</td>
<td><button class="btn accept">Accept</button></td>
`;

tr.querySelector("button").onclick = ()=>acceptOrder();

tbody.appendChild(tr);

}

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

document.querySelector(".profile-card")?.remove();

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
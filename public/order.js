/************************************************
 * Order Page Logic
 ************************************************/

const params = new URLSearchParams(window.location.search);

const orderId = params.get("order");
const payment = params.get("payment");
const amount = params.get("amount");
const profit = params.get("profit");

document.getElementById("orderId").innerText = "Order #" + orderId;
document.getElementById("paymentType").innerText = payment;
document.getElementById("amount").innerText = amount;
document.getElementById("profit").innerText = profit;

/* ================= LEAFLET MAP ================= */

window.onload = function(){

  const map = L.map('map').setView([28.6139, 77.2090], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  // Driver
  L.marker([28.6139, 77.2090]).addTo(map).bindPopup("You");

  // Pickup
  L.marker([28.6220, 77.2100]).addTo(map).bindPopup("Pickup");

  // Drop
  L.marker([28.6300, 77.2200]).addTo(map).bindPopup("Delivery");

};

/* ================= FLOW ================= */

function arrived(){
  alert("Reached Pickup");
  document.getElementById("pickedBtn").disabled = false;
}

function picked(){
  alert("Order Picked");
  document.getElementById("deliverBtn").disabled = false;
}

function delivered(){

  if(payment === "COD"){
    const cash = prompt("Enter cash received:");
    if(!cash){
      alert("Enter amount");
      return;
    }
    alert("₹" + cash + " collected");
  }

  alert("Delivery Completed! ₹" + profit);

  window.location.href = "dashboard.html";
}
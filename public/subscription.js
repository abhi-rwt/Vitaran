/************************************************
 * Vitaran - SUBSCRIPTION PAGE LOGIC V6.3
 * Handles: Redirect guard, Plan switching, Payment + Upgrade + Auto Tab
 ************************************************/

// ================= SUBSCRIPTION PAGE GUARD =================
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const allowUpgrade = localStorage.getItem("allowUpgrade");
  const upgradeTarget = localStorage.getItem("upgradeTarget"); // 👈 Naya

  // Agar user logged in hai AUR upgrade se nahi aaya to dashboard bhejo
  if (token && !allowUpgrade) {
    try {
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      
      if (data.success && data.user.plan) {
        // Already subscribed + normal login = dashboard
        window.location.replace("dashboard.html");
        return;
      }
    } catch (err) {
      console.log("Subscription guard error:", err);
    }
  }

  // 🔥 FIX: Upgrade complete hone ke baad flags hata do
  localStorage.removeItem("allowUpgrade");
  localStorage.removeItem("upgradeTarget");
  
  // Page show kar do
  document.body.style.display = "block";
  
  // 🔥 FIX: URL se tab param read karo + dashboard se aaya tab check karo
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab') || upgradeTarget;
  const planParam = urlParams.get('plan');
  
  console.log("🔥 Opening tab:", tabParam, "| Plan:", planParam);
  
  // Tab ke hisaab se view set karo
  if(tabParam === 'food') {
    showQuick();
    showFood();
  } else if(tabParam === 'grocery') {
    showQuick();
    showGrocery();
  } else if(tabParam === 'ecom') {
    showEcom();
    showFood();
  } else if(tabParam === 'all') {
    showAll();
  } else if(planParam === 'both') {
    showQuick();
    showBoth();
  } else {
    // Default view
    showEcom();
    showFood();
  }
});

// ================= MAIN PLAN SWITCHING =================

function showEcom() {
  document.getElementById('ecomPlans').style.display = 'block';
  document.getElementById('quickPlans').style.display = 'none';
  document.getElementById('allPlans').style.display = 'none';
  document.getElementById('tab-ecom').classList.add('active');
  document.getElementById('tab-quick').classList.remove('active');
  document.getElementById('tab-all').classList.remove('active');
}

function showQuick() {
  document.getElementById('ecomPlans').style.display = 'none';
  document.getElementById('quickPlans').style.display = 'block';
  document.getElementById('allPlans').style.display = 'none';
  document.getElementById('tab-quick').classList.add('active');
  document.getElementById('tab-ecom').classList.remove('active');
  document.getElementById('tab-all').classList.remove('active');
}

function showAll() {
  document.getElementById('ecomPlans').style.display = 'none';
  document.getElementById('quickPlans').style.display = 'none';
  document.getElementById('allPlans').style.display = 'block';
  document.getElementById('tab-all').classList.add('active');
  document.getElementById('tab-ecom').classList.remove('active');
  document.getElementById('tab-quick').classList.remove('active');
}

function showFood() {
  document.getElementById('foodPlans').style.display = 'block';
  document.getElementById('groceryPlans').style.display = 'none';
  document.getElementById('bothPlans').style.display = 'none';
  setQuick(0);
}

function showGrocery() {
  document.getElementById('foodPlans').style.display = 'none';
  document.getElementById('groceryPlans').style.display = 'block';
  document.getElementById('bothPlans').style.display = 'none';
  setQuick(1);
}

function showBoth() {
  document.getElementById('foodPlans').style.display = 'none';
  document.getElementById('groceryPlans').style.display = 'none';
  document.getElementById('bothPlans').style.display = 'block';
  setQuick(2);
}

function setQuick(i) {
  document.querySelectorAll('.switch-btn2').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === i);
  });
}

// ================= RAZORPAY + UPGRADE LOGIC =================

async function buyPlan(plan, amount){
  try{
    const token = localStorage.getItem("token");

    if(!token){
      alert("Please login first.");
      window.location.href = "login.html";
      return;
    }

    // STEP 1: Create order
    const orderRes = await fetch("/api/payment/create-order",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ amount })
    });

    if(!orderRes.ok){
      alert("Server not responding");
      return;
    }

    const orderData = await orderRes.json();

    if(orderData.status !== "ok"){
      alert("Order creation failed: " + orderData.message);
      return;
    }

    // STEP 2: Razorpay
    var options = {
      key: orderData.key,
      amount: amount * 100,
      currency: "INR",
      name: "Vitaran",
      description: plan,
      image: "https://vitaran.onrender.com/logos/logo.png",
      order_id: orderData.order.id,

      handler: async function () {
        // 🔥 FIX: Upgrade vs New user alag route
        const isUpgrade = localStorage.getItem("allowUpgrade");
        const endpoint = isUpgrade ? "/api/subscription/upgrade" : "/api/subscription/save";
        
        const saveRes = await fetch(endpoint, {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            token: token,
            plan: plan
          })
        });

        const saveData = await saveRes.json();

        if(saveData.success){
          localStorage.removeItem("allowUpgrade");
          localStorage.removeItem("upgradeTarget");
          // 🔥 Popup hata diya - seedha redirect
          window.location.replace("dashboard.html");
        } else {
          alert("Plan save failed: " + saveData.error);
        }
      },

      theme: { color:"#0093FF" }
    };

    var rzp = new Razorpay(options);
    rzp.open();

  } catch(err){
    console.log("Payment Error:", err);
    alert("Something went wrong");
  }
}
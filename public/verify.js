function verifyUser(){

  const id = document.getElementById("idNumber").value;

  if(id.length < 6){
    alert("Enter valid ID");
    return;
  }

  // save verification
  localStorage.setItem("isVerified","true");

  alert("Profile Verified ✅");

  // go to dashboard
  window.location.href = "dashboard.html";
}
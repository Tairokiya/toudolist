/**
 * Created by mike on 2017/3/21.
 */

// Cordova Life Cycle
//https://cordova.apache.org/docs/en/latest/cordova/events/events.html
document.addEventListener("deviceready", onDeviceReady, false);
document.addEventListener("pause", onPause, false);
document.addEventListener("resume", onResume, false);
document.addEventListener("volumeupbutton", onVolumeUpKeyDown, false);

function onDeviceReady() {
  // Now safe to use device APIs
  console.log("On Device Ready Called");
  //window.alert("Be it master, or just a brother --- I love you, Touko.");

  // Wilddog Configuration
  var config = {
    //authDomain: "with-u-near.wilddogio.com",
    syncURL: "https://with-u-near.wilddogio.com"
  };
  wilddog.initializeApp(config);
  console.log("Wilddog in wilddog.js");

}

function onPause() {
  // Handle the pause event
  console.log("On Pause Called");

}

function onResume() {
  // Handle the resume event
}

function onVolumeUpKeyDown() {
  // Handle the volume up button
  setTimeout(function() {
    window.alert("Be it master, or just a brother --- I love you, Touko.");
  }, 0);
}

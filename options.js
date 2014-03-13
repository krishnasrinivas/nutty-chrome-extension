var input = document.getElementById("inputid");
var setbutton = document.getElementById("setbutton");
var resetbutton = document.getElementById("resetbutton");

function set() {
    localStorage['nuttyserver'] = input.value;
    chrome.runtime.reload();
}
function reset() {
    localStorage['nuttyserver'] = 'https://nutty.io';
    input.value = localStorage['nuttyserver'];
    chrome.runtime.reload();
}
if (localStorage['nuttyserver'] === undefined)
    reset();
else
    input.value = localStorage['nuttyserver']
setbutton.onclick = set;
resetbutton.onclick = reset;

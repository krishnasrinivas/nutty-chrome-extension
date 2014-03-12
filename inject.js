var port;

window.addEventListener("message", function(event) {
    if (event.source !== window)
        return;
    if (!event.data.type)
        return;
    if (event.data.type === '_nutty_fromwebpage') {
        if (port)
            port.postMessage(event.data);
    }
});

port = chrome.runtime.connect({name:'nutty'});

port.onMessage.addListener(function(msg) {
    msg.type = '_nutty_fromcontentscript';
    window.postMessage(msg, window.location.origin);
});

window.postMessage({
    type: '_nutty_fromcontentscript',
    share: true
}, '*');

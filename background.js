/*
    Copyright (C) 2014  Krishna Srinivas (https://github.com/krishnasrinivas)
*/

var portmap = {};

chrome.browserAction.onClicked.addListener(function(tab) {
    if (localStorage['nuttyserver'] === undefined)
        localStorage['nuttyserver'] = 'https://nutty.io'

    var nuttyserver = localStorage['nuttyserver'];
    if (nuttyserver === 'https://nutty.io') {
        chrome.tabs.create({
            index: tab.index+1,
            url: 'https://nutty.io/share',
            active: true
        });
    } else if (nuttyserver + '/clickicon' === tab.url) {
        chrome.tabs.executeScript(tab.id, {
            file: "inject.js"
        });
    } else {
        chrome.tabs.create({
            index: tab.index+1,
            url: nuttyserver + '/clickicon',
            active: true
        });
    }
});

function fromnativeport(sessionid) {
    return function(msg) {
        if (portmap[sessionid])
            portmap[sessionid].browserport.postMessage(msg)
        else
            console.log("portmap[" + sessionid + "] is null");
    }
}

function nuttyonconnect(port) {
    var nativeport;
    var sessionid;
    var input = document.getElementById('clipboard');
    port.onDisconnect.addListener(function() {
        console.log("port disconnected");
        if (!portmap[sessionid])
            return;
        portmap[sessionid].active = false;
        setTimeout(function() {
            if (!portmap[sessionid])
                return;
            if (!portmap[sessionid].active) {
                if (portmap[sessionid].browserport !== port)
                    return;
                delete(portmap[sessionid]);
                nativeport.disconnect();
                nativeport = undefined;
            }
        }, 5000);
    });

    port.onMessage.addListener(function(msg) {
        if (msg.copy) {
            input.value = msg.copy;
            input.focus();
            input.select();
            document.execCommand('copy');
            return;
        }

        if (msg.paste) {
            input.focus();
            input.select();
            document.execCommand('paste');
            port.postMessage({
                paste: input.value
            });
            return;
        }

        if (msg.unsetsessionid) {
            if (!portmap[sessionid])
                return;
            if (portmap[sessionid].browserport !== port)
                return;
            delete(portmap[sessionid]);
            nativeport.disconnect();
            nativeport = undefined;
            return;
        }
        if (msg.setsessionid) {
            sessionid = msg.setsessionid;
            if (!portmap[sessionid]) {
                nativeport = chrome.runtime.connectNative('io.nutty.terminal');
                portmap[sessionid] = {
                    browserport: port,
                    nativeport: nativeport,
                    active: true
                }
                nativeport.onMessage.addListener(fromnativeport(sessionid));

                nativeport.onDisconnect.addListener(function() {
                    nativeport = undefined;
                    port.postMessage({
                        nativehost: "disconnected"
                    });
                    port.disconnect();
                    console.log("nutty.py script disconnected");
                });
            } else {
                nativeport = portmap[sessionid].nativeport;
                portmap[sessionid].browserport = port;
                portmap[sessionid].active = true;
            }
            return;
        }
        if (!nativeport) {
            port.postMessage({
                nativehost: "disconnected"
            });
            console.log("unable to connect to native app");
            return;
        }
        try {
            nativeport.postMessage(msg);
        } catch (ex) {
            nativeport = undefined;
            port.postMessage({
                nativehost: "disconnected"
            });
        }
    });
}

chrome.runtime.onConnect.addListener(nuttyonconnect);
chrome.runtime.onConnectExternal.addListener(nuttyonconnect);

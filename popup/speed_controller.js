function isUrlValid(url) {
    const validatingRegex = /https?:\/\/bbb(-\w+)?\.finki\.ukim\.mk\/playback\/presentation\/2\.0\/playback\.html\?meetingId=\w{40}-\w{13}/;

    return validatingRegex.test(url)
}

function consoleLog(text) {
    return browser.tabs.executeScript({code: `console.log(${JSON.stringify(text)});`});
}

function consoleError(text) {
    return browser.tabs.executeScript({code: `console.error(${JSON.stringify(text)});`});
}

function registerSpeedEvents() {
    function getCurrentSpeed(tabs, speedElement) {
        let currentTab = tabs[0];

        browser.tabs.sendMessage(currentTab.id, {
            command: "cbs-speed-request"
        }).then(speed => {
            speedElement.textContent = speed.toFixed(2);
        })
    }

    function reportError(error) {
        consoleError(`Courses-BBB-Speed Error: ${error}`);
    }

    document.addEventListener("click", (e) => {
        function changeSpeed(tabs, speedAction) {
            let currentTab = tabs[0];

            browser.tabs.sendMessage(currentTab.id, {
                command: "cbs-speed-change",
                speedAction: speedAction
            })
        }

        browser.tabs.query({active: true, currentWindow: true})
            .then(activeTabs => changeSpeed(activeTabs, e.target.id))
            .catch(reportError);
    });

    const currentSpeedElement = document.getElementById("current-speed");

    browser.runtime.onMessage.addListener(message => {
        if (message.command === "cbs-speed-update") {
            currentSpeedElement.textContent = message.newSpeed.toFixed(2);
        }
    });

    browser.tabs.query({active: true, currentWindow: true})
        .then(activeTabs => getCurrentSpeed(activeTabs, currentSpeedElement))
        .catch(reportError);
}

function registerTimeEvents() {
    document.addEventListener("click", (e) => {
        function changeTime(tabs, timeAction) {
            let currentTab = tabs[0];

            browser.tabs.sendMessage(currentTab.id, {
                command: "cbs-time-change",
                timeAction: timeAction
            })
        }

        function reportError(error) {
            consoleError(`Courses-BBB-Speed Error: ${error}`);
        }

        browser.tabs.query({active: true, currentWindow: true})
            .then(activeTabs => changeTime(activeTabs, e.target.id))
            .catch(reportError);
    });
}

function reportExecuteScriptError(error) {
    document.querySelector("#popup-content").classList.add("hidden");
    document.querySelector("#error-content").classList.remove("hidden");
    document.querySelector("#error-content > p").textContent = error.message;
    consoleError(`Failed to execute downloader content script: ${JSON.stringify(error)}`);
}

function loadScripts(scripts) {
    if (scripts.length < 1) {
        consoleError("INVALID SCRIPTS");
        return Promise.reject("INVALID SCRIPTS");
    }

    const getScript = (script) => {
        if (script.endsWith(".js"))
            return browser.tabs.executeScript({file: script});
        else
            return browser.tabs.insertCSS({file: script});
    };

    let mainPromise = getScript(scripts[0]);

    for (const script of scripts.slice(1)) {
        mainPromise = mainPromise.then(() => getScript(script));
    }

    return mainPromise;
}

browser.tabs.query({active: true, currentWindow: true})
    .then(tabs => {
        let currentTab = tabs[0];
        if (!isUrlValid(currentTab.url)) {
            throw {
                message: "Invalid tab url"
            };
        }
    })
    .then(() => loadScripts([
        "/content_scripts/speed_manager.js"
    ]))
    .then(registerSpeedEvents)
    .then(registerTimeEvents)
    .catch(reportExecuteScriptError);

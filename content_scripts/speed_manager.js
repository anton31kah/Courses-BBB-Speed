(function () {
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    const MAX_SPEED = 2.5;
    const MIN_SPEED = 0.05;
    const SPEED_CHANGE = 0.05;
    const NORMAL_SPEED = 1;

    const TIME_CHANGE = 10;

    function changeVideosSpeed(speedAction) {
        const videoElements = [...document.getElementsByTagName("video")];

        let newSpeed = videoElements[0].playbackRate;

        if (speedAction === "slower") {
            newSpeed = Math.max(MIN_SPEED, newSpeed - SPEED_CHANGE);
        }

        if (speedAction === "normal") {
            newSpeed = NORMAL_SPEED;
        }

        if (speedAction === "faster") {
            newSpeed = Math.min(MAX_SPEED, newSpeed + SPEED_CHANGE);
        }

        for (let videoElement of videoElements) {
            videoElement.playbackRate = newSpeed;
        }

        browser.runtime.sendMessage({
            command: "cbs-speed-update",
            newSpeed: newSpeed
        });
    }

    function changeVideosTime(timeAction) {
        const videoElements = [...document.getElementsByTagName("video")];

        let newTime = videoElements[0].currentTime;

        if (timeAction === "back") {
            newTime -= TIME_CHANGE;
        }

        if (timeAction === "forward") {
            newTime += TIME_CHANGE;
        }

        for (let videoElement of videoElements) {
            videoElement.currentTime = newTime;
        }
    }

    function getCurrentSpeed() {
        return document.getElementsByTagName("video")[0].playbackRate;
    }

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.command === "cbs-speed-change") {
            changeVideosSpeed(message.speedAction);
        }
        if (message.command === "cbs-time-change") {
            changeVideosTime(message.timeAction);
        }
        if (message.command === "cbs-speed-request") {
            sendResponse(getCurrentSpeed());
        }
    });
})();

let interval = null;
let seconds_elapsed = 0;

function startCounter() {
    seconds_elapsed = 0;
    interval = setInterval(() => {
        seconds_elapsed++;
        chrome.runtime.sendMessage({ action: 'counter', seconds_elapsed: seconds_elapsed })
    }, 1000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'stop') {
        console.log('solved');
        clearInterval(interval);
    }
})

startCounter();
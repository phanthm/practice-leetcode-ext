let interval = null;
let seconds_elapsed = 0;

let on = false;
let info = {
    tab_id: null,
    problem: null
}
let last_solved_problem_index = null;

const formatTime = (seconds) => {
    const secs = seconds % 60;
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    return `${hrs < 10 ? '0' + hrs : hrs}:${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
}

function startCounter() {
    on = true;
    seconds_elapsed = 0;

    interval = setInterval(() => {
        seconds_elapsed++;
        if (seconds_elapsed > 100000) {
            stopCounter();
        }
        chrome.runtime.sendMessage({ action: 'counter', time: formatTime(seconds_elapsed) }).catch(err => console.log(err));
    }, 1000);
}

function stopCounter() {
    on = false;
    clearInterval(interval);
    info = { tab_id: null, problem: null };
    seconds_elapsed = 0;
}

function tabRemoveListener(tabId) {
    if (tabId === info.tab_id) {
        stopCounter();
        chrome.tabs.onRemoved.removeListener(tabRemoveListener);
    }
}

function tabChangeListener(tabId, changeInfo) {
    if (tabId === info.tab_id && changeInfo.url && !changeInfo.url.includes(info.problem.leetcode_href)) {
        stopCounter();
        chrome.tabs.onUpdated.removeListener(tabChangeListener);
    }
}

async function checkIfSolved(details) {
    const response = await fetch(details.url);
    const data = await response.json();

    if (data.state === 'SUCCESS' && data.total_correct === data.total_testcases && on) {
        chrome.webRequest.onCompleted.removeListener(checkIfSolved);
        console.log('Problem Solved');

        const last_solved_problem = {
            name: info.problem.text,
            time: formatTime(seconds_elapsed)
        }
        chrome.storage.local.set({ last_solved_problem }).catch(err => console.log(err));

        last_solved_problem_index = info.problem.index;

        let problems = await getProblems();
        problems[info.problem.index].solved = true;
        chrome.storage.local.set({ problems }).catch(err => console.log(err));

        stopCounter();
    }
}

function generateRandomProblem(problems) {
    return problems[Math.floor(Math.random() * problems.length)];
}

async function getProblems() {
    const res = await chrome.storage.local.get('problems');
    return res.problems || [];
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'status') {
        console.log(request);
        if (on) {
            sendResponse({ on: true, problem: info.problem, time: formatTime(seconds_elapsed) });
        } else {
            sendResponse({ on: false, problem: null });
        }
    }

    if (request.action === 'start' && !on) {
        console.log(request);
        if (request.problem) {
            info.problem = request.problem;
        }

        const tab = await chrome.tabs.create({ url: info.problem.leetcode_href });
        info.tab_id = tab.id;

        startCounter();

        chrome.webRequest.onCompleted.addListener(checkIfSolved, {
            urls: ["*://leetcode.com/submissions/detail/*/check/"]
        })

        chrome.tabs.onRemoved.addListener(tabRemoveListener);
        chrome.tabs.onUpdated.addListener(tabChangeListener);
    }

    if (request.action === 'generate') {
        console.log(request);
        let problems = await getProblems();

        const filters = request.filters || {};
        const category_filters = filters.categories || [];
        const difficulty_filters = filters.difficulties || [];
        const only_unsolved_filter = filters.only_unsolved || false;

        problems = problems.filter(problem => {
            return category_filters.includes(problem.category);
        })

        problems = problems.filter(problem => {
            return difficulty_filters.includes(problem.difficulty);
        })

        if (only_unsolved_filter) {
            problems = problems.filter(problem => {
                return !problem.solved;
            });
        }

        info.problem = generateRandomProblem(problems);
        chrome.runtime.sendMessage({ action: 'problem', problem: info.problem });
    }

    if (request.action === 'mark') {
        console.log(request);
        let problems = await getProblems();

        if (on) {
            if (request.solved) {
                info.problem.solved = false;
                problems[info.problem.index].solved = false;
            } else {
                info.problem.solved = true;
                problems[info.problem.index].solved = true;
            }
        } else {
            if (request.solved) {
                problems[last_solved_problem_index].solved = false;
            } else {
                problems[last_solved_problem_index].solved = true;
            }
        }

        chrome.storage.local.set({ problems }).catch(err => console.log(err));
    }
});


chrome.runtime.onInstalled.addListener(async () => {
    const response = await fetch(chrome.runtime.getURL('problemset/problemset.json'));
    const problems = await response.json();

    chrome.storage.local.set({ problems }).catch(err => console.log(err));
    chrome.storage.local.set({ last_solved_problem: null }).catch(err => console.log(err));
})


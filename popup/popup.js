const categories = [
    "Arrays & Hashing",
    "Two Pointers",
    "Sliding Window",
    "Stack",
    "Binary Search",
    "Linked List",
    "Trees",
    "Heap / Priority Queue",
    "Backtracking",
    "Tries",
    "Graphs",
    "Advanced Graphs",
    "1-D DP",
    "2-D DP",
    "Greedy",
    "Intervals",
    "Math & Geometry",
    "Bit Manipulation"
];

const display = document.getElementById('display');
const error_display = document.getElementById('error');
const problem_link = document.getElementById('problem-link');
const name_display = document.getElementById('name-display');
const counter_display = document.getElementById('counter-display');
const generate_btn = document.getElementById('generate-btn');
const filter_btn = document.getElementById('filter-btn');
const filter_options = document.getElementById('filter-options');
const filter_container = document.getElementById('filter-container');
const isSolved = document.getElementById('solved');
const options = document.getElementById('options');

function populateFilterOptions() {
    let id = 1;
    const getFilterOptionDiv = (name, text) => {
        const div = document.createElement('div');
        div.classList.add('filter-option');

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = name;
        input.id = `option-${id}`;
        input.value = text;
        input.checked = true;
        div.appendChild(input);

        const label = document.createElement('label');
        label.textContent = text;
        label.htmlFor = `option-${id}`;
        div.appendChild(label);

        id++;
        return div;
    }

    const select_all_container = document.createElement('div');
    select_all_container.classList.add('select-all-container');
    select_all_container.classList.add('container');
    select_all_container.classList.add('row-one');
    select_all_container.appendChild(getFilterOptionDiv('select-all', 'Select All'));

    const only_unsolved_container = document.createElement('div');
    only_unsolved_container.classList.add('only-unsolved-container');
    only_unsolved_container.classList.add('container');
    only_unsolved_container.appendChild(getFilterOptionDiv('only-unsolved', 'Only Unsolved'));

    const difficulty_container = document.createElement('div');
    difficulty_container.classList.add('difficulty-container');
    difficulty_container.classList.add('container');
    ['Easy', 'Medium', 'Hard'].forEach(difficulty => {
        difficulty_container.appendChild(getFilterOptionDiv('difficulty', difficulty));
    });

    const category_container = document.createElement('div');
    category_container.classList.add('category-container');
    category_container.classList.add('container');
    category_container.classList.add('row-three');
    categories.forEach(category => {
        category_container.appendChild(getFilterOptionDiv('category', category));
    });

    const row = document.createElement('div');
    row.appendChild(only_unsolved_container);
    row.appendChild(difficulty_container);
    row.className = 'row-two';

    filter_options.appendChild(select_all_container);
    filter_options.appendChild(row);
    filter_options.appendChild(category_container);

    const handleSelectAll = () => {
        const select_all = document.querySelector('input[name="select-all"]');

        select_all.addEventListener('click', () => {
            if (select_all.checked) {
                const checkboxes = document.querySelectorAll('input[name="category"], input[name="difficulty"], input[name="only-unsolved"]');
                checkboxes.forEach(checkbox => checkbox.checked = true);
            } else {
                const checkboxes = document.querySelectorAll('input[name="category"], input[name="difficulty"], input[name="only-unsolved"]');
                checkboxes.forEach(checkbox => checkbox.checked = false);
            }
        });
    }

    handleSelectAll();
}


function getFilters() {
    const only_unsolved_checkbox = document.querySelector('input[name="only-unsolved"]');
    const difficulty_checkboxes = document.querySelectorAll('input[name="difficulty"]:checked');
    const category_checkboxes = document.querySelectorAll('input[name="category"]:checked');
    return {
        only_unsolved: only_unsolved_checkbox.checked,
        difficulties: Array.from(difficulty_checkboxes).map(checkbox => checkbox.value),
        categories: Array.from(category_checkboxes).map(checkbox => checkbox.value)
    }
}

function showError(error) {
    error_display.innerHTML = error;
}


// <--------------------------------------------------------------->


populateFilterOptions();

generate_btn.addEventListener('click', async () => {
    const status_res = await chrome.runtime.sendMessage({ action: 'status' });
    if (status_res.on) {
        showError('Solve or Close the current problem first.');
        return;
    }

    chrome.runtime.sendMessage({ action: 'generate', filters: getFilters() });
});

problem_link.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'start' });
})

filter_btn.addEventListener('click', () => {
    filter_container.classList.toggle('hidden');
});

options.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
})

document.addEventListener('click', (event) => {
    if (!filter_btn.contains(event.target) && !filter_container.contains(event.target)) {
        filter_container.classList.add('hidden');
    }
})

isSolved.addEventListener('click', () => {
    if (isSolved.checked) {
        chrome.runtime.sendMessage({ action: 'mark', solved: false });
    } else {
        chrome.runtime.sendMessage({ action: 'mark', solved: true });
    }
})


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'counter') {
        counter_display.innerHTML = request.time;
    }
    if (request.action === 'problem') {
        if (request.problem) {
            showError('');
            problem_link.textContent = request.problem.text;
            problem_link.href = request.problem.leetcode_href;
        } else {
            showError('No Problems Found');
        }
    }
})

document.addEventListener('DOMContentLoaded', () => {
    chrome.runtime.sendMessage({ action: 'status' }).then(res => {
        if (res.on) {
            display.classList.remove('hidden');
            isSolved.classList.remove('hidden');
            isSolved.checked = res.problem.solved;
            name_display.textContent = res.problem.text;
            counter_display.textContent = res.time;
        } else {
            chrome.storage.local.get('last_solved_problem').then(data => {
                if (data.last_solved_problem) {
                    display.classList.remove('hidden');
                    isSolved.classList.remove('hidden');
                    isSolved.checked = true;
                    name_display.textContent = data.last_solved_problem.name;
                    counter_display.textContent = data.last_solved_problem.time;

                    chrome.storage.local.set({ last_solved_problem: null });
                } else {
                    display.classList.add('hidden');
                    isSolved.classList.add('hidden');
                    console.log('no data');
                }
            }).catch(err => console.log(err));
        }
    });

})
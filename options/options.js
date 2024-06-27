const category_container = document.getElementById('category-container');
let problems;

async function fetchCategories() {
    const res = await fetch(chrome.runtime.getURL('../problemset/categories.json'));
    return res.json();
}

async function fetchProblems() {
    const res = await chrome.storage.local.get('problems');
    return res.problems;
}

async function populateCategories() {
    const categories = await fetchCategories();

    categories.forEach(category => {
        const div = document.createElement('div');
        div.className = 'category';
        div.id = category.split(' ').join('-').toLowerCase();

        const name_div = document.createElement('div');
        name_div.className = 'category-name';
        name_div.textContent = category;

        div.appendChild(name_div);
        category_container.appendChild(div);
    });
}

async function populateProblems() {
    problems = await fetchProblems();

    problems.forEach(problem => {
        const div = document.createElement('div');
        div.className = 'problem';
        div.id = problem.text.split(' ').join('-');

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = 'solved';
        input.checked = problem.solved;

        const name_div = document.createElement('a');
        name_div.textContent = problem.text;
        name_div.className = 'problem-name';

        const diff_div = document.createElement('div');
        diff_div.className = `difficulty ${problem.difficulty.toLowerCase()}`;
        diff_div.textContent = problem.difficulty;

        div.appendChild(input);
        div.appendChild(name_div);
        div.appendChild(diff_div);

        name_div.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'start', problem: problem });
        });

        input.addEventListener('click', (e) => {
            if (e.target.checked) {
                problems[problem.index].solved = true;
            } else {
                problems[problem.index].solved = false;
            }

            console.log(problems[problem.index]);
            chrome.storage.local.set({ problems });
        });

        document.getElementById(problem.category.split(' ').join('-').toLowerCase()).appendChild(div);
    });
}

async function populateData() {
    await populateCategories();
    await populateProblems();
}

populateData();

async function loadSurveys() {
    const r = await fetch('/api/surveys');
    const xs = await r.json();
    document.querySelector('#surveys-list').innerHTML = xs.map(x => `
        <article class="message" style="border:1px solid #ccc; padding:10px; margin-top:10px;">
            <b>${escapeHtml(x.name)} さんの質問:</b>
            <p>${escapeHtml(x.question)}</p>
            <button onclick="vote(${x.id}, 1)">${escapeHtml(x.option1)} (${x.votes1}票)</button>
            <button onclick="vote(${x.id}, 2)">${escapeHtml(x.option2)} (${x.votes2}票)</button>
            <button onclick="vote(${x.id}, 3)">${escapeHtml(x.option2)} (${x.votes3}票)</button>
            <button onclick="vote(${x.id}, 4)">${escapeHtml(x.option2)} (${x.votes4}票)</button>
        </
        article>
    `).join('');
}

function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

document.querySelector('#survey-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.querySelector('#survey-name').value;
    const question = document.querySelector('#survey-question').value;
    const option1 = document.querySelector('#survey-opt1').value;
    const option2 = document.querySelector('#survey-opt2').value;
    
    const r = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, question, option1, option2 })
    });
    
document.querySelector('#survey-status').textContent = r.ok ? 'アンケートを作成しました' : '作成に失敗しました';
    if (r.ok) {
        document.querySelector('#survey-question').value = '';
        document.querySelector('#survey-opt1').value = '';
        document.querySelector('#survey-opt2').value = '';
        document.querySelector('#survey-opt3').value = ''; // クリア
        document.querySelector('#survey-opt4').value = ''; // クリア
        await loadSurveys();
    }
});

async function vote(surveyId, optionNum) {
    await fetch(`/api/surveys/${surveyId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option: optionNum })
    });
    await loadSurveys();
}

loadSurveys();
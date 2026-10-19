async function loadSurveys() {
    const r = await fetch('/api/surveys');
    const xs = await r.json();
    
    document.querySelector('#surveys-list').innerHTML = xs.map(x => `
        <article style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
            <p><b>${escapeHtml(x.name || '名無し')} さんの質問:</b></p>
            <h3>${escapeHtml(x.question)}</h3>
            <ul>
                <li><button onclick="vote(${x.id}, 1)">${escapeHtml(x.option1)}</button> : ${x.votes1}票</li>
                <li><button onclick="vote(${x.id}, 2)">${escapeHtml(x.option2)}</button> : ${x.votes2}票</li>
                ${x.option3 ? `<li><button onclick="vote(${x.id}, 3)">${escapeHtml(x.option3)}</button> :${x.votes3}票</li>` : ''}
                ${x.option4 ? `<li><button onclick="vote(${x.id}, 4)">${escapeHtml(x.option4)}</button> :${x.votes4}票</li>` : ''}
            </ul>
        </article>
    `).join('');
}

function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

// 投票処理
async function vote(surveyId, optionNumber) {
    const res = await fetch(`/api/surveys/${surveyId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option: optionNumber })
    });
    if (res.ok) {
        loadSurveys();
    }
}

// アンケート作成時の送信処理
document.querySelector('#survey-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.querySelector('#survey-name').value;
    const question = document.querySelector('#survey-question').value;
    const option1 = document.querySelector('#survey-opt1').value;
    const option2 = document.querySelector('#survey-opt2').value;
    const option3 = document.querySelector('#survey-opt3').value;
    const option4 = document.querySelector('#survey-opt4').value;
    
    const r = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, question, option1, option2, option3, option4 })
    });
    
    document.querySelector('#survey-status').textContent = r.ok ? 'アンケートを作成しました' : '作成に失敗しました';
    if (r.ok) {
        document.querySelector('#survey-name').value = '';
        document.querySelector('#survey-question').value = '';
        document.querySelector('#survey-opt1').value = '';
        document.querySelector('#survey-opt2').value = '';
        document.querySelector('#survey-opt3').value = '';
        document.querySelector('#survey-opt4').value = '';
        await loadSurveys();
    }
});

// ページ読み込み時に一覧を表示
loadSurveys();
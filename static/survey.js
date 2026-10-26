const surveyUuids = new Map();
async function loadSurveys() {
    const r = await fetch('/api/surveys');
    const xs = await r.json();

    surveyUuids.clear();
    xs.forEach(x => {
        surveyUuids.set(x.id, x.uuid);
    });

    
    document.querySelector('#surveys-list').innerHTML = xs.map(x => `
        <article style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
            <p><b>${escapeHtml(x.name || '名無し')} さんの質問:</b></p>
            <h3>${escapeHtml(x.question)}</h3>
            ${x.img_question ? `<img src="${escapeHtml(x.img_question)}" style="max-width: 200px; display: block; margin-bottom: 10px;">` : ''}
            <ul>
                <li>
                    <button onclick="vote(${x.id}, 1)">${escapeHtml(x.option1)}</button> : ${x.votes1}票
                    ${x.img1 ? `<br><img src="${escapeHtml(x.img1)}" style="max-width: 100px; margin-top: 5px;">` : ''}
                </li>
                <li>
                    <button onclick="vote(${x.id}, 2)">${escapeHtml(x.option2)}</button> : ${x.votes2}票
                    ${x.img2 ? `<br><img src="${escapeHtml(x.img2)}" style="max-width: 100px; margin-top: 5px;">` : ''}
                </li>
                ${x.option3 ? `<li>
                    <button onclick="vote(${x.id}, 3)">${escapeHtml(x.option3)}</button> :${x.votes3}票
                    ${x.img3 ? `<br><img src="${escapeHtml(x.img3)}" style="max-width: 100px; margin-top: 5px;">` : ''}
                </li>` : ''}
                ${x.option4 ? `<li>
                    <button onclick="vote(${x.id}, 4)">${escapeHtml(x.option4)}</button> :${x.votes4}票
                    ${x.img4 ? `<br><img src="${escapeHtml(x.img4)}" style="max-width: 100px; margin-top: 5px;">` : ''}
                </li>` : ''}
            </ul>
        </article>
    `).join('');
}

function escapeHtml(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

// 投票処理
// 投票処理
async function vote(surveyId, optionNumber) {
    const surveyUuid = surveyUuids.get(surveyId);

if (!surveyUuid) {
    alert('アンケート情報を取得できませんでした');
    return;
}

const voteKey = `survey_${surveyUuid}_option_${optionNumber}`;

    // すでに投票しているか確認
    if (localStorage.getItem(voteKey)) {
        alert('この選択肢にはすでに投票しています');
        return;
    }

    const res = await fetch(`/api/surveys/${surveyId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option: optionNumber })
    });

    if (res.ok) {
        // 投票成功時に履歴を保存
        localStorage.setItem(voteKey, 'true');
        await loadSurveys();
    } else {
        alert('投票に失敗しました');
    }
}

// アンケート作成時の送信処理
document.querySelector('#survey-form').addEventListener('submit', async e => {
    e.preventDefault();
    
    // JSONの代わりにFormDataオブジェクトを使用
    const formData = new FormData();
    formData.append('name', document.querySelector('#survey-name').value);
    formData.append('question', document.querySelector('#survey-question').value);
    formData.append('option1', document.querySelector('#survey-opt1').value);
    formData.append('option2', document.querySelector('#survey-opt2').value);
    formData.append('option3', document.querySelector('#survey-opt3').value);
    formData.append('option4', document.querySelector('#survey-opt4').value);
    
    // 画像ファイルが存在する場合のみ追加
    const imgQuestion = document.querySelector('#survey-img-question').files[0];
    if (imgQuestion) formData.append('img_question', imgQuestion);
    
    const img1 = document.querySelector('#survey-img1').files[0];
    if (img1) formData.append('img1', img1);
    
    const img2 = document.querySelector('#survey-img2').files[0];
    if (img2) formData.append('img2', img2);
    
    const img3 = document.querySelector('#survey-img3').files[0];
    if (img3) formData.append('img3', img3);
    
    const img4 = document.querySelector('#survey-img4').files[0];
    if (img4) formData.append('img4', img4);
    
    const r = await fetch('/api/surveys', {
        method: 'POST',
        body: formData // FormDataを使用する場合、Content-Typeヘッダーはブラウザが自動設定するため省略
    });
    
    document.querySelector('#survey-status').textContent = r.ok ? 'アンケートを作成しました' : '作成に失敗しました';
    if (r.ok) {
        document.querySelector('#survey-form').reset(); // 入力欄をすべてリセット
        await loadSurveys();
    }
});

// ページ読み込み時に一覧を表示
loadSurveys();
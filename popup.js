const apiKeyInput = document.getElementById('api-key');
const saveKeyBtn = document.getElementById('save-key');
const keyStatus = document.getElementById('key-status');
const analyzeBtn = document.getElementById('analyze-btn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const noResult = document.getElementById('no-result');
const copyResultBtn = document.getElementById('copy-result');

chrome.storage.local.get('groqApiKey', (data) => {
    if (data.groqApiKey) {
        apiKeyInput.value = '*'.repeat(25);
        keyStatus.textContent = '✓ API Key kayıtlı (Groq)';
        keyStatus.style.color = '#4ade80';
    }
});

saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();

    if (!key || key.startsWith('*')) {
        keyStatus.textContent = '⚠ Geçerli bir key girin';
        keyStatus.style.color = '#f97316';

        return;
    }

    chrome.storage.local.set({ groqApiKey: key }, () => {
        apiKeyInput.value = '*'.repeat(25);
        keyStatus.textContent = '✓ API Key kaydedildi';
        keyStatus.style.color = '#4ade80';
    });
});

analyzeBtn.addEventListener('click', async () => {
    chrome.storage.local.get('groqApiKey', async (data) => {
        if (!data.groqApiKey) {
            keyStatus.textContent = '⚠ Lütfen önce Groq API Key ekleyin';
            keyStatus.style.color = '#f97316';

            return;
        }

        loading.style.display = 'block';
        result.style.display = 'none';
        noResult.style.display = 'none';
        keyStatus.textContent = '';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) throw new Error('Aktif sayfa bulunamadı.');

            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            }).catch(() => {});

            const response = await new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tab.id, { action: 'extractIssueData' }, (res) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error('Jira verisi okunamadı. Sayfayı yenileyin.'));
                    } else {
                        resolve(res);
                    }
                });
            });

            const analysisResult = await analyzeWithGroq(data.groqApiKey, response);

            displayResult(analysisResult);

        } catch (error) {
            keyStatus.textContent = '✗ ' + error.message;
            keyStatus.style.color = '#ef4444';
        } finally {
            loading.style.display = 'none';
        }
    });
});

async function analyzeWithGroq(apiKey, issueData) {
    const prompt = `Analyze this Jira issue and provide a summary following these strict rules:
    1. "NE İSTENİYOR?" section must be in TURKISH and 1-2 sentences.
    2. "YAPILACAK" section must be in ENGLISH, use "I" person (e.g., "I will implement..."), and be 1 sentence.

    ISSUE DESCRIPTION:
    ${issueData.description || 'No description provided.'}

    COMMENTS:
    ${issueData.comments?.join(' | ') || 'No comments.'}

    RESPONSE FORMAT:
    NE İSTENİYOR?
    [Turkish summary here]

    YAPILACAK:
    [English action starting with "I will..." here]`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: "You are a senior developer assistant." },
            { role: "user", content: prompt }
        ],
        temperature: 0.1
        })
    });

    if (!response.ok) throw new Error('Groq API error.');

    const data = await response.json();
    const text = data.choices[0].message.content;

    const parts = text.split(/YAPILACAK:/i);

    return {
        whatNeeded: parts[0].replace(/NE İSTENİYOR\?/i, '').trim(),
        devWillDo: parts[1]?.trim() || "I will analyze the requirements further."
    };
}

function displayResult(resultData) {
    document.getElementById('what-text').textContent = resultData.whatNeeded;
    document.getElementById('dev-text').textContent = resultData.devWillDo;

    result.style.display = 'block';
    noResult.style.display = 'none';
}

copyResultBtn.addEventListener('click', () => {
    const devText = document.getElementById('dev-text').textContent;

    navigator.clipboard.writeText(devText).then(() => {
        const originalText = copyResultBtn.textContent;

        copyResultBtn.textContent = '✓ Aksiyon kopyalandı!';

        setTimeout(() => {
            copyResultBtn.textContent = '📋 Sonucu Kopyala';
        }, 2000);
    }).catch(err => {
        console.error('Kopyalama hatası:', err);
    });
});
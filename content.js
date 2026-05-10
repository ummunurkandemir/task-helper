console.log('🔍 Task Helper content script loaded');
console.log('📍 URL:', window.location.href);

if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✓ Chrome runtime available');
} else {
    console.log('✗ Chrome runtime NOT available');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Message received:', request);

    if (request.action === 'extractIssueData') {
        try {
            const data = extractJiraData();

            console.log('✓ Data extracted:', data);
            sendResponse(data);
        } catch (error) {
            console.error('✗ Error extracting data:', error);
            sendResponse({ error: error.message });
        }
    }
});

function extractJiraData() {
    return {
        description: getDescription(),
        comments: getComments()
    };
}

function getDescription() {
    const selectors = [
        '[data-testid="issue.views.issue-base.foundation.description.value"]',
        '[data-testid="issue.views.field.rich-text.description"]',
        '.description .user-content-block',
        '[data-testid*="description"] [class*="content"]',
        '.issue-description',
        '[class*="description"][class*="content"]'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);

        if (element && element.textContent.trim()) {
            return element.textContent.trim();
        }
    }

    return '';
}

function getComments() {
    const comments = [];
    const commentSelectors = [
        '[data-testid*="comment.comment-view"]',
        '[data-testid*="comment"]',
        '.comment',
        '[class*="comment"][class*="content"]',
        '[class*="activity"][class*="item"]'
    ];

    let commentElements = [];

    for (const selector of commentSelectors) {
        const elements = document.querySelectorAll(selector);

        if (elements.length > 0) {
            commentElements = Array.from(elements);

            break;
        }
    }

    for (let i = 0; i < Math.min(5, commentElements.length); i++) {
        const text = commentElements[i].textContent.trim();

        if (text && text.length > 0) {
            comments.push(text.substring(0, 300));
        }
    }

    return comments;
}

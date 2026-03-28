document.addEventListener('DOMContentLoaded', () => {
    const captureBtn = document.getElementById('capture-btn');
    const tasksBtn = document.getElementById('tasks-btn');
    const dashboardBtn = document.getElementById('dashboard-btn');
    const statusText = document.getElementById('status-text');

    // Navigation Elements
    const mainView = document.getElementById('main-view');
    const shareView = document.getElementById('share-view');
    const settingsView = document.getElementById('settings-view');
    const shareViewBtn = document.getElementById('share-view-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const backFromShare = document.getElementById('back-from-share');
    const backFromSettings = document.getElementById('back-from-settings');

    // Settings Elements
    const cardUrlInput = document.getElementById('card-url-input');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    // Share Elements
    const myCardUrl = document.getElementById('my-card-url');
    const copyLinkBtn = document.getElementById('copy-link-btn');

    // --- State Management ---
    // Load saved settings
    chrome.storage.local.get(['cardUrl'], (result) => {
        if (result.cardUrl) {
            cardUrlInput.value = result.cardUrl;
            myCardUrl.textContent = result.cardUrl;
        } else {
            statusText.textContent = "Please link your card in Settings.";
        }
    });

    // --- Navigation ---
    settingsBtn.addEventListener('click', () => {
        mainView.style.display = 'none';
        settingsView.style.display = 'block';
    });

    shareViewBtn.addEventListener('click', () => {
        mainView.style.display = 'none';
        shareView.style.display = 'block';
        // Generate QR Code here if we had a library
        // For now, just using text placeholder
    });

    backFromSettings.addEventListener('click', () => {
        settingsView.style.display = 'none';
        mainView.style.display = 'block';
    });

    backFromShare.addEventListener('click', () => {
        shareView.style.display = 'none';
        mainView.style.display = 'block';
    });

    // --- Actions ---
    saveSettingsBtn.addEventListener('click', () => {
        const url = cardUrlInput.value.trim();
        if (url) {
            chrome.storage.local.set({ cardUrl: url }, () => {
                statusText.textContent = "Settings saved!";
                myCardUrl.textContent = url;
                settingsView.style.display = 'none';
                mainView.style.display = 'block';
            });
        }
    });

    copyLinkBtn.addEventListener('click', () => {
        if (myCardUrl.textContent !== "No card linked") {
            navigator.clipboard.writeText(myCardUrl.textContent).then(() => {
                const originalText = copyLinkBtn.textContent;
                copyLinkBtn.textContent = "Copied!";
                setTimeout(() => copyLinkBtn.textContent = originalText, 1500);
            });
        }
    });

    captureBtn.addEventListener('click', async () => {
        statusText.textContent = "Scanning page...";

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Send message to content script
            chrome.tabs.sendMessage(tab.id, { action: "scan_page" }, (response) => {
                if (chrome.runtime.lastError) {
                    statusText.textContent = "Error: Please refresh the page.";
                    console.error(chrome.runtime.lastError);
                    return;
                }

                if (response) {
                    console.log("Captured Data:", response);

                    // Simple formatter for now, we will add UI later
                    const emails = response.emails.length ? response.emails.join(', ') : 'No email';
                    statusText.innerHTML = `
                        <strong>Found:</strong><br>
                        Name: ${response.name || 'Unknown'}<br>
                        Email: ${emails}<br>
                        Phone: ${response.phones.join(', ') || 'N/A'}
                    `;
                } else {
                    statusText.textContent = "No data found.";
                }
            });
        } catch (err) {
            console.error(err);
            statusText.textContent = "Connection failed.";
        }
    });

    dashboardBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'http://localhost:3000' }); // URL will need to be configured
    });

    tasksBtn.addEventListener('click', () => {
        statusText.textContent = "Tasks feature coming soon...";
    });
});

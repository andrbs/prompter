document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#prompts-table tbody');
    const addRowBtn = document.getElementById('add-row-btn');
    const saveBtn = document.getElementById('save-btn');
    const toastContainer = document.getElementById('toast-container');

    let initialDataLoaded = false; // Flag to prevent saving before initial load

    let debounceTimer;
    const debounce = (func, delay) => {
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        }
    };

    const savePrompts = async (showNotification = false) => {
        if (!initialDataLoaded) return; // Prevent saving before initial data is loaded

        const prompts = [];
        tableBody.querySelectorAll('tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            const typeSelect = cells[0].querySelector('select');
            const textarea = cells[2].querySelector('textarea');
            prompts.push({
                type: typeSelect.value,
                name: cells[1].innerText,
                prompt: textarea.value
            });
        });

        try {
            await fetch('/api/prompts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(prompts)
            });
            if (showNotification) {
                showToast('Prompts saved successfully!');
            }
        } catch (error) {
            console.error('Error saving prompts:', error);
            showToast('Error saving prompts', 'error');
        }
    };

    const debouncedSave = debounce(() => savePrompts(false), 2000);

    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type} show`;
        toast.innerText = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 3000);
    };

    const fetchPrompts = async () => {
        try {
            const response = await fetch('/api/prompts');
            const prompts = await response.json();
            renderPrompts(prompts);
            initialDataLoaded = true; // Set flag after initial load
        } catch (error) {
            console.error('Error fetching prompts:', error);
            showToast('Error fetching prompts', 'error');
        }
    };

    const renderPrompts = (prompts) => {
        tableBody.innerHTML = '';
        prompts.forEach(prompt => {
            const row = createPromptRow(prompt);
            tableBody.appendChild(row);
        });
    };

    const createPromptRow = (prompt) => {
        const row = document.createElement('tr');
        const type = prompt.type || 'System';
        row.innerHTML = `
            <td class="type-cell">
                <select>
                    <option value="System" ${type === 'System' ? 'selected' : ''}>System</option>
                    <option value="User" ${type === 'User' ? 'selected' : ''}>User</option>
                </select>
            </td>
            <td contenteditable="true" class="name-cell">${prompt.name}</td>
            <td class="prompt-cell">
                <textarea>${prompt.prompt}</textarea>
                <span class="copy-icon">📋</span>
                <span class="delete-icon">🗑️</span>
            </td>
        `;
        const copyIcon = row.querySelector('.copy-icon');
        const deleteIcon = row.querySelector('.delete-icon');
        const textarea = row.querySelector('textarea');
        const typeSelect = row.querySelector('select');
        const nameCell = row.querySelector('.name-cell');

        const autoResizeTextarea = () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };

        textarea.addEventListener('input', () => {
            autoResizeTextarea();
            debouncedSave();
        });
        typeSelect.addEventListener('change', debouncedSave);
        nameCell.addEventListener('input', debouncedSave);
        
        copyIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(textarea.value).then(() => {
                showToast('Prompt copied to clipboard!');
            }).catch(err => {
                console.error('Error copying text: ', err);
                showToast('Error copying text', 'error');
            });
        });

        deleteIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this prompt?')) {
                row.remove();
                debouncedSave();
            }
        });

        // Initial resize
        setTimeout(autoResizeTextarea, 0);

        return row;
    };

    addRowBtn.addEventListener('click', () => {
        const newRow = createPromptRow({ type: 'System', name: 'New Prompt', prompt: '' });
        tableBody.appendChild(newRow);
        debouncedSave();
    });

    saveBtn.addEventListener('click', () => savePrompts(true));

    fetchPrompts();
});

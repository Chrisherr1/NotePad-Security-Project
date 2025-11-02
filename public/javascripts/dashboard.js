let notes = [];
let currentNoteId = null;
let currentFilter = 'all';

// Initialize the app
async function initNotes() {
    notes = await getNotes();
    updateCounts();
    renderNotes();
}

// Update the counts in the sidebar
function updateCounts() {
    document.getElementById('allCount').textContent = notes.length;
    document.getElementById('pinnedCount').textContent = notes.filter(n => n.pinned).length;
    document.getElementById('personalCount').textContent = notes.filter(n => n.category === 'personal').length;
    document.getElementById('workCount').textContent = notes.filter(n => n.category === 'work').length;
    document.getElementById('ideasCount').textContent = notes.filter(n => n.category === 'ideas').length;
    document.getElementById('todoCount').textContent = notes.filter(n => n.category === 'todo').length;
}

// Render notes to the DOM
async function renderNotes() {
    const list = document.getElementById('notesList');
    let filteredNotes = [...notes];

    // Apply filter
    if (currentFilter === 'pinned') {
        filteredNotes = filteredNotes.filter(n => n.pinned);
    } else if (currentFilter !== 'all') {
        filteredNotes = filteredNotes.filter(n => n.category === currentFilter);
    }

    // Sort notes (pinned first, then by date)
    filteredNotes.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date) - new Date(a.date);
    });

    // Apply search
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    if (searchTerm) {
        filteredNotes = filteredNotes.filter(n => 
            n.title.toLowerCase().includes(searchTerm) || 
            n.content.toLowerCase().includes(searchTerm)
        );
    }

    // Show empty state if no notes
    if (filteredNotes.length === 0) {
        list.innerHTML = '<div class="empty-state"><h2>No notes found</h2><p>Create your first note to get started</p></div>';
        return;
    }

    // Render note items
    list.innerHTML = filteredNotes.map(note => `
        <div class="note-item" data-note-id="${note.note_id}">
            <div class="note-item-header">
                <div class="note-item-title">${note.title}</div>
                <div class="note-item-actions">
                    <button class="icon-btn pin-btn" data-note-id="${note.note_id}" title="${note.pinned ? 'Unpin' : 'Pin'}">
                        ${note.pinned ? 'Pinned' : 'Pin'}
                    </button>
                    <button class="icon-btn delete-btn" data-note-id="${note.note_id}" title="Delete">
                        Delete
                    </button>
                </div>
            </div>
            <div class="note-item-content">${note.content}</div>
            <div class="note-item-footer">
                <span class="note-tag ${note.pinned ? 'pinned' : ''}">${note.category}</span>
                <span>•</span>
                <span>${formatDate(note.date)}</span>
            </div>
        </div>
    `).join('');
    
    // Add event listeners after rendering
    document.querySelectorAll('.note-item').forEach(item => {
        const noteId = parseInt(item.dataset.noteId);
        item.addEventListener('click', () => editNote(noteId));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNote(parseInt(btn.dataset.noteId));
        });
    });
    
    document.querySelectorAll('.pin-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePin(parseInt(btn.dataset.noteId));
        });
    });
}

// Open modal for creating or editing a note
function openModal(noteId = null) {
    const modal = document.getElementById('noteModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (noteId) {
        const note = notes.find(n => n.note_id === noteId);
        modalTitle.textContent = 'Edit Note';
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteContent').value = note.content;
        document.getElementById('noteCategory').value = note.category;
        currentNoteId = noteId;
    } else {
        modalTitle.textContent = 'Create New Note';
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('noteCategory').value = 'personal';
        currentNoteId = null;
    }
    
    modal.classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('noteModal').classList.remove('active');
}

// Get notes
async function getNotes() {
    const response = await fetch("/notes", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    const userNotes = await response.json();
    return userNotes;
}

// Save note (create or update)
async function saveNote(event) {
    event.preventDefault();
    
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const category = document.getElementById('noteCategory').value;

    if (currentNoteId) {
        // Update existing note
        //** FIX: doesn't work yet
        const response = await fetch(`/notes/${currentNoteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content, category })
        })
        const updatedNote = await response.json()
  
    } else {
        // Create new note
        //** FIX: user_id isn't being passed to database
        const response = await fetch("/notes", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, content, category })
        })
        const newNote = await response.json()
        notes.unshift(newNote);
    }

    closeModal();
    updateCounts();
    renderNotes();
}

// Edit note
// isn't there an editNote function already in saveNote?
function editNote(id) {
    openModal(id);
}

// Delete note
//** FIX: doesn't work yet
async function deleteNote(id) {
    if (confirm('Delete this note?')) {
        //notes = notes.filter(n => n.id !== id);
        const response = await fetch(`/notes/${id}`, {
            method: 'DELETE',
            headers: {
            'Content-Type': 'application/json',
            }
        })

        updateCounts();
        renderNotes();
    }
}

// Toggle pin status
function togglePin(id) {
    const note = notes.find(n => n.id === id);
    note.pinned = !note.pinned;
    updateCounts();
    renderNotes();
}

// Filter notes by category or view
function filterNotes(filter, element) {
    currentFilter = filter;
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }
    renderNotes();
}

// Format date for display
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
}

// Logout function
function logout() {
    if (confirm('Logout?')) {
        window.location.href = '/';
    }
}

// Event listeners
document.getElementById('searchBox').addEventListener('input', renderNotes);
document.getElementById('noteModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// Initialize on page load
initNotes();
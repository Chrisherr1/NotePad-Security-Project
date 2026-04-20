/*
* dashboard.js
* ------------
* Handles all logic for the NotePad dashboard:
*  - CSRF token fetching (required before any POST/PUT/DELETE)
*  - Loading and displaying the current logged in user
*  - Fetching, rendering, filtering, searching and sorting notes
*  - Creating, editing, pinning and deleting notes via the modal
*  - Mobile sidebar toggle (hamburger menu)
*  - Logout
*
* API endpoints used:
*  GET    /csrf                      — fetch CSRF token
*  GET    /api/v1/auth/user          — get current logged in user
*  GET    /api/v1/notes              — get all notes for the user
*  POST   /api/v1/notes              — create a new note
*  PUT    /api/v1/notes/:id          — update a note (edit or pin/unpin)
*  DELETE /api/v1/notes/:id          — delete a note
*  POST   /api/v1/auth/logout        — log the user out
*/

/* ================================================================
STATE
================================================================ */
const API = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://api.notepad.christianherrera.dev';

/*
* csrfToken — fetched on init, sent in x-csrf-token header on
* every POST, PUT, DELETE request. Required by csrf-sync middleware.
*/
let csrfToken = null;

/*
* notes — full list of notes fetched from the API.
* Kept in memory so filtering, sorting and searching
* don't require extra network requests.
* Re-fetched after every create, edit, pin or delete.
*/
let notes = [];

/*
* currentNoteId — tracks which note is open in the modal.
* null   = create mode → POST /api/v1/notes
* number = edit mode   → PUT  /api/v1/notes/:id
* Reset to null when the modal is closed.
*/
let currentNoteId = null;

/*
* currentFilter — tracks the active sidebar filter.
* Kept in state so that search respects the current filter.
* Default: 'all'
*/
let currentFilter = 'all';

let currentNote = null;


/* ================================================================
INIT
================================================================
Entry point. Runs on page load.
Order matters:
    1. getCsrfToken()  — must come first, needed before any mutations
    2. loadUser()      — redirect to login if session is expired
    3. initNotes()     — fetch and render notes
================================================================ */

async function init() {
    await getCsrfToken();
    await loadUser();
    await initNotes();
}

init();

/* ================================================================
CSRF TOKEN
================================================================ */

async function getCsrfToken() {
    try {
        const res = await fetch(`${API}/api/v1/csrf`, {
            credentials: 'include'
        });
        const data = await res.json();
        csrfToken = data.csrfToken;
    } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
    }
}

/* ================================================================
USER
================================================================ */

async function loadUser() {
    const res = await fetch(`${API}/api/v1/auth/user`, {
        credentials: 'include'
    });

    if (res.status === 401) {
        window.location.href = '/index.html';
        return;
    }

    const user = await res.json();
    document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
    document.getElementById('userName').textContent = user.name.split(' ')[0];
}

async function logout() {
    if (!confirm('Logout?')) return;

    await fetch(`${API}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'x-csrf-token': csrfToken
        }
    });

    csrfToken = null;
    window.location.href = '/index.html';
}

/* ================================================================
NOTES — FETCH
================================================================ */

async function initNotes() {
    notes = await getNotes();
    updateCounts();
    renderNotes();
}

async function getNotes() {
    const res = await fetch(`${API}/api/v1/notes`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (res.status === 401) {
        window.location.href = '/index.html';
        return [];
    }

    const userNotes = await res.json();
    return userNotes;
}

/* ================================================================
NOTES — RENDER
================================================================ */

async function renderNotes() {
    const list = document.getElementById('notesList');
    let filteredNotes = [...notes];

    if (currentFilter === 'pinned') {
        filteredNotes = filteredNotes.filter(n => n.pinned);
    } else if (currentFilter !== 'all') {
        filteredNotes = filteredNotes.filter(n => n.category === currentFilter);
    }

    filteredNotes.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    if (searchTerm) {
        filteredNotes = filteredNotes.filter(n =>
            n.title.toLowerCase().includes(searchTerm) ||
            n.content.toLowerCase().includes(searchTerm)
        );
    }

    if (filteredNotes.length === 0) {
        list.innerHTML = '<div class="empty-state"><h2>No notes found</h2><p>Create your first note to get started</p></div>';
        return;
    }

    list.innerHTML = filteredNotes.map(note => `
        <div class="note-item" data-note-id="${note.note_id}">
            <div class="note-item-header">
                <div class="note-item-title">${escapeHtml(note.title)}</div>
                <div class="note-item-actions">
                    <button class="icon-btn pin-btn" data-note-id="${note.note_id}" title="${note.pinned ? 'Unpin' : 'Pin'}">
                        ${note.pinned ? 'Pinned' : 'Pin'}
                    </button>
                    <button class="icon-btn delete-btn" data-note-id="${note.note_id}" title="Delete">
                        Delete
                    </button>
                </div>
            </div>
            <div class="note-item-content">${escapeHtml(note.content)}</div>
            <div class="note-item-footer">
                <span class="note-tag ${note.pinned ? 'pinned' : ''}">${escapeHtml(note.category)}</span>
                <span>•</span>
                <span>${formatDate(note.created_at)}</span>
            </div>
        </div>
    `).join('');

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

function updateCounts() {
    document.getElementById('allCount').textContent = notes.length;
    document.getElementById('pinnedCount').textContent = notes.filter(n => n.pinned).length;
    document.getElementById('personalCount').textContent = notes.filter(n => n.category === 'personal').length;
    document.getElementById('workCount').textContent = notes.filter(n => n.category === 'work').length;
    document.getElementById('ideasCount').textContent = notes.filter(n => n.category === 'ideas').length;
    document.getElementById('todoCount').textContent = notes.filter(n => n.category === 'todo').length;
}

/* ================================================================
NOTES — CREATE / EDIT / DELETE / PIN
================================================================ */

async function saveNote(event) {
    event.preventDefault();

    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const category = document.getElementById('noteCategory').value;

    if (currentNoteId) {
        await fetch(`${API}/api/v1/notes/${currentNoteId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'x-csrf-token': csrfToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content, category, pinned: currentNote.pinned })
        });
    } else {
        await fetch(`${API}/api/v1/notes`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'x-csrf-token': csrfToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content, category })
        });
    }

    notes = await getNotes();
    closeModal();
    updateCounts();
    renderNotes();
}

/*
* editNote
* --------
* Opens the modal in edit mode for the given note.
* Also closes the sidebar on mobile if it's open.
*/
function editNote(id) {
    // Close sidebar on mobile when opening a note
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('open')) {
            toggleSidebar();
        }
    }
    openModal(id);
}

async function deleteNote(id) {
    if (!confirm('Delete this note?')) return;

    const res = await fetch(`${API}/api/v1/notes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'x-csrf-token': csrfToken
        }
    });

    const result = await res.json();
    notes = await getNotes();
    updateCounts();
    renderNotes();
    return result;
}

async function togglePin(id) {
    const note = notes.find(n => n.note_id === id);
    if (!note) return;

    await fetch(`${API}/api/v1/notes/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'x-csrf-token': csrfToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: note.title,
            content: note.content,
            category: note.category,
            pinned: !note.pinned
        })
    });

    notes = await getNotes();
    updateCounts();
    renderNotes();
}

/* ================================================================
FILTER & SEARCH
================================================================ */

/*
* filterNotes
* -----------
* Updates currentFilter and re-renders the notes list.
* Also closes the sidebar on mobile after a filter is selected.
*/
function filterNotes(filter, element) {
    currentFilter = filter;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }

    // Close sidebar on mobile after selecting a filter
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('open')) {
            toggleSidebar();
        }
    }

    renderNotes();
}

document.getElementById('searchBox').addEventListener('input', renderNotes);

/* ================================================================
SIDEBAR — MOBILE TOGGLE
================================================================ */

/*
* toggleSidebar
* -------------
* Opens or closes the sidebar on mobile by toggling the 'open'
* class on the sidebar and 'active' class on the backdrop.
* Called by the hamburger button and the backdrop click.
*/
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('backdrop');

    sidebar.classList.toggle('open');
    backdrop.classList.toggle('active');
}

/* ================================================================
MODAL
================================================================ */

function openModal(noteId = null) {
    const modal = document.getElementById('noteModal');
    const modalTitle = document.getElementById('modalTitle');

    if (noteId) {
        const note = notes.find(n => n.note_id === noteId);
        currentNote = note;
        modalTitle.textContent = 'Edit Note';

        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteContent').value = note.content;
        document.getElementById('noteCategory').value = note.category;
        currentNoteId = noteId;
    } else {
        currentNote = null;
        modalTitle.textContent = 'Create New Note';
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('noteCategory').value = 'personal';
        currentNoteId = null;
    }

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('noteModal').classList.remove('active');
    currentNoteId = null;
    currentNote = null;
}

document.getElementById('noteModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

/* ================================================================
HELPERS
================================================================ */

function formatDate(dateStr) {
    if (!dateStr) return 'No date';

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'Invalid date';

    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
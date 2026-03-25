/*
* dashboard.js
* ------------
* Handles all logic for the NotePad dashboard:
*  - CSRF token fetching (required before any POST/PUT/DELETE)
*  - Loading and displaying the current logged in user
*  - Fetching, rendering, filtering, searching and sorting notes
*  - Creating, editing, pinning and deleting notes via the modal
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
const API = ''; // change to '' when deploying
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
* e.g. if you're on 'work' and search, results stay within 'work'.
* Default: 'all'
*/
let currentFilter = 'all';

//
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
================================================================
Fetches a CSRF token from GET /csrf and stores it in csrfToken.
The backend (csrf-sync) ties this token to the current session.
Sent back in the 'x-csrf-token' header on every mutating request.
If the token is missing or doesn't match the session → 403 Forbidden.
================================================================ */

async function getCsrfToken() {
    try {
        const res = await fetch(`${API}/csrf`, {
            /*
            * credentials: 'include' must be on EVERY fetch() call.
            * It sends the session cookie with the request so the
            * backend can identify the user and validate the CSRF token.
            */
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

/*
* loadUser
* --------
* Fetches the current logged in user from GET /api/v1/auth/user.
* Passport populates req.user from the session on the backend.
*
* On success: populates the sidebar avatar initial and first name.
* On 401:     session is expired or user is not logged in —
*             redirect to login page.
*/
async function loadUser() {
    const res = await fetch(`${API}/api/v1/auth/user`, {
        credentials: 'include'
    });

    if (res.status === 401) {
        window.location.href = '/index.html';
        return;
    }

    const user = await res.json();

    /*
    * Populate sidebar user info.
    * Previously done server-side by EJS:
    *   <%= user.name.charAt(0) %>  and  <%= user.name.split(' ')[0] %>
    * Now populated here after the fetch resolves.
    */
    document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
    document.getElementById('userName').textContent = user.name.split(' ')[0];
}

/*
* logout
* ------
* Sends POST /api/v1/auth/logout with the CSRF token.
* The backend destroys the session and clears the session cookie.
* Redirects to login page on success.
*
* Previously this was a <form action="/logout" method="POST">.
* Now it's a fetch() so we stay in control of the redirect.
*/
async function logout() {
    if (!confirm('Logout?')) return;

    await fetch(`${API}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            /*
            * CSRF token required on logout to prevent CSRF attacks
            * where a malicious site tricks your browser into logging you out.
            */
            'x-csrf-token': csrfToken
        }
    });

    window.location.href = '/index.html';
}

/* ================================================================
NOTES — FETCH
================================================================ */

/*
* initNotes
* ---------
* Fetches notes then triggers the initial render and count update.
* Called once on page load after getCsrfToken() and loadUser().
*/
async function initNotes() {
    notes = await getNotes();
    updateCounts();
    renderNotes();
}

/*
* getNotes
* --------
* Fetches all notes for the logged in user from GET /api/v1/notes.
* The backend uses the session to identify the user and returns
* only their notes.
*
* Returns the notes array on success.
* Redirects to login on 401 (session expired).
*/
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

/*
* renderNotes
* -----------
* Filters, sorts and renders the notes list to the DOM.
* Called after every state change: load, create, edit, delete,
* pin, filter change, and search input.
*
* Pipeline:
*   1. Copy notes array (don't mutate the original)
*   2. Apply currentFilter (all / pinned / category)
*   3. Sort (pinned first, then newest first by date)
*   4. Apply search term if present
*   5. Render to DOM or show empty state
*   6. Attach event listeners to rendered elements
*/
async function renderNotes() {
    const list = document.getElementById('notesList');
    let filteredNotes = [...notes]; // copy so we don't mutate the original

    // Step 2: apply the current sidebar filter
    if (currentFilter === 'pinned') {
        filteredNotes = filteredNotes.filter(n => n.pinned);
    } else if (currentFilter !== 'all') {
        // filter is a category name: 'personal', 'work', 'ideas', 'todo'
        filteredNotes = filteredNotes.filter(n => n.category === currentFilter);
    }

    /*
    * Step 3: sort — pinned notes always appear first.
    * Within each group (pinned / unpinned), sort newest first by date.
    */
    filteredNotes.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;  // a pinned, b not → a first
        if (!a.pinned && b.pinned) return 1;   // b pinned, a not → b first
        return new Date(b.created_at) - new Date(a.created_at); // same pin state → newest first
    });

    // Step 4: apply search term if the search box has a value
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    if (searchTerm) {
        filteredNotes = filteredNotes.filter(n =>
            n.title.toLowerCase().includes(searchTerm) ||
            n.content.toLowerCase().includes(searchTerm)
        );
    }

    // Step 5a: show empty state if no notes match
    if (filteredNotes.length === 0) {
        list.innerHTML = '<div class="empty-state"><h2>No notes found</h2><p>Create your first note to get started</p></div>';
        return;
    }

    /*
    * Step 5b: render note cards.
    * note_id is used here (not 'id') — must match the field
    * name returned by your backend (NoteController.getNotes).
    */
    list.innerHTML = filteredNotes.map(note => `
        <div class="note-item" data-note-id="${note.note_id}">
            <div class="note-item-header">
                <div class="note-item-title">${escapeHtml(note.title)}</div>
                <div class="note-item-actions">
                    <!--
                        data-note-id on buttons lets event listeners read the id.
                        e.stopPropagation() on these buttons prevents the card's
                        click handler (editNote) from also firing.
                    -->
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

    /*
    * Step 6: attach event listeners AFTER rendering.
    * Elements don't exist until innerHTML is set, so listeners
    * must be attached here. Re-attached after every render call.
    */

    // clicking the note card body opens the edit modal
    document.querySelectorAll('.note-item').forEach(item => {
        const noteId = parseInt(item.dataset.noteId);
        item.addEventListener('click', () => editNote(noteId));
    });

    // delete button — stopPropagation prevents card click from also firing
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNote(parseInt(btn.dataset.noteId));
        });
    });

    // pin button — stopPropagation prevents card click from also firing
    document.querySelectorAll('.pin-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePin(parseInt(btn.dataset.noteId));
        });
    });
}

/*
* updateCounts
* ------------
* Updates the note count badges in the sidebar.
* Always uses the full notes[] array (not a filtered subset)
* so counts reflect totals across all categories.
* Called after every load, create, edit, pin or delete.
*/
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

/*
* saveNote
* --------
* Handles both creating and editing a note.
* Called by the modal form's onsubmit="saveNote(event)".
*
* currentNoteId === null → POST /api/v1/notes     (create)
* currentNoteId !== null → PUT  /api/v1/notes/:id  (edit)
*
* Backend expects req.body: { title, content, category }
* CSRF token required on both POST and PUT.
*
* On success: close modal, re-fetch notes, update counts, re-render.
*/
async function saveNote(event) {
    event.preventDefault(); // stop default form submission (page reload)

    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const category = document.getElementById('noteCategory').value;
    const pinned = currentNote ? currentNote.pinned : false;
    


    if (currentNoteId) {
        // edit mode — PUT /api/v1/notes/:id
        await fetch(`${API}/api/v1/notes/${currentNoteId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'x-csrf-token': csrfToken, // required by csrf-sync
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                title, content, category, pinned: currentNote.pinned})
        });
    } else {
        // create mode — POST /api/v1/notes
        await fetch(`${API}/api/v1/notes`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'x-csrf-token': csrfToken, // required by csrf-sync
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                title, content, category})
        });
    }

    /*
    * Re-fetch from the API after save to stay in sync with the backend.
    * The backend may have set timestamps, generated IDs, etc.
    */
    notes = await getNotes();
    closeModal();
    updateCounts();
    renderNotes();
}

/*
* editNote
* --------
* Opens the modal in edit mode for the given note.
* Called when the user clicks anywhere on a note card.
*
* id — note_id of the note to edit (integer)
*/
function editNote(id) {
    openModal(id);
}

/*
* deleteNote
* ----------
* Sends DELETE /api/v1/notes/:id after user confirms.
* CSRF token required.
* On success: re-fetch notes, update counts, re-render.
*
* id — note_id of the note to delete (integer)
*/
async function deleteNote(id) {
    if (!confirm('Delete this note?')) return;

    const res = await fetch(`${API}/api/v1/notes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'x-csrf-token': csrfToken // required by csrf-sync
        }
    });

    const result = await res.json();
    notes = await getNotes();
    updateCounts();
    renderNotes();
    return result;
}

/*
* togglePin
* ---------
* Flips the pinned state of a note via PUT /api/v1/notes/:id.
* Sends the full note payload with pinned toggled since your
* backend's updateNote likely expects all fields.
* CSRF token required.
*
* id — note_id of the note to pin/unpin (integer)
*/
async function togglePin(id) {

    const note = notes.find(n => n.note_id === id);
   
    if (!note) return;

    await fetch(`${API}/api/v1/notes/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'x-csrf-token': csrfToken, // required by csrf-sync
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: note.title,
            content: note.content,
            category: note.category,
            pinned: !note.pinned // flip the current pin state
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
* No API call — filtering happens on the in-memory notes[] array.
* Called by sidebar nav items: onclick="filterNotes('all', this)"
*
* filter  — 'all' | 'pinned' | 'personal' | 'work' | 'ideas' | 'todo'
* element — the clicked nav item, used to toggle the active CSS class
*/
function filterNotes(filter, element) {
    currentFilter = filter; // update state so search respects the active filter

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }

    renderNotes();
}

/*
* Search input handler
* --------------------
* Re-renders notes in real time as the user types.
* Respects currentFilter — search only applies within the active filter.
* No API call — filtering is done on the in-memory notes[] array.
*/
document.getElementById('searchBox').addEventListener('input', renderNotes);

/* ================================================================
MODAL
================================================================ */

/*
* openModal
* ---------
* Opens the note modal in create or edit mode.
*
* No argument  → create mode (empty form)
* With noteId  → edit mode (form pre-filled with note data)
*
* noteId — optional note_id integer. Omit for create mode.
*/
function openModal(noteId = null) {
    const modal = document.getElementById('noteModal');
    const modalTitle = document.getElementById('modalTitle');

    if (noteId) {

        /*
        * Edit mode — find the note in the local notes[] cache.
        * Uses note_id (not 'id') to match your backend's field name.
        */
        const note = notes.find(n => n.note_id === noteId);
        currentNote = note;
        modalTitle.textContent = 'Edit Note';

        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteContent').value = note.content;
        document.getElementById('noteCategory').value = note.category;
        currentNoteId = noteId;
    } else {
        currentNote = null;
        // create mode — reset all fields to defaults
        modalTitle.textContent = 'Create New Note';
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('noteCategory').value = 'personal';
        currentNoteId = null;
    }

    modal.classList.add('active');
}

/*
* closeModal
* ----------
* Hides the modal and resets currentNoteId.
* Called by: × button, Cancel button, saveNote() on success,
* and clicking outside the modal backdrop.
*/
function closeModal() {
    document.getElementById('noteModal').classList.remove('active');
    currentNoteId = null;
    currentNote = null;
}

/*
* Click outside modal to close
* -----------------------------
* If the user clicks the modal backdrop (the modal div itself,
* not the content inside it), close the modal.
* e.target === this confirms the click was on the backdrop.
*/
document.getElementById('noteModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

/* ================================================================
HELPERS
================================================================ */

/*
* formatDate
* ----------
* Converts an ISO date string to a human-readable relative label.
* Used in the note card footer.
*
* dateStr — ISO date string from the backend (e.g. "2024-03-01T12:00:00Z")
* Returns: 'Today' | 'Yesterday' | 'N days ago' | 'MM/DD/YYYY'
*/
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
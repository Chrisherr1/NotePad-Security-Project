    import NoteRepository from '../repository/NoteRepository.js';

    class NoteController {

        // get all notes for the logged in user
        // req.user.user_id is attached by passport's deserializeUser on every request
        async getNotes(req, res) {
            try {

                if (!req.user?.user_id) { //error handling for unauthenticated user, checks if req.user exists and has a user_id property
                return res.status(401).send({ error: 'Unauthorized' });
                }

                const id = req.user.user_id;
                const notes = await NoteRepository.getUserNotes(id);
                res.status(200).send(notes);

            } catch (error) {
                res.status(500).send({ error: 'Could not fetch notes' });
            }
        }

        // create a new note for the logged in user
        // user_id comes from req.user not req.body for security
        async createNote(req, res) {
            try {

                if(!req.user?.user_id) { //error handling for unauthenticated user, checks if req.user exists and has a user_id property
                    return res.status(401).send({ error: 'Unauthorized' });
                }

                const { title, content, category } = req.body;

                if(!title || !content){ //error handling for missing title or content , checks if title and content are present in the request body
                    return res.status(400).send({ error: 'Title and content are required' });
                }

                const note = await NoteRepository.createNote(title, content, category, req.user.user_id);
                res.status(201).send(note);

            } catch (error) { // catch any errors and send a 500 response
                res.status(500).send({ error: 'Could not create note' });
            }
        }

        // update an existing note by id
        // id comes from the URL params
        async updateNote(req, res) {

            console.log('req.body:', req.body); // add this

            try {
                if (!req.user?.user_id) { //error handling for unauthenticated user, checks if req.user exists and has a user_id property
                    return res.status(401).send({ error: 'Unauthorized' });
                }

                const id = parseInt(req.params.id); // parse id from URL params to an integer

                if(isNaN(id)) { //error handling for invalid id, checks if id is a number
                    return res.status(400).send({ error: 'Invalid note id' });
                }

                const { title, content, category, pinned } = req.body;

                if(!title || !content){ //error handling for missing title or content , checks if title and content are present in the request body
                    return res.status(400).send({ error: 'Title and content are required' });
                }

                const existingNote = await NoteRepository.getNoteById(id); //get the note by id to check if it belongs to the user

                if(!existingNote) { //error handling for note not found, checks if the note with the given id exists in the user's notes
                    return res.status(404).send({ error: 'Note not found' });
                }

                if(existingNote.user_id !== req.user.user_id) { //error handling for unauthorized note update, checks if the note belongs to the logged in user
                    return res.status(403).send({ error: 'Forbidden' });
                }

                const note = await NoteRepository.updateNote(title, content, category, pinned, id);
                res.status(200).send(note);

            } catch (error) { // catch any errors and send a 500 response
                res.status(500).send({ error: 'Could not update note' });
            }
        }

        // delete a note by id
        // id comes from the URL params
        async deleteNote(req, res) {
            try {
                if(!req.user?.user_id) { //error handling for unauthenticated user, checks if req.user exists and has a user_id property
                    return res.status(401).send({ error: 'Unauthorized' });
                }

                const id = parseInt(req.params.id);
                if(isNaN(id)) { //error handling for invalid id, checks if id is a number
                    return res.status(400).send({ error: 'Invalid note id' });
                }
                const existingNote = await NoteRepository.getNoteById(id); //get the note by id to check if it belongs to the user

                if(!existingNote) { //error handling for note not found, checks if the note with the given id exists in the user's notes
                    return res.status(404).send({ error: 'Note not found' });
                }

                if(existingNote.user_id !== req.user.user_id) { //error handling for unauthorized note deletion, checks if the note belongs to the logged in user
                    return res.status(403).send({ error: 'Forbidden' });
                }

                const result = await NoteRepository.deleteNote(id);

                res.status(200).send(result);
            } catch (error) {
                res.status(500).send({ error: 'Could not delete note' });
            }
        }
    }

    export default new NoteController();
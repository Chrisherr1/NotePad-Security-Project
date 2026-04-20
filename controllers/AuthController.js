import UserService from '../services/userService.js';

class AuthController {

    // login user - grabs email and password from request body, calls UserService to verify credentials
    // then uses passport's req.login to establish a session and returns success response
    async login(req,res,next){

        const {email, password} = req.body;
        try {
            if(!email || !password) { //error handling for missing email or password, checks if email and password are present in the request body
                return res.status(400).json({message: 'Email and password are required'});
            }
            
        const user = await UserService.loginUser(email,password);
        
        req.session.regenerate(function(regenerateError) {
            if (regenerateError) {
                return next(regenerateError);
            }

            req.login(user, (error) => {
                if(error){
                return next(error);
                }
            
            return res.status(200).json({
            success: true,
            message: 'Login successful'
        });
    });
});
        }catch(error) {
            return res.status(401).json({message: 'Invalid email or password'});
        }
    }

    // signup user - grabs name, email and password from request body
    // calls UserService to create a new user and returns success response
    async signup(req,res,next){

        const { name, email, password } = req.body;
        try {
            if(!name || !email || !password) { //error handling for missing name, email or password, checks if name, email and password are present in the request body
                return res.status(400).json({message: 'Name, email and password are required'});
            }
        const user = await UserService.createUser(name, email, password);

        req.session.regenerate(function(regenerateError) {
            if (regenerateError) {
                return next(regenerateError);
            }

        req.login(user, (error) => {
            if(error){
                return next(error);
            }
            return res.status(201).json(
                {
                success: true,
                message:'Account created successfully'

            });
        });
    });
            }catch(error) {
                const message = error.message === 'Email already registered'
                    ? error.message
                    : 'Unable to create account. Please try again.';
                return res.status(400).json({ message });
            }
        }
    
// logout user - calls passport's req.logout to clear the session,
  // then destroys the session, clears the session cookie, and returns JSON
    async logout(req,res,next){

        req.logout((error) => {

            if(error){
                return next(error);
            }
            req.session.destroy(function(error) {

            if(error) {
            return next(error);
            }
            res.clearCookie('connect.sid');

            return res.status(200).json({
            success: true
            });
        });
    });
    }
}
export default new AuthController();
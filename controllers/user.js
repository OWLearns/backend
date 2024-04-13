const supabase = require('../util/con_db');
const jwt = require('jsonwebtoken');

dev = false;
key = process.env.JWTKEY;

/////////////////////////////////////////////////////oAuth/////////////////////////////////////////////////////
const oAuth = async (req, res, next) => {
    try {
        const device = req.params.device
        const provider = req.params.provider;
        let redirect;
        
        if (provider != 'google' && provider != 'github')
            throw new Error('Invalid provider');
        
        if (device == 'mobile')
            redirect = 'io.supabase.flutterquickstart://login-callback';
        else if (device == 'web')
            redirect = 'https://www.owlearns.site';
        else
            throw new Error('Invalid device');

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: redirect
            }
        });

        if (error) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid login credentials'
            });

        } else if (data) {
            res.status(200).json({
                status: 'success',
                url: data.url
            });
        }

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

/////////////////////////////////////////////////////login with email/////////////////////////////////////////////////////
const loginEmail = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            res.status(401).json({
                status: 'error',
                message: error.message
            });
            return;

        } else if (data) {
            const session = {
                "access_token": data.session.access_token,
                "token_type": data.session.token_type,
                "expires_in": data.session.expires_in,
                "expires_at": data.session.expires_at,
                "refresh_token": data.session.refresh_token,
            }
            
            res.status(200).json({
                status: 'success',
                message: 'User logged in successfully!',
                session: session
            });
        }

    } catch (error) {

        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

/////////////////////////////////////////////////////register with email/////////////////////////////////////////////////////
const registerEmail = async (req, res, next) => {
    try {
        const { email, password } = req.body;
            redirect = 'https://www.owlearns.site';
        //check if email already exists
        const { data: users, error } = await supabase.from('profiles').select('email').eq('email', email);
        
        if (error) {
            throw error;
        }

        if (users.length > 0) {
            res.status(400).json({
                status: 'error',
                message: 'Email already exists!'
            });
            return;
        }

        const username = email.split('@')[0];
        const { data, error: errorSignup } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: username
                }
            }
        });

        if (errorSignup) {
            throw new Error(errorSignup.message);
        }

        res.status(201).json({
            status: 'success',
            message: 'User created successfully!'
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}


/////////////////////////////////////////////////////delete user/////////////////////////////////////////////////////z
const deleteUser = async (req, res, next) => {
    try {
        const access_token = req.body.access_token;
        const { data, error } = await supabase.auth.getUser(access_token);

        if (error) {
            throw new Error(error.message);
        }
        
        const user = jwt.decode(access_token, key);
        const { error: errorDelete } = await supabase.auth.admin.deleteUser(user.sub);
        const { data: deleteStorage, error: errorDeleteStorage } = await supabase.storage
            .from('avatars')
            .remove([`${user.sub}/avatar`]);

        if (errorDelete) {
            throw new Error(errorDelete.message);
        }

        if (errorDeleteStorage) {
            throw new Error(errorDeleteStorage.message);
        }

        res.status(200).json({
            status: 'success',
            message: 'User deleted successfully!'
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

/////////////////////////////////////////////////////recover account/////////////////////////////////////////////////////
const recoverAccount = async (req, res, next) => {
    try {
        email = req.body.email;
        const { data: users, error: checks } = await supabase.from('profiles').select('email').eq('email', email);
        
        if (checks) {
            throw error;
        }

        if (users.length == 0) {
            res.status(400).json({
                status: 'error',
                message: 'Email does not exist!'
            });
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(req.body.email, {
            redirectTo: 'http://www.owlearns.site/recover-password'
        });

        if (error) {
            throw new Error(error.message);
        } 

        res.status(200).json({
            status: 'success',
            message: 'Password Recovery already sent to your email!'
        });

    } catch(error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

/////////////////////////////////////////////////////recover password/////////////////////////////////////////////////////
const recoverPassword = async (req, res, next) => {
    try {
        const access_token = req.body.access_token;
        const { error: checks } = await supabase.auth.getUser(access_token);

        if (checks) {
            res.status(401).json({
                status: 'error',
                message: 'Unauthorized access!'
            });
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: req.body.password
        });

        if (error) {
            throw new Error(error.message);
        }

        res.status(200).json({
            status: 'success',
            message: 'Password is changed!'
        });
        
    } catch (error){
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
    
}

/////////////////////////////////////////////////////update profile/////////////////////////////////////////////////////
const updateProfile = async (req, res, next) => {
    try{
        //check if user is authorized and get user id
        const access_token = req.body.access_token;
        const userName = req.body.username;
        const { error: checks } = await supabase.auth.getUser(access_token);

        if (checks) {
            res.status(401).json({
                status: 'error',
                message: 'Unauthorized access!'
            });
            return;
        }

        const user = jwt.decode(access_token, key);
        const id = user.sub;
        let imagePublicUrl;
        let avatar;

        if(req.file){
            try{
                //upload image to supabase storage, read the file with fs and get the public url
                avatar = req.file;
                const rawData = avatar.buffer;
                const { data, error } = await supabase.storage
                    .from('avatars')
                    .upload(`${id}/avatar`, rawData, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: avatar.mimetype
                });
        
                if(error){
                    throw new Error(error.message);
                }
        
                const { data: imageUrl } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(`${id}/avatar`);
        
                imagePublicUrl = imageUrl.publicUrl;

            } catch(error) {
                throw new Error(error.message);
            }
        } else {
            throw new Error('No image uploaded!');
        }
        
        const { error } = await supabase
            .from('profiles')
            .update({
                username : userName,
                avatar : imagePublicUrl
            })
            .eq('id', user.sub);

        if(error){
            throw new Error(error.message);
        }

        res.status(200).json({
            status: 'success',
            message: 'Succesfully Update Profile!',
            profilePicture : imagePublicUrl
        });
        
    }catch(error){
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

/////////////////////////////////////////////////////fetch user/////////////////////////////////////////////////////
const getUser = async(req, res, next) => {
    try {
        const access_token = req.body.access_token;
        const { error: checks } = await supabase.auth.getUser(access_token);

        if (checks) {
            res.status(401).json({
                status: 'error',
                message: 'Unauthorized access!'
            });
            return;
        }

        const user = jwt.decode(access_token, key);
        const id = user.sub;
        const { data, error } = await supabase
            .from('profiles')
            .select('username, email, avatar')
            .eq('id', id);

        if(error){
            throw new Error(error.message);
        }

        res.status(200).json({
            status: 'success',
            message: 'Succesfully Get Profile!',
            profile : data
        });

    }catch(error){
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }

}

module.exports = { loginEmail, registerEmail, deleteUser, recoverAccount, recoverPassword, oAuth, updateProfile, getUser };
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
        const {userName, bioData, access_token} = req.body;
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
        }
        
        const { error } = await supabase
            .from('profiles')
            .update({
                username : userName,
                avatar : imagePublicUrl,
                biodata : bioData
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
        const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select(`
                    username,
                    email,
                    avatar,
                    biodata,
                    exp,
                    quiz_point,
                    course_completed,
                    materials_completed,
                    quiz_completed,
                    topic_completed,
                    achievement_completed
                    `)
            .eq('id', id);

        const { data: achievement, error: achievementError } = await supabase
            .from('achievement_completed')
            .select('achievement(id, name)')
            .eq('profile_id', id);

        const { data: courseData, error: courseError } = await supabase
        .from('course_completed')
        .select('courses(id, name, image, description, total_topics)')
        .eq('profile_id', id);
        
        // console.log(achievement);
        if(userError || achievementError || courseError){
            console.log(userError);
            console.log(achievementError);
            console.log(courseError);
            throw new Error("there is an unexpected error");
        }

        const data = {
            user: userData[0],
            achievement: achievement.map(item => item.achievement),
            completedCourse: courseData.map (item => item.courses)
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

/////////////////////////////////////////////////////materialCompleted/////////////////////////////////////////////////////
const materialCompleted = async (req, res, next) => {
    try {
        const { access_token, materials_id } = req.body;
        const { error: checks } = await supabase.auth.getUser(access_token);

        if (checks) {
            res.status(401).json({
                status: 'error',
                message: 'Unauthorized access!'
            });
            return;
        }

        const user = jwt.decode(access_token, key);
        const profileID = user.sub;

        //check if material is already completed
        const { data: checkData, error: checkError } = await supabase
            .from('materials_completed')
            .select('*')
            .eq('profile_id', profileID)
            .eq('materials_id', materials_id);
        
        if (checkError) {
            res.status(400).json({
                status: 'failed',
                message: checkError.message
            });
            return;
        }

        if (checkData.length > 0) {
            res.status(400).json({
                status: 'failed',
                message: 'Material already completed!'
            });
            return;
        }

        const { data: materialTopicID, error: materialTopicError } = await supabase
            .from('materials')
            .select('topic_id')
            .eq('id', materials_id);
        
        if (materialTopicError) {
            res.status(400).json({
                status: 'failed',
                message: materialTopicError.message
            });
            return;
        }

        const { data: insertData, error: insertError } = await supabase
            .from(`materials_completed`)
            .insert([
                { "profile_id": profileID, "materials_id": materials_id, "topic_id": materialTopicID[0].topic_id }
            ]);
        
        if (insertError) {
            res.status(400).json({
                status: 'failed',
                message: insertError.message
            });
            return;
        }
            
        const { data: insertExpMaterial, error: insertExpMaterialError } = await supabase.rpc('incrementexp', { rowid: profileID, exp: 10});
        if (insertExpMaterialError) {
            throw new Error(insertExpMaterialError.message);
        }

        //increment the materials completed
        const { data: updateData, error: updateError } = await supabase.rpc('incrementtable', { rowid: profileID, tablename: "materials" });
        
        if (updateError) {
            throw new Error(updateError.message);
        }

        //get the topic id of the material
        const { data: topicData, error: topicError } = await supabase
            .from('materials')
            .select('topic_id')
            .eq('id', materials_id);

        if (topicError) {
            res.status(400).json({
                status: 'failed',
                message: topicError.message
            });
            return;
        }

        const topic_id = topicData[0].topic_id;

        //get all materials in the topic
        const { data: materialData, error: materialError } = await supabase
            .from('materials')
            .select('*')
            .eq('topic_id', topic_id);
        
        //get all completed materials in the topic
        const { data: materialCompleted, error: materialCompletedError } = await supabase
            .from('materials_completed')
            .select('*')
            .eq('profile_id', profileID)
            .eq('topic_id', topic_id)
        
        if (materialError || materialCompletedError) {
            res.status(400).json({
                status: 'failed',
                message: materialError ? materialError.message : materialCompletedError.message
            });
            return;
        }

        //check if all materials in the topic is completed
        if (materialData.length === materialCompleted.length) {
            const { data: courseData, error: courseError } = await supabase
                .from('topics')
                .select('course_id')
                .eq('id', topic_id);
            
            if (courseError) {
                res.status(400).json({
                    status: 'failed',
                    message: courseError.message
                });
                return;
            }

            const course_id = courseData[0].course_id;

            //insert into topic_completed
            const { data: insertData, error: insertError } = await supabase
                .from(`topic_completed`)
                .insert([
                    { "profile_id": profileID, "topic_id": topic_id, "course_id": course_id}
                ]);
            
            if (insertError) {
                throw new Error(insertError.message);
            }

            const { data: insertExpTopic, error: insertExpTopicError } = await supabase.rpc('incrementexp', { rowid: profileID, exp: 50});
            if (insertExpTopicError) {
                throw new Error(insertExpTopicError.message);
            }

            //increment the topics completed
            const { data: updateData, error: updateError } = await supabase.rpc('incrementtable', { rowid: profileID, tablename: "topic" });

            if (updateError) {
                throw new Error(updateError.message);
            }
            
            //check if all topics in a course is completed
            //get all topics in the course
            const { data: topicData, error: topicError } = await supabase
                .from('topics')
                .select('*')
                .eq('course_id', course_id);

            //get all completed topics in the course
            const { data: topicCompleted, error: topicCompletedError } = await supabase
                .from('topic_completed')
                .select('*')
                .eq('profile_id', profileID)
                .eq('course_id', course_id);

            if (topicError || topicCompletedError) {
                res.status(400).json({
                    status: 'failed',
                    message: topicError ? topicError.message : topicCompletedError.message
                });
                return;
            }

            //check if all topics in the course is completed
            if (topicData.length === topicCompleted.length) {
                const { data: insertData, error: insertError } = await supabase
                    .from(`course_completed`)
                    .insert([
                        { "profile_id": profileID, "course_id": course_id }
                    ]);
                
                if (insertError) {
                    throw new Error(insertError.message);
                }

                const { data: insertExpCourse, error: insertExpCourseError } = await supabase.rpc('incrementexp', { rowid: profileID, exp: 100});
                if (insertExpCourseError) {
                    throw new Error(insertExpCourseError.message);
                }

                const { data: updateData, error: updateError } = await supabase.rpc('incrementtable', { rowid: profileID, tablename: "course" });

                if (updateError) {
                    throw new Error(updateError.message);
                }
            }
        }

        res.status(200).json({
            status: 'success',
            message: 'Successfully completed!'
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

////////////////////////////////////////get studied material////////////////////////////////////////
const getStudied = async (req,res,next) => {
    try{
        const { access_token } = req.body;

        const { error: userError } = await supabase.auth.getUser(access_token);

        if (userError) {
            res.status(400).json({
                status: 'failed',
                message: userError.message
            });
            return;
        }

        const decoded = jwt.verify(access_token, key);
        const id = decoded.sub;

        //inner join to get the materials completed
        const { data: studiedData, error: studiedError } = await supabase
            .from('materials_completed')
            .select('topic_id(course_id(id, name, description, image, total_topics, total_materials))')
            .eq('profile_id', id);

        if (studiedError) {
            res.status(400).json({
                status: 'failed',
                message: studiedError.message
            });
            return;
        }

        //count every course completed
        let courseCompleted = {};
        const createCourseObject = (item, completed_materials) => {
            return {
                id: item.topic_id.course_id.id,
                description: item.topic_id.course_id.description,
                total_topics: item.topic_id.course_id.total_topics,
                total_materials: item.topic_id.course_id.total_materials,
                completed_materials,
                image: item.topic_id.course_id.image
            };
        }
        
        studiedData.forEach(item => {
            const courseName = item.topic_id.course_id.name;
            const isCourseCompleted = courseName in courseCompleted;
            const completedCount = isCourseCompleted ? courseCompleted[courseName].completed_materials + 1 : 1;
        
            courseCompleted[courseName] = createCourseObject(item, completedCount);
        });

        res.status(200).json({
            status: 'success',
            data: courseCompleted
        });

    }catch(error){
        res.status(500).json({
            status: 'failed',
            message: error.message
        });
    }
}

////////////////////////////////////////getting leaderboard////////////////////////////////////////
const getLeaderboard = async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('profiles')
        .select('username, exp, avatar')
        .order('exp', { ascending: false })
        .order('username', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        res.status(200).json({
            status: 'success',
            data: data
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

module.exports = { loginEmail, registerEmail, deleteUser, recoverAccount, recoverPassword, oAuth, updateProfile, getUser, materialCompleted, getStudied, getLeaderboard };
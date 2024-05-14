const supabase = require('../util/con_db');
const jwt = require('jsonwebtoken');

////////////////////////////////////////get course////////////////////////////////////////
const getCourse = async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('courses').select('*');
        if (error || data.length === 0) {
            res.status(400).json({
                status: 'failed',
                message: "No courses found in the database"
            });
            return;
        }

        if (data) {
            res.status(200).json({
                status: 'success',
                data: data
            });
            return;
        }

        throw new Error('An error occurred while fetching courses');

    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: error.message
        });
    }
}

////////////////////////////////////////add courses////////////////////////////////////////
const addCourse = async (req, res, next) => {
    try{
        const { name, description } = req.body;
        const thumbnail = req.file;
        const rawData = thumbnail.buffer;
        
        const { data: uploadData, error: uploadError } = supabase.storage
            .from('coursesImage')
            .upload(`${name}_image`, rawData, {
                cacheControl: 3600,
                upsert: true,
                contentType: thumbnail.mimetype
            })
        
        if (uploadError)
            throw new Error(uploadError.message);

        const { data: imageUrl } = supabase.storage
            .from('coursesImage')
            .getPublicUrl(`${name}_image`);
        
        const imagePublicUrl = imageUrl.publicUrl;

        const {data, error} = await supabase.from('courses').insert(
            [
                {
                    name: name,
                    image: imagePublicUrl,
                    total_topics:0,
                    total_materials:0,
                    description: description,
                }
            ]
        );

        if(error){
            res.status(400).json({
                status: 'failed',
                message: error.message
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            mesasge: 'Succesfully add new course'
        });
    }catch(error){
        res.status(500).json({
            status: 'failed',
            message: error.message
        });
    }
}

////////////////////////////////////////get topics////////////////////////////////////////
const getTopics = async (req, res, next) => {
    try {
        const courseID = req.params.courseID;
        if (!courseID) {
            res.status(400).json({
                status: 'failed',
                message: 'Course ID is required'
            });
            return;
        }
        
       const { data, error } = await supabase.from('topics').select('*').eq('course_id', courseID);
         if (error || data.length === 0) {
              res.status(400).json({
                status: 'failed',
                message: "No topics found for the specified course ID"
              });
              return;
         }
         if (data) {
            res.status(200).json({
                status: 'success',
                data: data
            });
            return;
        }

        throw new Error('An error occurred while fetching materials');
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: error.message
        });
    }
}

////////////////////////////////////////add topic////////////////////////////////////////
const addTopics = async(req, res, next) => {
    try {
        const { course_id, name } = req.body;

        const { data, error } = await supabase.from('topics').insert(
            [
                {
                    course_id: course_id,
                    name: name
                }
            ]
        )

        if (error) {
            res.status(400).json({
                message: error.message
            });
            return;
        }

        const { data: updateData, error: updateError } = await supabase.rpc('incrementtopics', {course_id: course_id});
        
        if (updateError) {
            res.status(400).json({
                message: updateError.message
            });
            return;
        }

        res.status(200).json({
            message: 'Succesfuly added Topic!',
             course_id: course_id,
             name: name
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}

////////////////////////////////////////add materials////////////////////////////////////////
const addMaterial = async (req, res, next) => {
    try{
        const { topicID, title, yt_link, description } = req.body;
        const thumbnail = req.file;
        const rawData = thumbnail.buffer;
        const { data: uploadData, error: uploadError } = supabase.storage
            .from('materialsImage')
            .upload(`${title}_image`, rawData, {
                cacheControl: 3600,
                upsert: true,
                contentType: thumbnail.mimetype
            })
        
        if (uploadError)
            throw new Error(uploadError.message);

        const { data: imageUrl } = supabase.storage
            .from('materialsImage')
            .getPublicUrl(`${title}_image`);
        
        const imagePublicUrl = imageUrl.publicUrl;

        const {data, error} = await supabase.from('materials').insert(
            [
                {
                    topic_id: topicID,
                    title: title,
                    yt_link: yt_link,
                    description: description,
                    image: imagePublicUrl
                }
            ]
        );

        const { data: updateData, error: updateError } = await supabase.rpc('incrementmaterials', {topic_id: topicID});

        if (updateError) {
            throw new Error(updateError.message);
        }

        if(error){
            res.status(400).json({
                status: 'failed',
                message: error.message
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            mesasge: 'Succesfully add new material'
        });
    }catch(error){
        res.status(500).json({
            status: 'failed',
            message: error.message
        });
    }
}

////////////////////////////////////////get materials////////////////////////////////////////
const getMaterials = async (req, res, next) => {
    try {
        const topicID = req.params.topicID;
        if (!topicID) {
            res.status(400).json({
                status: 'failed',
                message: 'Topic ID is required'
            });
            return;
        }
        
       const { data, error } = await supabase.from('materials').select('*').eq('topic_id', topicID);
        if (error || data.length === 0) {
            res.status(400).json({
            status: 'failed',
            message: "No materials found for the specified topic ID"
            });
            return;
        }

        if (data) {
            res.status(200).json({
                status: 'success',
                data: data
            });
            return;
        }

        throw new Error('An error occurred while fetching materials');
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: error.message
        });
    }
}

////////////////////////////////////////get quiz////////////////////////////////////////
const getQuiz = async (req,res,next) => {
    try{
        const topicID = req.body.topicID;
        const access_token = req.body.access_token;
        let canBeAccessed = false;

        const { data: checkToken, error: checkErrorToken } = await supabase.auth.getUser(access_token);

        if(checkErrorToken){
            res.status(400).json({
                status: 'failed',
                message: checkError.message
            });
            return;
        }

        const decodedToken = jwt.decode(access_token);
        const profileID = decodedToken.sub;

        if (!topicID) {
            res.status(400).json({
                status: 'failed',
                message: 'Topic ID is required'
            });
            return;
        }

        const { data, error } = await supabase.from('quiz').select(`
            question,
            multiple_choice,
            answer
        `).eq('topic_id', topicID);

        if (error || data.length === 0) {
            res.status(400).json({
                status: 'failed',
                message: 'There is no quiz for this topic'
            });
            return;
        }

        const { data: checkCompleted, error: checkError } = await supabase.from('topic_completed').select('*').eq('topic_id', topicID).eq('profile_id', profileID);

        if(checkError){
            res.status(400).json({
                status: 'failed',
                message: checkError.message
            });
            return;
        }

        if(checkCompleted.length > 0){
            console.log(checkCompleted);
            canBeAccessed = true;
        }


        res.status(200).json({
            status: 'successfully fetch quiz data',
            data: data,
            canBeAccessed: canBeAccessed
        });

    }catch(error){
        res.status(500).json({
            status: 'failed',
            message: error.message
        });
    }
}

////////////////////////////////////////add quiz////////////////////////////////////////
const addQuiz = async (req,res,next) => {
    try{
        const { topicID, question, multiple_choice, answer } = req.body;

        const { data, error } = await supabase.from('quiz').insert(
            [
                {   
                    topic_id: topicID,
                    question: question,
                    multiple_choice: multiple_choice,
                    answer: answer
                }
            ]
        );
        
        if(error){
            res.status(400).json({
                status: 'failed',
                message: error.message
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message : 'Succesfully add new quiz'
        });

    }catch(error){
        res.status(500).json({
            status: 'failed',
            message: error.message
        });
    }
}

////////////////////////////////////////add quiz////////////////////////////////////////
const quizScore = async (req,res,next) => {
    try{
        const { topicID, access_token, score} = req.body;

        const { data: checkToken, error: checkErrorToken } = await supabase.auth.getUser(access_token);

        if(checkErrorToken){
            res.status(400).json({
                status: 'failed',
                message: checkError.message
            });
            return;
        }

        const decodedToken = jwt.decode(access_token);
        const profileID = decodedToken.sub;

        const {data, error} = await supabase.from('quizScores').select('*').match({profileID: profileID,topicID: topicID });
        
        if(error){
            res.status(400).json({
                status: 'failed',
                message: error.message
            });
            return;
        }

        if(data.length === 0){
            const { data, error:insertError } = await supabase.from('quizScores').insert(
                [
                    {   
                        topicID: topicID,
                        profileID: profileID,
                        score: score
                    }
                ]
            );

            if(insertError){
                res.status(400).json({
                    status: 'failed',
                    message: insertError.message
                });
                return;
            }
        }else{
            const { data, error:updateError } = await supabase.from('quizScores')
            .update({score: score})
            .match({profileID: profileID,topicID: topicID });

            if(updateError){
                res.status(400).json({
                    status: 'failed',
                    message: updateError.message
                });
                return;
            }
        }

        res.status(200).json({
            status: 'success',
            message : 'Succesfully update quiz score'
        });

    }catch(error){
        res.status(500).json({
            status: 'failed',
            message: error.message
        });
    }
}

module.exports = { getCourse, getTopics, addTopics, getMaterials, addMaterial, getQuiz, addQuiz, addCourse, quizScore };
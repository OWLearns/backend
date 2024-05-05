const supabase = require('../util/con_db');


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
        const topicImage = req.file;
        const rawData = topicImage.buffer;

        const { data: uploadData, error: uploadError } = supabase.storage
            .from('topicImage')
            .upload(`${name}_image`, rawData, {
                cacheControl: 3600,
                upsert: true,
                contentType: topicImage.mimetype
            })
        
        if (uploadError)
            throw new Error(uploadError.message);
        

        const { data: imageUrl } = supabase.storage
            .from('topicImage')
            .getPublicUrl(`${name}_image`);

        imagePublicUrl = imageUrl.publicUrl;

        const { data, error } = await supabase.from('topics').insert(
            [
                {
                    course_id: course_id,
                    name: name,
                    image: imagePublicUrl
                }
            ]
        )
        
        res.status(200).json({
            message: 'Succesfuly added Topic!',
             course_id: course_id,
             name: name,
             imageUrl: imagePublicUrl
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
        const { topicID, title, yt_link, description} = req.body;
        const {data, error} = await supabase.from('materials').insert(
            [
                {
                    topic_id: topicID,
                    title: title,
                    yt_link: yt_link,
                    description: description
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
        const topicID = req.params.topicID;
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

        res.status(200).json({
            status: 'successfully fetch quiz data',
            data: data
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

module.exports = { getCourse, getTopics, addTopics, getMaterials, addMaterial, getQuiz, addQuiz };
const express = require('express')
const router = express.Router()
const con = require("../db")

// upload question images to the server
router.post('/upload-question-images', (req, res) => {
    const ckimage = req.files.image

    //changing image name
    const file_name_array = ckimage.name.split('.')
    const extension = file_name_array[file_name_array.length -1]
    const new_image_name = Math.floor(Math.random() * 10000000000) + '.' + extension

    var allowed_extensions = ["jpg", "gif", "png", "JPEG", "JPG", "GIF", "PNG", "jpeg"];
    if (allowed_extensions.includes(extension.toLowerCase())) {
        // path where images are to store
        const directoryPath = 'D:/question-images/' + new_image_name
        ckimage.mv(directoryPath, (err) => {
            if(err)
                throw err;
        })
        res.send({msg : directoryPath});
    }
    
})

//Get Sessions like 2019-2020 etc

router.get("/session-years",(req,res)=>{
    con.query(`select * from session_table`,(err,result)=>{
        res.send(result)
    })
})

module.exports = router
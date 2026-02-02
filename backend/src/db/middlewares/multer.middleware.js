import multer from 'multer'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  }, 
  filename: function (req, file, cb) {
    cb(null, file.originalname) // after completion add unique suffix in refrence to user id
  }
})


const upload = multer({ storage })
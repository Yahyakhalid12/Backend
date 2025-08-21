import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("Multer destination called for file:", file.originalname);
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    console.log("Multer filename called for file:", file.originalname);
    cb(null, file.originalname)
  }
})

export const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        console.log("File filter called for:", file.originalname, "mimetype:", file.mimetype);
        // Accept images only
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
})
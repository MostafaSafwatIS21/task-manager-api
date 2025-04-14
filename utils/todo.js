const multer = require("multer");
const sharp = require("sharp");
// Set up multer storage
const storage = multer.memoryStorage();
// Set up multer upload
const multerFilter = function (req, file, cb) {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({ storage, fileFilter: multerFilter });

// Middleware to handle image upload
exports.uploadUserPhoto = upload.single("image");
// Middleware to resize image
exports.resizeUserPhoto = asyncHandler(async (req, res, next) => {
  console.log(req.file);

  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  res.body.image = req.file.filename;
  console.log(req.file.filename);

  next();
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const upload_controller_1 = require("../controllers/upload.controller");
const router = express_1.default.Router();
// Configure Multer for temporary storage - use OS temp directory for Railway compatibility
const tempDir = process.env.NODE_ENV === 'production' ? os_1.default.tmpdir() : path_1.default.join(__dirname, '../temp/');
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});
// Set up multer with large file size limit for Cloudinary
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit
    }
});
// Routes
router.post('/', upload.single('file'), upload_controller_1.uploadFile);
router.get('/', upload_controller_1.getAllUploads);
router.delete('/:id', upload_controller_1.deleteUpload);
exports.default = router;

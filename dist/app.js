"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const compression_1 = __importDefault(require("compression"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Define single CORS configuration
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204
};
// Middleware - optimized order
app.use((0, compression_1.default)()); // Add compression for faster response times
app.use((0, cors_1.default)(corsOptions)); // Use CORS only once with proper options
app.use(express_1.default.json({ limit: '10mb' })); // Reduced limit for better performance
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' })); // Reduced limit
// Create uploads temp directory - use OS temp directory for Railway compatibility
const tempDir = process.env.NODE_ENV === 'production' ? os_1.default.tmpdir() : path_1.default.join(__dirname, './temp');
if (!fs_1.default.existsSync(tempDir) && process.env.NODE_ENV !== 'production') {
    fs_1.default.mkdirSync(tempDir, { recursive: true });
}
// Routes
app.use('/api/uploads', upload_routes_1.default);
// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Hello from the server!' });
});
// MongoDB connection with optimized options
const MONGO_URI = process.env.MONGO_URI;
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(MONGO_URI || '', {
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });
        console.log('MongoDB connected');
        // Set up mongoose performance options
        mongoose_1.default.set('autoIndex', false); // Disable autoIndex in production
    }
    catch (err) {
        console.error('MongoDB connection error:', err);
        // Implement reconnection strategy
        setTimeout(connectDB, 5000);
    }
};
connectDB();
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});
exports.default = app;

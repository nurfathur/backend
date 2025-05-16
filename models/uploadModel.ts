import mongoose, { Document, Schema } from 'mongoose';

export interface IUpload extends Document {
  fileName: string;
  url: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  publicId?: string;
}

const uploadSchema: Schema<IUpload> = new mongoose.Schema({
  fileName: { type: String, required: true },
  url: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  publicId: { type: String }
});

const Upload = mongoose.model<IUpload>('Upload', uploadSchema);
export default Upload;
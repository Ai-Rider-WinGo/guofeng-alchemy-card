import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AssetsService {
  constructor(private config: ConfigService) {}

  getUploadDir() {
    const dir = this.config.get('UPLOAD_DIR', './uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  async saveFile(file: Express.Multer.File) {
    const url = `/uploads/${file.filename}`;
    return {
      filename: file.filename,
      original_name: file.originalname,
      size: file.size,
      url,
    };
  }

  listFiles() {
    const dir = this.getUploadDir();
    const files = readdirSync(dir);
    return files.map((f: string) => ({
      filename: f,
      url: `/uploads/${f}`,
    }));
  }

  removeFile(filename: string) {
    const filePath = join(this.getUploadDir(), filename);
    if (existsSync(filePath)) unlinkSync(filePath);
    return { deleted: true };
  }
}

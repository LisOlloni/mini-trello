import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';

import * as path from 'path';

export interface StoredFile {
  storage: 'Local' | 'GOOGLE_DRIVE';
  storageKey: string;
}

@Injectable()
export class StorageService {
  private uploadDir = path.join(process.cwd(), 'upload');

  async saveLocal(buffer: Buffer, filename: string): Promise<StoredFile> {
    await fs.mkdir(this.uploadDir, { recursive: true });

    const filePath = path.join(this.uploadDir, `${Date.now()}_${filename}`);

    await fs.writeFile(filePath, buffer);

    return { storage: 'Local', storageKey: filePath };
  }

  async removeLocal(storageKey: string) {
    try {
      await fs.unlink(storageKey);
    } catch (e) {
      // Nëse file-i nuk ekziston, e injorojmë
      console.log(e);
    }
  }
}

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import dotenv from 'dotenv';
dotenv.config();

// Helper function to wait for file to be fully written
const waitForFile = (filePath, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkFile = () => {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > 0) {
          // Wait a bit more to ensure file is completely written
          setTimeout(() => resolve(), 100);
        } else {
          // File exists but is empty, keep checking
          if (Date.now() - startTime > timeout) {
            reject(new Error('File not ready within timeout'));
          } else {
            setTimeout(checkFile, 100);
          }
        }
      } catch (err) {
        // File doesn't exist yet, keep checking
        if (Date.now() - startTime > timeout) {
          reject(err);
        } else {
          setTimeout(checkFile, 100);
        }
      }
    };
    
    checkFile();
  });
};

export async function uploadToGoFile(filePath) {
  try {
    // Wait for file to be fully written
    await waitForFile(filePath);
    
    // Verify file exists and has content
    const stats = fs.statSync(filePath);
    console.log(`📊 File size: ${stats.size} bytes`);
    
    if (stats.size === 0) {
      throw new Error('PDF file is empty');
    }
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    
    const response = await axios.post('https://upload.gofile.io/uploadfile', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.GOFILE_API_TOKEN}`
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('📦 GoFile upload response:', response.data);
    
    if (response.data.status === 'ok') {
      return response.data.data.downloadPage;
    } else {
      throw new Error(response.data.message || 'Upload failed');
    }
  } catch (err) {
    console.error('❌ GoFile upload failed:', err.response?.data || err.message);
    throw err;
  }
}
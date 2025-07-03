import axios from 'axios';
import fs from 'fs';
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
    
    // Step 1: Upload the file (this creates a new public folder automatically)
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const uploadResponse = await axios.post('https://upload.gofile.io/uploadfile', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.GOFILE_API_TOKEN}`
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('📦 GoFile upload response:', uploadResponse.data);
    
    if (uploadResponse.data.status !== 'ok') {
      throw new Error(uploadResponse.data.message || 'Upload failed');
    }

    const folderId = uploadResponse.data.data.parentFolder;
    const downloadPage = uploadResponse.data.data.downloadPage;

    // Step 2: Set expiry on the folder (30 days from now)
    const expireTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days in Unix timestamp
    //const expireTime = Math.floor(Date.now() / 1000) + (10 * 60); // 10 minutes in Unix timestamp (for trail)
    
    try {
      const updateResponse = await axios.put(
        `https://api.gofile.io/contents/${folderId}/update`,
        {
          attribute: 'expiry',
          attributeValue: expireTime
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GOFILE_API_TOKEN}`
          }
        }
      );

      console.log('⏰ Folder expiry set:', updateResponse.data);
      
      if (updateResponse.data.status === 'ok') {
        console.log(`✅Invoice Folder will expire on ${new Date(expireTime * 1000).toLocaleString()}`);
      } else {
        console.warn('⚠️ Failed to set folder expiry:', updateResponse.data.message);
      }
    } catch (updateError) {
      console.warn('⚠️ Failed to set folder expiry:', updateError.response?.data || updateError.message);
    }
    
    return downloadPage;
    
  } catch (err) {
    console.error('❌ GoFile upload failed:', err.response?.data || err.message);
    throw err;
  }
}
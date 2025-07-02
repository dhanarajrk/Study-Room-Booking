import PDFDocument from 'pdfkit';
import fs from 'fs';
import bwipjs from 'bwip-js';

export async function generateInvoicePDF(booking, outputPath) {
  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(outputPath));

  doc.fontSize(20).text('Table Booking Invoice', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Booking ID: ${booking._id}`);
  doc.text(`Name: ${booking.userName}`);
  doc.text(`Email: ${booking.email}`);
  doc.text(`Table: ${booking.tableName}`);
  doc.text(`Date: ${new Date(booking.startTime).toLocaleDateString()}`);
  doc.text(`Time: ${new Date(booking.startTime).toLocaleTimeString()} - ${new Date(booking.endTime).toLocaleTimeString()}`);
  doc.text(`Amount Paid: ₹${booking.amountPaid}`);
  doc.moveDown();

  // Add Barcode of Booking ID
  const barcodeBuffer = await bwipjs.toBuffer({
    bcid:        'code128',       // Barcode type
    text:        booking._id,     // Text to encode
    scale:       3,               // 3x scaling factor
    height:      10,              // Bar height, in millimeters
    includetext: true,            // Show human-readable text
    textxalign:  'center',        // Always good to set this
  });

  doc.image(barcodeBuffer, { fit: [250, 100], align: 'center' });

  doc.end();
}
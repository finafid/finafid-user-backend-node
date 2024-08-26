const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");

const s3 = new AWS.S3();

async function generateAndUploadInvoice(invoiceData) {
  const doc = new PDFDocument();
  const buffers = [];

  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", async () => {
    const buffer = Buffer.concat(buffers);
    const fileName = `invoice-${invoiceData.invoiceNumber}.pdf`;

    const params = {
      Bucket: process.env.bucket_name,
      Key: `invoices/${fileName}`, // S3 folder path
      Body: buffer,
      ContentType: "application/pdf",
      ACL: "public-read", // or private, depending on your needs
    };

    try {
      const data = await s3.upload(params).promise();
      console.log(`Invoice uploaded successfully at ${data.Location}`);
      return data.Location; // Return the S3 URL
    } catch (err) {
      console.error("Error uploading invoice to S3:", err);
      throw err;
    }
  });

  // Add the title
  doc.fontSize(20).text("Invoice", { align: "center" });

  // Add invoice details
  doc.fontSize(12).text(`Invoice Number: ${invoiceData.invoiceNumber}`);
  doc.text(`Date: ${invoiceData.date}`);
  doc.text(`Customer Name: ${invoiceData.customerName}`);
  doc.text(`Customer Email: ${invoiceData.customerEmail}`);

  // Add a table for items
  doc.moveDown();
  doc
    .text("Item", { continued: true })
    .text("Qty", { align: "center", continued: true })
    .text("Price", { align: "right" });
  invoiceData.items.forEach((item) => {
    doc.moveDown();
    doc
      .text(item.name, { continued: true })
      .text(item.quantity, { align: "center", continued: true })
      .text(`₹${item.price.toFixed(2)}`, { align: "right" });
  });

  // Add additional fields: Subtotal, Discount, GST, Shipping, and Total
  doc.moveDown();
  doc.fontSize(12).text(`Subtotal: ₹${invoiceData.subtotal.toFixed(2)}`);
  doc
    .text(`Discount: ₹${invoiceData.discount.toFixed(2)}`, {
      align: "left",
      continued: true,
    })
    .fillColor("green");
  doc.fillColor("black").text(`GST (incl): ₹${invoiceData.gst.toFixed(2)}`);
  doc.text(`Shipping: ₹${invoiceData.shipping.toFixed(2)}`);
  doc.text(`Total: ₹${invoiceData.total.toFixed(2)}`, {
    align: "right",
    font: "Helvetica-Bold",
  });

  // Finalize the PDF
  doc.end();
}

module.exports = generateAndUploadInvoice;

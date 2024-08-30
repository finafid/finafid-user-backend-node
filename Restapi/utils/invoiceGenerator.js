const PDFDocument = require("pdfkit");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

async function generateAndUploadInvoice(invoiceData) {
  return new Promise((resolve, reject) => {
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
      };

      try {
        const data = await s3.upload(params).promise();
        console.log(`Invoice uploaded successfully at ${data.Location}`);
        resolve(fileName);
      } catch (err) {
        console.error("Error uploading invoice to S3:", err);
        reject(err); // Reject the promise if there's an error
      }
    });

    // Add the title
    doc.fontSize(20).text("Tax Invoice", { align: "center" });

    // Add order details (top section)
    doc.moveDown();
    doc
      .fontSize(12)
      .text(`Your order ID: ${invoiceData.invoiceNumber}`, { align: "left" });
    doc.text(`Seller Details: Finafid Technologies`, { align: "left" });
    doc.text(`Payment Details: ${invoiceData.payment_method}`, {
      align: "right",
    });
    doc.text(`Date: ${invoiceData.date}`, { align: "right" });

    // Add a separator line
    doc.moveDown().moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // Add customer details
    doc.moveDown();
    doc.fontSize(12).text(`Customer Name: ${invoiceData.customerName}`);
    doc.text(`Email: ${invoiceData.customerEmail}`);
    doc.text(`Phone: ${invoiceData.customerPhoneNumber}`);
    doc.text(`Address: ${invoiceData.customerAddress}`);

    // Add a separator line
    doc.moveDown().moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // Add ordered items table
    doc.moveDown();
    const itemHeaderY = doc.y; // Store the Y position of the header

    doc
      .fontSize(12)
      .text("SL", 50, itemHeaderY)
      .text("Ordered Items", 100, itemHeaderY)
      .text("Unit Price", 300, itemHeaderY)
      .text("QTY", 400, itemHeaderY)
      .text("Total", 450, itemHeaderY);

    doc.moveDown();

    invoiceData.items.forEach((item, index) => {
      const itemY = doc.y;
      doc
        .text(index + 1, 50, itemY)
        .text(item.name, 100, itemY)
        .text(`${item.unitPrice.toFixed(2)}`, 300, itemY)
        .text(item.quantity.toString(), 400, itemY)
        .text(`${item.price.toFixed(2)}`, 450, itemY);
      doc.moveDown();
    });

    // Add a separator line before the totals
    doc.moveDown().moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // Add totals
    doc
      .fontSize(12)
      .text(`Sub Total: ${invoiceData.subtotal.toFixed(2)}`, {
        align: "left",
      })
      .moveDown()
      .text(`Discount: ${invoiceData.discount.toFixed(2)}`, {
        align: "left",
      })
      .moveDown()
      .text(`GST: ${invoiceData.gst.toFixed(2)}`, { align: "left" })
      .moveDown()
      .text(`Shipping: ${invoiceData.shipping.toFixed(2)}`, { align: "left" })
      .moveDown()
      .text(`Total: ${invoiceData.total.toFixed(2)}`, {
        align: "left",
        font: "Helvetica-Bold",
      });

    // Finalize the PDF
    doc.end();
  });
}

module.exports = { generateAndUploadInvoice };

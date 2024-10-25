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

    doc.fontSize(20).text("Tax Invoice", { align: "center" });

    // Move down to give space between title and details
    doc.moveDown();

    // Draw the Payment Mode and Date on the upper line
    const rightColumnStartX = 300;
    const detailsStartY = doc.y;

    doc.text(`Payment Mode: ${invoiceData.payment_method}`, rightColumnStartX, detailsStartY)
      .text(`Date: ${invoiceData.date}`, rightColumnStartX, detailsStartY + 15);

    // Seller and Customer details in the same line
    const leftColumnStartX = 50;
    const sectionStartY = detailsStartY + 35; // Shift down a bit for cleaner spacing

    doc.fontSize(12)
      .text(`Invoice ID: ${invoiceData.invoiceNumber}`, leftColumnStartX, sectionStartY)
      .text(`Seller: Finafid Technologies Pvt Ltd`, leftColumnStartX, sectionStartY + 15)
      .text(`GST Number: 19AAECF2320D1Z5`, leftColumnStartX, sectionStartY + 30)
      .text(`CIN : U72900WB2020PTC239330`, leftColumnStartX, sectionStartY + 45);

    doc.text(`Customer Name: ${invoiceData.customerName}`, rightColumnStartX, sectionStartY)
      .text(`Email: ${invoiceData.customerEmail}`, rightColumnStartX, sectionStartY + 15)
      .text(`Phone: ${invoiceData.customerPhoneNumber}`, rightColumnStartX, sectionStartY + 30)
      .text(`Address: ${invoiceData.customerAddress}`, rightColumnStartX, sectionStartY + 45);

    // Add a larger gap between this section and the next
    doc.moveDown(4); 

    // Separator line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // Items table (unchanged)
    const tableTop = doc.y + 10;
    doc.fontSize(12)
      .text("SL", 50, tableTop)
      .text("Ordered Items", 100, tableTop)
      .text("Unit Price", 300, tableTop)
      .text("QTY", 400, tableTop)
      .text("Total", 450, tableTop);

    doc.moveDown();

    invoiceData.items.forEach((item, index) => {
      const position = tableTop + (index + 1) * 20;
      doc.text(index + 1, 50, position)
        .text(item.name, 100, position)
        .text(`${item.unitPrice.toFixed(2)}`, 300, position)
        .text(item.quantity, 400, position)
        .text(`${item.price.toFixed(2)}`, 450, position);
    });

    // Separator line after the items table
    doc.moveDown().moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // Footer section with subtotals and totals (unchanged)
    const footerTop = doc.y + 10;
    doc.fontSize(12)
      .text("Sub Total", 50, footerTop)
      .text(`${invoiceData.subtotal.toFixed(2)}`, 450, footerTop, { align: "right" });

    doc.text("Discount", 50, footerTop + 20)
      .text(`${invoiceData.discount.toFixed(2)}`, 450, footerTop + 20, { align: "right" });

    doc.text("GST(incl)", 50, footerTop + 40)
      .text(`${invoiceData.gst.toFixed(2)}`, 450, footerTop + 40, { align: "right" });

    doc.text("Utsav Discount", 50, footerTop + 60)
      .text(`${invoiceData.utsavDiscount.toFixed(2)}`, 450, footerTop + 60, { align: "right" });

    doc.text("Coupon Discount", 50, footerTop + 80)
      .text(`${invoiceData.couponDiscount.toFixed(2)}`, 450, footerTop + 80, { align: "right" });

    doc.text("Shipping Fee", 50, footerTop + 100)
      .text(`${invoiceData.shipping.toFixed(2)}`, 450, footerTop + 100, { align: "right" });

    doc.font("Helvetica-Bold")
      .text("Total", 50, footerTop + 120)
      .text(`${invoiceData.total.toFixed(2)}`, 450, footerTop + 120, { align: "right" });

    doc.end();
  });
}


module.exports = { generateAndUploadInvoice };

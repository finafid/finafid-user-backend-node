const PDFDocument = require("pdfkit");
const axios = require("axios");
const FormData = require("form-data");

async function generateAndUploadInvoice(invoiceData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const buffer = Buffer.concat(buffers);
      const fileName = `invoice-${invoiceData.invoiceNumber}.pdf`;

      try {
        // Sending the generated PDF buffer to the PHP API
        const formData = new FormData();
        formData.append("file", buffer, {
          filename: fileName,
          contentType: "application/pdf",
        });

        const response = await axios.post("https://files.finafid.org/invoice/upload.php", formData, {
          headers: {
            ...formData.getHeaders(),
            "x-api-key": process.env.xapikey, // Optional API key for authentication
          },
        });

        if (response.data.status === "success") {
          console.log(`Invoice uploaded successfully at ${response.data.url}`);
          console.log(response.data);
          resolve(response.data.url);
        } else {
          console.error("Error uploading invoice:", response.data.message);
          reject(new Error(response.data.message));
        }
      } catch (err) {
        console.error("Error uploading invoice to PHP API:", err);
        reject(err); // Reject the promise if there's an error
      }
    });

    // Header Section with Logo
    if (invoiceData.logo) {
      doc.image(invoiceData.logo, 50, 30, { width: 100 });
    }
    doc.fontSize(20).text("INVOICE", 50, 40, { align: "left" });

    // Invoice Number and Date
    doc
      .fontSize(10)
      .text(`Invoice Number: ${invoiceData.invoiceNumber}`, 400, 40)
      .text(`Invoice Date: ${invoiceData.date}`, 400, 58)
      .text(`Payment Mode: ${invoiceData.payment_method}`, 400, 76);

    // Draw a line under the header
    doc.moveTo(50, 100).lineTo(550, 100).stroke();

    // Billing and Shipping Information
    const infoY = 120;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Seller Information", 50, infoY)
      .text("Shipping Information", 330, infoY);

    // Billing Details
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Finafid Technologies Pvt Ltd`, 50, infoY + 15)
      .text(`GST Number: 19AAECF2320D1Z5`, 50, infoY + 30)
      .text(`CIN : U72900WB2020PTC239330`, 50, infoY + 45)
      .text(`Email: support@finafid.com`, 50, infoY + 60)
      .text(`Phone: 7595878899`, 50, infoY + 75);

    // Shipping Details
    doc
      .text(`Name: ${invoiceData.customerName}`, 330, infoY + 15)
      .text(`Phone: ${invoiceData.customerPhoneNumber}`, 330, infoY + 30)
      .text(`Address: ${invoiceData.customerAddress}`, 330, infoY + 45, {
        width: 230,
      });

    // Divider Line
    doc
      .moveTo(50, infoY + 110)
      .lineTo(550, infoY + 110)
      .stroke();

    // Products Section Header
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Products", 50, infoY + 95);

    // Products Table Headers
    const tableY = infoY + 120;
    doc
      .fontSize(10)
      .fillColor("black")
      .font("Helvetica-Bold")
      .text("Description", 50, tableY)
      .text("Quantity", 250, tableY)
      .text("MRP", 350, tableY)
      .text("Total", 450, tableY);

    // Draw a line under the header
    doc
      .moveTo(50, tableY + 15)
      .lineTo(550, tableY + 15)
      .stroke();

    // Product Rows
    let positionY = tableY + 30;
    invoiceData.items.forEach((item) => {
      doc
        .font("Helvetica")
        .fillColor("black")
        .text(item.name, 50, positionY, { width: 150 })
        .text(item.quantity, 265, positionY, {})
        .text(`${item.unitPrice.toFixed(2)}`, 345, positionY, {})
        .text(
          `${(item.unitPrice * item.quantity).toFixed(2)}`,
          450,
          positionY,
          {}
        );
      positionY += 30;
    });

    // Line under items
    doc
      .moveTo(50, positionY + 5)
      .lineTo(550, positionY + 5)
      .stroke();

    // Total Summary
    const summaryY = positionY + 20;
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Subtotal", 330, summaryY)
      .text(`${invoiceData.subtotal.toFixed(2)}`, 510, summaryY, {
       
      })
      .text("Product Discount", 330, summaryY + 15)
      .text(`${invoiceData.discount.toFixed(2)}`, 510, summaryY + 15, {
        
      })
      .text("Utsav Discount", 330, summaryY + 30)
      .text(`${invoiceData.utsavDiscount.toFixed(2)}`, 510, summaryY + 30, {
        
      })
      .text("Coupon Discount", 330, summaryY + 45)
      .text(`${invoiceData.couponDiscount.toFixed(2)}`, 510, summaryY + 45, {
       
      })
      .text("Tax", 330, summaryY + 60)
      .text(`${invoiceData.gst.toFixed(2)}`, 510, summaryY + 60, {
        
      })
      .text("Shipping", 330, summaryY + 75)
      .text(`${invoiceData.shipping.toFixed(2)}`, 510, summaryY + 75, {
        
      });

    doc
      .font("Helvetica-Bold")
      .text("Total", 330, summaryY + 100)
      .text(`${invoiceData.total.toFixed(2)}`, 510, summaryY + 100, {
        
      });

    doc.moveDown().moveDown();

    const signatureY = doc.y + 30;
    doc.moveDown().moveDown();
    doc
      .fontSize(10)
      .font("Helvetica-Oblique")
      .text(
        "This invoice was electronically generated and digitally signed.",
        50,
        signatureY
      );

    // Digital Signature and Date
    doc.moveDown().moveDown();
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Authorized Signature", 50, doc.y);
    doc
      .font("Helvetica")
      .text("Date: " + new Date().toLocaleDateString(), 50, doc.y + 15);
    // doc.image("./sign.png", 50, doc.y + 35, { width: 100 }); // Placeholder for a signature image

    // End of document
    doc.end();
  });
}

module.exports = { generateAndUploadInvoice };

const PDFDocument = require("pdfkit");
const axios = require("axios");
const FormData = require("form-data");

async function generateAndUploadInvoice(invoiceData) {
  return new Promise((resolve, reject) => {
    console.log('generating')
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
          // console.log(`Invoice uploaded successfully at ${response.data.url}`);
          // console.log(response.data);
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

    // Set some basic styles
    const titleColor = '#333333';
    const accentColor = '#FF204E'; // Professional blue color
    const lightGray = '#f0f0f0';

    // Add company logo (placeholder)
    // doc.image('logo.png', 50, 45, { width: 120 });

    // Company header
    doc.fontSize(20).fillColor(accentColor).font('Times-Bold').text('Finafid Technologies Pvt Ltd', 50, 50);
    doc.fontSize(10).fillColor('#666666').font('Times-Roman')
      .text('I-Space, DH-6/35, Opp Unitech Gate 2, New Town', 50, doc.y + 5)
      .text('Kolkata, West Bengal - 700156', 50, doc.y + 2)
      .text('India', 50, doc.y + 2);

    // Tax details
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#666666')
      .text(`GSTIN: 19AAECF2320D1Z5`, 50, doc.y)
      .text(`PAN: AAECF2320D`, 50, doc.y + 2)
      .text(`CIN: U72900WB2020PTC239330`, 50, doc.y + 2);

    // Contact details


    // Invoice title and details
    doc.fontSize(22).fillColor(titleColor).font('Times-Bold').text('TAX INVOICE', 400, 50, { align: 'right' });

    // Invoice details box
    doc.roundedRect(400, 80, 164, 80, 3).fillAndStroke(lightGray, '#cccccc');
    doc.fontSize(9).fillColor('#333333').font('Times-Bold')
      .text('Invoice No:', 410, 90)
      .text('Invoice Date:', 410, 105)
      .text('Phone:', 410, 120)
      .text('Email:', 410, 135);

    doc.fontSize(9).fillColor('#333333').font('Times-Roman')
      .text(`${invoiceData.invoiceNumber}`, 455, 90, { width: 100, align: 'right' })
      .text(invoiceData.date, 455, 105, { align: 'right', width: 100 })
      .text(`+91 7595878899`, 455, 120, { align: 'right', width: 100 })
      .text('support@finafid.com', 455, 135, { align: 'right', width: 100 });

    // Customer details
    doc.fontSize(12).fillColor(accentColor).font('Times-Bold').text('Bill To:', 50, 180);
    doc.fontSize(10).fillColor('#333333').font('Times-Bold').text(invoiceData.customerName, 50, doc.y + 5);
    doc.fontSize(9).fillColor('#666666').font('Times-Roman')
      .text(invoiceData.customerBilling, 50, doc.y + 2, { width: 200 })
      .moveDown(0.5)
      .text(`Phone: ${invoiceData.customerPhoneNumber}`, 50, doc.y)
      .text(`Email: ${invoiceData.customerEmail || 'customer@example.com'}`, 50, doc.y + 2);

    if (invoiceData.customerGST) {
      doc.text(`GSTIN: ${invoiceData.customerGST}`, 50, doc.y + 2);
    }

    // Shipping details if different
    doc.fontSize(12).fillColor(accentColor).font('Times-Bold').text('Ship To:', 300, 180);
    doc.fontSize(10).fillColor('#333333').font('Times-Bold').text(invoiceData.customerName, 300, doc.y + 5);
    doc.fontSize(9).fillColor('#666666').font('Times-Roman')
      .text(`Address: ${invoiceData.customerShipping || invoiceData.customerAddress}`, 300, doc.y + 2, { width: 200 });

    // Order details
    doc.fontSize(9).fillColor('#666666')
      .text(`Order ID: ${(invoiceData.orderId).toString().toUpperCase() || '#6788768'}`, 300, doc.y + 5)
      .text(`Payment Method: ${invoiceData.payment_method === "COD" ? "Cash On Delivery" : invoiceData.payment_method === "PayU" ? "Prepaid (Card / UPI)" : invoiceData.payment_method}`, 300, doc.y + 2);

    // Table header
    const tableTop = 290;
    doc.roundedRect(50, tableTop - 10, 500, 25, 3).fill(accentColor);

    doc.fontSize(10).fillColor('#FFFFFF').font('Times-Bold')
      .text('Item Description', 60, tableTop)
      .text('Qty', 300, tableTop, { width: 40, align: 'center' })
      .text('Rate', 340, tableTop, { width: 70, align: 'right' })
      .text('GST', 410, tableTop, { width: 70, align: 'center' })
      .text('Amount', 480, tableTop, { width: 60, align: 'center' });

    // Table rows
    let y = tableTop + 30;
    let totalItems = 0;

    // Alternating row colors
    invoiceData.items.forEach((item, i) => {
      const rowHeight = 25;
      if (i % 2 === 0) {
        doc.roundedRect(50, y - 5, 500, rowHeight, 0).fill('#f9f9f9');
      }

      doc.fontSize(9).fillColor('#333333').font('Times-Roman')
        .text(item.name, 60, y, { width: 170 })
        .text(item.quantity.toString(), 300, y, { width: 40, align: 'center' })
        .text(`${item.unitPrice.toFixed(2)}`, 340, y, { width: 70, align: 'right' })
        .text(`${(item.taxPercent || 0)+'%'}`, 410, y, { width: 70, align: 'center' })
        .text(`${(item.unitPrice * item.quantity).toFixed(2)}`, 480, y, { width: 60, align: 'center' });

      totalItems += item.quantity;
      y += rowHeight;
    });

    // Line at the bottom of the table
    doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke('#cccccc');

    // Summary section
    const summaryX = 350;
    y += 15;

    doc.fontSize(9).fillColor('#333333').font('Times-Roman')
      .text('Subtotal:', summaryX, y, { width: 100 })
      .text(`${invoiceData.subtotal.toFixed(2)}`, summaryX + 100, y, { width: 88, align: 'right' });

    y += 15;
    doc.text('Discount:', summaryX, y, { width: 100 })
      .text(`${(invoiceData.discount).toFixed(2)}`,
        summaryX + 100, y, { width: 88, align: 'right' });
        y += 15;
    doc.text('Utsav Discount:', summaryX, y, { width: 100 })
      .text(`${(invoiceData.utsavDiscount ).toFixed(2)}`,
        summaryX + 100, y, { width: 88, align: 'right' });
        y += 15;
    doc.text('Coupon Discount:', summaryX, y, { width: 100 })
      .text(`${(invoiceData.couponDiscount ).toFixed(2)}`,
        summaryX + 100, y, { width: 88, align: 'right' });

    y += 15;
    doc.text('Shipping Fee:', summaryX, y, { width: 100 })
      .text(`${invoiceData.shipping === 0 ?"Free ":invoiceData.shipping.toFixed(2)}`, summaryX + 100, y, { width: 88, align: 'right' });

    // GST details
    y += 15;
    const cgst = invoiceData.gst / 2;
    const sgst = invoiceData.gst / 2;
    const gstPercent = ((invoiceData.gst / invoiceData.total) * 100).toFixed(2);

    doc.text(`CGST (incl) :`, summaryX, y, { width: 100 })
      .text(`${cgst.toFixed(2)}`, summaryX + 100, y, { width: 88, align: 'right' });

    y += 15;
    doc.text(`CGST (incl) :`, summaryX, y, { width: 100 })
      .text(`${sgst.toFixed(2)}`, summaryX + 100, y, { width: 88, align: 'right' });

    // Total
    y += 20;
    doc.roundedRect(summaryX - 10, y - 5, 210, 30, 3).fill(accentColor);
    doc.fontSize(12).fillColor('#FFFFFF').font('Times-Bold')
      .text('Total Amount RS:', summaryX, y, { width: 100 })
      .text(`${invoiceData.total.toFixed(2)}`, summaryX + 100, y, { width: 88, align: 'right' });

    // Amount in words
    y += 90;
    doc.fontSize(9).fillColor('#333333').font('Times-Bold')
      .text('Amount in Words:', 50, y);
    doc.fontSize(9).fillColor('#333333').font('Times-Roman')
      .text(numberToWords(invoiceData.total) + ' Rupees Only', 140, y);

    // Bank details


    // Terms and conditions
    const termsY = y + 20;
    doc.fontSize(10).fillColor(accentColor).font('Times-Bold')
      .text('Terms & Conditions', 50, termsY);

    doc.fontSize(8).fillColor('#666666').font('Times-Roman')
      .text('1. We reserve the right to change prices at any time without notice.', 50, termsY + 15)
      .text('2. GST is applicable on all sales.', 50, termsY + 25)
      .text('3. By placing an order, you agree to our terms and conditions.', 50, termsY + 35)
      .text('4. All disputes are subject to Kolkata jurisdiction only.', 50, termsY + 45)
      .text('5. This is a computer-generated invoice and does not require a physical signature.', 50, termsY + 55);

    // Footer
    doc.fontSize(8).fillColor('#999999').text(
      'This is a computer-generated invoice and does not require a physical signature.',
      50,715, { align: 'center', width: 500 }
    );

    
    doc.end();
  });
}

// Helper function to convert number to words (for Indian Rupees)
function numberToWords(num) {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const numberToWordsHelper = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + numberToWordsHelper(n % 100) : '');
    return '';
  };

  let result = '';

  if (Math.floor(num / 10000000) > 0) {
    result += numberToWordsHelper(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  if (Math.floor(num / 100000) > 0) {
    result += numberToWordsHelper(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  if (Math.floor(num / 1000) > 0) {
    result += numberToWordsHelper(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  if (Math.floor(num / 100) > 0) {
    result += numberToWordsHelper(Math.floor(num / 100)) + ' Hundred ';
    num %= 100;
  }
  if (num > 0) {
    result += (result !== '' ? 'and ' : '') + numberToWordsHelper(num);
  }

  return result.trim();
}


module.exports = { generateAndUploadInvoice };

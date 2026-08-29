import { SystemSettings, SalesInvoice, Employee, PayrollRun } from '../types';

export const numberToWords = (num: number): string => {
  num = Math.floor(Math.abs(num || 0));
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const below1000 = (n: number) => {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) str += ones[n] + ' ';
    return str;
  };
  let words = '';
  const units: [number, string][] = [
    [10000000, 'Crore'],
    [100000, 'Lac'],
    [1000, 'Thousand']
  ];
  units.forEach(([div, name]) => {
    if (num >= div) {
      words += below1000(Math.floor(num / div)) + name + ' ';
      num %= div;
    }
  });
  words += below1000(num);
  return words.replace(/\s+/g, ' ').trim();
};

export const printHtmlDirectly = (htmlContent: string) => {
  try {
    // Remove existing print frame if any
    const existing = document.getElementById('universal-print-iframe');
    if (existing) {
      existing.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'universal-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1024px';
    iframe.style.height = '768px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      const triggerPrint = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.error('Iframe print error, attempting window fallback', e);
            const w = window.open('', '_blank');
            if (w) {
              w.document.write(htmlContent);
              w.document.close();
            }
          }
        }, 300);
      };

      if (iframe.contentWindow) {
        iframe.contentWindow.onload = triggerPrint;
      }
      // Safety fallback in case onload already fired
      setTimeout(triggerPrint, 500);
    }
  } catch (err) {
    console.error('Printing error:', err);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(htmlContent);
      w.document.close();
    }
  }
};

export const printUniversalSlip = (
  title: string,
  dataObj: Record<string, any>,
  settings: SystemSettings,
  autoClose = false
) => {
  const s = settings;
  const numKey = Object.keys(dataObj).find(k => /#$|^Ref|^Voucher|^Receipt|^Invoice/i.test(k));
  const dateKey = Object.keys(dataObj).find(k => /date/i.test(k));
  const docNumber = numKey ? dataObj[numKey] : '';
  const docDate = dateKey ? dataObj[dateKey] : new Date().toISOString().split('T')[0];

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} ${docNumber}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#0f172a;margin:0;padding:24px;font-size:11px;background:#fff;}
    .sheet{max-width:820px;margin:0 auto;border:1px solid #cbd5e1;padding:28px 32px;border-radius:8px;}
    .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0284c7;padding-bottom:12px;margin-bottom:20px;}
    .doc-title{font-size:24px;font-weight:900;color:#0284c7;text-transform:uppercase;letter-spacing:.5px;}
    .doc-sub{font-size:10px;color:#64748b;margin-top:2px;font-weight:600;}
    .brand{text-align:right;}
    .brand-title{font-size:16px;font-weight:900;color:#0f172a;}
    .brand-sub{font-size:10px;color:#64748b;}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:20px;}
    .box{background:#f8fafc;border:1px solid #e2e8f0;padding:12px 14px;border-radius:6px;}
    .box h4{margin:0 0 6px 0;font-size:11px;font-weight:800;color:#0284c7;text-transform:uppercase;}
    .line{font-size:10.5px;color:#334155;line-height:1.6;}
    table.data-table{width:100%;border-collapse:collapse;margin:16px 0;}
    table.data-table th{background:#f1f5f9;color:#0f172a;font-size:10px;font-weight:800;text-transform:uppercase;padding:8px 10px;border:1px solid #cbd5e1;text-align:left;}
    table.data-table td{padding:8px 10px;border:1px solid #e2e8f0;font-size:10.5px;}
    .r{text-align:right;}
    .totals-box{margin-left:auto;width:320px;border:1px solid #cbd5e1;border-radius:6px;overflow:hidden;margin-top:12px;}
    .totals-row{display:flex;justify-content:space-between;padding:6px 12px;border-bottom:1px solid #f1f5f9;}
    .totals-row.grand{background:#0284c7;color:#fff;font-weight:900;font-size:13px;border-bottom:none;}
    .footer-note{margin-top:24px;border-top:1px dashed #cbd5e1;padding-top:12px;font-size:9.5px;color:#64748b;text-align:center;}
    .signature-row{display:flex;justify-content:space-between;margin-top:36px;}
    .sig-line{width:200px;border-top:1px solid #64748b;text-align:center;padding-top:4px;font-size:10px;font-weight:700;}
    @media print{body{padding:0}.sheet{border:none;border-radius:0}@page{margin:12mm}}
  </style></head><body><div class="sheet">
    <div class="top">
      <div>
        <div class="doc-title">${title}</div>
        <div class="doc-sub">${docNumber ? 'Document Reference: ' + docNumber : ''} | Date: ${docDate}</div>
      </div>
      <div class="brand">
        <div class="brand-title">${s.company || 'Posvibe Enterprise ERP'}</div>
        <div class="brand-sub">${s.tagline || ''}</div>
        <div class="brand-sub">NTN/STRN: ${s.ntn || 'NTN-7890123-4'} | Ph: ${s.phone || ''}</div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <h4>Entity / Business Details</h4>
        <div class="line">
          <strong>${s.company}</strong><br/>
          ${s.address ? s.address + '<br/>' : ''}
          ${s.email ? 'Email: ' + s.email + '<br/>' : ''}
          ${s.bank ? 'Bank Details: ' + s.bank : ''}
        </div>
      </div>
      <div class="box">
        <h4>Document Metadata</h4>
        <div class="line">
          ${Object.entries(dataObj).filter(([k]) => !/items|products/i.test(k)).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`).join('')}
        </div>
      </div>
    </div>

    <div class="footer-note">
      ${s.footer || 'Thank you for your business. Computer generated document requiring no physical signature.'}
      <br/>System Generated by Posvibe Cloud ERP | Hotline: ${s.phone}
    </div>
  </div>
  </body></html>`;

  printHtmlDirectly(html);
};

export const printDetailedInvoice = (invoice: SalesInvoice, settings: SystemSettings) => {
  const s = settings;
  const itemsHtml = (invoice.items || []).map((it, idx) => {
    const itemName = it.prodName || it.name || 'Medicine Item';
    const rate = it.rate ?? it.price ?? 0;
    const tax = it.taxPct ?? it.taxPercent ?? 0;
    const totalAmt = it.total ?? it.amount ?? (it.qty * rate);
    
    return `
    <tr>
      <td style="text-align:center;font-weight:700;">${idx + 1}</td>
      <td>
        <strong>${itemName}</strong>
        <div style="color:#64748b;font-size:9px;margin-top:2px;">
          ${it.batch ? `<span>Batch: <strong>${it.batch}</strong></span>` : ''}
          ${it.expiryDate ? `<span style="margin-left:8px;">Exp: <strong>${it.expiryDate}</strong></span>` : ''}
          ${it.packSize ? `<span style="margin-left:8px;">Pack: ${it.packSize}</span>` : ''}
          ${it.hsnCode || it.hsCode ? `<span style="margin-left:8px;">HSN: ${it.hsnCode || it.hsCode}</span>` : ''}
        </div>
      </td>
      <td style="text-align:right;font-weight:700;">${it.qty} ${it.unit || 'Pcs'}</td>
      <td style="text-align:center;color:#059669;font-weight:700;">${it.bonusQty ? `+${it.bonusQty} Free` : '-'}</td>
      <td style="text-align:right;">${s.currency} ${rate.toFixed(2)}</td>
      <td style="text-align:right;">${tax}%</td>
      <td style="text-align:right;color:#e11d48;">${it.discount ? `${s.currency} ${it.discount.toFixed(2)}` : '0.00'}</td>
      <td style="text-align:right;font-weight:900;">${s.currency} ${totalAmt.toFixed(2)}</td>
    </tr>
  `;
  }).join('');

  const words = numberToWords(invoice.amount);
  const totalFreeSchemeUnits = (invoice.items || []).reduce((sum, item) => sum + (item.bonusQty || 0), 0);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>MZ Pharma Smart Distribution Invoice ${invoice.inv}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#0f172a;margin:0;padding:24px;font-size:11px;background:#fff;}
    .sheet{max-width:880px;margin:0 auto;border:1px solid #cbd5e1;padding:28px 32px;border-radius:8px;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0284c7;padding-bottom:12px;margin-bottom:16px;}
    .title{font-size:22px;font-weight:900;color:#0284c7;letter-spacing:0.5px;}
    .sub-title{font-size:10px;font-weight:700;color:#0369a1;text-transform:uppercase;}
    .company{text-align:right;}
    .company-name{font-size:16px;font-weight:900;color:#0f172a;}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:16px;}
    .box{background:#f8fafc;border:1px solid #e2e8f0;padding:12px 14px;border-radius:6px;font-size:10.5px;line-height:1.6;}
    .box-title{font-weight:800;color:#0284c7;text-transform:uppercase;margin-bottom:4px;font-size:10.5px;}
    table{width:100%;border-collapse:collapse;margin:16px 0;}
    th{background:#0284c7;color:#fff;font-size:10px;font-weight:800;text-transform:uppercase;padding:8px;border:1px solid #0284c7;}
    td{padding:7px 8px;border:1px solid #e2e8f0;font-size:10.5px;}
    .totals-area{display:flex;justify-content:space-between;align-items:flex-start;margin-top:10px;}
    .words-box{flex:1;padding-right:24px;font-size:10.5px;}
    .totals-table{width:320px;border:1px solid #cbd5e1;border-radius:6px;overflow:hidden;}
    .totals-table td{padding:5px 10px;}
    .grand-row{background:#0284c7;color:#fff;font-weight:900;font-size:13px;}
    .grand-row td{color:#fff;border-color:#0284c7;}
    .pharma-badge{display:inline-block;padding:2px 6px;background:#e0f2fe;color:#0369a1;font-weight:700;border-radius:4px;font-size:9.5px;margin-top:4px;}
    .footer{margin-top:20px;border-top:1px solid #e2e8f0;padding-top:10px;text-align:center;font-size:9.5px;color:#64748b;}
    @media print{body{padding:0}.sheet{border:none}@page{margin:12mm}}
  </style></head><body><div class="sheet">
    <div class="header">
      <div>
        <div class="sub-title">MZ Medicine Smart Distribution ERP</div>
        <div class="title">CONSOLIDATED PHARMA INVOICE</div>
        <div style="font-size:11px;font-weight:700;color:#334155;margin-top:2px;">Invoice No: <span style="font-family:monospace;color:#0284c7;">${invoice.inv}</span></div>
        <div style="font-size:10px;color:#64748b;">Date: ${invoice.date} | Due: ${invoice.dueDate || 'Immediate'}</div>
      </div>
      <div class="company">
        <div class="company-name">${s.company || 'MZ Medicine Smart Distribution'}</div>
        <div style="font-size:10px;color:#475569;">${s.address || 'Pharma Wholesale Market, Lahore'}</div>
        <div style="font-size:10px;color:#475569;">Drug License (DL #): <strong>${s.dlNo || 'DL-LHR-2024-8891'}</strong> | NTN: <strong>${s.ntn || 'NTN-7890123-4'}</strong></div>
        <div style="font-size:10px;color:#475569;">Sales Helpline: ${s.phone}</div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <div class="box-title">Customer / Pharmacy Buyer Details</div>
        <div><strong>${invoice.custName}</strong></div>
        <div>Address: ${invoice.custAddress || 'Over counter / Local Retailer'}</div>
        <div>Contact: ${invoice.contact || invoice.custPhone || 'N/A'}</div>
        <div>NTN / CNIC: <strong>${invoice.custNtnCnic || 'Registered Buyer'}</strong></div>
        <div class="pharma-badge">Multi-Medicine Distribution Batch Invoice</div>
      </div>
      <div class="box">
        <div class="box-title">Payment & Shipping Summary</div>
        <div>Payment Mode: <strong>${invoice.paymentMode}</strong> | Status: <strong>${invoice.status}</strong></div>
        <div>Total Line Items: <strong>${invoice.items?.length || 0} Medicines</strong></div>
        ${totalFreeSchemeUnits > 0 ? `<div>Bonus Free Schemes: <strong style="color:#059669;">+${totalFreeSchemeUnits} Units Free</strong></div>` : ''}
        <div>IRN Reference: <span style="font-family:monospace;font-size:9px;">${invoice.irn || 'IRN-MZ-DIST-992'}</span></div>
        ${invoice.vehicleNo ? `<div>Transport Vehicle: <strong>${invoice.vehicleNo}</strong></div>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:30px;">#</th>
          <th>Medicine Item &amp; Batch / Expiry Details</th>
          <th style="width:70px;text-align:right;">Billed Qty</th>
          <th style="width:70px;text-align:center;">Scheme</th>
          <th style="width:85px;text-align:right;">Unit Price</th>
          <th style="width:55px;text-align:right;">GST %</th>
          <th style="width:65px;text-align:right;">Disc</th>
          <th style="width:105px;text-align:right;">Total (${s.currency})</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals-area">
      <div class="words-box">
        <div style="font-weight:700;color:#334155;margin-bottom:4px;">Amount in Words:</div>
        <div style="font-style:italic;color:#0284c7;font-weight:700;">${s.currency} ${words} Only.</div>
        <div style="margin-top:16px;font-size:10px;color:#475569;">
          <strong>Pharma Terms & Cold-Chain Certification:</strong><br/>
          Medicines stored and dispatched under compliant 2°C - 8°C cold chain. Please verify batch & expiry upon receipt.
        </div>
      </div>

      <table class="totals-table">
        <tr><td>Taxable Subtotal:</td><td style="text-align:right;">${s.currency} ${(invoice.subtotal || 0).toFixed(2)}</td></tr>
        <tr><td>GST / Tax (${invoice.taxPct || 18}%):</td><td style="text-align:right;">+ ${s.currency} ${(invoice.totalTax || invoice.taxAmount || 0).toFixed(2)}</td></tr>
        ${invoice.discount ? `<tr><td>Discount Allowed:</td><td style="text-align:right;color:#e11d48;">- ${s.currency} ${(invoice.discount || 0).toFixed(2)}</td></tr>` : ''}
        ${invoice.tcsAmount ? `<tr><td>TCS Collected (${invoice.tcsRate}%):</td><td style="text-align:right;">+ ${s.currency} ${(invoice.tcsAmount || 0).toFixed(2)}</td></tr>` : ''}
        <tr class="grand-row"><td>Grand Net Total:</td><td style="text-align:right;">${s.currency} ${(invoice.amount || 0).toFixed(2)}</td></tr>
      </table>
    </div>

    <div class="footer">
      <div>${s.footer || 'MZ Medicine Smart Distribution - Computer generated Tax Invoice.'}</div>
      <div style="margin-top:4px;font-weight:700;">MZ Pharma Smart Distribution System | Hotline: +92 308 6707676</div>
    </div>
  </div>
  </body></html>`;

  printHtmlDirectly(html);
};

export const printSalarySlip = (payroll: PayrollRun, emp: Employee | undefined, settings: SystemSettings) => {
  const s = settings;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Salary Slip - ${payroll.employeeName}</title>
  <style>
    body{font-family:sans-serif;padding:24px;font-size:11px;color:#0f172a;}
    .card{max-width:650px;margin:0 auto;border:1px solid #cbd5e1;padding:24px;border-radius:8px;}
    .title{font-size:18px;font-weight:900;color:#0284c7;text-align:center;margin-bottom:4px;}
    .sub{text-align:center;color:#64748b;margin-bottom:16px;}
    table{width:100%;border-collapse:collapse;margin:12px 0;}
    th,td{border:1px solid #e2e8f0;padding:6px 10px;}
    th{background:#f8fafc;font-weight:700;}
    .r{text-align:right;}
    .net{background:#0284c7;color:#fff;font-size:13px;font-weight:900;}
  </style></head><body><div class="card">
    <div class="title">${s.company}</div>
    <div class="sub">CONFIDENTIAL STAFF PAYSLIP - ${payroll.month} ${payroll.year}</div>
    <table>
      <tr><td><strong>Employee Name:</strong></td><td>${payroll.employeeName}</td><td><strong>Employee Code:</strong></td><td>${emp?.employeeCode || 'EMP-100'}</td></tr>
      <tr><td><strong>Designation:</strong></td><td>${emp?.designation || 'Staff'}</td><td><strong>Department:</strong></td><td>${emp?.department || 'Operations'}</td></tr>
      <tr><td><strong>Days Present:</strong></td><td>${payroll.totalDaysPresent} Days</td><td><strong>Hours Worked:</strong></td><td>${payroll.totalHoursWorked} hrs</td></tr>
    </table>
    <table>
      <tr><th>Earnings Breakdown</th><th class="r">Amount (${s.currency})</th><th>Deductions Breakdown</th><th class="r">Amount (${s.currency})</th></tr>
      <tr><td>Base Salary</td><td class="r">${payroll.baseSalary.toFixed(2)}</td><td>Tax / Provident Fund</td><td class="r">${payroll.deductions.toFixed(2)}</td></tr>
      <tr><td>Overtime Pay</td><td class="r">${payroll.overtimePay.toFixed(2)}</td><td>Unpaid Leave Penalty</td><td class="r">0.00</td></tr>
      <tr><td>Special Allowances</td><td class="r">${payroll.allowances.toFixed(2)}</td><td>Other Deductions</td><td class="r">0.00</td></tr>
      <tr class="net"><td colspan="3">Net Disbursed Salary</td><td class="r">${payroll.netSalary.toFixed(2)}</td></tr>
    </table>
    <div style="margin-top:20px;display:flex;justify-content:space-between;padding-top:20px;">
      <div>Employee Signature: _______________</div>
      <div>Authorized Manager: _______________</div>
    </div>
  </div></body></html>`;
  printHtmlDirectly(html);
};

export const printSalesInvoice = printDetailedInvoice;

